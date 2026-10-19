//   GET  /api/messages?room=blue-fox-42        → the last 50 messages in that room
//   POST /api/messages  { room, from, text }   → adds a message to that room

const sendMessageButton = document.getElementById("sendButton");
const messageInput = document.getElementById("messageInput");
const avatarAnimation = document.getElementById("avatarAnimation");
const partnerAvatar = document.getElementById("partnerAvatar");
const chatLog = document.getElementById("chatLog");

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
    // the CSS max-height clamps the box; scroll only if the text is taller than what's visible
    messageInput.style.overflowY =
        messageInput.scrollHeight > messageInput.clientHeight + 1 ? "auto" : "hidden";
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
        `Tell ${partnerName} something you love about them`,
        `Ask ${partnerName} what made them smile today`,
        `Tell ${partnerName} about your day`,
        `Send ${partnerName} a quick check-in`,
        `Ask ${partnerName} about their day`,
        `Send ${partnerName} a little kiss`,
        `Give ${partnerName} a compliment that will make them blush`,
        `Tell ${partnerName} you miss them`,
        `Tell ${partnerName} why you love them`,
        `Share a memory you had with ${partnerName} that was unforgettable`,
    ];

    messageInput.placeholder = placeholders[Math.floor(Math.random() * placeholders.length)];
}

autoGrow();

// ---------- emoji buttons ----------
document.querySelectorAll(".emojiButton").forEach((button) => {
    // stops the button from stealing focus, so the cursor stays in the text box
    button.addEventListener("mousedown", (e) => e.preventDefault());

    button.addEventListener("click", () => {
        // insert at the cursor (or replace the selected text)
        messageInput.setRangeText(
            button.dataset.emoji,
            messageInput.selectionStart,
            messageInput.selectionEnd,
            "end"
        );
        messageInput.focus();
        autoGrow();
        sendMessage();
    });
});

// ---------- avatar fade: 100% -> 0% over 15 minutes ----------
const FADE_DURATION = 15 * 60 * 1000;   // change this to make it faster or slower
let lastActivityTime = Date.now();      // when the avatar was last "refreshed"

const updateAvatarFade = function () {
    const elapsed = Date.now() - lastActivityTime;
    avatarAnimation.style.opacity = Math.max(0, 1 - elapsed / FADE_DURATION);
};

updateAvatarFade();

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

            let newestPartnerTime = 0;

            for (const message of results) {
                if (message.from !== myName) {
                    newestPartnerTime = Math.max(newestPartnerTime, message.time || 0);
                }

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
                    playRandomAvatarAnimation();
                }
            }

            // the avatar's fade restarts from my partner's latest message
            if (newestPartnerTime && (firstLoad || newestPartnerTime > lastActivityTime)) {
                lastActivityTime = newestPartnerTime;
                updateAvatarFade();
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

    // temporary test helpers: remove both lines once partner messages arrive
    lastActivityTime = Date.now();
    updateAvatarFade();
    playRandomAvatarAnimation();

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
let avatarFadeTimer = setInterval(updateAvatarFade, 1000);

// ---------- keep the layout inside the visible screen (keyboard open or closed for iPhone) ----------
const fitToVisibleScreen = function () {
    const vv = window.visualViewport;
    if (!vv) return;
    document.documentElement.style.setProperty("--app-height", vv.height + "px");
    document.documentElement.style.setProperty("--app-top", vv.offsetTop + "px");
};

if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", fitToVisibleScreen);
    window.visualViewport.addEventListener("scroll", fitToVisibleScreen);
}
fitToVisibleScreen();

// ---------- phone: hide the avatar while typing, so the messages get the space ----------
const phoneQuery = window.matchMedia("(max-width: 600px)");

messageInput.addEventListener("focus", () => {
    if (phoneQuery.matches) document.documentElement.classList.add("typing");
});

messageInput.addEventListener("blur", () => {
    document.documentElement.classList.remove("typing");
});

// tapping Send shouldn't take focus from the text box, otherwise the keyboard closes
// mid-tap and the layout jumps (the keyboard now stays open after sending, like a normal chat app)
sendMessageButton.addEventListener("mousedown", (e) => e.preventDefault());