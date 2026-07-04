// ==============================
// GLIMMER OFFER SERVICE
// ==============================

let ACTIVE_OFFERS = [];

async function loadActiveOffers(forceReload = false) {

    if (
        ACTIVE_OFFERS.length > 0 &&
        !forceReload
    ) {
        return ACTIVE_OFFERS;
    }

    const now =
        new Date()
        .toISOString();

    const { data, error } =
        await supabaseClient
            .from("offers")
            .select("*")
            .eq("active", true)
            .or(
                `start_date.is.null,start_date.lte.${now}`
            )
            .or(
                `end_date.is.null,end_date.gte.${now}`
            )
            .order(
                "priority",
                {
                    ascending: true
                }
            );

    if (error) {

        console.error(
            "Offer Loading Error",
            error
        );

        ACTIVE_OFFERS = [];

        return [];

    }

    ACTIVE_OFFERS =
        data || [];

    return ACTIVE_OFFERS;

}

function getLoadedOffers() {

    return ACTIVE_OFFERS;

}

function clearOfferCache() {

    ACTIVE_OFFERS = [];

}
