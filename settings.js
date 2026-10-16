const saveButton = document.getElementById("saveButton");
const partnerNameInput = document.getElementById("partnerNameInput");
const myNameInput = document.getElementById("myNameInput");

myNameInput.value = localStorage.getItem("myName");
partnerNameInput.value = localStorage.getItem("partnerName");
const savedAvatar = localStorage.getItem("partnerAvatar");
const savedAvatarRadio = document.querySelector(`input[name="avatar"][value="${savedAvatar}"]`);
if (savedAvatarRadio) {
    savedAvatarRadio.checked = true;
}

saveButton.addEventListener("click", () => {
    // do something with the values
    localStorage.setItem("myName", myNameInput.value);
    localStorage.setItem("partnerName", partnerNameInput.value);
    const chosenAvatar = document.querySelector('input[name="avatar"]:checked');
    localStorage.setItem("partnerAvatar", chosenAvatar.value);
    window.location.href = "index.html";
});

