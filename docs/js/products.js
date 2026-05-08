const SUPABASE_URL = "https://bwgcnxaedxfoaoivfqlz.supabase.co";
const SUPABASE_KEY = "YOUR_PUBLISHABLE_KEY";

const supabaseClient = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

const container = document.getElementById("products-container");
const collectionTitle = document.getElementById("categoryTitle");


// LOAD PRODUCTS
async function loadProducts() {

    const { data, error } = await supabaseClient
        .from("products")
        .select("*");

    if(error){
        console.log(error);
        return;
    }

    container.innerHTML = "";

    const urlParams = new URLSearchParams(window.location.search);
    const selectedCategory = urlParams.get("category") || "all";

    // activate selected button
    document.querySelectorAll(".filter-btn").forEach(btn => {
        btn.classList.remove("active");

        if(btn.dataset.category === selectedCategory){
            btn.classList.add("active");
        }
    });

    // update title
    if(selectedCategory === "all"){
        collectionTitle.innerText = "All Products";
    } else {
        collectionTitle.innerText =
            selectedCategory.charAt(0).toUpperCase() +
            selectedCategory.slice(1);
    }

    data.forEach(product => {

        if(
            selectedCategory === "all" ||
            product.category === selectedCategory
        ){
            container.innerHTML += `
                <div class="product-card">
                    <img src="${product.image}"
                    onclick="openPopup(
                        '${product.image}',
                        '${product.category}',
                        '${product.name}',
                        '${product.offer_price}',
                        '${product.description}'
                    )">

                    <h3>${product.name}</h3>
                    <p>₹${product.offer_price}</p>
                </div>
            `;
        }
    });
}


// POPUP OPEN
function openPopup(img, category, name, price, description){
    document.getElementById("popupOverlay").style.display = "flex";

    document.getElementById("popupImage").src = img;
    document.getElementById("popupCategory").innerText = category;
    document.getElementById("popupName").innerText = name;
    document.getElementById("popupPrice").innerText = "₹" + price;
    document.getElementById("popupDescription").innerText = description;
}


// POPUP CLOSE
function closePopup(){
    document.getElementById("popupOverlay").style.display = "none";
}


// FILTER BUTTON CLICK
document.querySelectorAll(".filter-btn").forEach(button => {
    button.addEventListener("click", function(){

        const category = this.dataset.category;

        window.location.href =
            `products.html?category=${category}`;
    });
});


loadProducts();
