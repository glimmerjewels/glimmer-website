

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

    const { data, error } =
        await supabaseClient
            .from("products")
            .select("*")
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

    const grid =
        document.getElementById(
            "productsGrid"
        );

    const title =
        document.getElementById(
            "categoryTitle"
        );

    grid.innerHTML = "";

    let productsToShow = [...allProducts];

const selectedCategory = normalizeCategory(category);

if (selectedCategory !== "all") {
productsToShow = productsToShow.filter(product =>
normalizeCategory(product.category) === selectedCategory
);
}

// Search product names and categories.
const searchTerm = (
document.getElementById("productSearch")?.value || ""
).trim().toLowerCase();

if (searchTerm) {
productsToShow = productsToShow.filter(product =>
String(product.name || "").toLowerCase().includes(searchTerm) ||
String(product.category || "").toLowerCase().includes(searchTerm)
);
}

// Apply the selected price range.
productsToShow = productsToShow.filter(product => {
const price = getProductPrice(product);

if (minPriceFilter !== null && price < minPriceFilter) {
    return false;
}

if (maxPriceFilter !== null && price > maxPriceFilter) {
    return false;
}

return true;

});

// Sort the filtered results.
const sortValue =
document.getElementById("productSort")?.value || "newest";

if (sortValue === "price-low") {
productsToShow.sort(
(a, b) => getProductPrice(a) - getProductPrice(b)
);
} else if (sortValue === "price-high") {
productsToShow.sort(
(a, b) => getProductPrice(b) - getProductPrice(a)
);
} else if (sortValue === "offers") {
productsToShow.sort((a, b) => {
const aHasOffer =
Number(a.offer_price) > 0 &&
Number(a.actual_price) > Number(a.offer_price);

    const bHasOffer =
        Number(b.offer_price) > 0 &&
        Number(b.actual_price) > Number(b.offer_price);

    return Number(bHasOffer) - Number(aHasOffer);
});

} else {
productsToShow.sort(
(a, b) =>
new Date(b.created_at || 0) -
new Date(a.created_at || 0)
);
}


    title.innerText =
        category === "all"
            ? "All Products"
            : category.charAt(0)
                .toUpperCase() +
              category.slice(1);

    // ===== OPTIMIZATION: Fetch all images in parallel =====
    const imageMap = {};
    
    try {
        // Fetch all images concurrently instead of sequentially
        const imagePromises = 
            productsToShow.map(async (product) => {
                const images = 
                    await getImages(product.id);
                imageMap[product.id] = 
                    images.length > 0
                        ? images[0].image_url
                        : "assets/no-image.png";
            });
        
        await Promise.all(imagePromises);
    } catch (error) {
        console.error("Error fetching images:", error);
    }

    // ===== OPTIMIZATION: Build HTML string first, then insert once =====
    let htmlContent = "";

    for (const product of productsToShow) {

        const coverImage = 
            imageMap[product.id] || 
            "assets/no-image.png";
        
        const isNew =
            new Date(product.created_at) >
            new Date(
                Date.now()-7*24*60*60*1000);
        
        htmlContent += `

        <div
        class="product-card"
        onclick="openProductPopup('${product.id}')">
            ${isNew ? `
            <div class="new-badge">
            ✨ New Arrival</div>
            `: ""}
            ${product.stock <= 0 ?`<div class="stock-badge">
            Out Of Stock </div>`: ""}
            
            <img
            src="${coverImage}"
            alt="${product.name}"
            loading="lazy">

            <h3>
                ${product.name}
            </h3>

        </div>

        `;
    }

    // ===== OPTIMIZATION: Insert all HTML at once =====
    grid.innerHTML = htmlContent;
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
            .select("*")
            .eq(
                "product_id",
                productId
            );

    return data || [];
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

        mainImage.src =
            images[0].image_url;

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

        strip.innerHTML += `

        <img
        src="${img.image_url}"
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
        .select("*")
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

    data.forEach(review=>{

        container.innerHTML +=

        `
        <div class="review-card">

            <strong>
            ${review.customer_name}
            </strong>

            <div>

            ${"⭐".repeat(
                review.rating
            )}

            </div>

            <p>
            ${review.review}
            </p>

        </div>
        `;
    });
}
async function submitReview() {

    const name =
        document
        .getElementById(
            "reviewName"
        )
        .value.trim();

    const rating =
        parseFloat(
            document
            .getElementById(
                "reviewRating"
            )
            .value
        );

    const review =
        document
        .getElementById(
            "reviewComment"
        )
        .value.trim();

    if(!name || !review){

        alert(
            "Please complete review"
        );

        return;
    }

    const { error } =
        await supabaseClient
        .from("reviews")
        .insert([{

            product_id:
                currentReviewProductId,

            customer_name:
                name,

            rating:
                rating,

            review:
                review

        }]);

    if(error){

        console.error(error);

        alert(
            "Unable to save review"
        );

        return;
    }

    document
    .getElementById(
        "reviewName"
    )
    .value = "";

    document
    .getElementById(
        "reviewComment"
    )
    .value = "";

    loadReviews(
        currentReviewProductId
    );
}
