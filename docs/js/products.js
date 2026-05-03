const products = [
  {
    name: "Charm Bracelet",
    price: 699,
    image: "assets/images/bracelet.jpg"
  },
  {
    name: "Necklace",
    price: 799,
    image: "assets/images/necklace.jpg"
  }
];

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
