let cart = JSON.parse(localStorage.getItem("glimmerCart")) || [];
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
