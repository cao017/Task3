const saveButton = document.getElementById("saveButton"); // Finds the Save button that commits the form.
const partnerNameInput = document.getElementById("partnerNameInput"); // Finds the field for the partner's name.
const myNameInput = document.getElementById("myNameInput"); // Finds the field for this user's name.
const avatarOptions = document.querySelectorAll('input[name="avatar"]'); // Finds every radio choice for the partner avatar.
const themeToggle = document.getElementById("themeToggle"); // Finds the control that changes light/dark mode.

myNameInput.value = localStorage.getItem("myName") || ""; // Fill the name field from storage, or leave it blank.
partnerNameInput.value = localStorage.getItem("partnerName") || ""; // Fill the partner field from storage, or leave it blank.
const savedAvatar = localStorage.getItem("partnerAvatar"); // Read the previously selected avatar file path.
const savedAvatarRadio = document.querySelector(`input[name="avatar"][value="${savedAvatar}"]`); // Find the radio choice matching that path.
if (savedAvatarRadio) { // A saved path may not match an available choice.
    savedAvatarRadio.checked = true; // Mark the matching avatar option as selected.
}

// Attaches a change handler to each available partner avatar.
avatarOptions.forEach((avatarOption) => {
    // Save a selected avatar immediately when the user chooses it.
    avatarOption.addEventListener("change", () => {
        if (avatarOption.checked) { // Only the radio that became selected should be saved.
            localStorage.setItem("partnerAvatar", avatarOption.value); // Persist its image path for the main page.
        }
    });
});

// Saves the settings and returns to the main chat page.
saveButton.addEventListener("click", () => {
    localStorage.setItem("myName", myNameInput.value); // Save the user's entered name.
    localStorage.setItem("partnerName", partnerNameInput.value); // Save the partner's entered name.
    const chosenAvatar = document.querySelector('input[name="avatar"]:checked'); // Find the avatar currently selected in the form.
    if (chosenAvatar) { // Save an avatar only if a radio option is selected.
        localStorage.setItem("partnerAvatar", chosenAvatar.value); // Persist the selected avatar's image path.
    }
    window.location.href = "index.html"; // Return to the main conversation page.
});

// ---------- theme ----------
// Applies the selected theme, persists it, and updates the avatar previews.
const applyTheme = function (theme) {
    document.documentElement.setAttribute("data-theme", theme); // Update the root attribute used by the theme CSS.
    localStorage.setItem("theme", theme); // Remember this theme for future page loads.
    const themeStyles = getComputedStyle(document.documentElement); // Read the background values for the newly active theme.
    document.body.style.backgroundImage = themeStyles.getPropertyValue("--screen-background-image"); // Update the visible page background immediately on desktop and mobile.
    document.body.style.backgroundColor = themeStyles.getPropertyValue("--page-fallback-color"); // Keep the fallback color in sync while the image loads.

    // swap the avatar choices to match the theme
    // Changes each preview image to its light- or dark-theme asset.
    document.querySelectorAll(".avatarChoice img").forEach((img) => {
        img.src = theme === "dark" ? img.dataset.dark : img.dataset.light; // Select the matching image URL stored in the HTML data attributes.
    });

    themeToggle.textContent = theme === "dark" ? "☀️ Light mode" : "🌙 Dark mode"; // Label the action that switches to the opposite theme.
};

// Switches to the opposite of the currently active theme.
themeToggle.addEventListener("click", () => {
    const isDark = document.documentElement.getAttribute("data-theme") === "dark"; // Read whether dark mode is currently active.
    applyTheme(isDark ? "light" : "dark"); // Toggle to the other theme.
});

// run once on load
applyTheme(document.documentElement.getAttribute("data-theme")); // Apply saved/system theme and synchronize all previews on startup.