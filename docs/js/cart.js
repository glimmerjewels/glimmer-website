let cart = JSON.parse(localStorage.getItem("glimmerCart")) || [];

function loadCart(){

    const container =
    document.getElementById("cartItems");

    let total = 0;

    container.innerHTML = "";

    cart.forEach(item => {

        total += item.offer_price * item.quantity;

        container.innerHTML += `

        <div class="cart-item">

            <img src="${item.image}">

            <div>
                <h3>${item.name}</h3>
                <p>Quantity: ${item.quantity}</p>
                <p>₹${item.offer_price}</p>
            </div>

        </div>
        `;
    });

    document.getElementById("cartTotal")
    .innerText = total;
}

async function payNow(){

    let total = 0;

    cart.forEach(item => {
        total += item.offer_price * item.quantity;
    });

    const options = {

        key: "YOUR_RAZORPAY_KEY",

        amount: total * 100,

        currency: "INR",

        name: "Glimmer",

        description: "Jewelry Purchase",

        handler: async function(response){

            for(const item of cart){

                await supabaseClient
                .from("orders")
                .insert([
                    {
                        order_id:
                        response.razorpay_payment_id,

                        product_id:item.id,

                        quantity:item.quantity,

                        payment_status:"Paid",

                        order_status:"Placed"
                    }
                ]);

                const newStock =
                item.stock - item.quantity;

                await supabaseClient
                .from("products")
                .update({
                    stock:newStock
                })
                .eq("id", item.id);
            }

            localStorage.removeItem("glimmerCart");

            alert("Payment Successful");

            window.location.href = "index.html";
        }
    };

    const rzp = new Razorpay(options);

    rzp.open();
}

loadCart();
