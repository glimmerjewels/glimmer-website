const SUPABASE_URL = "https://bwgcnxaedxfoaoivfqlz.supabase.co";
const SUPABASE_KEY = "YOUR_PUBLISHABLE_KEY";

const supabaseClient = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

async function loadProducts() {
    const { data, error } = await supabaseClient
        .from("products")
        .select("*");

    if(error){
        console.log(error);
        return;
    }

    const container = document.getElementById("products-container");
    container.innerHTML = "";

    data.forEach(product => {
        container.innerHTML += `
            <div class="product-card" data-category="${product.category}">
                <img src="${product.image}">
                <h3>${product.name}</h3>
                <p>₹${product.offer_price}</p>

                <button onclick="openPopup(
                    '${product.image}',
                    '${product.category}',
                    '${product.name}',
                    '${product.offer_price}',
                    '${product.description}'
                )">
                    Quick View
                </button>
            </div>
        `;
    });
}

loadProducts();

const container = document.getElementById("products-container");

products.forEach(product => {
  container.innerHTML += `
    <div class="product-card">
      <img src="${product.image}" class="hover-zoom">
      <h3>${product.name}</h3>
      <p>₹${product.price}</p>
      
      <button onclick="addToCart('${product.name}', ${product.price})">🛒 Add to Cart</button>
      <button onclick="addToWishlist('${product.name}')">❤️ Wishlist</button>
      <button onclick="quickView('${product.name}', '${product.image}', ${product.price})">Quick View</button>
    </div>
  `;
});

function addToCart(name, price){
    alert(name + " added to cart ✨");
}

function addToWishlist(name){
    alert(name + " added to wishlist ❤️");
}

function quickView(name, image, price){
    document.getElementById("quickViewModal").style.display="block";
    document.getElementById("modal-img").src=image;
    document.getElementById("modal-name").innerText=name;
    document.getElementById("modal-price").innerText="₹"+price;
}


function openPopup(img, category, name, price, description) {
            document.getElementById("popupOverlay").style.display = "flex";
            document.getElementById("popupImage").src = img;
            document.getElementById("popupCategory").innerText = category;
            document.getElementById("popupName").innerText = name;
            document.getElementById("popupPrice").innerText = "₹" + price;
            document.getElementById("popupDescription").innerText = description;
        }
function closePopup() {
            document.getElementById("popupOverlay").style.display = "none";
        }

function filterProducts(category){
            document.getElementById("categoryTitle").innerText =
                category.charAt(0).toUpperCase() + category.slice(1);
        }

        // URL category detection
        const params = new URLSearchParams(window.location.search);
        const selectedCategory = params.get("category");

        if(selectedCategory){
            document.getElementById("categoryTitle").innerText =
            selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1);
        }
const filterButtons = document.querySelectorAll(".filter-btn");
const productCards = document.querySelectorAll(".product-card");
const collectionTitle = document.querySelector(".collection-title");

filterButtons.forEach(button => {
    button.addEventListener("click", () => {

        const category = button.dataset.category;

        // remove previous active state
        filterButtons.forEach(btn => btn.classList.remove("active"));

        // add active class
        button.classList.add("active");

        // update heading
        if(category === "all"){
            collectionTitle.textContent = "All Products";
        } else {
            collectionTitle.textContent =
                category.charAt(0).toUpperCase() + category.slice(1);
        }

        // filter products
        productCards.forEach(card => {
            if(
                category === "all" ||
                card.dataset.category === category
            ){
                card.style.display = "block";
            } else {
                card.style.display = "none";
            }
        });
    });
});

const params = new URLSearchParams(window.location.search);
const selectedCategory = params.get("category");

if(selectedCategory){
    const targetBtn = document.querySelector(
        `.filter-btn[data-category="${selectedCategory}"]`
    );

    if(targetBtn){
        targetBtn.click();
    }
}
