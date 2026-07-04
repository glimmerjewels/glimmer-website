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


async function loadOfferBanner() {

    const banner =
        document.getElementById("offerTrack");

    if (!banner)
        return;

    const offers =
        await fetchOffers();

    if (!offers.length) {

        document
            .getElementById("offerBanner")
            .style.display =
            "none";

        return;

    }

    let html = "";

    offers.forEach(offer => {

        html +=

        `<span class="offer-item">

            ${offer.banner_text}

        </span>

        <span class="offer-dot">

        ★

        </span>`;

    });

    html += html;

    banner.innerHTML = html;

}
