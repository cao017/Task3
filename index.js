
import express from 'express'
import { Redis } from '@upstash/redis'

const app = express()
const port = 3000

// Reads UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN from the environment.
// Locally they come from .env; on Vercel from Settings → Environment Variables.
const redis = Redis.fromEnv()

// Turn a JSON request body into req.body
app.use(express.json())




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
if ((!myName) || (!partnerName)) {
    window.location.href = "settings.html";
}

sendMessageButton.addEventListener("click", () => {
    postMessage();
});

const getMessages = async function() {
    let URL = `https://messenger-coral-xi.vercel.app/api/messages?room=partnercheckin`;
    let response = await fetch(URL);
    let results = await response.json();

    if (Array.isArray(results) && results.length > 0) {
        let fromPartner = results.filter((message) => message.from === partnerName);
        if (fromPartner.length > 0) {
            let lastMessage = fromPartner[fromPartner.length - 1];
            messageReceived.textContent = lastMessage.text;
            let timeElapsed = Date.now() - lastMessage.time;       
            if (timeElapsed < 10000) {
                avatarAnimation.style.opacity = 1;
            }
        }
    }    
    
    console.log(results);
}

const postMessage = async function() {
    
    let URL = `https://messenger-coral-xi.vercel.app/api/messages`;
    let response = await fetch(URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            room: "partnercheckin",
            from: localStorage.getItem("myName"),
            text: messageInput.value
        })
    });
    let results = await response.json();
    console.log(results);

}

const fadeAvatar = function() {
    avatarAnimation.style.opacity = avatarAnimation.style.opacity * 0.99;
};

partnerAvatar.src = localStorage.getItem("partnerAvatar");
let getMessageTimer = setInterval(getMessages, 5000);
let avatarFadeTimer = setInterval(fadeAvatar, 100);

