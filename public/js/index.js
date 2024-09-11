// /* Phone version burger icon*/
// const PhoneMenu = () => {
// 	document.getElementById("Menu").classList.toggle("active");
// 	// Change the icon class
// 	const PhoneMenuElement = document.getElementById("PhoneMenu");
// 	if (PhoneMenuElement.classList.contains("fa-bars")) {
// 		PhoneMenuElement.classList.remove("fa-bars");
// 		PhoneMenuElement.classList.add("fa-x");
// 	} else {
// 		PhoneMenuElement.classList.remove("fa-x");
// 		PhoneMenuElement.classList.add("fa-bars");
// 	}
// };

/*Sidebar generator*/
document.addEventListener("DOMContentLoaded", function () {
	const ul = document.getElementById("Sidebar-list");
	const titleElements = document.querySelectorAll("section .title");

	titleElements.forEach((title, index) => {
		const li = document.createElement("li");
		if (index === titleElements.length - 1) {
			li.className = "last";
		}
		li.textContent = title.textContent;

		const a = document.createElement("a");
		a.href = `#${title.id}`;
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

/*highligth*/
document.addEventListener("DOMContentLoaded", function () {
	const sections = document.querySelectorAll("main section");
	const links = document.querySelectorAll("#Sidebar-list a");

	if (sections.length === 0 || links.length === 0) {
		console.error(
			`No sections or links found. Check your selectors. ${sections.length}, ${links.length}`,
		);
		return;
	}

	window.addEventListener("scroll", function () {
		let current = "";
		sections.forEach((section) => {
			const sectionTop = section.offsetTop;
			if (window.pageYOffset >= sectionTop - 80) {
				// Adjust 10 to account for small differences
				current = section.getAttribute("id");
			}
		});

		links.forEach((link) => {
			link.classList.remove("active");
			if (link.getAttribute("href").slice(1) === current) {
				link.classList.add("active");
			}
		});
	});
});
function Top() {
	location.href = "#top";
}
