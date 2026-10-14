
document.addEventListener("DOMContentLoaded", () => {
    loadLatestTrendingProducts();

    const track = document.getElementById("latestTrendingTrack");
    const prev = document.getElementById("latestPrev");
    const next = document.getElementById("latestNext");

    if (track && prev && next) {
        prev.addEventListener("click", () => {
            track.scrollBy({ left: -track.clientWidth * 0.8, behavior: "smooth" });
        });

        next.addEventListener("click", () => {
            track.scrollBy({ left: track.clientWidth * 0.8, behavior: "smooth" });
        });
    }
});

async function loadLatestTrendingProducts() {
    const track = document.getElementById("latestTrendingTrack");
    if (!track || typeof supabaseClient === "undefined") return;

    try {
        const cutoff = new Date(
            Date.now() - 15 * 24 * 60 * 60 * 1000
        ).toISOString();

        const [productsResult, ordersResult] = await Promise.all([
            supabaseClient
                .from("products")
                .select("id, name, actual_price, offer_price, stock, created_at")
                .order("created_at", { ascending: false }),

            supabaseClient
                .from("orders")
                .select("id")
                .in("status", ["Confirmed", "Delivered"])
                .order("created_at", { ascending: false })
                .limit(25)
        ]);

        if (productsResult.error) throw productsResult.error;
        if (ordersResult.error) throw ordersResult.error;

        const products = productsResult.data || [];
        const orderIds = (ordersResult.data || []).map(order => order.id);
        let trendingIds = new Set();

        if (orderIds.length) {
            const { data: items, error } = await supabaseClient
                .from("order_items")
                .select("product_id")
                .in("order_id", orderIds);

            if (error) throw error;

            trendingIds = new Set(
                (items || []).map(item => String(item.product_id))
            );
        }

        const selected = products.filter(product => {
            const isNew = product.created_at &&
                new Date(product.created_at).getTime() >= Date.parse(cutoff);

            return isNew || trendingIds.has(String(product.id));
        });

        if (!selected.length) {
            track.innerHTML = "<p>New jewellery is coming soon. Stay sparkling!</p>";
            return;
        }

        const ids = selected.map(product => product.id);
        const { data: images, error: imageError } = await supabaseClient
            .from("product_images")
            .select("product_id, image_url")
            .in("product_id", ids);

        if (imageError) throw imageError;

        const imageMap = {};
        (images || []).forEach(image => {
            if (!imageMap[String(image.product_id)]) {
                imageMap[String(image.product_id)] = image.image_url;
            }
        });

        const escapeHTML = value => String(value ?? "").replace(/[&<>"']/g, char => ({
            "&": "&amp;", "<": "&lt;", ">": "&gt;",
            '"': "&quot;", "'": "&#39;"
        }[char]));

        track.innerHTML = selected.map(product => {
            const id = String(product.id);
            const name = escapeHTML(product.name);
            const image = escapeHTML(imageMap[id] || "assets/no-image.png");
            const actual = Number(product.actual_price);
            const offer = Number(product.offer_price);
            const hasOffer = offer > 0 && actual > offer;
            const price = hasOffer ? offer : actual;
            const isNew = product.created_at &&
                new Date(product.created_at).getTime() >= Date.parse(cutoff);
            const isTrending = trendingIds.has(id);
            const badge = isTrending
                ? "🔥 Trending"
                : "✨ New";

            return `
                <article class="latest-product-card"
                    onclick="window.location.href='products.html'">
                    <div class="latest-product-image">
                        <span class="product-badge ${isTrending ? "trending-badge" : ""}">
                            ${badge}
                        </span>
                        <img src="${image}" alt="${name}" loading="lazy">
                    </div>
                    <div class="latest-product-info">
                        <div class="latest-product-price">
                            <strong>₹${price.toLocaleString("en-IN")}</strong>
                            ${hasOffer ? `<del>₹${actual.toLocaleString("en-IN")}</del>` : ""}
                        </div>
                        <h3>${name}</h3>
                        <a href="products.html">Shop now →</a>
                    </div>
                </article>
            `;
        }).join("");
    } catch (error) {
        console.error("Unable to load latest and trending products:", error);
        track.innerHTML = "<p>Products could not be loaded right now. Please try again later.</p>";
    }
}
