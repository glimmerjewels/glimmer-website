// ==============================
// GLOBALS
// ==============================

let products = [];

let currentPage = 1;

const PRODUCTS_PER_PAGE = 25;

let orders = [];

let offers = [];

let orderPage = 1;

const ORDERS_PER_PAGE = 25;

// ==============================
// INIT
// ==============================

document.addEventListener("DOMContentLoaded", async () => {

    const {
        data: { session }
    } = await supabaseClient.auth.getSession();

    if (session) {

        showAdminPanel();

        await loadInventory();
        await loadOffers();
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

    showAdminPanel();

    await loadInventory();
    await loadOffers();
}



// =====================
// Show Admin Panel
// =====================

function showAdminPanel() {

    document
        .getElementById("loginOverlay")
        .classList.add("hidden");

    document
        .getElementById("adminPanel")
        .classList.remove("hidden");
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
let inventoryLoading = false;
async function loadInventory() {
    if (inventoryLoading) return;

    inventoryLoading = true;

    try {
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
    await loadOrders();
    } finally {
        inventoryLoading = false;
    }
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

        <td>
        <div class="thumb-container">
        ${thumbnails}
        ${extraCount}
        </div>
        </td>

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
    inventoryLoading = false;
    await loadInventory();
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
        inventoryLoading = false;
        await loadInventory();

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
    inventoryLoading = false;
    await loadInventory();
}

async function loadOrders() {

    const {
        data,
        error
    } = await supabaseClient
        .from("orders")
        .select("*")
        .order(
            "created_at",
            {
                ascending: false
            }
        );

    if (error) {

        console.error(error);

        return;
    }

    orders = data || [];

    renderOrders();
}

function renderOrders() {

    const tbody =
        document.getElementById(
            "ordersBody"
        );

    if (!tbody)
        return;

    tbody.innerHTML = "";

    const start =
        (orderPage - 1) *
        ORDERS_PER_PAGE;

    const pageOrders =
        orders.slice(
            start,
            start +
            ORDERS_PER_PAGE
        );

    pageOrders.forEach(order => {

        let statusClass =
            "status-pending";

        if (
            order.status ===
            "Confirmed"
        )
            statusClass =
                "status-confirmed";

        if (
            order.status ===
            "Cancelled"
        )
            statusClass =
                "status-cancelled";

        tbody.innerHTML += `

        <tr>

            <td>
                ${order.id}
            </td>

            <td>
                ${order.customer_name}
            </td>

            <td>
                ${order.customer_mobile}
            </td>

            <td>
                ${order.total_quantity}
            </td>

            <td>
                ₹${order.grand_total}
            </td>

            <td>

                <span
                    class="status-badge ${statusClass}">

                    ${order.status}

                </span>

            </td>

            <td>

                ${new Date(
                    order.created_at
                ).toLocaleDateString()}

            </td>

            <td>

                <button
                    class="order-action-btn view-btn"
                    onclick="viewOrder(${order.id})">

                    View

                </button>

                ${
                    order.status === "Pending"
                    ? `
                    <button
                        class="order-action-btn confirm-btn"
                        onclick="confirmOrder(${order.id})">

                        Confirm

                    </button>

                    <button
                        class="order-action-btn cancel-btn"
                        onclick="cancelOrder(${order.id})">

                        Cancel

                    </button>
                    `
                    : ""
                }

            </td>

        </tr>

        `;
    });
}

async function viewOrder(orderId) {

    const order =
        orders.find(
            o => o.id === orderId
        );

    if (!order)
        return;

    const {
        data: items,
        error
    } =
    await supabaseClient
        .from("order_items")
        .select("*")
        .eq(
            "order_id",
            orderId
        );

    if (error) {

        console.error(error);

        return;
    }

    let html = `

        <h3>
            Order #${order.id}
        </h3>

        <hr>

        <h4>
            Products
        </h4>

    `;

    items.forEach(item => {

        html += `

            <div class="order-item">

                <strong>
                    ${item.product_name}
                </strong>

                <br>

                ${item.quantity}
                ×
                ₹${item.price}

                =

                ₹${item.subtotal}

            </div>

        `;
    });

    html += `

        <hr>

        <h4>
            Order Summary
        </h4>

        <p>
            Total Quantity :
            ${order.total_quantity}
        </p>

        <p>
            Subtotal :
            ₹${order.subtotal}
        </p>

        <p>
            Delivery :
            ₹${order.delivery_charge}
        </p>

        <p>
            Grand Total :
            ₹${order.grand_total}
        </p>

        <hr>

        <h4>
            Customer Details
        </h4>

        <p>

            <strong>Name:</strong>

            ${order.customer_name}

        </p>

        <p>

            <strong>Mobile:</strong>

            ${order.customer_mobile}

        </p>

        <p>

            <strong>Address:</strong>

            ${order.customer_address}

        </p>

        <p>

            <strong>City:</strong>

            ${order.city}

        </p>

        <p>

            <strong>Pincode:</strong>

            ${order.pincode}

        </p>

        <p>

            <strong>State:</strong>

            ${order.state}

        </p>

        <hr>

        <p>

            <strong>Status:</strong>

            ${order.status}

        </p>

    `;

    document
        .getElementById(
            "orderPopupContent"
        )
        .innerHTML =
        html;

    document
        .getElementById(
            "orderPopupOverlay"
        )
        .classList
        .remove("hidden");
}

function closeOrderPopup() {

    document
        .getElementById(
            "orderPopupOverlay"
        )
        .classList
        .add("hidden");
}

async function cancelOrder(orderId) {

    const confirmCancel =
        confirm(
            "Cancel this order?"
        );

    if (!confirmCancel)
        return;

    const {
        error
    } =
    await supabaseClient
        .from("orders")
        .update({

            status:
                "Cancelled"

        })
        .eq(
            "id",
            orderId
        );

    if (error) {

        console.error(error);

        alert(
            "Unable to cancel order"
        );

        return;
    }

    alert(
        "Order Cancelled"
    );

    await loadOrders();
}

async function confirmOrder(orderId) {

    const confirmPayment =
        confirm(
            "Confirm payment received and reduce stock?"
        );

    if (!confirmPayment)
        return;

    const {
        data: order,
        error
    } =
    await supabaseClient
        .from("orders")
        .select("*")
        .eq(
            "id",
            orderId
        )
        .single();

    if (error) {

        console.error(error);

        return;
    }

    if (
        order.stock_reduced
    ) {

        alert(
            "Stock already reduced for this order."
        );

        return;
    }

    const success =
        await reduceStock(
            orderId
        );

    if (!success)
        return;

    const {
        error: updateError
    } =
    await supabaseClient
        .from("orders")
        .update({

            status:
                "Confirmed",

            stock_reduced:
                true,

            confirmed_at:
                new Date()
                    .toISOString()

        })
        .eq(
            "id",
            orderId
        );

    if (updateError) {

        console.error(
            updateError
        );

        alert(
            "Unable to confirm order"
        );

        return;
    }

    alert(
        "Order Confirmed Successfully"
    );

    await loadInventory();

    await loadOrders();
}

async function reduceStock(orderId) {

    const {
        data: items,
        error
    } =
    await supabaseClient
        .from("order_items")
        .select("*")
        .eq(
            "order_id",
            orderId
        );

    if (error) {

        console.error(error);

        return false;
    }

    for (
        const item of items
    ) {

        const {
            data: product,
            error: productError
        } =
        await supabaseClient
            .from("products")
            .select(
                "id, stock"
            )
            .eq(
                "id",
                item.product_id
            )
            .single();

        if (
            productError
        ) {

            console.error(
                productError
            );

            return false;
        }

        const newStock =
            Math.max(
                0,
                product.stock -
                item.quantity
            );

        const {
            error: updateError
        } =
        await supabaseClient
            .from("products")
            .update({

                stock:
                    newStock

            })
            .eq(
                "id",
                item.product_id
            );

        if (
            updateError
        ) {

            console.error(
                updateError
            );

            return false;
        }
    }

    return true;
}
async function loadOffers() {
    const { data, error } = await supabaseClient
        .from("offers")
        .select("*")
        .order("priority", { ascending: true });

    if (error) {
        console.error(error);
        return;
    }

    offers = data || [];
    renderOffers();
}

function renderOffers() {
    const tbody = document.getElementById("offersBody");

    if (!tbody) {
        return;
    }

    tbody.innerHTML = "";

    offers.forEach((offer) => {
        tbody.innerHTML += `
            <tr>
                <td>${offer.name}</td>
                <td>${offer.banner_text}</td>
                <td>₹${offer.offer_price}</td>
                <td>${offer.minimum_order_value || 0}</td>
                <td>${offer.priority || 0}</td>
                <td>${offer.active ? "Active" : "Inactive"}</td>
                <td>
                    <button class="edit-btn" onclick="editOffer(${offer.id})">Edit</button>
                    <button class="delete-btn" onclick="deleteOffer(${offer.id})">Delete</button>
                </td>
            </tr>
        `;
    });
}

async function saveOffer() {
    const offerData = {
        name: document.getElementById("offerNameInput").value.trim(),
        banner_text: document.getElementById("offerBannerTextInput").value.trim(),
        offer_price: Number(document.getElementById("offerPriceInput").value),
        minimum_order_value: Number(document.getElementById("minimumOrderValueInput").value || 0),
        required_any: Number(document.getElementById("requiredAnyInput").value || 0),
        required_rings: Number(document.getElementById("requiredRingsInput").value || 0),
        required_bracelets: Number(document.getElementById("requiredBraceletsInput").value || 0),
        required_necklace: Number(document.getElementById("requiredNecklaceInput").value || 0),
        required_earrings: Number(document.getElementById("requiredEarringsInput").value || 0),
        required_anklets: Number(document.getElementById("requiredAnkletsInput").value || 0),
        required_mens: Number(document.getElementById("requiredMensInput").value || 0),
        required_watches: Number(document.getElementById("requiredWatchesInput").value || 0),
        surprise_freebies: Number(document.getElementById("surpriseFreebiesInput").value || 0),
        priority: Number(document.getElementById("offerPriorityInput").value || 0),
        active: document.getElementById("offerActiveInput").checked,
        start_date: document.getElementById("offerStartDateInput").value || null,
        end_date: document.getElementById("offerEndDateInput").value || null
    };

    if (!offerData.name || !offerData.banner_text || !offerData.offer_price) {
        alert("Please complete the offer name, banner text, and offer price.");
        return;
    }

    const editingOfferId = document.getElementById("offerPopupTitle").dataset.editingId;

    if (editingOfferId) {
        const { error } = await supabaseClient.from("offers").update(offerData).eq("id", editingOfferId);
        if (error) {
            alert("Offer update failed");
            return;
        }
    } else {
        const { error } = await supabaseClient.from("offers").insert([offerData]);
        if (error) {
            alert("Offer creation failed");
            return;
        }
    }

    closeOfferPopup();
    await loadOffers();
    await fetchOffers(true);
    alert("Offer saved successfully");
}

async function editOffer(offerId) {
    const offer = offers.find((item) => item.id === offerId);
    if (!offer) {
        return;
    }

    document.getElementById("offerPopupTitle").innerText = "Edit Offer";
    document.getElementById("offerPopupTitle").dataset.editingId = offer.id;
    document.getElementById("offerNameInput").value = offer.name || "";
    document.getElementById("offerBannerTextInput").value = offer.banner_text || "";
    document.getElementById("offerPriceInput").value = offer.offer_price || 0;
    document.getElementById("minimumOrderValueInput").value = offer.minimum_order_value || 0;
    document.getElementById("requiredAnyInput").value = offer.required_any || 0;
    document.getElementById("requiredRingsInput").value = offer.required_rings || 0;
    document.getElementById("requiredBraceletsInput").value = offer.required_bracelets || 0;
    document.getElementById("requiredNecklaceInput").value = offer.required_necklace || 0;
    document.getElementById("requiredEarringsInput").value = offer.required_earrings || 0;
    document.getElementById("requiredAnkletsInput").value = offer.required_anklets || 0;
    document.getElementById("requiredMensInput").value = offer.required_mens || 0;
    document.getElementById("requiredWatchesInput").value = offer.required_watches || 0;
    document.getElementById("surpriseFreebiesInput").value = offer.surprise_freebies || 0;
    document.getElementById("offerPriorityInput").value = offer.priority || 0;
    document.getElementById("offerActiveInput").checked = offer.active !== false;
    document.getElementById("offerStartDateInput").value = offer.start_date ? offer.start_date.split("T")[0] : "";
    document.getElementById("offerEndDateInput").value = offer.end_date ? offer.end_date.split("T")[0] : "";
    openOfferPopup();
}

async function deleteOffer(offerId) {
    const confirmDelete = confirm("Delete this offer permanently?");
    if (!confirmDelete) {
        return;
    }

    const { error } = await supabaseClient.from("offers").delete().eq("id", offerId);
    if (error) {
        alert("Offer deletion failed");
        return;
    }

    await loadOffers();
    await fetchOffers(true);
    alert("Offer deleted");
}
