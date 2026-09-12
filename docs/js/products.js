
async function openProductPopup(productId) {

    selectedProduct =
        allProducts.find(
            p => p.id === productId
        );
    currentReviewProductId = selectedProduct.id;
    if (!selectedProduct)
        return;

    currentQuantity = 1;

    document
        .getElementById(
            "quantityValue"
        )
        .innerText =
        currentQuantity;

    const images =
        await getImages(
            productId
        );

    populatePopup(
        selectedProduct,
        images
    );
    loadReviews(
    productId
    );
    const productPopupEl = document.getElementById("productPopup");
    productPopupEl.classList.remove("hidden");

    // lock page scroll in a reliable class-based way
    document.body.classList.add('popup-open');

    // reset internal popup scroll, if present
    const popupInner = productPopupEl.querySelector(".product-popup");
    if (popupInner) popupInner.scrollTop = 0;
}


function closePopup() {

    const productPopupEl = document.getElementById("productPopup");
    if (productPopupEl) productPopupEl.classList.add("hidden");

    // restore page scrolling
    document.body.classList.remove('popup-open');
}
