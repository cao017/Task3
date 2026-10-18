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

// ---------- text box growing (also fits the placeholder) ----------
const autoGrow = function () {
    messageInput.style.height = "auto";

    let neededHeight;
    if (messageInput.value === "") {
        // empty: briefly use the placeholder as real text to measure it
        messageInput.value = messageInput.placeholder;
        neededHeight = messageInput.scrollHeight;
        messageInput.value = "";
    } else {
        neededHeight = messageInput.scrollHeight;
    }

    messageInput.style.height = neededHeight + "px";
    messageInput.style.overflowY = neededHeight > 150 ? "auto" : "hidden";
};

messageInput.addEventListener("input", autoGrow);
window.addEventListener("resize", autoGrow);
document.fonts.ready.then(autoGrow);

// ---------- placeholder ----------
const hasNames = myName && partnerName;

if (!hasNames) {
    messageInput.placeholder = "Choose names in settings!";
} else {
    const placeholders = [
     `Tell ${partnerName} what you love about them`,
    `Send ${partnerName} a love note`,
    `Tell ${partnerName} about your day`,
    `Send ${partnerName} a quick check-in`,
    `Ask ${partnerName} about their day`,
    `Ask ${partnerName} what made them smile today`,
    `Give ${partnerName} a compliment`,
    `Tell ${partnerName} why you miss them`,
    `Give ${partnerName} a virtual hug`,
    `Share a memory you had with ${partnerName} that was unforgettable`,
    ];

    messageInput.placeholder = placeholders[Math.floor(Math.random() * placeholders.length)];
}

autoGrow();

// ---------- random avatar animations ----------
const avatarAnimations = [
    "anim-hop", "anim-sway", "anim-drift", "anim-squish",
    "anim-shake", "anim-heartbeat", "anim-flash", "anim-glow"
];

let lastSeenTime = 0;
let lastAnimation = "";

const playRandomAvatarAnimation = function () {
    // pick a random one, but never the same as last time
    let choices = avatarAnimations.filter((name) => name !== lastAnimation);
    let chosen = choices[Math.floor(Math.random() * choices.length)];
    lastAnimation = chosen;

    // clear any animation still running, then restart
    partnerAvatar.classList.remove(...avatarAnimations);
    void partnerAvatar.offsetWidth;
    partnerAvatar.classList.add(chosen);

    partnerAvatar.addEventListener("animationend", () => {
        partnerAvatar.classList.remove(chosen);
    }, { once: true });
};

// ---------- receiving ----------
const getMessages = async function() {
    try {
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
                    playRandomAvatarAnimation();
                }

                let timeElapsed = Date.now() - lastMessage.time;
                if (timeElapsed < 10000) {
                    avatarAnimation.style.opacity = 1;
                }
            }
        }

        console.log(results);
    } catch (error) {
        console.log("Could not fetch messages yet:", error);
    }
};

// ---------- sending ----------
const sendMessage = async function() {
    const text = messageInput.value.trim();
    if (text === "") return;

    if (!hasNames) {
        messageInput.value = "";
        autoGrow();
        messageInput.focus();
        return;   // no names yet, so don't send
    }

    // shown right away so you can test the frontend without a backend
    messageReceived.textContent = text;
    avatarAnimation.style.opacity = "1";
    playRandomAvatarAnimation();   // temporary: remove once partner messages arrive

    messageInput.value = "";
    autoGrow();

    try {
        await fetch(`https://messengerbackend-beta.vercel.app/api/messages`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                room: "partnercheckin",
                from: myName,
                text: text
            })
        });
    } catch (error) {
        console.log("Could not send message yet:", error);
    }
};

sendMessageButton.addEventListener("click", sendMessage);

messageInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();   // stops the newline from being inserted
        sendMessage();
    }
});

// ---------- avatar (light or dark version) ----------
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

// ---------- timers ----------
let getMessageTimer = setInterval(getMessages, 5000);
let avatarFadeTimer = setInterval(fadeAvatar, 100);