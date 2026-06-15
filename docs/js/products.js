
// ======================================
// GLOBALS
// ======================================

let allProducts = [];

let selectedProduct = null;

let currentQuantity = 1;

let currentReviewProductId = null;

// ======================================
// PAGE LOAD
// ======================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        loadProducts();

        initializeFilters();

    }
);

// ======================================
// LOAD PRODUCTS
// ======================================

async function loadProducts() {

      const productsGrid =
        document.getElementById(
            "productsGrid"
        );

    // SHOW SKELETONS

    productsGrid.innerHTML =

        Array(8)
        .fill("")
        .map(() => `

            <div class="skeleton-card"></div>

        `)
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

    let productsToShow =
        allProducts;

    if (category !== "all") {

        productsToShow =
            allProducts.filter(
                product =>
                product.category ===
                category
            );
    }

    title.innerText =
        category === "all"
            ? "All Products"
            : category.charAt(0)
                .toUpperCase() +
              category.slice(1);

    for (const product of productsToShow) {

        const images =
            await getImages(
                product.id
            );

        const coverImage =
            images.length > 0
                ? images[0].image_url
                : "assets/no-image.png";
        
        const isNew =
            new Date(product.created_at) >
            new Date(
                Date.now()-15*24*60*60*1000);
        
        grid.innerHTML += `

        <div
        class="product-card"
        onclick="openProductPopup(${product.id})">
            ${isNew ? `
            <div class="new-badge">
            ✨ New Arrival</div>
            `: ""}
            ${product.stock <= 0 ?`<div class="stock-badge">
            Out Of Stock </div>`: ""}
            
            <img
            src="${coverImage}"
            alt="${product.name}">

            <h3>
                ${product.name}
            </h3>

        </div>

        `;
    }
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

async function openProductPopup(
    productId
) {

    selectedProduct =
        allProducts.find(
            p => p.id === productId
        );
    currentReviewProductId = product.id;
    if (!selectedProduct)
        return;

    currentQuantity = 1;

    document
        .getElementById(
            "quantityValue"
        )
        .innerText =
        currentQuantity;

    const images =
        await getImages(
            productId
        );

    populatePopup(
        selectedProduct,
        images
    );
    loadReviews(
    productId
    );
    document
        .getElementById(
            "productPopup"
        )
        .classList.remove(
            "hidden"
        );
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

    document
        .getElementById(
            "productPopup"
        )
        .classList.add(
            "hidden"
        );
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
