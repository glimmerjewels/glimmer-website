@@
     document
         .getElementById("checkoutBtn")
         .addEventListener(
             "click",
             openDeliveryPopup
         );
@@
     document
         .getElementById("closePopupBtn")
         .addEventListener(
             "click",
             closeDeliveryPopup
         );
@@
 function openDeliveryPopup() {
 
     if (cart.length === 0) {
 
         alert(
             "Your cart is empty"
         );
 
         return;
     }
 
-    document
-        .getElementById(
-            "deliveryOverlay"
-        )
-        .classList
-        .remove("hidden");
+    document
+        .getElementById(
+            "deliveryOverlay"
+        )
+        .classList
+        .remove("delivery-modal-hidden");
 
 }
@@
 function closeDeliveryPopup() {
 
-    document
-        .getElementById(
-            "deliveryOverlay"
-        )
-        .classList
-        .add("hidden");
+    document
+        .getElementById(
+            "deliveryOverlay"
+        )
+        .classList
+        .add("delivery-modal-hidden");
 
 }
