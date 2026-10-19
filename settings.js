const saveButton = document.getElementById("saveButton");
const partnerNameInput = document.getElementById("partnerNameInput");
const myNameInput = document.getElementById("myNameInput");
const avatarOptions = document.querySelectorAll('input[name="avatar"]');
const themeToggle = document.getElementById("themeToggle");

myNameInput.value = localStorage.getItem("myName") || "";
partnerNameInput.value = localStorage.getItem("partnerName") || "";
const savedAvatar = localStorage.getItem("partnerAvatar");
const savedAvatarRadio = document.querySelector(`input[name="avatar"][value="${savedAvatar}"]`);
if (savedAvatarRadio) {
    savedAvatarRadio.checked = true;
}

// Attaches a change handler to each available partner avatar.
avatarOptions.forEach((avatarOption) => {
    // Save a selected avatar immediately when the user chooses it.
    avatarOption.addEventListener("change", () => {
        if (avatarOption.checked) {
            localStorage.setItem("partnerAvatar", avatarOption.value);
        }
    });
});

// Saves the settings and returns to the main chat page.
saveButton.addEventListener("click", () => {
    localStorage.setItem("myName", myNameInput.value);
    localStorage.setItem("partnerName", partnerNameInput.value);
    const chosenAvatar = document.querySelector('input[name="avatar"]:checked');
    if (chosenAvatar) {
        localStorage.setItem("partnerAvatar", chosenAvatar.value);
    }
    window.location.href = "index.html";
});

// ---------- theme ----------
// Applies the selected theme, persists it, and updates the avatar previews.
const applyTheme = function (theme) {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);

    // swap the avatar choices to match the theme
    // Changes each preview image to its light- or dark-theme asset.
    document.querySelectorAll(".avatarChoice img").forEach((img) => {
        img.src = theme === "dark" ? img.dataset.dark : img.dataset.light;
    });

    themeToggle.textContent = theme === "dark" ? "☀️ Light mode" : "🌙 Dark mode";
};

// Switches to the opposite of the currently active theme.
themeToggle.addEventListener("click", () => {
    const isDark = document.documentElement.getAttribute("data-theme") === "dark";
    applyTheme(isDark ? "light" : "dark");
});

// run once on load
applyTheme(document.documentElement.getAttribute("data-theme"));