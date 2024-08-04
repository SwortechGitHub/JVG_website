CKEDITOR.plugins.add("picoReference", {
	init: function (editor) {
		editor.addCommand("showPicoReference", {
			exec: function (editor) {
				var referenceDiv = document.getElementById("pico-reference");
				referenceDiv.style.display =
					referenceDiv.style.display === "none" ? "block" : "none";
			},
		});

		editor.ui.addButton("PicoReference", {
			label: "Rādīt Pico klases",
			command: "showPicoReference",
			toolbar: "about",
			icon: "picoReferenceIcon", // Use a custom class name
		});

		// Disable the plugin if not in source mode
		editor.on("mode", function () {
			if (editor.mode === "source") {
				editor.getCommand("showPicoReference").enable();
			} else {
				editor.getCommand("showPicoReference").disable();
			}
		});
	},
});
