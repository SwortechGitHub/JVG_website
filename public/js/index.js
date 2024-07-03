/* Phone version burger icon*/
document.getElementById("Menu").addEventListener("click", function () {
	document.getElementsByTagName("nav")[0].classList.toggle("active");
	// Change the icon class
	const menuElement = document.getElementById("Menu");
	if (menuElement.classList.contains("fa-bars")) {
		menuElement.classList.remove("fa-bars");
		menuElement.classList.add("fa-x");
	} else {
		menuElement.classList.remove("fa-x");
		menuElement.classList.add("fa-bars");
	}
});

/*Sidebar generator*/
document.addEventListener("DOMContentLoaded", function () {
	const ul = document.getElementById("Sidebar-list");
	const h1Elements = document.querySelectorAll("main h1");

	h1Elements.forEach((h1, index) => {
		const li = document.createElement("li");
		if (index === h1Elements.length - 1) {
			li.className = "last";
		}
		li.textContent = h1.textContent;

		const a = document.createElement("a");
		a.href = `#${h1.id}`;
		a.appendChild(li);

		ul.appendChild(a);
	});
});

/*Active link*/
document.addEventListener("DOMContentLoaded", function () {
	// Get the current page URL
	const currentPage = window.location.pathname.split("/").pop();

	// Get all navigation links
	const navLinks = document.querySelectorAll("nav li a");

	// Loop through each link and add the 'active' class if it matches the current page
	navLinks.forEach((link) => {
		if (link.getAttribute("data-page") === currentPage) {
			link.classList.add("active");
		}
	});
});
