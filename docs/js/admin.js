@@
     if (error) {
@@
     document
         .getElementById("loginOverlay")
-        .classList.add("hidden");
+        .classList.add("admin-modal-hidden");
@@
     document
         .getElementById("adminPanel")
         .classList.remove("hidden");
@@
 function login() {
@@
-    document
-        .getElementById("loginOverlay")
-        .classList.add("hidden");
-
-    document
-        .getElementById("adminPanel")
-        .classList.remove("hidden");
+    document
+        .getElementById("loginOverlay")
+        .classList.add("admin-modal-hidden");
+
+    document
+        .getElementById("adminPanel")
+        .classList.remove("hidden");
@@
 function showAdminPanel() {
 
-    document
-        .getElementById("loginOverlay")
-        .classList.add("hidden");
-
-    document
-        .getElementById("adminPanel")
-        .classList.remove("hidden");
+    document
+        .getElementById("loginOverlay")
+        .classList.add("admin-modal-hidden");
+
+    document
+        .getElementById("adminPanel")
+        .classList.remove("hidden");
 }
@@
 function openProductPopup() {
-
-    document
-        .getElementById("productPopup")
-        .classList.remove("hidden");
+
+    document
+        .getElementById("productPopup")
+        .classList.remove("admin-modal-hidden");
 }
 
 function closeProductPopup() {
-
-    document
-        .getElementById("productPopup")
-        .classList.add("hidden");
+
+    document
+        .getElementById("productPopup")
+        .classList.add("admin-modal-hidden");
 }
@@
-    document
-        .getElementById(
-            "orderPopupOverlay"
-        )
-        .classList
-        .remove("hidden");
+    document
+        .getElementById(
+            "orderPopupOverlay"
+        )
+        .classList
+        .remove("admin-modal-hidden");
 }
@@
-    document
-        .getElementById(
-            "orderPopupOverlay"
-        )
-        .classList
-        .add("hidden");
+    document
+        .getElementById(
+            "orderPopupOverlay"
+        )
+        .classList
+        .add("admin-modal-hidden");
 }
