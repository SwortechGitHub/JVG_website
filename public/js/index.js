/* Phone version burger icon*/
document.getElementById("Menu").addEventListener("click", function () {
	document.getElementsByTagName("nav")[0].classList.toggle("active");
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
