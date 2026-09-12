---
title: "Fix: stabilize popup architecture and restore product quick-view behavior"
body: |
  This PR reconciles popup and modal styling/behavior between integration and main.

  - Unifies popup/common rules to prevent CSS collisions (.hidden, overlay, scroll-lock).
  - Removes conflicting fixed-transform centering and uses a single overlay-flex centering approach.
  - Restores reliable body scroll-lock when product quick-view opens and restores it on close.
  - Keeps main's visual design intact and preserves product loading/filtering/add-to-cart logic.

  Files changed: docs/css/style.css, docs/js/products.js

  Notes: Visual verification on target devices requested after merge; see PULL_REQUEST_SUMMARY.md for QA checklist.

  Closes: N/A

---
