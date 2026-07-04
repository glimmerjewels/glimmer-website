// ======================================
// GLIMMER OFFER ENGINE
// ======================================

function cartTotal(cart) {

    let total = 0;

    cart.forEach(item => {

        total +=
            item.offer_price *
            item.quantity;

    });

    return total;

}


function categoryCounts(cart) {

    const counts = {

        rings:0,

        bracelets:0,

        necklace:0,

        earrings:0,

        anklets:0,

        mens:0,

        watches:0,

        totalItems:0

    };

    cart.forEach(item=>{

        const cat =
            item.category
            ?.toLowerCase();

        if(
            counts.hasOwnProperty(cat)
        ){

            counts[cat]+=
                item.quantity;

        }

        counts.totalItems+=
            item.quantity;

    });

    return counts;

}


function offerMatches(
    offer,
    counts
){

    if(
        counts.rings<
        offer.required_rings
    )
        return false;

    if(
        counts.bracelets<
        offer.required_bracelets
    )
        return false;

    if(
        counts.necklace<
        offer.required_necklace
    )
        return false;

    if(
        counts.earrings<
        offer.required_earrings
    )
        return false;

    if(
        counts.anklets<
        offer.required_anklets
    )
        return false;

    if(
        counts.mens<
        offer.required_mens
    )
        return false;

    if(
        counts.watches<
        offer.required_watches
    )
        return false;

    if(
        counts.totalItems<
        offer.required_any
    )
        return false;

    return true;

}


function calculatePricing(cart){

    const offers =
        getLoadedOffers();

    const counts =
        categoryCounts(cart);

    const originalTotal =
        cartTotal(cart);

    let bestOffer = null;

    let bestTotal =
        originalTotal;

    offers.forEach(offer=>{

        if(
            !offerMatches(
                offer,
                counts
            )
        ){

            return;

        }

        /*
        IMPORTANT

        This is temporary.

        Part 2B will replace
        this with bundle pricing.

        */

        if(

            offer.offer_price
            <
            bestTotal

        ){

            bestTotal =
                offer.offer_price;

            bestOffer =
                offer;

        }

    });

    return{

        originalTotal,

        discountedTotal:
            bestTotal,

        savings:
            originalTotal-
            bestTotal,

        offerApplied:
            bestOffer!=null,

        appliedOffer:
            bestOffer,

        freebies:

            bestOffer
            ?

            bestOffer
            .surprise_freebies

            :

            0,

        congratulationMessage:

            bestOffer
            &&
            bestOffer
            .surprise_freebies>0

            ?

            `🎉 Congratulations! You have been selected for ${bestOffer.surprise_freebies} surprise freebies from our side. They will be included in your order package automatically.`

            :

            ""

    };

}
