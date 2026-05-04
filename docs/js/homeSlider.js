const images = [
    "assets/home_images/img1.jpg",
    "assets/home_images/img2.jpg",
    "assets/home_images/img3.jpg",
    "assets/home_images/img4.jpg"
];

let currentIndex = 0;
const slider = document.getElementById("slider-image");

setInterval(() => {
    currentIndex = (currentIndex + 1) % images.length;
    slider.src = images[currentIndex];
}, 5000);
