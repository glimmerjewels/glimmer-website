// ======================================
// GLIMMER OFFER ENGINE
// ======================================

function cartTotal(cart) {
    let total = 0;

    cart.forEach((item) => {
        total += Number(item.offer_price || item.price || 0) * Number(item.quantity || 1);
    });

    return total;
}

function categoryCounts(cart) {
    const counts = {
        rings: 0,
        bracelets: 0,
        necklace: 0,
        earrings: 0,
        anklets: 0,
        mens: 0,
        watches: 0,
        totalItems: 0
    };

    cart.forEach((item) => {
        const rawCategory = item.category || item.product_category || "";
        const normalizedCategory = String(rawCategory).toLowerCase().trim();
        const categoryMap = {
            ring: "rings",
            rings: "rings",
            bracelet: "bracelets",
            bracelets: "bracelets",
            necklace: "necklace",
            necklaces: "necklace",
            earring: "earrings",
            earrings: "earrings",
            anklet: "anklets",
            anklets: "anklets",
            men: "mens",
            mens: "mens",
            man: "mens",
            watch: "watches",
            watches: "watches"
        };

        const cat = categoryMap[normalizedCategory] || normalizedCategory;

        if (Object.prototype.hasOwnProperty.call(counts, cat)) {
            counts[cat] += Number(item.quantity || 1);
        }

        counts.totalItems += Number(item.quantity || 1);
    });

    return counts;
}

function offerMatches(offer, counts) {
    if (counts.rings < (offer.required_rings || 0)) return false;
    if (counts.bracelets < (offer.required_bracelets || 0)) return false;
    if (counts.necklace < (offer.required_necklace || 0)) return false;
    if (counts.earrings < (offer.required_earrings || 0)) return false;
    if (counts.anklets < (offer.required_anklets || 0)) return false;
    if (counts.mens < (offer.required_mens || 0)) return false;
    if (counts.watches < (offer.required_watches || 0)) return false;
    if (counts.totalItems < (offer.required_any || 0)) return false;

    return true;
}

// =====================================
// GLIMMER OFFER ENGINE
// =====================================


function expandCartItems(cart){

    let items=[];


    cart.forEach(product=>{


        for(
            let i=0;
            i<product.quantity;
            i++
        ){

            items.push({

                id:product.id,

                name:product.name,

                category:
                    product.category
                    ?.toLowerCase(),

                price:
                    product.offer_price

            });

        }


    });


    return items;

}



// -------------------------------------
// NORMAL TOTAL
// -------------------------------------

function calculateNormalTotal(items){

    return items.reduce(
        (sum,item)=>
            sum+item.price,
        0
    );

}



// -------------------------------------
// REMOVE BUNDLE ITEMS
// -------------------------------------

function removeItems(source,indexes){


    return source.filter(
        (_,index)=>
            !indexes.includes(index)
    );

}




// -------------------------------------
// FIND RING BUNDLES
// -------------------------------------

function applyRingOffer(items,offer){


    let working=[
        ...items
    ];


    let bundles=[];


    while(true){


        let rings =
            working
            .map(
                (x,i)=>
                    x.category==="rings"
                    ? i
                    : null
            )
            .filter(
                x=>x!==null
            );


        if(
            rings.length <
            offer.required_rings
        )
            break;



        let selected =
            rings.slice(
                0,
                offer.required_rings
            );


        bundles.push({

            items:selected,

            price:
                offer.offer_price

        });



        working =
            removeItems(
                working,
                selected
            );

    }



    return {

        bundles,

        remaining:
            working

    };

}


// -------------------------------------
// FIND CATEGORY COMBO
// Ring + Necklace + Bracelet
// -------------------------------------

function applyComboOffer(items,offer){


    let working=[
        ...items
    ];


    let bundles=[];



    while(true){


        let ringIndex =
            working.findIndex(
                x =>
                x.category==="rings"
            );


        let necklaceIndex =
            working.findIndex(
                x =>
                x.category==="necklace"
            );


        let braceletIndex =
            working.findIndex(
                x =>
                x.category==="bracelets"
            );



        if(
            ringIndex===-1 ||
            necklaceIndex===-1 ||
            braceletIndex===-1
        ){

            break;

        }



        let selected=[

            ringIndex,

            necklaceIndex,

            braceletIndex

        ];



        bundles.push({

            items:selected,

            price:
                offer.offer_price

        });



        working =
            removeItems(
                working,
                selected
            );


    }



    return {


        bundles,


        remaining:
            working

    };

}


// -------------------------------------
// ANY 5 ITEMS OFFER
// -------------------------------------

function applyAnyFiveOffer(items,offer){


    let working=[
        ...items
    ];


    let bundles=[];



    while(
        working.length >=
        offer.required_any
    ){


        let selected =
            working
            .slice(
                0,
                offer.required_any
            )
            .map(
                (_,index)=>
                    index
            );



        bundles.push({

            items:selected,

            price:
                offer.offer_price

        });



        working =
            removeItems(
                working,
                selected
            );


    }



    return {


        bundles,


        remaining:
            working

    };


}


// -------------------------------------
// MAIN CALCULATOR
// -------------------------------------

async function calculatePricing(cart){


    const offers =
        getOffers();



    const items =
        expandCartItems(cart);



    const originalTotal =
        calculateNormalTotal(
            items
        );



    let bestTotal =
        originalTotal;



    let bestOffer=null;



    let freebies=0;



offers.forEach(
offer=>{


let result=null;



// 2 Rings Offer

if(
    offer.required_rings===2 &&
    !offer.required_any
){

    result =
    applyRingOffer(
        items,
        offer
    );

}




// Ring + Necklace + Bracelet

else if(

offer.required_rings===1 &&

offer.required_necklace===1 &&

offer.required_bracelets===1

){


    result =
    applyComboOffer(
        items,
        offer
    );


}





// Any 5 items

else if(
    offer.required_any>=5
){


    result =
    applyAnyFiveOffer(
        items,
        offer
    );


}




if(!result)
return;




let offerTotal =
result.bundles
.reduce(
    (sum,bundle)=>
    sum+
    bundle.price,
    0
);



offerTotal +=
calculateNormalTotal(
    result.remaining
);





if(
offerTotal <
bestTotal
){


bestTotal =
offerTotal;


bestOffer =
offer;


freebies =
offer.surprise_freebies
||0;


}



});

    );




    return {


        originalTotal,


        discountedTotal:
            bestTotal,


        savings:
            originalTotal -
            bestTotal,


        offerApplied:
            bestOffer!==null,


        appliedOffer:
            bestOffer,


        freebies,


        congratulationMessage:

            freebies>0

            ?

`🎉 Congratulations! You have been selected for ${freebies} surprise freebies from our side. They will be included in your order package automatically.`

            :

            ""

    };


}
