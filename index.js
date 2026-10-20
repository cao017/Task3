//   GET  /api/messages?room=partnercheckin     → messages in this app's conversation
//   POST /api/messages  { room, from, text }   → adds a message to that room


const sendMessageButton = document.getElementById("sendButton"); // Finds the Send button so a click can submit a message.
const messageInput = document.getElementById("messageInput"); // Finds the text field where a message is composed.
const avatarAnimation = document.getElementById("avatarAnimation"); // Finds the avatar wrapper whose opacity fades.
const partnerAvatar = document.getElementById("partnerAvatar"); // Finds the avatar image to switch and animate.
const chatLog = document.getElementById("chatLog"); // Finds the scrollable list where message bubbles are rendered.
const logo = document.getElementById("logo"); // Finds the one logo element that moves between the header and partner section.
const header = document.getElementById("header"); // Finds the header where the logo sits beside Settings while typing.
const partnerSection = document.getElementById("partnerSection"); // Finds the logo's normal position above the avatar.

// retrieve the names from localStorage: this is persistent between sessions
let myName = localStorage.getItem("myName"); // Loads this user's saved display name.
let partnerName = localStorage.getItem("partnerName"); // Loads the partner's saved display name.

// ---------- text box growing (also fits the placeholder) ----------
// Resizes the message field to fit its text and enables scrolling only when needed.
const autoGrow = function () {
    messageInput.style.height = "auto"; // Reset height so the browser can measure the content's natural height.

    let neededHeight; // Will hold the height needed to display the text or placeholder.
    if (messageInput.value === "") {
        // empty: briefly use the placeholder as real text to measure it
        messageInput.value = messageInput.placeholder; // Temporarily let the browser measure the placeholder text.
        neededHeight = messageInput.scrollHeight; // Read the full height required for that text.
        messageInput.value = ""; // Restore the empty field after measuring.
    } else {
        neededHeight = messageInput.scrollHeight; // Measure the current message content.
    }

     messageInput.style.height = neededHeight + "px"; // Grow the field to the measured height; CSS caps its maximum.
    // the CSS max-height clamps the box; scroll only if the text is taller than what's visible
    messageInput.style.overflowY =
        messageInput.scrollHeight > messageInput.clientHeight + 1 ? "auto" : "hidden"; // Enable internal scrolling only after the field reaches its height limit.
};

messageInput.addEventListener("input", autoGrow); // Recalculate height whenever the user edits the message.
window.addEventListener("resize", autoGrow); // Recalculate after viewport changes alter text wrapping.
document.fonts.ready.then(autoGrow); // Recalculate after web fonts finish loading and change text metrics.

// ---------- placeholder ----------
const hasNames = myName && partnerName; // Sending requires both participants' names to be configured.

if (!hasNames) {
    messageInput.placeholder = "Choose names in settings!"; // Explain why messages cannot be sent yet.
} else {
    const placeholders = [ // Suggestions personalize the empty input for the current partner.
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

    messageInput.placeholder = placeholders[Math.floor(Math.random() * placeholders.length)]; // Select one suggestion at random.
}

autoGrow(); // Set the correct initial input height when the page first loads.

// ---------- emoji buttons ----------
// Adds each emoji at the current cursor position, then sends the updated message.
document.querySelectorAll(".emojiButton").forEach((button) => {
    // Keeps a mouse click from moving focus away from the message field.
    button.addEventListener("mousedown", (e) => e.preventDefault()); // Keep mouse interaction from changing the cursor position.

    // Inserts this button's emoji at the cursor and sends the resulting message.
    button.addEventListener("click", () => {
        // insert at the cursor (or replace the selected text)
        messageInput.setRangeText( // Replace any selected text, or insert at the cursor.
            button.dataset.emoji, // Emoji value stored on the clicked button.
            messageInput.selectionStart, // Beginning of the selected range or cursor.
            messageInput.selectionEnd, // End of the selected range or cursor.
            "end" // Place the caret immediately after the inserted emoji.
        );
        autoGrow(); // Resize the field to fit the inserted emoji.
        sendMessage(); // Send the emoji as a message immediately.
    });
});

// ---------- avatar fade: 100% -> 0% over 15 minutes ----------
const FADE_DURATION = 15 * 60 * 1000; // Avatar takes 15 minutes to fade from fully visible to hidden.
let lastActivityTime = Date.now(); // Timestamp of the most recent partner activity.

// Sets the avatar's opacity based on how long it has been since the latest activity.
const updateAvatarFade = function () {
    const elapsed = Date.now() - lastActivityTime; // Time passed since the last activity, in milliseconds.
    avatarAnimation.style.opacity = Math.max(0, 1 - elapsed / FADE_DURATION); // Convert elapsed time to opacity and clamp it at zero.
};

updateAvatarFade(); // Set the avatar's initial opacity before the timer starts.

// ---------- chat log ----------
// Formats a message timestamp as a time today, or as a date and time for older messages.
const formatTime = function (ms) { // Converts a server timestamp into a readable chat label.
    const date = new Date(ms); // Create a Date object from milliseconds since the epoch.
    const time = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }); // Format the time using the user's locale.
    // messages from today show just the time, older ones also show the date
    if (date.toDateString() === new Date().toDateString()) { // Compare calendar dates, ignoring the time of day.
        return time; // Today's messages need only display the time.
    }
    return `${date.toLocaleDateString([], { day: "numeric", month: "short" })}, ${time}`; // Older messages include a short date too.
};

const seenKeys = new Set(); // Combined sender/time/text keys prevent duplicate rendering.
const pendingMine = []; // Locally shown outgoing messages awaiting the server's copy.

// ---------- keep the chat pinned to the newest message ----------
let stickToBottom = true;

// Moves the message list to its newest message.
const scrollToBottom = function () {
    chatLog.scrollTop = chatLog.scrollHeight;
};

// Tracks whether the reader is near the bottom before the chat list scrolls.
chatLog.addEventListener("scroll", () => {
    stickToBottom = chatLog.scrollHeight - chatLog.scrollTop - chatLog.clientHeight < 40;
});

// Keeps the newest message visible after the chat list changes size.
new ResizeObserver(() => {
    if (stickToBottom) scrollToBottom();
}).observe(chatLog);

// Creates and displays a chat bubble, optionally scrolling down to the newest message.
const addMessage = function (from, text, time, scrollToLatest = false) {
    const isMine = from === myName; // Determines which side/color to use for this message bubble.

    const bubble = document.createElement("div"); // Create the outer message bubble.
    bubble.className = "chatMessage " + (isMine ? "mine" : "theirs"); // Add the CSS class for the sender's side.

    const meta = document.createElement("div"); // Container for sender name and timestamp.
    meta.className = "chatMeta"; // Applies metadata layout styles.

    const sender = document.createElement("span"); // Create the sender label.
    sender.className = "chatSender"; // Applies sender text styling.
    sender.textContent = from; // Use textContent so sender data is displayed as text, not HTML.

    const timeEl = document.createElement("span"); // Create the timestamp label.
    timeEl.className = "chatTime"; // Applies timestamp styling.
    timeEl.textContent = formatTime(time); // Display a formatted timestamp.

    const body = document.createElement("div"); // Create the message text container.
    body.className = "chatText"; // Applies wrapping and alignment styles.
    body.textContent = text; // Display message content safely as plain text.

    meta.append(sender, timeEl); // Put sender and time together above the message text.
    bubble.append(meta, body); // Put the metadata and message text inside the bubble.
    chatLog.append(bubble); // Add the completed bubble to the visible conversation.
    if (scrollToLatest) { // Scroll only when a local send requests it.
        // Wait for layout so the scroll position includes the new bubble's full height.
       stickToBottom = true;
    scrollToBottom();                        // immediately
    requestAnimationFrame(scrollToBottom);   // again once layout has settled
    }
    
    return { bubble, timeEl }; // Return elements so callers can later update this message's timestamp.
};

// ---------- random avatar animations ----------
const avatarAnimations = [ // CSS animation classes available for message-triggered reactions.
    "anim-hop", "anim-sway", "anim-drift", "anim-squish",
    "anim-shake", "anim-heartbeat", "anim-flash", "anim-glow"
];

let lastAnimation = ""; // Remembers the last effect so it is not repeated immediately.

// Plays a randomly selected avatar animation different from the previous one.
const playRandomAvatarAnimation = function () {
    // pick a random one, but never the same as last time
    // The filter callback removes the animation that played most recently.
    let choices = avatarAnimations.filter((name) => name !== lastAnimation); // Exclude the previous effect from this random selection.
    let chosen = choices[Math.floor(Math.random() * choices.length)]; // Choose an available effect at random.
    lastAnimation = chosen; // Save this choice to avoid repeating it next time.

    // clear any animation still running, then restart
    partnerAvatar.classList.remove(...avatarAnimations); // Clear any animation class that might still be active.
    void partnerAvatar.offsetWidth; // Force layout so re-adding a class restarts its CSS animation.
    partnerAvatar.classList.add(chosen); // Start the chosen animation.

    // Removes the temporary animation class after the animation finishes.
    partnerAvatar.addEventListener("animationend", () => {
        partnerAvatar.classList.remove(chosen); // Return to the normal idle animation after the effect ends.
    }, { once: true });
};

// ---------- receiving ----------
let firstLoad = true; // Marks the initial history fetch so old messages do not trigger reactions.

// Fetches chat history/new messages, adds unseen messages, and refreshes the avatar fade.
const getMessages = async function() {
    try {
        let URL = `https://messengerbackend-beta.vercel.app/api/messages?room=partnercheckin`; // Endpoint for this conversation's message history.
        let response = await fetch(URL); // Request the current messages from the server.
        let results = await response.json(); // Parse the response body as JSON.

        if (Array.isArray(results)) { // Continue only when the response has the expected list shape.
            const isInitialLoad = firstLoad; // Keep the initial-load state for this batch.

            // oldest first, whatever order the server returns them in
            // The comparator orders messages by their timestamp.
            results.sort((a, b) => (a.time || 0) - (b.time || 0)); // Render messages chronologically; treat missing timestamps as zero.

            let newestPartnerTime = 0; // Track the newest incoming partner message for the avatar fade.

            for (const message of results) { // Process each server message in chronological order.
                if (message.from !== myName) { // Count partner messages as activity, not this user's echoed messages.
                    newestPartnerTime = Math.max(newestPartnerTime, message.time || 0); // Keep the newest timestamp from the partner.
                }

                const key = `${message.from}|${message.time}|${message.text}`; // Build a stable key from sender, time, and content.
                if (seenKeys.has(key)) continue; // Ignore messages already rendered in an earlier poll.
                seenKeys.add(key); // Mark this message so later polls will skip it.

                // one of mine that I already showed locally: just fix its time
                if (message.from === myName) { // Check whether the server is echoing a message shown optimistically.
                    // Locate the local pending bubble corresponding to this server echo.
                            const index = pendingMine.findIndex((p) => p.text === message.text); // Find the locally displayed copy by its text.
                    if (index !== -1) { // If found, update it instead of rendering a duplicate.
                        pendingMine[index].timeEl.textContent = formatTime(message.time); // Replace its temporary local time with server time.
                        pendingMine.splice(index, 1); // Remove the acknowledged message from the pending list.
                        continue; // This message is already visible, so skip bubble creation.
                    }
                }

                addMessage(message.from, message.text, message.time); // Render an unseen incoming or historical message.

                // a new message from my partner (not history)
                if (!firstLoad && message.from !== myName) { // Only new partner messages trigger reactions, not history.
                    playRandomAvatarAnimation(); // Animate the partner avatar for the new message.
                }
            }

            if (isInitialLoad) { // Position the conversation at the newest message on page load.
                // After loading history, position the chat at its newest message.
                requestAnimationFrame(() => {
                    chatLog.scrollTop = chatLog.scrollHeight - chatLog.clientHeight; // Scroll to the bottom edge after bubbles are laid out.
                });
            }

            // the avatar's fade restarts from my partner's latest message
            if (newestPartnerTime && (firstLoad || newestPartnerTime > lastActivityTime)) { // Reset fading when a newer partner message is found.
                lastActivityTime = newestPartnerTime; // Use the partner message's timestamp as the activity time.
                updateAvatarFade(); // Immediately apply the updated opacity.
            }

            firstLoad = false; // Future polls are incremental, not history loads.
        }

        console.log(results); // Log the response for development/debugging.
    } catch (error) {
        console.log("Could not fetch messages yet:", error); // Report fetch/JSON errors without stopping future polling.
    }
};

// ---------- sending ----------
// Displays the message immediately, then posts it to the shared chat service.
const sendMessage = async function() {
    const text = messageInput.value.trim(); // Remove surrounding whitespace before sending.
    if (text === "") return; // Do not send empty or whitespace-only messages.

    if (!hasNames) {
        messageInput.value = ""; // Clear text that cannot be sent until names are configured.
        autoGrow(); // Resize the now-empty text field.
        messageInput.focus(); // Keep the cursor in the field so the user can continue after settings.
        return; // Stop here because both names are required.
    }

    // Add the bubble immediately so the interface responds before the network request finishes.
    const shown = addMessage(myName, text, Date.now(), true); // Show immediately and scroll to the latest message.
    pendingMine.push({ text: text, timeEl: shown.timeEl }); // Track this bubble until the server confirms it.

    // Treat sending as activity so the avatar becomes visible and reacts.
    lastActivityTime = Date.now(); // Treat a local send as recent avatar activity.
    updateAvatarFade(); // Restore the avatar's opacity.
    playRandomAvatarAnimation(); // Play an animation in response to sending.

    messageInput.value = ""; // Clear the text after it has been displayed locally.
    autoGrow(); // Shrink the input back to its empty height.

    try {
        await fetch(`https://messengerbackend-beta.vercel.app/api/messages`, { // Send the new message to the backend service.
            method: "POST", // POST creates a new message on the server.
            headers: { "Content-Type": "application/json" }, // Tell the server that the request body is JSON.
            body: JSON.stringify({ // Serialize the message fields into the request body.
                room: "partnercheckin", // Identify the shared conversation.
                from: myName, // Include the sender's display name.
                text: text // Include the message text.
            })
        });
    } catch (error) {
        console.log("Could not send message yet:", error); // Report a network error; the local bubble remains visible.
    }
};

sendMessageButton.addEventListener("click", sendMessage); // Send when the user presses the Send button.

// Sends on Enter while preserving Shift+Enter for a newline.
messageInput.addEventListener("keydown", (e) => { // Handle keyboard submission from the message field.
    if (e.key === "Enter" && !e.shiftKey) { // Enter sends; Shift+Enter remains available for a newline.
        e.preventDefault(); // Prevent Enter from inserting a newline when it sends.
        sendMessage(); // Run the same send flow as the button.
    }
});

// ---------- avatar (light or dark version) ----------
const savedPartnerAvatar = localStorage.getItem("partnerAvatar"); // Load the avatar path selected in Settings.
if (savedPartnerAvatar) { // Leave the HTML default in place if no choice was saved.
    const isDark = document.documentElement.getAttribute("data-theme") === "dark"; // Check which theme is active now.
    partnerAvatar.src = isDark // Choose a dark image variant only for dark mode.
        ? savedPartnerAvatar.replace("images/NonBinary", "images/DarkModeNonBinary") // Convert the saved light asset path to its dark equivalent.
        : savedPartnerAvatar; // Otherwise use the saved light-theme asset.
}

// ---------- timers ----------
getMessages(); // Load chat history immediately instead of waiting for the first poll.
let getMessageTimer = setInterval(getMessages, 5000); // Check for new messages every five seconds.
let avatarFadeTimer = setInterval(updateAvatarFade, 1000); // Recalculate avatar opacity once per second.

// ---------- keep the layout inside the visible screen (keyboard open or closed for iPhone) ----------
// Fits the fixed app panel to the visible viewport, including changes from the phone keyboard.
const fitToVisibleScreen = function () {
    const vv = window.visualViewport; // The portion of the page currently visible, excluding a mobile keyboard.
    if (!vv) return; // Older browsers without Visual Viewport keep their CSS fallback sizes.
    document.documentElement.style.setProperty("--app-height", vv.height + "px"); // Pass visible height to the fixed app layout.
    document.documentElement.style.setProperty("--app-top", vv.offsetTop + "px"); // Pass visible viewport offset to the fixed app layout.
};

if (window.visualViewport) { // Register viewport listeners only when the browser supports them.
    window.visualViewport.addEventListener("resize", fitToVisibleScreen); // Refit when keyboard or orientation changes viewport height.
    window.visualViewport.addEventListener("scroll", fitToVisibleScreen); // Refit when the visual viewport shifts vertically.
}
fitToVisibleScreen(); // Apply correct dimensions immediately on page load.

// ---------- phone: hide the avatar while typing, so the messages get the space ----------
const phoneQuery = window.matchMedia("(max-width: 600px)"); // Detect whether the narrow-phone layout applies.
let messageInputFocused = document.activeElement === messageInput; // Record whether the composer is initially focused.
let largestViewportHeight = window.visualViewport?.height ?? window.innerHeight; // Store a baseline height for detecting keyboard shrinkage.

// Uses viewport shrinkage and input focus to detect when the phone keyboard is open.
const updateTypingLayout = function () {
    const viewportHeight = window.visualViewport?.height ?? window.innerHeight; // Use visible height where supported, otherwise the window height.
    largestViewportHeight = Math.max(largestViewportHeight, viewportHeight); // Preserve the largest observed height as the keyboard-closed baseline.

    const keyboardIsOpen = // Compact layout requires all three conditions below.
        phoneQuery.matches && // The device is using the phone-width layout.
        messageInputFocused && // The user is interacting with the message field.
        largestViewportHeight - viewportHeight > 100; // The viewport has shrunk enough to indicate an open keyboard.
    document.documentElement.classList.toggle("typing", keyboardIsOpen); // Add/remove the CSS class that activates compact layout.

    if (keyboardIsOpen && logo.parentElement !== header) { // Move the existing logo into the header while typing.
        header.prepend(logo); // Reuse the logo in the header instead of creating a second one.
    } else if (!keyboardIsOpen && logo.parentElement !== partnerSection) {
        partnerSection.prepend(logo); // Restore the logo above the avatar when the keyboard closes.
    }
};

messageInput.addEventListener("focus", () => { // Enter compact layout when focus and keyboard state require it.
    // Marks the field focused, then updates the phone's keyboard layout.
    messageInputFocused = true;
    updateTypingLayout();
});

messageInput.addEventListener("blur", () => { // Restore the normal layout when the message field loses focus.
    // Restores the normal phone layout when the field loses focus.
    messageInputFocused = false;
    updateTypingLayout();
});

window.visualViewport?.addEventListener("resize", updateTypingLayout); // Update the compact layout when the keyboard resizes the viewport.
phoneQuery.addEventListener("change", updateTypingLayout); // Re-evaluate when the window crosses the phone-width breakpoint.
updateTypingLayout(); // Set the correct initial compact/normal layout.

// tapping Send shouldn't take focus from the text box, otherwise the keyboard closes
// mid-tap and the layout jumps (the keyboard now stays open after sending, like a normal chat app)
sendMessageButton.addEventListener("mousedown", (e) => e.preventDefault()); // Keep the text field focused while tapping Send so the keyboard stays open.