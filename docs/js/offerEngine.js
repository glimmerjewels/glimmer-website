// =============================================
// GLIMMER GENERIC OFFER ENGINE
// DATABASE DRIVEN
// =============================================


function expandCart(cart){

    let items=[];


    cart.forEach(product=>{


        for(
            let i=0;
            i<product.quantity;
            i++
        ){

            items.push({

                id:
                    product.id,

                name:
                    product.name,

                category:
                    product.category
                    ?.toLowerCase(),

                price:
                    Number(
                        product.offer_price
                    )

            });

        }

    });


    return items;

}





function normalTotal(items){

    return items.reduce(
        (sum,item)=>
            sum+item.price,
        0
    );

}





function removeIndexes(
    items,
    indexes
){

    return items.filter(
        (_,i)=>
        !indexes.includes(i)
    );

}






// ---------------------------------------------
// CHECK IF BUNDLE CAN BE CREATED
// ---------------------------------------------


function findBundleIndexes(
    items,
    rules
){

    let selected=[];


    for(
        const rule of rules
    ){

        let category =
            rule.category
            .toLowerCase();


        let required =
            rule.required_quantity;



        if(
            category==="any"
        ){

            let available =
                items.length -
                selected.length;


            if(
                available <
                required
            )
                return null;


            for(
                let i=0;
                i<items.length;
                i++
            ){

                if(
                    !selected.includes(i)
                    &&
                    selected.length <
                    required
                ){

                    selected.push(i);

                }

            }


            continue;

        }





        let matched =
            items
            .map(
                (item,index)=>
                item.category===category
                &&
                !selected.includes(index)
                ?
                index
                :
                null
            )
            .filter(
                x=>x!==null
            );



        if(
            matched.length <
            required
        )
            return null;



        selected.push(
            ...matched.slice(
                0,
                required
            )
        );


    }



    return selected;

}





// ---------------------------------------------
// APPLY OFFER REPEATEDLY
// ---------------------------------------------


function applyOffer(
    items,
    offer
){

    let remaining=[
        ...items
    ];


    let bundles=0;



    while(true){


        let indexes =
            findBundleIndexes(
                remaining,
                offer.rules
            );


        if(!indexes)
            break;



        remaining =
            removeIndexes(
                remaining,
                indexes
            );


        bundles++;

    }



    return {


        bundles,


        remaining


    };

}





// ---------------------------------------------
// MAIN PRICE CALCULATOR
// ---------------------------------------------


async function calculatePricing(cart){


    const items =
        expandCart(cart);



    const originalTotal =
        normalTotal(items);



    const offers =
        await fetchOffers(true);



    let best={


        total:
            originalTotal,


        offer:null,


        bundles:0


    };




    for(
        const offer of offers
    ){


        const rules =
            await getOfferRules(
                offer.id
            );



        if(
            !rules.length
        )
            continue;




        const result =
            applyOffer(
                items,
                {
                    ...offer,
                    rules
                }
            );



        if(
            result.bundles===0
        )
            continue;




        let total =

            (
                result.bundles *
                Number(
                    offer.offer_price
                )
            )

            +

            normalTotal(
                result.remaining
            );





        if(
            total <
            best.total
        ){


            best.total =
                total;


            best.offer =
                offer;


            best.bundles =
                result.bundles;


        }


    }





    return {


        originalTotal,


        discountedTotal:
            best.total,


        savings:
            originalTotal -
            best.total,


        offerApplied:
            !!best.offer,


        appliedOffer:
            best.offer,


        surpriseFreebies:
            best.offer
            ?.surprise_freebies
            ||
            0,


        congratulationMessage:

        best.offer
        ?.surprise_freebies>0

        ?

        `🎉 Congratulations! You have been selected for ${best.offer.surprise_freebies} surprise freebies from our side. They will be included in your order package automatically.`

        :

        ""

    };


}
