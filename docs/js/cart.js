let cart = [];

const DELIVERY_CHARGE = 50;
const FREE_DELIVERY_THRESHOLD = 1499;
let isPlacingOrder = false;

// ======================================
// ANTI-TAMPERING CART VERIFICATION
// ======================================
async function verifyAndSyncCart() {
    if (!cart || cart.length === 0) {
        throw new Error("Your cart is empty.");
    }

    const productIds = cart.map(item => item.id);
    const { data: dbProducts, error } = await supabaseClient
        .from("products")
        .select("id, name, actual_price, offer_price, stock")
        .in("id", productIds);

    if (error || !dbProducts) {
        throw new Error("Unable to verify live product prices. Please check your internet connection.");
    }

    const dbMap = new Map(dbProducts.map(p => [String(p.id), p]));
    let cartModified = false;

    for (const item of cart) {
        const dbProd = dbMap.get(String(item.id));
        if (!dbProd) {
            throw new Error(`Product "${item.name}" is no longer available in the catalogue.`);
        }

        const officialOfferPrice = Number(dbProd.offer_price) > 0 ? Number(dbProd.offer_price) : Number(dbProd.actual_price);
        const officialActualPrice = Number(dbProd.actual_price);
        const availableStock = Number(dbProd.stock) || 0;

        if (availableStock <= 0) {
            throw new Error(`Product "${item.name}" is currently out of stock.`);
        }

        if (Number(item.quantity) > availableStock) {
            item.quantity = availableStock;
            cartModified = true;
            throw new Error(`Quantity for "${item.name}" exceeds available stock (${availableStock}). Cart adjusted.`);
        }

        // Detect price tampering or outdated cached prices
        if (Number(item.offer_price) !== officialOfferPrice || Number(item.actual_price) !== officialActualPrice) {
            item.offer_price = officialOfferPrice;
            item.actual_price = officialActualPrice;
            cartModified = true;
        }

        // Enforce positive integer quantity
        if (Number(item.quantity) <= 0 || !Number.isInteger(Number(item.quantity))) {
            item.quantity = 1;
            cartModified = true;
        }
    }

    if (cartModified) {
        saveCart();
        await renderCart();
        throw new Error("Cart has been synchronized with official store prices. Please review before proceeding.");
    }

    return true;
}

function getDeliveryCharge(subtotal) {
    return subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_CHARGE;
}

document.addEventListener("DOMContentLoaded", async () => {

    cart =
        JSON.parse(
            localStorage.getItem("glimmerCart")
        ) || [];

    await loadOfferBanner();
    await renderCart();

    document
        .getElementById("checkoutBtn")
        .addEventListener(
            "click",
            openDeliveryPopup
        );

    document
        .getElementById("closePopupBtn")
        .addEventListener(
            "click",
            closeDeliveryPopup
        );

    document
        .getElementById("orderWhatsappBtn")
        .addEventListener(
            "click",
            placeOrder
        );

    document
        .getElementById("pincode")
        .addEventListener(
            "keyup",
            (e) => {
                fetchPincodeData(
                    e.target.value
                );
            }
        );

});


function saveCart() {

    localStorage.setItem(
        "glimmerCart",
        JSON.stringify(cart)
    );

}

async function removeFromCart(productId) {
    cart = cart.filter(item => String(item.id) !== String(productId));
    saveCart();
    await renderCart();
}


async function renderCart() {

    const container =
        document.getElementById(
            "cartItems"
        );

    if (!container) return;

    if (cart.length === 0) {

        container.innerHTML = `

            <div class="empty-cart">

                <h3>
                    Your cart is empty
                </h3>

            </div>

        `;

        document.getElementById(
            "totalQty"
        ).innerText = "0";

        document.getElementById(
            "grandTotal"
        ).innerText = "₹0";

        const offerSummary = document.getElementById("offerSummary");
        if (offerSummary) {
            offerSummary.innerHTML = "<div class='offer-summary-card'>Add a few items to unlock our combo deals.</div>";
        }

        return;
    }

    let html = "";

    let totalQty = 0;
   
    cart.forEach((item) => {

        const itemTotal =
            item.quantity *
            item.offer_price;

        totalQty += item.quantity;

        html += `

        <div class="cart-item">

           <img
            src="${item.image || 'assets/no-image.png'}"
            class="cart-image">

            <div class="cart-details">

                <h3>
                    ${item.name}
                </h3>

                <p>
                    ₹${item.offer_price}
                </p>

            </div>

            <div class="qty-box">

                <button
                    onclick="decreaseQty(${item.id})">

                    -

                </button>

                <span>
                    ${item.quantity}
                </span>

                <button
                    onclick="increaseQty(${item.id})">

                    +

                </button>

            </div>

            <div class="cart-subtotal">

                ₹${itemTotal}

            </div>
            <button
                type="button"
                class="remove-cart-item"
                onclick="removeFromCart('${item.id}')"
                aria-label="Remove ${item.name} from cart">
                Remove
            </button>

        </div>

        `;
    });

    const pricing =
    await calculatePricing(cart);


    const subtotal =
    pricing.discountedTotal;

    const deliveryCharge = getDeliveryCharge(subtotal);
    
    const savings =
    pricing.savings;

    const appliedOffer =
    pricing.appliedOffer;

    const congratulationMessage =
    pricing.congratulationMessage;
    
    container.innerHTML = html;

    document.getElementById(
        "totalQty"
    ).innerText = totalQty;

    document.getElementById("grandTotal").innerText =
    "₹" + (subtotal + deliveryCharge);

const deliveryElement = document.getElementById("deliveryCharge");
if (deliveryElement) {
    deliveryElement.innerText =
        deliveryCharge === 0 ? "FREE" : "₹" + deliveryCharge;
}

const freeDeliveryMessage =
    document.getElementById("freeDeliveryMessage");

if (freeDeliveryMessage) {
    freeDeliveryMessage.textContent =
        deliveryCharge === 0
            ? "🎉 You've unlocked free delivery!"
            : `Add ₹${Math.max(0, FREE_DELIVERY_THRESHOLD - subtotal)} more for free delivery.`;
}

    const offerSummary = document.getElementById("offerSummary");
    if (offerSummary) {
        if (pricing.offerApplied) {
          offerSummary.innerHTML = `
                        <div class="offer-summary-card">
                        <strong>🎉 Offer Applied</strong>
                            <br>
                            <span>
                            ${pricing.appliedOffer.title || pricing.appliedOffer.name}
                            </span>
                            <br>
                            <small>You saved ₹${pricing.savings}</small>
                            ${
                            pricing.surpriseFreebies > 0
                            ?
                            `
                            <div class="freebie-message">
                            🎁 Congratulations! You have been selected for 
                            ${pricing.surpriseFreebies} surprise freebies from our side.
                            <br>
                            They will be included in your order package automatically.
                            </div>
                            `
                            :
                            ""
                            }
                        </div>
                        `;
        } else {
            offerSummary.innerHTML = `
                <div class="offer-summary-card">
                    <strong>No combo matched yet.</strong><br>
                    <span>Add items to unlock our rotating offers.</span>
                </div>
            `;
        }
    }

}


async function increaseQty(productId) {

    const item =
        cart.find(
            p => p.id === productId
        );

    if (!item) return;

    const {
        data,
        error
    } =
    await supabaseClient
        .from("products")
        .select("stock")
        .eq("id", productId)
        .single();

    if (error) {

        alert(
            "Unable to verify stock"
        );

        return;
    }

    if (
        item.quantity >=
        data.stock
    ) {

        alert(
            "Maximum available stock reached"
        );

        return;
    }

    item.quantity++;

    saveCart();

    await renderCart();

}


async function decreaseQty(productId) {

    const item =
        cart.find(
            p => p.id === productId
        );

    if (!item) return;

    item.quantity--;

    if (
        item.quantity <= 0
    ) {

        cart =
            cart.filter(
                p =>
                p.id !== productId
            );
    }

    saveCart();

    await renderCart();

}


function openDeliveryPopup() {

    if (cart.length === 0) {

        alert(
            "Your cart is empty"
        );

        return;
    }

    document
        .getElementById(
            "deliveryOverlay"
        )
        .classList
        .remove("hidden");

}


function closeDeliveryPopup() {

    document
        .getElementById(
            "deliveryOverlay"
        )
        .classList
        .add("hidden");

}


async function fetchPincodeData(pin) {

    if (
        pin.length !== 6
    ) return;

    try {

        const response =
            await fetch(
                `https://api.postalpincode.in/pincode/${pin}`
            );

        const result =
            await response.json();

        if (
            result[0].Status ===
            "Success"
        ) {

            document
                .getElementById(
                    "city"
                )
                .value =
                result[0]
                .PostOffice[0]
                .District;

            document
                .getElementById(
                    "state"
                )
                .value =
                result[0]
                .PostOffice[0]
                .State;
        }

    } catch (err) {

        console.error(err);

    }

}


async function placeOrder() {
    if (isPlacingOrder) return;

    const orderBtn = document.getElementById("orderWhatsappBtn");
    const name = document.getElementById("customerName").value.trim();
    const mobile = document.getElementById("customerMobile").value.trim();
    const address = document.getElementById("customerAddress").value.trim();
    const city = document.getElementById("city").value.trim();
    const pincode = document.getElementById("pincode").value.trim();
    const state = document.getElementById("state").value.trim();

    if (!name || !mobile || !address || !city || !pincode) {
        alert("Please fill all delivery details.");
        return;
    }

    if (name.length < 2 || name.length > 100) {
        alert("Please enter a valid customer name (2 to 100 characters).");
        return;
    }

    if (address.length < 5 || address.length > 300) {
        alert("Please enter a valid address (5 to 300 characters).");
        return;
    }

    if (!/^[6-9]\d{9}$/.test(mobile)) {
        alert("Please enter a valid 10-digit Indian mobile number.");
        return;
    }

    if (!/^\d{6}$/.test(pincode)) {
        alert("Please enter a valid 6-digit pincode.");
        return;
    }

    isPlacingOrder = true;
    if (orderBtn) {
        orderBtn.disabled = true;
        orderBtn.innerText = "Verifying & Placing Order...";
    }

    try {
        // Step 1: Verify all cart item prices & stock against live Supabase data
        await verifyAndSyncCart();

        let totalQty = 0;
        cart.forEach(item => {
            totalQty += Number(item.quantity) || 0;
        });

        if (totalQty <= 0) {
            alert("Your cart is empty or has invalid quantities.");
            return;
        }

        const pricing = await calculatePricing(cart);
        const subtotal = pricing.discountedTotal;
        const deliveryCharge = getDeliveryCharge(subtotal);
        const grandTotal = subtotal + deliveryCharge;

        const {
            data: order,
            error: orderError
        } =
        await supabaseClient
            .from("orders")
            .insert([{
                customer_name: name,
                customer_mobile: mobile,
                customer_address: address,
                city: city,
                state: state,
                pincode: pincode,
                total_quantity: totalQty,
                subtotal: pricing.discountedTotal,
                original_total: pricing.originalTotal,
                offer_id: pricing.appliedOffer?.id || null,
                offer_name: pricing.appliedOffer?.title || null,
                offer_type: pricing.appliedOffer?.offer_type || null,
                offer_price: pricing.appliedOffer?.offer_price || null,
                offer_discount: pricing.savings,
                surprise_freebies: pricing.surpriseFreebies,
                delivery_charge: deliveryCharge,
                grand_total: grandTotal,
                status: "Pending",
                whatsapp_sent: true,
                stock_reduced: false
            }])
            .select()
            .single();

        if (orderError) throw orderError;

        for (const item of cart) {
            const { error: itemError } =
            await supabaseClient
                .from("order_items")
                .insert([{
                    order_id: order.id,
                    product_id: item.id,
                    product_name: item.name,
                    quantity: item.quantity,
                    price: item.offer_price,
                    subtotal: item.quantity * item.offer_price
                }]);

            if (itemError) throw itemError;
        }

        let message = `Hi Glimmer,\n\nI would like to place the following order (Order #${order.id}):\n\nProducts:\n\n`;

        cart.forEach(item => {
            message += `${item.name}\n(${item.quantity} × ₹${item.offer_price})\nSubtotal ₹${item.quantity * item.offer_price}\n\n`;
        });

        if (pricing.offerApplied) {
            message += `Offer Applied : ${pricing.appliedOffer.name}\nOffer Price : ₹${pricing.appliedOffer.offer_price}\n\n`;
        }

        message += `Delivery Charges : ${deliveryCharge === 0 ? "FREE" : "₹" + deliveryCharge}\n` +
            `Total Quantity : ${totalQty}\n` +
            `Order Total : ₹${grandTotal}\n\n` +
            `Delivery Address:\n` +
            `Customer Name : ${name}\n` +
            `Address : ${address}\n` +
            `City : ${city}\n` +
            `Pincode : ${pincode}\n` +
            `State : ${state}\n` +
            `Mobile : ${mobile}`;

        localStorage.removeItem("glimmerCart");

        window.location.href = `https://wa.me/918999120594?text=${encodeURIComponent(message)}`;
    } catch (error) {
        console.error("ORDER ERROR:", error);
        alert(error.message || "An unexpected error occurred while placing your order.");
    } finally {
        isPlacingOrder = false;
        if (orderBtn) {
            orderBtn.disabled = false;
            orderBtn.innerText = "Order Via WhatsApp";
        }
    }
}
