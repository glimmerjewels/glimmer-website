# Pull request summary

This PR unifies popup and modal styling/behavior and restores the product quick-view lifecycle so popups are centered in the visible viewport and background scrolling is properly locked.

What changed

- docs/css/style.css: canonical popup CSS, deduplicated .hidden, overlay-based centering, popup max-height, responsive behavior.
- docs/js/products.js: openProductPopup and closePopup now use a class-based scroll lock (body.popup-open) and reset internal popup scrollTop.

Why

The integration branch introduced duplicate and conflicting popup rules which caused the product quick-view to sometimes be positioned relative to the document instead of the viewport and led to inconsistent scroll behavior. This PR fixes that while preserving main's visual design.

Notes for QA

- Open a product quick view from various scroll positions and viewport sizes; verify it appears centered in the viewport and background scrolling is locked.
- Verify popup internal scrolling when content is large.
- Confirm cart and admin popups are not visually regressed.

