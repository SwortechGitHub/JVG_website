function smoothScroll(target, duration) {
	let targetPosition;
	let startPosition = window.pageYOffset;
	let startTime = null;

	if (target === "top") {
		targetPosition = -startPosition;
	} else {
		targetElement = document.querySelector(target);
		if (!targetElement) {
			console.error("Target element not found");
			return;
		}
		targetPosition = targetElement.getBoundingClientRect().top;
	}

	function animation(currentTime) {
		if (startTime === null) startTime = currentTime;
		let timeElapsed = currentTime - startTime;
		let run = ease(timeElapsed, startPosition, targetPosition, duration);
		window.scrollTo(0, run);
		if (timeElapsed < duration) requestAnimationFrame(animation);
	}

	function ease(t, b, c, d) {
		t /= d / 2;
		if (t < 1) return (c / 2) * t * t + b;
		t--;
		return (-c / 2) * (t * (t - 2) - 1) + b;
	}

	requestAnimationFrame(animation);
}

// Add event listeners to anchor links
document.addEventListener("DOMContentLoaded", function () {
	document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
		anchor.addEventListener("click", function (e) {
			e.preventDefault();
			smoothScroll(this.getAttribute("href"), 1000);
		});
	});
});

function Top() {
	smoothScroll("top", 1000); // 1000ms = 1 second
}
