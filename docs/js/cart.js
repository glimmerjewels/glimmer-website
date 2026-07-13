let cart = [];

const DELIVERY_CHARGE = 50;

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


async function renderCart() {

    const container =
        document.getElementById(
            "cartItems"
        );

    if (!container) return;

    await fetchOffers();
    const pricing = calculatePricing(cart);

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

        </div>

        `;
    });

    const pricing =
    await calculatePricing(cart);


    const subtotal =
    pricing.discountedTotal;
    
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

    document.getElementById(
        "grandTotal"
    ).innerText =
        "₹" +
        (
            pricing.discountedTotal +
            DELIVERY_CHARGE
        );

    const offerSummary = document.getElementById("offerSummary");
    if (offerSummary) {
        if (pricing.offerApplied) {
            offerSummary.innerHTML = `
                <div class="offer-summary-card">
                    <strong>Offer applied:</strong> ${pricing.appliedOffer.name}<br>
                    <span>${pricing.appliedOffer.banner_text}</span><br>
                    <small>You saved ₹${pricing.savings} on this order.</small>
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


function decreaseQty(productId) {

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

    const name =
        document
        .getElementById(
            "customerName"
        )
        .value
        .trim();

    const mobile =
        document
        .getElementById(
            "customerMobile"
        )
        .value
        .trim();

    const address =
        document
        .getElementById(
            "customerAddress"
        )
        .value
        .trim();

    const city =
        document
        .getElementById(
            "city"
        )
        .value
        .trim();

    const pincode =
        document
        .getElementById(
            "pincode"
        )
        .value
        .trim();

    const state =
        document
        .getElementById(
            "state"
        )
        .value
        .trim();

    if (
        !name ||
        !mobile ||
        !address ||
        !city ||
        !pincode
    ) {

        alert(
            "Please fill all delivery details"
        );

        return;
    }
    if (!/^[6-9]\d{9}$/.test(mobile)) {

    alert(
        "Please enter valid 10 digit mobile number"
    );

    return;
    }

    if (!/^\d{6}$/.test(pincode)) {

    alert(
        "Please enter valid 6 digit pincode"
    );

    return;
    }

    const pricing = calculatePricing(cart);

    let totalQty = 0;

    cart.forEach(item => {

        totalQty +=
            item.quantity;

    });

   const pricing =
    await calculatePricing(cart);

    const subtotal =
    pricing.discountedTotal;

    const grandTotal =
    subtotal +
    DELIVERY_CHARGE;

    try {

        const {
            data: order,
            error: orderError
        } =
        await supabaseClient
            .from("orders")
            .insert([{

                customer_name:
                    name,

                customer_mobile:
                    mobile,

                customer_address:
                    address,

                city:
                    city,

                state:
                    state,

                pincode:
                    pincode,

                total_quantity:
                    totalQty,

                subtotal:
                    pricing.discountedTotal,

                delivery_charge:
                    DELIVERY_CHARGE,

                grand_total:
                    grandTotal,

                status:
                    "Pending",

                whatsapp_sent:
                    true,

                stock_reduced:
                    false

            }])
            .select()
            .single();

        if (orderError)
            throw orderError;

        for (const item of cart) {

    const {

        error:itemError

    } =

    await supabaseClient
        .from("order_items")
        .insert([{

            order_id:
                order.id,

            product_id:
                item.id,

            product_name:
                item.name,

            quantity:
                item.quantity,

            price:
                item.offer_price,

            subtotal:
                item.quantity *
                item.offer_price

        }]);

    if(itemError){

        throw itemError;
    }
    }

        let message =

`Hi Glimmer,

I would like to place the following order.

Products:

`;

        cart.forEach(item => {

            message +=

`${item.name}
(${item.quantity} × ₹${item.offer_price})
Subtotal ₹${item.quantity * item.offer_price}

`;

        });

        if (pricing.offerApplied) {
            message += `
Offer Applied : ${pricing.appliedOffer.name}
Offer Price : ₹${pricing.appliedOffer.offer_price}
`;
        }

        message +=

`Delivery Charges ₹${DELIVERY_CHARGE}

Total Quantity : ${totalQty}

Order Total : ₹${grandTotal}

At below address

Customer Name : ${name}

Address : ${address}

City : ${city}

Pincode : ${pincode}

State : ${state}

Mobile : ${mobile}`;

        localStorage.removeItem(
            "glimmerCart"
        );

        window.location.href =
        `https://wa.me/918999120594?text=${encodeURIComponent(message)}`;

    }
    catch(error){

    console.error(
        "ORDER ERROR:",
        error
    );

    alert(

        error.message ||

        JSON.stringify(
            error
        )

    );
    }    

}
