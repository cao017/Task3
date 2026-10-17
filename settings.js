const saveButton = document.getElementById("saveButton");
const partnerNameInput = document.getElementById("partnerNameInput");
const myNameInput = document.getElementById("myNameInput");
const avatarOptions = document.querySelectorAll('input[name="avatar"]');

myNameInput.value = localStorage.getItem("myName");
partnerNameInput.value = localStorage.getItem("partnerName");
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
