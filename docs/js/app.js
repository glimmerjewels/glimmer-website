function shopNow() {
  window.location.href = "products.html";
}

// Fetch products from backend
fetch("http://127.0.0.1:5000/products")
.then(res => res.json())
.then(data => {
  let container = document.getElementById("products-container");

  data.forEach(product => {
    container.innerHTML += `
      <div class="product-card">
        <img src="${product.image}" width="100%">
        <h3>${product.name}</h3>
        <p>₹${product.price}</p>
      </div>
    `;
  });
});
