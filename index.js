//   GET  /api/messages?room=blue-fox-42        → the last 50 messages in that room
//   POST /api/messages  { room, from, text }   → adds a message to that room

const sendMessageButton = document.getElementById("sendButton");
const messageInput = document.getElementById("messageInput");
const avatarAnimation = document.getElementById("avatarAnimation");
const partnerAvatar = document.getElementById("partnerAvatar");
const chatLog = document.getElementById("chatLog");
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
}

autoGrow();

// ---------- chat log ----------
const formatTime = function (ms) {
    const date = new Date(ms);
    const time = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    // messages from today show just the time, older ones also show the date
    if (date.toDateString() === new Date().toDateString()) {
        return time;
    }
    return `${date.toLocaleDateString([], { day: "numeric", month: "short" })}, ${time}`;
};

const seenKeys = new Set();     // messages already on screen (from the server)
const pendingMine = [];         // messages I just sent, waiting for the server to echo them back

const addMessage = function (from, text, time) {
    const isMine = from === myName;

    // only auto-scroll if I sent it, or I was already at the bottom
    const wasAtBottom = chatLog.scrollHeight - chatLog.scrollTop - chatLog.clientHeight < 40;

    const bubble = document.createElement("div");
    bubble.className = "chatMessage " + (isMine ? "mine" : "theirs");

    const meta = document.createElement("div");
    meta.className = "chatMeta";

    const sender = document.createElement("span");
    sender.className = "chatSender";
    sender.textContent = from;

    const timeEl = document.createElement("span");
    timeEl.className = "chatTime";
    timeEl.textContent = formatTime(time);

    const body = document.createElement("div");
    body.className = "chatText";
    body.textContent = text;

    meta.append(sender, timeEl);
    bubble.append(meta, body);
    chatLog.append(bubble);

    if (isMine || wasAtBottom) {
        chatLog.scrollTop = chatLog.scrollHeight;
    }

    return { bubble, timeEl };
};

// ---------- random avatar animations ----------
const avatarAnimations = [
    "anim-hop", "anim-sway", "anim-drift", "anim-squish",
    "anim-shake", "anim-heartbeat", "anim-flash", "anim-glow"
];

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
let firstLoad = true;   // the first fetch loads history, so it shouldn't trigger animations

const getMessages = async function() {
    try {
        let URL = `https://messengerbackend-beta.vercel.app/api/messages?room=partnercheckin`;
        let response = await fetch(URL);
        let results = await response.json();

        if (Array.isArray(results)) {
            // oldest first, whatever order the server returns them in
            results.sort((a, b) => (a.time || 0) - (b.time || 0));

            for (const message of results) {
                const key = `${message.from}|${message.time}|${message.text}`;
                if (seenKeys.has(key)) continue;
                seenKeys.add(key);

                // one of mine that I already showed locally: just fix its time
                if (message.from === myName) {
                    const index = pendingMine.findIndex((p) => p.text === message.text);
                    if (index !== -1) {
                        pendingMine[index].timeEl.textContent = formatTime(message.time);
                        pendingMine.splice(index, 1);
                        continue;
                    }
                }

                addMessage(message.from, message.text, message.time);

                // a new message from my partner (not history)
                if (!firstLoad && message.from !== myName) {
                    avatarAnimation.style.opacity = 1;
                    playRandomAvatarAnimation();
                }
            }

            firstLoad = false;
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
    const shown = addMessage(myName, text, Date.now());
    pendingMine.push({ text: text, timeEl: shown.timeEl });
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
getMessages();   // load the conversation right away instead of waiting 5 seconds
let getMessageTimer = setInterval(getMessages, 5000);
let avatarFadeTimer = setInterval(fadeAvatar, 100);