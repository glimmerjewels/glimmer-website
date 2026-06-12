// ==============================
// GLOBALS
// ==============================

let products = [];

let currentPage = 1;

const PRODUCTS_PER_PAGE = 25;

// ==============================
// INIT
// ==============================

document.addEventListener("DOMContentLoaded", async () => {

    const {
        data: { session }
    } = await supabaseClient.auth.getSession();

    if (session) {

        document
            .getElementById("loginOverlay")
            .classList.add("hidden");

        document
            .getElementById("adminPanel")
            .classList.remove("hidden");

        loadInventory();

    }
});

// ==============================
// LOGIN
// ==============================

async function login() {

    const email =
        document.getElementById("adminEmail").value;

    const password =
        document.getElementById("adminPassword").value;

    const errorBox =
        document.getElementById("loginError");

    errorBox.innerText = "";

    const { error } =
        await supabaseClient.auth.signInWithPassword({
            email,
            password
        });

    if (error) {

        errorBox.innerText =
            "Invalid Email or Password";

        return;
    }

    document
        .getElementById("loginOverlay")
        .classList.add("hidden");

    document
        .getElementById("adminPanel")
        .classList.remove("hidden");

    loadInventory();
}

// ==============================
// LOGOUT
// ==============================

async function logout() {

    await supabaseClient.auth.signOut();

    location.reload();
}

// ==============================
// POPUP
// ==============================

function openProductPopup() {

    document
        .getElementById("productPopup")
        .classList.remove("hidden");
}

function closeProductPopup() {

    document
        .getElementById("productPopup")
        .classList.add("hidden");
}

// ==============================
// LOAD INVENTORY
// ==============================

async function loadInventory() {

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

    products = data || [];

    currentPage = 1;

    renderTable();
    renderPagination();
}

// ==============================
// PAGINATION
// ==============================

function renderPagination() {

    const totalPages =
        Math.ceil(
            products.length /
            PRODUCTS_PER_PAGE
        );

    const pagination =
        document.getElementById("pagination");

    pagination.innerHTML = "";

    if (currentPage > 1) {

        pagination.innerHTML += `
            <button onclick="changePage(${currentPage - 1})">
                Previous
            </button>
        `;
    }

    for (let i = 1; i <= totalPages; i++) {

        pagination.innerHTML += `
            <button
            class="${i === currentPage ? "active-page" : ""}"
            onclick="changePage(${i})">
            ${i}
            </button>
        `;
    }

    if (currentPage < totalPages) {

        pagination.innerHTML += `
            <button onclick="changePage(${currentPage + 1})">
                Next
            </button>
        `;
    }
}

function changePage(page) {

    currentPage = page;

    renderTable();
    renderPagination();
}

// ==============================
// TABLE
// ==============================

async function renderTable() {

    const tbody =
        document.getElementById("inventoryBody");

    tbody.innerHTML = "";

    const start =
        (currentPage - 1) * PRODUCTS_PER_PAGE;

    const end =
        start + PRODUCTS_PER_PAGE;

    const pageProducts =
        products.slice(start, end);

    for (const product of pageProducts) {

        const images =
            await getProductImages(product.id);

    const thumbnails =
    images
    .slice(0,3)
    .map(img => `
        <img
        src="${img.image_url}"
        class="mini-thumb">
    `).join("");

    const extraCount =
    images.length > 3
    ? `<span class="more-images">
         +${images.length - 3}
       </span>`
    : "";
        tbody.innerHTML += `

        <tr id="row-${product.id}">

            <td>${product.name}</td>

            <td>
                <div class="thumb-container">
                    ${thumbnails}
                    ${extraCount}
                </div>
            </td>

            <td>${product.category}</td>

            <td>
                ₹${product.actual_price}
            </td>

            <td>
                ₹${product.offer_price}
            </td>

            <td>
                ${product.stock}
            </td>

            <td>

               <button
                class="edit-btn"
                onclick="editProduct(${product.id})">

                Edit

                </button>

                <button
                class="delete-btn"
                onclick="deleteProduct(${product.id})">

                Delete

                </button>

            </td>

        </tr>
        `;
    }
}

// ==============================
// IMAGES
// ==============================

async function getProductImages(productId) {

    const { data } =
        await supabaseClient
            .from("product_images")
            .select("*")
            .eq("product_id", productId);

    return data || [];
}

// ==============================
// EDIT PRODUCT
// ==============================

async function editProduct(productId) {

    const product =
        products.find(
            p => p.id === productId
        );

    const row =
        document.getElementById(
            `row-${productId}`
        );

    const images =
        await getProductImages(productId);

   const thumbnails =
    images
    .slice(0,3)
    .map(img => `
        <img
        src="${img.image_url}"
        class="mini-thumb">
    `).join("");

const extraCount =
    images.length > 3
    ? `<span class="more-images">
         +${images.length - 3}
       </span>`
    : "";

    row.innerHTML = `

        <td>${product.name}</td>

        <td>${thumbnails}</td>

        <td>${product.category}</td>

        <td>
            <input
            type="number"
            id="actual-${productId}"
            value="${product.actual_price}">
        </td>

        <td>
            <input
            type="number"
            id="offer-${productId}"
            value="${product.offer_price}">
        </td>

        <td>
            <input
            type="number"
            id="stock-${productId}"
            value="${product.stock}">
        </td>

        <td>

           <button
            class="done-btn"
            onclick="saveEdit(${productId})">

            Done

            </button>

        </td>
    `;
}

// ==============================
// SAVE EDIT
// ==============================

async function saveEdit(productId) {

    const actualPrice =
        document.getElementById(
            `actual-${productId}`
        ).value;

    const offerPrice =
        document.getElementById(
            `offer-${productId}`
        ).value;

    const stock =
        document.getElementById(
            `stock-${productId}`
        ).value;

    const { error } =
        await supabaseClient
            .from("products")
            .update({

                actual_price: actualPrice,

                offer_price: offerPrice,

                stock: stock

            })
            .eq("id", productId);

    if (error) {

        alert("Update failed");
        return;
    }

    loadInventory();
}

// ==============================
// DELETE PRODUCT
// ==============================

async function deleteProduct(productId) {

    const confirmDelete =
        confirm(
            "Delete this product permanently?"
        );

    if (!confirmDelete)
        return;

    try {

        const images =
            await getProductImages(
                productId
            );

        for (const img of images) {

            const path =
                img.image_url
                    .split(
                        "/product-images/"
                    )[1];

            if (path) {

                await supabaseClient
                    .storage
                    .from(
                        "product-images"
                    )
                    .remove([
                        path
                    ]);
            }
        }

        await supabaseClient
            .from(
                "product_images"
            )
            .delete()
            .eq(
                "product_id",
                productId
            );

        await supabaseClient
            .from(
                "products"
            )
            .delete()
            .eq(
                "id",
                productId
            );

        alert(
            "Product Deleted"
        );

        loadInventory();

    }
    catch(error){

        console.error(error);

        alert(
            "Delete Failed"
        );
    }
}
// ==============================
// SAVE PRODUCT
// ==============================

async function saveProduct() {

    const name =
        document.getElementById(
            "productName"
        ).value;

    const category =
        document.getElementById(
            "productCategory"
        ).value;

    const actualPrice =
        document.getElementById(
            "actualPrice"
        ).value;

    const offerPrice =
        document.getElementById(
            "offerPrice"
        ).value;

    const description =
        document.getElementById(
            "description"
        ).value;

    const stock =
        document.getElementById(
            "stock"
        ).value;

    const imageFiles =
        document.getElementById(
            "productImages"
        ).files;

    if (!name || imageFiles.length === 0) {

        alert("Complete all fields");
        return;
    }

    const productInsert =
        await supabaseClient
            .from("products")
            .insert([{

                name,
                category,
                actual_price: actualPrice,
                offer_price: offerPrice,
                description,
                stock

            }])
            .select()
            .single();

    const product =
        productInsert.data;

    if (!product) {

        alert("Failed to create product");
        return;
    }

    for (const file of imageFiles) {

        const filename =
            `${Date.now()}-${file.name}`;

        const upload =
            await supabaseClient.storage
                .from("product-images")
                .upload(
                    filename,
                    file
                );

        if (upload.error) {

            console.error(upload.error);
            continue;
        }

        const imageUrl =
            `${SUPABASE_URL}/storage/v1/object/public/product-images/${filename}`;

        await supabaseClient
            .from("product_images")
            .insert([{

                product_id: product.id,

                image_url: imageUrl

            }]);
    }

    alert(
        "Product Added Successfully"
    );

    closeProductPopup();

    loadInventory();
}
