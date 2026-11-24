
// ======================================
// GLOBALS
// ======================================

let allProducts = [];

let selectedProduct = null;

let currentQuantity = 1;

let currentReviewProductId = null;

let currentCategory = "all";
let minPriceFilter = null;
let maxPriceFilter = null;

// ======================================
// ESCAPE HTML UTILITY (XSS PROTECTION)
// ======================================

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    }[char]));
}

// Rate-limiting timestamp for review submissions (anti-spam)
let lastReviewSubmissionTime = 0;

// ======================================
// IMAGE TRANSFORMATION HELPER
// ======================================

/**
 * Appends Supabase Storage image-transform query params to a URL so we
 * serve a correctly-sized, compressed image instead of the full original.
 *
 * @param {string} url      - The raw Supabase Storage URL (or any fallback URL).
 * @param {object} opts
 * @param {number} opts.width   - Desired pixel width.
 * @param {number} opts.quality - JPEG/WebP quality (1-100).
 * @returns {string}
 */
function getTransformedUrl(url, { width = 400, quality = 75 } = {}) {
    if (!url || typeof url !== "string") return url;

    // Only apply transforms to Supabase Storage URLs.
    if (!url.includes(".supabase.co/storage/")) return url;

    try {
        const u = new URL(url);
        u.searchParams.set("width", width);
        u.searchParams.set("quality", quality);
        // "origin" lets the CDN serve WebP/AVIF based on the browser's
        // Accept header, with the original format as a fallback.
        u.searchParams.set("format", "origin");
        return u.toString();
    } catch {
        return url;
    }
}

// ======================================
// PAGE LOAD
// ======================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        loadProducts();

        initializeFilters();

        initializeProductTools();
        window.addEventListener("popstate", () => {
    const category =
        new URLSearchParams(window.location.search)
            .get("category") || "all";

    currentCategory = category;
    renderProducts(category);
    highlightCategory(category);
});

    }
);

// ======================================
// LOAD PRODUCTS
// ======================================

async function loadProducts() {

    const grid =
        document.getElementById(
            "productsGrid"
        );

    grid.innerHTML =

        Array(8)
        .fill("")
        .map(() =>

        `<div class="skeleton-card"></div>`

        )
        .join("");

    // Only select the columns the grid actually uses — avoids downloading
    // heavy text fields like description that are only needed in the popup.
    const { data, error } =
        await supabaseClient
            .from("products")
            .select("id, name, category, actual_price, offer_price, stock, created_at")
            .order("created_at", {
                ascending: false
            });

    if (error) {

        console.error(error);

        return;
    }

    allProducts = data;

    const params =
    new URLSearchParams(
        window.location.search
    );

    const category =
    params.get(
        "category"
    ) || "all";

    currentCategory = category;

    renderProducts(
    category
    );
    highlightCategory(
    category
    );
}

// ======================================
// FILTERS
// ======================================

function initializeFilters() {

    document
        .querySelectorAll(".filter-btn")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    document
                        .querySelectorAll(".filter-btn")
                        .forEach(btn => {

                            btn.classList.remove(
                                "active"
                            );

                        });

                    button.classList.add(
                        "active"
                    );

                    const category =
                        button.dataset.category;
                    currentCategory = category;

                    // ===== FIX: Update URL when button is clicked =====
                    window.history.pushState(
                        { category: category },
                        '',
                        `products.html?category=${category}`
                    );

                    renderProducts(
                        category
                    );
                    highlightCategory(
                        category
                    );

                }
            );

        });
}

// ======================================
// TOOLBARS FUNCTION
// ======================================


function initializeProductTools() {
const searchInput = document.getElementById("productSearch");
const sortSelect = document.getElementById("productSort");
const filterSheet = document.getElementById("filterSheet");

const openButton = document.getElementById("openFilterSheet");
const closeButton = document.getElementById("closeFilterSheet");
const applyButton = document.getElementById("applyPriceFilters");
const clearButton = document.getElementById("clearPriceFilters");

let searchTimer;

// Search by product name or category.
searchInput?.addEventListener("input", () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
        renderProducts(currentCategory);
    }, 250);
});

// Change product ordering.
sortSelect?.addEventListener("change", () => {
    renderProducts(currentCategory);
});

function closeFilterSheet() {
    filterSheet?.classList.add("hidden");
    filterSheet?.setAttribute("aria-hidden", "true");
}

openButton?.addEventListener("click", () => {
    filterSheet?.classList.remove("hidden");
    filterSheet?.setAttribute("aria-hidden", "false");
});

closeButton?.addEventListener("click", closeFilterSheet);

// Apply the selected minimum and maximum prices.
applyButton?.addEventListener("click", () => {
    const minInput = document.getElementById("minPrice");
    const maxInput = document.getElementById("maxPrice");

    const minValue = minInput.value.trim();
    const maxValue = maxInput.value.trim();

    minPriceFilter = minValue === "" ? null : Number(minValue);
    maxPriceFilter = maxValue === "" ? null : Number(maxValue);

    if (
        (minPriceFilter !== null && minPriceFilter < 0) ||
        (maxPriceFilter !== null && maxPriceFilter < 0) ||
        (minPriceFilter !== null &&
            maxPriceFilter !== null &&
            minPriceFilter > maxPriceFilter)
    ) {
        alert("Please enter a valid price range.");
        return;
    }

    closeFilterSheet();
    renderProducts(currentCategory);
});

// Clear the price range.
clearButton?.addEventListener("click", () => {
    document.getElementById("minPrice").value = "";
    document.getElementById("maxPrice").value = "";

    minPriceFilter = null;
    maxPriceFilter = null;

    renderProducts(currentCategory);
});

}

// Match URL slugs such as "necklace" with database categories
// such as "Necklace & Chains".
function normalizeCategory(value) {
const normalized = String(value ?? "")
.toLowerCase()
.replace(/&/g, "and")
.replace(/[^a-z0-9]/g, "");


const aliases = {
    necklaceandchains: "necklace",
    necklacechains: "necklace",
    necklaces: "necklace",
    men: "mens"
};

return aliases[normalized] || normalized;


}

// Use the offer price when available; otherwise use the actual price.
function getProductPrice(product) {
const offerPrice = Number(product.offer_price);
const actualPrice = Number(product.actual_price);


return Number.isFinite(offerPrice) && offerPrice > 0
    ? offerPrice
    : actualPrice;


}


// ======================================
// RENDER PRODUCTS
// ======================================


async function renderProducts(category) {
    const grid = document.getElementById("productsGrid");
    const title = document.getElementById("categoryTitle");

    if (!grid || !title) return;

    grid.innerHTML = "";

    let productsToShow = [...allProducts];
    const selectedCategory = normalizeCategory(category);

    if (selectedCategory !== "all") {
        productsToShow = productsToShow.filter(
            product => normalizeCategory(product.category) === selectedCategory
        );
    }

    const searchTerm = (
        document.getElementById("productSearch")?.value || ""
    ).trim().toLowerCase();

    if (searchTerm) {
        productsToShow = productsToShow.filter(product =>
            String(product.name || "").toLowerCase().includes(searchTerm) ||
            String(product.category || "").toLowerCase().includes(searchTerm)
        );
    }

    productsToShow = productsToShow.filter(product => {
        const price = getProductPrice(product);
        if (minPriceFilter !== null && price < minPriceFilter) return false;
        if (maxPriceFilter !== null && price > maxPriceFilter) return false;
        return true;
    });

    const sortValue =
        document.getElementById("productSort")?.value || "newest";

    if (sortValue === "price-low") {
        productsToShow.sort((a, b) => getProductPrice(a) - getProductPrice(b));
    } else if (sortValue === "price-high") {
        productsToShow.sort((a, b) => getProductPrice(b) - getProductPrice(a));
    } else if (sortValue === "offers") {
        productsToShow.sort((a, b) => {
            const aOffer = Number(a.actual_price) > Number(a.offer_price);
            const bOffer = Number(b.actual_price) > Number(b.offer_price);
            return Number(bOffer) - Number(aOffer);
        });
    } else {
        productsToShow.sort(
            (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)
        );
    }

    title.textContent = selectedCategory === "all"
        ? "All Products"
        : category.charAt(0).toUpperCase() + category.slice(1);

    if (!productsToShow.length) {
        grid.innerHTML = "<p class='no-products'>No jewellery found. Try another category or search.</p>";
        return;
    }

    // ─── BATCH image fetch (1 query instead of N) ────────────────────────
    // Previously each product card triggered its own getImages() DB call,
    // creating an N+1 waterfall.  We now fetch all images for all visible
    // products in a single query, then build a lookup map.
    const productIds = productsToShow.map(product => product.id);

    const [imageResult, reviewResult, trendingIds] = await Promise.all([
        supabaseClient
            .from("product_images")
            .select("product_id, image_url")   // only the two columns we need
            .in("product_id", productIds),
        supabaseClient
            .from("reviews")
            .select("product_id, rating")
            .in("product_id", productIds),
        getTrendingProductIds()
    ]);

    // Build a product_id → first image_url map.
    const imageMap = {};
    if (imageResult.error) {
        console.error("Unable to load product images:", imageResult.error);
    } else {
        (imageResult.data || []).forEach(row => {
            const key = String(row.product_id);
            // Keep the first image for each product (server order = insertion order).
            if (!imageMap[key]) {
                // Apply a 400 px wide transform for thumbnail grids.
                imageMap[key] = getTransformedUrl(row.image_url, { width: 400, quality: 75 });
            }
        });
    }
    const ratingsByProduct = {};
    if (reviewResult.error) {
        console.error("Unable to load product ratings:", reviewResult.error);
    } else {
        (reviewResult.data || []).forEach(review => {
            const rating = Number(review.rating);
            if (!Number.isFinite(rating) || rating < 1 || rating > 5) return;

            const id = String(review.product_id);
            if (!ratingsByProduct[id]) {
                ratingsByProduct[id] = { total: 0, count: 0 };
            }

            ratingsByProduct[id].total += rating;
            ratingsByProduct[id].count += 1;
        });
    }

    const escapeHTML = value => String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    }[char]));

    grid.innerHTML = productsToShow.map((product, index) => {
        const id = String(product.id);
        const name = escapeHTML(product.name);
        // Fall back to placeholder if no image was returned.
        const rawImage = imageMap[id] || "assets/no-image.png";
        const image = escapeHTML(rawImage);
        const offerPrice = Number(product.offer_price);
        const actualPrice = Number(product.actual_price);
        const hasOffer = actualPrice > offerPrice && offerPrice > 0;
        const price = hasOffer ? offerPrice : actualPrice;
        const isNew = product.created_at &&
            new Date(product.created_at).getTime() >=
            Date.now() - 15 * 24 * 60 * 60 * 1000;
        const isTrending = trendingIds.has(id);
        const reviews = ratingsByProduct[id];
        const showRating = reviews && reviews.count > 3;
        const average = showRating
            ? (reviews.total / reviews.count).toFixed(1)
            : "";

        const badge = isTrending
            ? '<span class="product-badge trending-badge">🔥 Trending</span>'
            : isNew
                ? '<span class="product-badge">✨ New</span>'
                : "";

        const ratingHTML = showRating
            ? `<div class="product-rating"><span>${average} ★</span><span>|</span><span>${reviews.count}</span></div>`
            : "";

        const cartButton = Number(product.stock) > 0
            ? `<button class="product-add-cart" type="button"
                aria-label="Add ${name} to cart"
                onclick="event.stopPropagation(); addProductCardToCart('${id}')">
                <span aria-hidden="true">Add To </span><span aria-hidden="true">🛒</span>
               </button>`
            : '<span class="product-card-out-of-stock">Out of stock</span>';

        // The first 6 cards are likely above the fold — load eagerly and
        // signal high fetch priority so the browser pre-loads them.
        // Everything else is lazy-loaded to avoid wasted bandwidth.
        const isAboveFold = index < 6;
        const loadingAttr    = isAboveFold ? 'loading="eager"'          : 'loading="lazy"';
        const priorityAttr   = isAboveFold ? 'fetchpriority="high"'     : 'fetchpriority="low"';
        const decodingAttr   = isAboveFold ? 'decoding="sync"'          : 'decoding="async"';

return `
    <article class="product-card" onclick="openProductPopup('${id}')">
        <div class="product-image-wrap">
            ${badge}
            <img src="${image}" alt="${name}" ${loadingAttr} ${decodingAttr} ${priorityAttr}>
            ${ratingHTML}
        </div>
        <div class="product-card-info">
            <div class="product-prices">
                <strong>₹${price.toLocaleString("en-IN")}</strong>
                ${hasOffer ? `<del>₹${actualPrice.toLocaleString("en-IN")}</del>` : ""}
            </div>
            <h3>${name}</h3>
            ${cartButton}
        </div>
    </article>
`;
    }).join("");
}


// ======================================
// ADD PRODUCT TO CART DIRECTLY
// ======================================


async function addProductCardToCart(productId) {
    const product = allProducts.find(
        item => String(item.id) === String(productId)
    );

    if (!product) {
        alert("Product could not be found. Please refresh the page.");
        return;
    }

    if (Number(product.stock) <= 0) {
        alert("Sorry, this product is out of stock.");
        return;
    }

    const images = await getImages(product.id);
    const cart = JSON.parse(localStorage.getItem("glimmerCart") || "[]");

    const existing = cart.find(
        item => String(item.id) === String(product.id)
    );

    if (existing) {
        if (Number(existing.quantity) + 1 > Number(product.stock)) {
            alert(`Only ${product.stock} item(s) available in stock.`);
            return;
        }

        existing.quantity = Number(existing.quantity) + 1;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            // Store the cart thumbnail at a modest size (200 px) — it's only
            // shown in the cart sidebar/page, not at full resolution.
            image: getTransformedUrl(images[0]?.image_url || "", { width: 200, quality: 70 }),
            category: product.category,
            actual_price: product.actual_price,
            offer_price: product.offer_price,
            stock: product.stock,
            quantity: 1
        });
    }

    localStorage.setItem("glimmerCart", JSON.stringify(cart));

    const totalItems = cart.reduce(
        (sum, item) => sum + Number(item.quantity || 0),
        0
    );

    alert(`Added to cart! Cart items: ${totalItems}`);
}


// ======================================
// GET PRODUCT IMAGES
// ======================================

async function getImages(
    productId
) {

    const { data } =
        await supabaseClient
            .from("product_images")
            .select("image_url")   // only the column we need
            .eq(
                "product_id",
                productId
            );

    return data || [];
}

// ======================================
// GET TRENDING PRODUCT
// ======================================

async function getTrendingProductIds() {
    const { data: recentOrders, error: ordersError } =
        await supabaseClient
            .from("orders")
            .select("id")
            .in("status", ["Confirmed", "Delivered"])
            .order("created_at", { ascending: false })
            .limit(25);

    if (ordersError) {
        console.error("Unable to load recent orders:", ordersError);
        return new Set();
    }

    const orderIds = (recentOrders || []).map(order => order.id);
    if (!orderIds.length) return new Set();

    const { data: items, error: itemsError } =
        await supabaseClient
            .from("order_items")
            .select("product_id")
            .in("order_id", orderIds);

    if (itemsError) {
        console.error("Unable to load trending products:", itemsError);
        return new Set();
    }

    return new Set(
        (items || [])
            .map(item => String(item.product_id))
            .filter(Boolean)
    );
}

// ======================================
// PRODUCT POPUP
// ======================================


async function openProductPopup(productId) {
    selectedProduct = allProducts.find(
        product => String(product.id) === String(productId)
    );

    if (!selectedProduct) {
        console.error("Quick View could not find product:", productId);
        return;
    }

    const overlay = document.getElementById("productPopup");

    if (!overlay) {
        console.error("Product popup element #productPopup was not found.");
        return;
    }

    currentReviewProductId = selectedProduct.id;
    currentQuantity = 1;

    document.getElementById("quantityValue").innerText = currentQuantity;

    // Show and center the overlay immediately.
    overlay.classList.remove("hidden");
    document.body.classList.add("popup-open");
    document.body.style.overflow = "hidden";

    const popup = overlay.querySelector(".product-popup");

    if (popup) {
        popup.scrollTop = 0;
    }

    try {
        const images = await getImages(selectedProduct.id);

        // Do not populate a different product if another was clicked
        // while the images were loading.
        if (
            !selectedProduct ||
            String(selectedProduct.id) !== String(productId)
        ) {
            return;
        }

        populatePopup(selectedProduct, images);

        if (popup) {
            popup.scrollTop = 0;
        }

        loadReviews(selectedProduct.id);
    } catch (error) {
        console.error("Unable to load Quick View details:", error);
    }
}

// ======================================
// POPULATE POPUP
// ======================================

function populatePopup(
    product,
    images
) {

    document
        .getElementById(
            "popupName"
        )
        .innerText =
        product.name;

    document
        .getElementById(
            "popupDescription"
        )
        .innerText =
        product.description || "";

    document
        .getElementById(
            "popupActualPrice"
        )
        .innerText =
        `₹${product.actual_price}`;

    document
        .getElementById(
            "popupOfferPrice"
        )
        .innerText =
        `₹${product.offer_price}`;

    document
        .getElementById(
            "popupStock"
        )
        .innerText =
        product.stock;
    
        const cartBtn =
        document.getElementById(
            "addToCartBtn"
        );

        if (
            product.stock <= 0
        ) {

            cartBtn.disabled = true;

            cartBtn.innerText =
                "Out Of Stock";

        }
        else {

            cartBtn.disabled = false;

            cartBtn.innerText =
                "Add To Cart";

        }
    
    const mainImage =
        document.getElementById(
            "mainPopupImage"
        );

    if (images.length > 0) {

        // 900 px wide, high quality for the full-size popup view.
        mainImage.src =
            getTransformedUrl(images[0].image_url, { width: 900, quality: 85 });

    } else {

        mainImage.src =
            "assets/no-image.png";
    }

    const strip =
        document.getElementById(
            "thumbnailStrip"
        );

    strip.innerHTML = "";

    images.forEach(img => {
        // 140 px wide thumbnails — small and fast to load.
        const thumbUrl = getTransformedUrl(img.image_url, { width: 140, quality: 70 });

        strip.innerHTML += `

        <img
        src="${thumbUrl}"
        loading="lazy"
        decoding="async"
        onclick="changeMainImage('${img.image_url}')">

        `;

    });
}

// ======================================
// CHANGE MAIN IMAGE
// ======================================

function changeMainImage(
    imageUrl
) {

    document
        .getElementById(
            "mainPopupImage"
        )
        .src =
        imageUrl;
}

// ======================================
// CLOSE POPUP
// ======================================


function closePopup() {
    const overlay = document.getElementById("productPopup");

    if (overlay) {
        overlay.classList.add("hidden");
    }

    document.body.classList.remove("popup-open");
    document.body.style.overflow = "";
}


// ======================================
// QUANTITY
// ======================================

function increaseQty() {

    if (!selectedProduct)
        return;

    if (
        currentQuantity <
        selectedProduct.stock
    ) {

        currentQuantity++;

        document
            .getElementById(
                "quantityValue"
            )
            .innerText =
            currentQuantity;
    }
}

function decreaseQty() {

    if (
        currentQuantity > 1
    ) {

        currentQuantity--;

        document
            .getElementById(
                "quantityValue"
            )
            .innerText =
            currentQuantity;
    }
}

// ======================================
// ADD TO CART
// ======================================

async function addToCart() {

    if (!selectedProduct)
        return;

    const images =
        await getImages(
            selectedProduct.id
        );

    const cart =
        JSON.parse(
            localStorage.getItem(
                "glimmerCart"
            )
        ) || [];

    const existing =
        cart.find(
            item =>
            item.id ===
            selectedProduct.id
        );

    if (existing) {

        const newQty =
            existing.quantity +
            currentQuantity;

        if (
            newQty >
            selectedProduct.stock
        ) {

            alert(
                `Only ${selectedProduct.stock} item(s) available in stock`
            );

            return;
        }

        existing.quantity =
            newQty;

    }
    else {

        if (
            currentQuantity >
            selectedProduct.stock
        ) {

            alert(
                `Only ${selectedProduct.stock} item(s) available in stock`
            );

            return;
        }

        cart.push({

            id:
                selectedProduct.id,

            name:
                selectedProduct.name,

            image:
                images.length > 0
                    ? images[0]
                        .image_url
                    : "",
            category: selectedProduct.category,

            actual_price:
                selectedProduct.actual_price,

            offer_price:
                selectedProduct.offer_price,

            stock:
                selectedProduct.stock,

            quantity:
                currentQuantity

        });
    }

    localStorage.setItem(

        "glimmerCart",

        JSON.stringify(cart)

    );

       const totalItems =
        cart.reduce(
            (sum,item) =>
            sum +
            item.quantity,
            0
        );

        alert(
        `Added To Cart\nCart Items : ${totalItems}`
        );

    closePopup();
}
// ========================
// Highlight selected Category
// ========================


function highlightCategory(
    category
){

    document
    .querySelectorAll(
        ".filter-btn"
    )
    .forEach(btn => {

        btn.classList.remove(
            "active"
        );

        if(

            btn.dataset.category
            ===
            category

        ){

            btn.classList.add(
                "active"
            );
        }

    });
}
async function loadReviews(
    productId
){

    const { data } =
        await supabaseClient
        .from("reviews")
        .select("customer_name, rating, review, created_at")
        .eq(
            "product_id",
            productId
        )
        .order(
            "created_at",
            {
                ascending:false
            }
        );

    const container =
        document.getElementById(
            "reviewsContainer"
        );

    container.innerHTML = "";

    if(!data?.length){

        container.innerHTML =
        `
        <p>
        No reviews yet
        </p>
        `;

        return;
    }

    data.forEach(review => {
        const safeName = escapeHTML(review.customer_name);
        const safeReview = escapeHTML(review.review);
        const safeRating = Math.max(1, Math.min(5, Math.round(Number(review.rating) || 5)));

        container.innerHTML += `
        <div class="review-card">
            <strong>${safeName}</strong>
            <div>
            ${"⭐".repeat(safeRating)}
            </div>
            <p>${safeReview}</p>
        </div>
        `;
    });
}
async function submitReview() {
    // Anti-spam cooldown check (10 seconds)
    const now = Date.now();
    if (now - lastReviewSubmissionTime < 10000) {
        alert("Please wait a few seconds before submitting another review.");
        return;
    }

    const nameInput = document.getElementById("reviewName");
    const reviewInput = document.getElementById("reviewComment");
    const ratingInput = document.getElementById("reviewRating");

    const name = nameInput.value.trim();
    const rating = parseFloat(ratingInput.value);
    const review = reviewInput.value.trim();

    // Input bounds validation
    if (!name || name.length < 2 || name.length > 60) {
        alert("Please enter a valid name (2 to 60 characters).");
        return;
    }

    if (!review || review.length < 5 || review.length > 1000) {
        alert("Please enter a review between 5 and 1,000 characters.");
        return;
    }

    if (isNaN(rating) || rating < 1 || rating > 5) {
        alert("Please select a valid rating between 1 and 5 stars.");
        return;
    }

    const submitBtn = document.querySelector(".submit-review-btn");
    if (submitBtn) submitBtn.disabled = true;

    try {
        const { error } =
            await supabaseClient
            .from("reviews")
            .insert([{
                product_id: currentReviewProductId,
                customer_name: name,
                rating: Math.round(rating),
                review: review
            }]);

        if (error) {
            console.error(error);
            alert("Unable to save review: " + (error.message || "Security or database error."));
            return;
        }

        lastReviewSubmissionTime = Date.now();
        nameInput.value = "";
        reviewInput.value = "";
        alert("Review submitted successfully! Thank you.");

        loadReviews(currentReviewProductId);
    } finally {
        if (submitBtn) submitBtn.disabled = false;
    }
}
