@@
     for (const product of productsToShow) {
@@
     populatePopup(
         selectedProduct,
         images
     );
     loadReviews(
     productId
     );
-    document
-        .getElementById(
-            "productPopup"
-        )
-        .classList.remove(
-            "hidden"
-        );
+    document
+        .getElementById(
+            "productPopup"
+        )
+        .classList.remove(
+            "product-modal-hidden"
+        );
     document.body.style.overflow = "hidden";
 
-    const popup =
-    document.querySelector(".product-popup");
+    const popup =
+    document.querySelector(".product-modal-content");
 
     if (popup) {
     popup.scrollTop = 0;
 }
 }
@@
 function closePopup() {
 
     document.body.style.overflow = "";
 
-        document
-        .getElementById("productPopup")
-        .classList.add("hidden");
+        document
+        .getElementById("productPopup")
+        .classList.add("product-modal-hidden");
 
 }
