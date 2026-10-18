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

avatarOptions.forEach((avatarOption) => {
    avatarOption.addEventListener("change", () => {
        if (avatarOption.checked) {
            localStorage.setItem("partnerAvatar", avatarOption.value);
        }
    });
});

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
const applyTheme = function (theme) {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);

    // swap the avatar choices to match the theme
    document.querySelectorAll(".avatarChoice img").forEach((img) => {
        img.src = theme === "dark" ? img.dataset.dark : img.dataset.light;
    });

    themeToggle.textContent = theme === "dark" ? "☀️ Light mode" : "🌙 Dark mode";
};

themeToggle.addEventListener("click", () => {
    const isDark = document.documentElement.getAttribute("data-theme") === "dark";
    applyTheme(isDark ? "light" : "dark");
});

// run once on load
applyTheme(document.documentElement.getAttribute("data-theme"));