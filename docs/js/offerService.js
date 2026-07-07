// =============================================
// GLIMMER OFFER SERVICE
// =============================================

let GLIMMER_OFFERS = [];

const FALLBACK_OFFERS = [
    {
        id: 1,
        name: "Two Finger Rings Deal",
        banner_text: "Offer 1: Get 2 finger rings @ ₹349",
        offer_price: 349,
        required_rings: 2,
        required_any: 2,
        surprise_freebies: 0,
        priority: 1,
        active: true
    },
    {
        id: 2,
        name: "Custom Combo Deal",
        banner_text: "Offer 2: Make your own combo (1 ring + 1 necklace + 1 bracelet) @ ₹999",
        offer_price: 999,
        required_rings: 1,
        required_necklace: 1,
        required_bracelets: 1,
        required_any: 3,
        surprise_freebies: 0,
        priority: 2,
        active: true
    },
    {
        id: 3,
        name: "Five Item Combo Deal",
        banner_text: "Offer 3: Make your own combo (any 5 items) @ ₹1499 + 2 freebeez",
        offer_price: 1499,
        required_any: 5,
        surprise_freebies: 2,
        priority: 3,
        active: true
    }
];

function normalizeOffer(offer) {
    const normalized = { ...offer };

    normalized.id = normalized.id || normalized.offer_id || normalized.name || Date.now();
    normalized.name = normalized.name || normalized.title || "Special Offer";
    normalized.banner_text = normalized.banner_text || normalized.banner || normalized.tagline || `${normalized.name}`;
    normalized.offer_price = Number(normalized.offer_price ?? normalized.discounted_price ?? normalized.price ?? 0);
    normalized.required_rings = Number(normalized.required_rings ?? normalized.rings ?? 0);
    normalized.required_bracelets = Number(normalized.required_bracelets ?? normalized.bracelets ?? 0);
    normalized.required_necklace = Number(normalized.required_necklace ?? normalized.necklace ?? 0);
    normalized.required_earrings = Number(normalized.required_earrings ?? normalized.earrings ?? 0);
    normalized.required_anklets = Number(normalized.required_anklets ?? normalized.anklets ?? 0);
    normalized.required_mens = Number(normalized.required_mens ?? normalized.mens ?? 0);
    normalized.required_watches = Number(normalized.required_watches ?? normalized.watches ?? 0);
    normalized.required_any = Number(normalized.required_any ?? normalized.any_items ?? normalized.total_items ?? 0);
    normalized.surprise_freebies = Number(normalized.surprise_freebies ?? normalized.freebeez ?? 0);
    normalized.priority = Number(normalized.priority ?? 0);
    normalized.active = normalized.active !== false;

    return normalized;
}

async function fetchOffers(refresh = false) {
    if (!refresh && GLIMMER_OFFERS.length > 0) {
        return GLIMMER_OFFERS;
    }

    try {
        const now = new Date().toISOString();

        const { data, error } = await supabaseClient
            .from("offers")
            .select("*")
            .eq("active", true)
            .or(`start_date.is.null,start_date.lte.${now}`)
            .or(`end_date.is.null,end_date.gte.${now}`)
            .order("priority", { ascending: true });

        if (!error && Array.isArray(data) && data.length > 0) {
            GLIMMER_OFFERS = data.map(normalizeOffer);
            return GLIMMER_OFFERS;
        }
    } catch (error) {
        console.warn("Offer table unavailable, using fallback offers", error);
    }

    GLIMMER_OFFERS = FALLBACK_OFFERS.map(normalizeOffer);
    return GLIMMER_OFFERS;
}

function getOffers() {
    return GLIMMER_OFFERS;
}

function getLoadedOffers() {
    return getOffers();
}

async function loadOfferBanner() {
    const banner = document.getElementById("offerTrack");

    if (!banner) {
        return;
    }

    const offers = await fetchOffers();

    if (!offers.length) {
        const bannerContainer = document.getElementById("offerBanner");
        if (bannerContainer) {
            bannerContainer.style.display = "none";
        }
        return;
    }

    const repeatedOffers = [...offers, ...offers];
    const html = repeatedOffers.map((offer) => `
        <span class="offer-item">
            ${offer.banner_text}
        </span>
        <span class="offer-dot">★</span>
    `).join("");

    banner.innerHTML = html;
}

