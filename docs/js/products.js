/*
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
*/
const container = document.getElementById("products-container");
const collectionTitle = document.getElementById("categoryTitle");

let cart = JSON.parse(localStorage.getItem("glimmerCart")) || [];

async function loadProducts(){

    const { data, error } = await supabaseClient
    .from("products")
    .select("*")
    .order("created_at", { ascending:false });

    if(error){
        console.log(error);
        return;
    }

    container.innerHTML = "";

    const urlParams = new URLSearchParams(window.location.search);

    const selectedCategory =
    urlParams.get("category") || "all";

    document.querySelectorAll(".filter-btn")
    .forEach(btn => {

        btn.classList.remove("active");

        if(btn.dataset.category === selectedCategory){
            btn.classList.add("active");
        }
    });

    if(selectedCategory === "all"){
        collectionTitle.innerText = "All Products";
    } else {
        collectionTitle.innerText = selectedCategory;
    }

    window.allProducts = data;

    data.forEach(product => {

        if(
            selectedCategory === "all" ||
            product.category === selectedCategory
        ){

            container.innerHTML += `

            <div class="product-card">

                <img src="${product.image}"
                onclick="openPopup(${product.id})">

                <h3>${product.name}</h3>

                <p>
                    <del>₹${product.actual_price}</del>
                    ₹${product.offer_price}
                </p>

            </div>
            `;
        }
    });
}

function openPopup(id){

    const product =
    window.allProducts.find(p => p.id === id);

    document.getElementById("popupOverlay")
    .style.display = "flex";

    document.getElementById("popupImage")
    .src = product.image;

    document.getElementById("popupCategory")
    .innerText = product.category;

    document.getElementById("popupName")
    .innerText = product.name;

    document.getElementById("popupPrice")
    .innerText = `₹${product.offer_price}`;

    document.getElementById("popupDescription")
    .innerText = product.description;

    document.getElementById("addToCartBtn")
    .setAttribute("data-id", product.id);
}

function closePopup(){
    document.getElementById("popupOverlay")
    .style.display = "none";
}

function addToCart(){

    const id = Number(
        document.getElementById("addToCartBtn")
        .dataset.id
    );

    const product =
    window.allProducts.find(p => p.id === id);

    const existing = cart.find(item => item.id === id);

    if(existing){
        existing.quantity += 1;
    } else {
        cart.push({
            ...product,
            quantity:1
        });
    }

    localStorage.setItem(
        "glimmerCart",
        JSON.stringify(cart)
    );

    alert("Added To Cart");
}

loadProducts();
