let ACTIVE_OFFERS = [];

async function loadOffers() {

    const { data, error } =
        await supabaseClient
            .from("offers")
            .select("*")
            .eq("active", true)
            .order("priority");

    if (error) {

        console.error(error);

        return [];
    }

    ACTIVE_OFFERS = data || [];

    return ACTIVE_OFFERS;

}

function getCartCounts(cart) {

    const counts = {

        rings: 0,

        bracelets: 0,

        necklace: 0,

        earrings: 0,

        anklets: 0,

        mens: 0,

        watches: 0,

        totalItems: 0,

        totalPrice: 0

    };

    cart.forEach(item => {

        const category =
            item.category
            ?.toLowerCase();

        counts.totalItems += item.quantity;

        counts.totalPrice +=
            item.offer_price *
            item.quantity;

        if (counts.hasOwnProperty(category)) {

            counts[category] +=
                item.quantity;

        }

    });

    return counts;

}

function isOfferApplicable(
    offer,
    counts
) {

    if (
        offer.required_rings >
        counts.rings
    )
        return false;

    if (
        offer.required_bracelets >
        counts.bracelets
    )
        return false;

    if (
        offer.required_necklace >
        counts.necklace
    )
        return false;

    if (
        offer.required_earrings >
        counts.earrings
    )
        return false;

    if (
        offer.required_anklets >
        counts.anklets
    )
        return false;

    if (
        offer.required_mens >
        counts.mens
    )
        return false;

    if (
        offer.required_watches >
        counts.watches
    )
        return false;

    if (
        offer.required_any >
        counts.totalItems
    )
        return false;

    return true;

}

function calculateBestOffer(
    cart
) {

    const counts =
        getCartCounts(cart);

    let bestOffer = null;

    let bestTotal =
        counts.totalPrice;

    ACTIVE_OFFERS.forEach(
        offer => {

            if (
                !isOfferApplicable(
                    offer,
                    counts
                )
            )
                return;

            if (
                offer.offer_price <
                bestTotal
            ) {

                bestTotal =
                    offer.offer_price;

                bestOffer =
                    offer;

            }

        }
    );

    return {

        originalTotal:
            counts.totalPrice,

        finalTotal:
            bestTotal,

        savings:
            counts.totalPrice -
            bestTotal,

        offerApplied:
            bestOffer != null,

        offer:
            bestOffer,

        surpriseFreebies:
            bestOffer
                ?.surprise_freebies ||
            0

    };

}

function getOfferProgress(cart) {

    const counts =
        getCartCounts(cart);

    return ACTIVE_OFFERS.map(
        offer => {

            let needed = 0;

            let current = 0;

            if (
                offer.required_any >
                0
            ) {

                needed =
                    offer.required_any;

                current =
                    counts.totalItems;

            }

            else if (
                offer.required_rings >
                0
            ) {

                needed =
                    offer.required_rings;

                current =
                    counts.rings;

            }

            else if (

                offer.required_bracelets > 0

            ) {

                needed =
                    offer.required_bracelets;

                current =
                    counts.bracelets;

            }

            else if (

                offer.required_necklace > 0

            ) {

                needed =
                    offer.required_necklace;

                current =
                    counts.necklace;

            }

            return {

                offer,

                needed,

                current,

                unlocked:
                    current >=
                    needed

            };

        }

    );

}
