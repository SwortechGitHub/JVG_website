const templates = {
	"Big title": `
      <section class="layout">
        <div class="center v-center">
          <h2 class="editable title">Title</h2>
          <div class="editable center text">Text</div>
        </div>
      </section>`,

	"Two texts": `
      <section class="layout">
        <h2 class="center editable title">Title</h2>
        <div class="line">
          <div>
            <h4 class="center editable">Sub Title</h4>
            <div class="editable text">Text</div>
          </div>
          <div>
            <h4 class="center editable">Sub Title</h4>
            <div class="editable text">Text</div>
          </div>
        </div>
      </section>`,

	"Side image": `
      <section class="layout line">
        <div><img src="public/files/images/none.webp" class="center"></div>
        <div>
          <h2 class="editable title">Title</h2>
          <div class="editable text">Text</div>
        </div>
      </section>`,

	"Image and text": `
      <section class="layout line">
        <div class="center v-center">
          <img src="public/files/images/none.webp" class="center">
          <div class="editable">
            <h3>Text with Image</h3>
            <div class="text">Text</div>
          </div>
        </div>
      </section>`,
};

let updateStylingOptions; // Define it in a higher scope

document.addEventListener("DOMContentLoaded", () => {
	initializePage();

	document
		.getElementById("layout-selector")
		.addEventListener("change", addLayout);

	initializeStylingOptions();
});

function initializePage() {
	initializeEditableElements();
	initializeDraggable();
	initializeImageClick();
}

function initializeEditableElements() {
	document.querySelectorAll(".editable").forEach((editableDiv) => {
		editableDiv.addEventListener("click", (e) => {
			e.stopPropagation();
			makeEditable(editableDiv);
		});

		editableDiv.addEventListener("blur", () => {
			document.getElementById("stylingOptions").style.display = "none";
			editableDiv.removeAttribute("contenteditable");
		});

		editableDiv.addEventListener("keydown", (e) => {
			if (e.key === "Enter") {
				e.preventDefault();
				document.execCommand("insertLineBreak");
			}
		});

		editableDiv.addEventListener("paste", (e) => {
			e.preventDefault();

			// Get the plain text from the clipboard
			const text = e.clipboardData.getData("text/plain");

			// Insert the plain text at the current caret position
			const selection = window.getSelection();
			if (!selection.rangeCount) return;
			selection.deleteFromDocument(); // Removes selected text if any

			const range = selection.getRangeAt(0);
			range.insertNode(document.createTextNode(text)); // Insert plain text
			range.collapse(false); // Move caret to the end of the inserted text

			// Optionally restore the selection/caret position
			selection.removeAllRanges();
			selection.addRange(range);
		});
	});
}

function makeEditable(element) {
	element.setAttribute("contenteditable", "true");
	element.focus();
	if (updateStylingOptions) {
		// Check if the function is defined before calling it
		updateStylingOptions();
	}
}

function initializeStylingOptions() {
	const stylingOptions = document.getElementById("stylingOptions");
	const boldBtn = document.getElementById("boldBtn");
	const italicBtn = document.getElementById("italicBtn");
	const underlineBtn = document.getElementById("underlineBtn");
	const linkBtn = document.getElementById("linkBtn");
	const alignLeftBtn = document.getElementById("alignLeftBtn");
	const alignCenterBtn = document.getElementById("alignCenterBtn");
	const alignRightBtn = document.getElementById("alignRightBtn");

	let activeEditable = null;

	updateStylingOptions = function () {
		const selection = window.getSelection();
		if (selection.rangeCount === 0) return;

		const range = selection.getRangeAt(0);
		const rect = range.getBoundingClientRect();

		if (rect.width && rect.height) {
			stylingOptions.style.display = "block";
			stylingOptions.style.top = `${
				rect.top + window.scrollY - stylingOptions.offsetHeight
			}px`;
			stylingOptions.style.left = `${rect.left + window.scrollX}px`;
		} else {
			stylingOptions.style.display = "none";
		}
	};

	document.addEventListener("selectionchange", () => {
		const selection = window.getSelection();
		if (selection.rangeCount === 0) return;

		const range = selection.getRangeAt(0);
		let container = range.commonAncestorContainer;

		if (container.nodeType === Node.TEXT_NODE) {
			container = container.parentNode;
		}

		activeEditable = document.querySelector(".editable:focus");

		if (activeEditable) {
			updateStylingOptions();
		} else {
			stylingOptions.style.display = "none";
		}
	});

	// Apply text styling options
	boldBtn.addEventListener("click", () => applyStyle("bold"));
	italicBtn.addEventListener("click", () => applyStyle("italic"));
	underlineBtn.addEventListener("click", () => applyStyle("underline"));
	linkBtn.addEventListener("click", () => {
		const url = prompt("Enter the URL");
		if (url) {
			applyStyle("createLink", url);
		}
	});

	// Text alignment options
	alignLeftBtn.addEventListener("click", () => applyStyle("justifyLeft"));
	alignCenterBtn.addEventListener("click", () => applyStyle("justifyCenter"));
	alignRightBtn.addEventListener("click", () => applyStyle("justifyRight"));

	stylingOptions.addEventListener("mousedown", (e) => e.preventDefault());
}

// Modified applyStyle function to accept optional argument (e.g., URL for link creation)
function applyStyle(command, value = null) {
	document.execCommand(command, false, value);
}

function addLayout() {
	const selectedLayout = document.getElementById("layout-selector").value;
	const layoutContainer = document.querySelector("main");

	layoutContainer.insertAdjacentHTML("afterbegin", templates[selectedLayout]);

	initializePage();
}

function initializeDraggable() {
	Sortable.create(document.querySelector("main"), {
		group: "shared",
		animation: 150,
		handle: ".layout",
		forceFallback: true, // This is it!
		onStart: function () {
			document.body.classList.add("grabbing");
			document.getElementById("trash-bin").style.display = "block";
		},
		onEnd: function () {
			document.body.classList.remove("grabbing");
			document.getElementById("trash-bin").style.display = "none";
		},
		onMove: function () {
			document.body.classList.add("grabbing");
		},
	});
}
// Initialize Sortable for the trash bin
const trashBin = new Sortable(document.getElementById("trash-bin"), {
	group: "shared",
	onAdd: function (evt) {
		evt.item.remove(); // Remove the item when it's dropped into the trash bin
	},
});

// Images
let selectedImageElement = null;

function initializeImageClick() {
	document.querySelectorAll("main img").forEach((image) => {
		image.addEventListener("click", handleImageClick);
	});
}

function handleImageClick() {
	selectedImageElement = this;
	showDialog();
}

function showDialog() {
	document.getElementById("imageDialog").classList.add("show");
}

function closeDialog() {
	document.getElementById("imageDialog").classList.remove("show");
}

function applyImageUrl() {
	const imageUrl = document.getElementById("imageUrlInput").value;
	if (imageUrl && selectedImageElement) {
		selectedImageElement.src = imageUrl;
		closeDialog();
	}
}

function selectGalleryImage(imageSrc) {
	if (selectedImageElement) {
		selectedImageElement.src = imageSrc;
		selectedImageElement.alt = document.getElementById("altTextInput").value;
		closeDialog();
	}
}

/*Save*/
async function saveHTML() {
	// Find all elements with class 'title'
	document.querySelectorAll(".title").forEach((titleElement) => {
		let textContent = titleElement.textContent.trim(); // Get the text content and trim any extra spaces
		let modifiedText = `_${textContent.replace(/\s+/g, "_")}`; // Replace spaces with underscores and prepend an underscore

		// Set the id of the title element with the modified text
		titleElement.id = modifiedText;
	});

	const mainContentHTML = document.querySelector("main").innerHTML;
	const pageTitle = document.getElementById("title").value; // You can adjust this to be dynamic
	const routeName = window.location.pathname.split("/").pop(); // You can adjust this to be dynamic
	const author = "Admin"; // You can adjust this to be dynamic

	try {
		// Send the HTML content to the server using the Fetch API
		const response = await fetch("/save-html", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				pageTitle,
				routeName,
				content: mainContentHTML,
				author,
			}),
		});

		// Check if the request was successful
		if (response.ok) {
			alert("Content saved successfully!");
		} else {
			const errorMessage = await response.json();
			alert("Failed to save content.", errorMessage.error);
		}
	} catch (error) {
		console.error("Error saving content:", error);
		alert("An error occurred while saving.");
	}
}

async function routeAdd() {
	const routeName = document.getElementById("routeName").value;

	try {
		const response = await fetch("/add-route", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				routeName,
			}),
		});

		if (response.ok) {
			alert("Route added successfully!");
			window.location.reload(); // Reload the page to see the new route added
		} else {
			alert("Failed to add route.");
		}
	} catch (error) {
		console.error("Error adding route:", error);
		alert("An error occurred while adding the route.");
	}
}

async function routeDelete(element) {
	const routeId = element.id;
	alert(routeId);

	try {
		const response = await fetch("/delete-route", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				routeId,
			}),
		});

		if (response.ok) {
			alert("Route deleted successfully!");
			window.location.reload(); // Reload the page to see the route deleted
		} else {
			alert("Failed to add route.");
		}
	} catch (error) {
		console.error("Error deleting route:", error);
		alert("An error occurred while deleting the route.");
	}
}
