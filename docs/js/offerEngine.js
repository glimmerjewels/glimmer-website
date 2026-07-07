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

function calculatePricing(cart) {
    const offers = getLoadedOffers();
    const counts = categoryCounts(cart);
    const originalTotal = cartTotal(cart);

    let bestOffer = null;
    let bestTotal = originalTotal;

    offers.forEach((offer) => {
        const normalizedOffer = normalizeOffer(offer);

        if (!offerMatches(normalizedOffer, counts)) {
            return;
        }

        const candidateTotal = Number(normalizedOffer.offer_price) || originalTotal;

        if (candidateTotal < bestTotal) {
            bestTotal = candidateTotal;
            bestOffer = normalizedOffer;
        }
    });

    return {
        originalTotal,
        discountedTotal: bestTotal,
        savings: originalTotal - bestTotal,
        offerApplied: bestOffer != null,
        appliedOffer: bestOffer,
        freebies: bestOffer ? bestOffer.surprise_freebies : 0,
        congratulationMessage:
            bestOffer && bestOffer.surprise_freebies > 0
                ? `🎉 Congratulations! You have been selected for ${bestOffer.surprise_freebies} surprise freebies from our side. They will be included in your order package automatically.`
                : "",
        offerMessage: bestOffer ? `${bestOffer.name} — ₹${bestOffer.offer_price}` : ""
    };
}

