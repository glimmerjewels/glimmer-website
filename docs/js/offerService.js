// =============================================
// GLIMMER OFFER SERVICE
// =============================================

let GLIMMER_OFFERS = [];

async function fetchOffers(refresh = false) {

    if (!refresh && GLIMMER_OFFERS.length > 0) {
        return GLIMMER_OFFERS;
    }

    const now = new Date().toISOString();

    const { data, error } = await supabaseClient
        .from("offers")
        .select("*")
        .eq("active", true)
        .or(`start_date.is.null,start_date.lte.${now}`)
        .or(`end_date.is.null,end_date.gte.${now}`)
        .order("priority", { ascending: true });

    if (error) {
        console.error("Offer Loading Error", error);
        return [];
    }

    GLIMMER_OFFERS = data || [];

    return GLIMMER_OFFERS;
}

function getOffers() {
    return GLIMMER_OFFERS;
}
