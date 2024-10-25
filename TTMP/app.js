// app.js
// =============================
// Service Worker Registration
// =============================

// Check if the browser supports service workers
if ("serviceWorker" in navigator) {
	window.addEventListener("load", () => {
		// Register the service worker with an absolute path
		navigator.serviceWorker
			.register("./service-worker.js")
			.then((registration) => {
				console.log("[Service Worker] Registered with scope:", registration.scope);
			})
			.catch((error) => {
				console.error("[Service Worker] Registration failed:", error);
			});
	});
} else {
	console.warn(
		"[Service Worker] Service workers are not supported in this browser."
	);
}

// =============================
// LUA Integrations
// =============================

// Load and execute main.lua by appending a script tag with type "application/lua"
const script = document.createElement("script");
script.src = "./lua/main.lua";
script.type = "application/lua";
script.async = true;
document.body.appendChild(script);

// =============================
// Initialization Confirmation
// =============================

// Log a message to confirm that app.js has loaded
console.log("app.js has been loaded successfully.");

// =============================
// Functions
// =============================

// Helper function to safely get an element by ID
window.safeGetElementById = function (id) {
	return document.getElementById(id);
};

// Define typeText and untypeText functions on the window object with added test prints
window.typeText = function (text, elementId, duration) {
	const element = window.safeGetElementById(elementId);
	if (!element) {
		console.error(`Element with ID '${elementId}' not found.`);
		return;
	}
	duration = duration || 1000;
	const totalChars = text.length;
	const interval = duration / totalChars;

	for (let i = 1; i <= totalChars; i++) {
		setTimeout(() => {
			element.textContent = text.substring(0, i);
		}, interval * i);
	}
};

window.untypeText = function (elementId, duration) {
	const element = window.safeGetElementById(elementId);
	if (!element) {
		console.error(`Element with ID '${elementId}' not found.`);
		return;
	}

	const text = element.textContent || "";
	const totalChars = text.length;
	if (totalChars === 0) {
		console.log("Element has no text to untype.");
		return;
	}

	duration = duration || 1000;
	const interval = duration / totalChars;

	for (let i = totalChars; i >= 0; i--) {
		setTimeout(() => {
			element.textContent = text.substring(0, i) || "\u00A0"; // Ensure a space is present when text is fully untyped
		}, interval * (totalChars - i + 1));
	}
};

// Window Size Management
function enforceWindowSize() {
	const minWidth = 1180;
	const minHeight = 760;

	// Check and set window size on load
	if (window.innerWidth < minWidth || window.innerHeight < minHeight) {
		window.resizeTo(minWidth, minHeight);
	}

	// Disable resizing by reverting any resize attempt
	window.addEventListener("resize", () => {
		if (window.innerWidth < minWidth || window.innerHeight < minHeight) {
			window.resizeTo(minWidth, minHeight);
		}
	});
}

function copyToClipboard() {
	const outputText = document.getElementById("output-text");
	outputText.select();
	document.execCommand("copy");
	alert("Text copied to clipboard!");
}

// Run when the window loads
window.onload = enforceWindowSize;
