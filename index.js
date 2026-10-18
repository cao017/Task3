//   GET  /api/messages?room=blue-fox-42        → the last 50 messages in that room
//   POST /api/messages  { room, from, text }   → adds a message to that room

const getMessagesButton = document.getElementById("getMessagesButton");
const sendMessageButton = document.getElementById("sendButton");
const partnerNameLogo = document.getElementById("partnerNameLogo");
const messageInput = document.getElementById("messageInput");
const avatarAnimation = document.getElementById("avatarAnimation");
const partnerAvatar = document.getElementById("partnerAvatar");
const messageReceived = document.getElementById("messageReceived");
avatarAnimation.style.opacity = 1;

// retrieve the names from localStorage: this is persistent between sessions
let myName = localStorage.getItem("myName");
let partnerName = localStorage.getItem("partnerName");

const placeholders = [
    `Tell ${partnerName} something sweet`,
    `Send ${partnerName} a love note`,
    `Tell ${partnerName} about your day`,
    `Send ${partnerName} a quick check-in`,
    `Ask ${partnerName} about their day`,
    `Send ${partnerName} a little kiss`,
    `Give ${partnerName} a compliment`,
    `Tell ${partnerName} you miss them`,
    `Give ${partnerName} a virtual hug`,
    `Share a memory with ${partnerName}`,
];

messageInput.placeholder = placeholders[Math.floor(Math.random() * placeholders.length)];

//testing animation
let lastSeenTime = 0;

const makeAvatarHop = function () {
    partnerAvatar.classList.remove("excited");
    void partnerAvatar.offsetWidth;   // restarts the animation if it's already running
    partnerAvatar.classList.add("excited");
    partnerAvatar.addEventListener("animationend", () => {
        partnerAvatar.classList.remove("excited");
    }, { once: true });
};
//testing animation

const getMessages = async function() {
    let URL = `https://messengerbackend-beta.vercel.app/api/messages?room=partnercheckin`;
    let response = await fetch(URL);
    let results = await response.json();

    if (Array.isArray(results) && results.length > 0) {
        let fromPartner = results.filter((message) => message.from === partnerName);
        if (fromPartner.length > 0) {
            let lastMessage = fromPartner[fromPartner.length - 1];
            messageReceived.textContent = lastMessage.text;
            if (lastMessage.time && lastMessage.time > lastSeenTime) {
    lastSeenTime = lastMessage.time;
    makeAvatarHop();
}
            let timeElapsed = Date.now() - lastMessage.time;       
            if (timeElapsed < 10000) {
                avatarAnimation.style.opacity = 1;
            }
        }
    }    
    
    console.log(results);
}

const autoGrow = function () {
    messageInput.style.height = "auto";
    messageInput.style.height = messageInput.scrollHeight + "px";
    messageInput.style.overflowY = messageInput.scrollHeight > 150 ? "auto" : "hidden";
};

messageInput.addEventListener("input", autoGrow);

const sendMessage = async function() {
    const text = messageInput.value.trim();
    if (text === "") return;

    await fetch(`https://messengerbackend-beta.vercel.app/api/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            room: "partnercheckin",
            from: myName,
            text: text
        })
    });

    messageReceived.textContent = text;
    avatarAnimation.style.opacity = "1";
    messageInput.value = "";
    autoGrow();
}

sendMessageButton.addEventListener("click", sendMessage);

const fadeAvatar = function() {
    avatarAnimation.style.opacity = avatarAnimation.style.opacity * 0.99;
};

const savedPartnerAvatar = localStorage.getItem("partnerAvatar");
if (savedPartnerAvatar) {
    const isDark = document.documentElement.getAttribute("data-theme") === "dark";
    partnerAvatar.src = isDark
        ? savedPartnerAvatar.replace("images/NonBinary", "images/DarkModeNonBinary")
        : savedPartnerAvatar;
}

let getMessageTimer = setInterval(getMessages, 5000);
let avatarFadeTimer = setInterval(fadeAvatar, 100);

// Optional: also send when pressing Enter
messageInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();   // stops the newline from being inserted
        sendMessage();
    }
});