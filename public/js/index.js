/* Phone version burger icon*/
const ToggleBotton = document.getElementById('ToggleBotton');
const PagesLinks = document.getElementById('PagesLinks');
ToggleBotton.addEventListener('click',()=> {
    PagesLinks.classList.toggle('active');
});

/* When the user scrolls down, hide the navbar. When the user scrolls up, show the navbar */
var prevScrollpos = window.pageYOffset;
window.onscroll = function() {
var currentScrollPos = window.pageYOffset;
if (prevScrollpos > currentScrollPos) {
    document.getElementsByTagName("nav")[0].style.top = "0";
} else {
    /*Hides navbar links when scrolling down*/
    document.getElementById("PagesLinks").classList.remove("active")
    document.getElementsByTagName("nav")[0].style.top = "-100px";
}
prevScrollpos = currentScrollPos;
}