document.addEventListener("DOMContentLoaded", () => {
const dropdowns = document.querySelectorAll(".navbar .dropdown");

```
dropdowns.forEach((dropdown) => {
    const button = dropdown.querySelector(".dropbtn");
    const menu = dropdown.querySelector(".dropdown-content");

    if (!button || !menu) return;

    button.setAttribute("aria-expanded", "false");

    button.addEventListener("click", () => {
        const willOpen = !dropdown.classList.contains("open");

        // Close other navigation dropdowns first.
        dropdowns.forEach((otherDropdown) => {
            otherDropdown.classList.remove("open");

            const otherButton = otherDropdown.querySelector(".dropbtn");
            if (otherButton) {
                otherButton.setAttribute("aria-expanded", "false");
            }
        });

        dropdown.classList.toggle("open", willOpen);
        button.setAttribute("aria-expanded", String(willOpen));
    });

    menu.addEventListener("click", (event) => {
        if (event.target.closest("a")) {
            dropdown.classList.remove("open");
            button.setAttribute("aria-expanded", "false");
        }
    });
});

document.addEventListener("click", (event) => {
    if (event.target.closest(".navbar .dropdown")) return;

    dropdowns.forEach((dropdown) => {
        dropdown.classList.remove("open");

        const button = dropdown.querySelector(".dropbtn");
        if (button) {
            button.setAttribute("aria-expanded", "false");
        }
    });
});

document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;

    dropdowns.forEach((dropdown) => {
        dropdown.classList.remove("open");

        const button = dropdown.querySelector(".dropbtn");
        if (button) {
            button.setAttribute("aria-expanded", "false");
        }
    });
});
```

});
