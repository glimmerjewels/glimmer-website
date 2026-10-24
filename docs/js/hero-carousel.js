
document.addEventListener("DOMContentLoaded", () => {
    const heroImage = document.getElementById("heroCarouselImage");
    if (!heroImage) return;

    const images = [
        "assets/home_images/img1.jpg",
        "assets/home_images/img2.jpg",
        "assets/home_images/img3.jpg",
        "assets/home_images/img4.jpg",
        "assets/home_images/img5.jpg",
        "assets/home_images/img6.jpg"
    ];

    // Preload images so transitions are less likely to show a blank frame.
    images.slice(1).forEach(src => {
        const preload = new Image();
        preload.src = src;
    });

    let currentIndex = 0;

    window.setInterval(() => {
        currentIndex = (currentIndex + 1) % images.length;

        heroImage.classList.add("hero-image-changing");

        const nextImage = new Image();
        nextImage.onload = () => {
            heroImage.src = images[currentIndex];
            heroImage.classList.remove("hero-image-changing");
        };
        nextImage.onerror = () => {
            heroImage.classList.remove("hero-image-changing");
            console.error("Unable to load homepage image:", images[currentIndex]);
        };
        nextImage.src = images[currentIndex];
    }, 4000);
});
