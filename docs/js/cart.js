let cart = [];

const DELIVERY_CHARGE = 50;

document.addEventListener("DOMContentLoaded", async () => {

    cart =
        JSON.parse(
            localStorage.getItem("glimmerCart")
        ) || [];

    renderCart();

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


function renderCart() {

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

        return;
    }

    let html = "";

    let totalQty = 0;

    let subtotal = 0;

    cart.forEach((item) => {

        const itemTotal =
            item.quantity *
            item.offer_price;

        totalQty += item.quantity;

        subtotal += itemTotal;

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

    container.innerHTML = html;

    document.getElementById(
        "totalQty"
    ).innerText = totalQty;

    document.getElementById(
        "grandTotal"
    ).innerText =
        "₹" +
        (
            subtotal +
            DELIVERY_CHARGE
        );

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

    renderCart();

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

    renderCart();

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

    let totalQty = 0;

    let subtotal = 0;

    cart.forEach(item => {

        totalQty +=
            item.quantity;

        subtotal +=
            item.quantity *
            item.offer_price;

    });

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
                    subtotal,

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

        for (
            const item of cart
        ) {

            await supabaseClient
                .from(
                    "order_items"
                )
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

        window.open(
            `https://wa.me/918999120594?text=${encodeURIComponent(message)}`,
            "_blank"
        );

        window.location.href =
            "products.html";

    }
    catch(error){

        console.error(error);

        alert(
            "Unable to place order"
        );
    }

}
