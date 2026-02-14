// =============================================
//  WebRTC + SignalR — Consultation Room Logic
// =============================================

// DOM References
const remoteVideo = document.getElementById("remoteVideo");
const localVideo = document.getElementById("localVideo");
const chatMessages = document.getElementById("chatMessages");
const messageInput = document.getElementById("messageInput");
const btnSendMessage = document.getElementById("btnSendMessage");
const btnEndCall = document.getElementById("btnEndCall");
const btnToggleAudio = document.getElementById("btnToggleAudio");
const btnToggleVideo = document.getElementById("btnToggleVideo");
const connectionDot = document.getElementById("connectionDot");
const sessionTimerEl = document.getElementById("sessionTimer");
const remotePlaceholder = document.getElementById("remoteVideoPlaceholder");

// Tab switching
const tabChat = document.getElementById("tabChat");
const tabNotes = document.getElementById("tabNotes");
const chatPanel = document.getElementById("chatPanel");
const notesPanel = document.getElementById("notesPanel");
const unreadCountEl = document.getElementById("unreadCount");

let unreadMessages = 0;

tabChat.addEventListener("click", () => {
    tabChat.classList.add("active");
    tabNotes?.classList.remove("active");
    chatPanel.style.display = "flex";
    notesPanel.style.display = "none";
    unreadMessages = 0;
    unreadCountEl.style.display = "none";
});

tabNotes?.addEventListener("click", () => {
    tabNotes.classList.add("active");
    tabChat.classList.remove("active");
    notesPanel.style.display = "flex";
    chatPanel.style.display = "none";
});

// Session Timer
let sessionSeconds = 0;
function updateSessionTimer() {
    sessionSeconds++;
    const hrs = String(Math.floor(sessionSeconds / 3600)).padStart(2, "0");
    const mins = String(Math.floor((sessionSeconds % 3600) / 60)).padStart(2, "0");
    const secs = String(sessionSeconds % 60).padStart(2, "0");
    sessionTimerEl.innerText = `${hrs}:${mins}:${secs}`;
}
setInterval(updateSessionTimer, 1000);

// Modal helpers
function showModal(title, body) {
    document.getElementById("modalTitle").innerText = title;
    document.getElementById("modalBody").innerText = body;
    document.getElementById("customModalBackdrop").style.display = "flex";
}

document.getElementById("modalOkBtn").addEventListener("click", () => {
    document.getElementById("customModalBackdrop").style.display = "none";
});

function showConfirm(title, body) {
    return new Promise((resolve) => {
        document.getElementById("confirmTitle").innerText = title;
        document.getElementById("confirmBody").innerText = body;
        document.getElementById("confirmModalBackdrop").style.display = "flex";

        document.getElementById("confirmOkBtn").onclick = () => {
            document.getElementById("confirmModalBackdrop").style.display = "none";
            resolve(true);
        };
        document.getElementById("confirmCancelBtn").onclick = () => {
            document.getElementById("confirmModalBackdrop").style.display = "none";
            resolve(false);
        };
    });
}

// WebRTC Variables
let localStream;
let peerConnection;
const configuration = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };

// SignalR Connection
const connection = new signalR.HubConnectionBuilder()
    .withUrl(`${API_BASE_URL}/telemedicineHub?access_token=${TOKEN}`)
    .withAutomaticReconnect()
    .build();

async function start() {
    try {
        localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localVideo.srcObject = localStream;

        await connection.start();
        console.log("SignalR connected.");

        connectionDot.classList.add("connected");
        connectionDot.title = "Connected";

        await connection.invoke("JoinRoom", ROOM_ID);
        // Load chat history on join/rejoin
        await connection.invoke("GetChatHistory", ROOM_ID);
    } catch (err) {
        console.error("Connection failed:", err);
        connectionDot.classList.add("failed");
        connectionDot.title = "Connection failed";
        showModal("Connection Error", "Could not connect to the consultation room. Please check your internet connection and try again.");
    }
}

// SignalR events
connection.on("UserJoined", async (userId) => {
    console.log("User joined:", userId);
    if (remotePlaceholder) remotePlaceholder.style.display = "none";
    await createOffer();
});

connection.on("ReceiveSignal", async (userId, type, payload) => {
    const data = JSON.parse(payload);

    if (type === "offer") {
        createPeerConnection();
        await peerConnection.setRemoteDescription(new RTCSessionDescription(data));
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        await connection.invoke("SendSignal", ROOM_ID, "answer", JSON.stringify(answer));
    } else if (type === "answer") {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(data));
    } else if (type === "ice-candidate") {
        await peerConnection.addIceCandidate(new RTCIceCandidate(data));
    }
});

connection.on("ReceiveMessage", (senderId, message, fileUrl, timestamp) => {
    appendMessage(senderId, message, fileUrl, timestamp);
});

connection.on("ReceiveHistory", (messages) => {
    // Clear empty state
    const emptyState = chatMessages.querySelector(".chat-empty-state");
    if (emptyState) emptyState.remove();

    messages.forEach(msg => {
        appendMessage(msg.senderId, msg.message, msg.fileUrl, msg.timestamp, msg.senderName);
    });
});

connection.on("SessionEnded", () => {
    showModal("Consultation Ended", "The session has ended. You will be redirected to your dashboard.");
    setTimeout(() => window.location.href = "/Dashboard", 3000);
});

// Chat Logic
function appendMessage(senderId, message, fileUrl, timestamp, senderName) {
    // Remove empty state on first message
    const emptyState = chatMessages.querySelector(".chat-empty-state");
    if (emptyState) emptyState.remove();

    const isMe = senderId.toString() === CURRENT_USER_ID;
    const div = document.createElement("div");
    div.classList.add("message-bubble", isMe ? "message-sent" : "message-received");

    const time = new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    let html = "";
    if (!isMe) {
        const name = senderName || `User ${senderId}`;
        html += `<span class="message-sender">${name}</span>`;
    }
    html += `<span>${message}</span>`;
    if (fileUrl) {
        html += `<br/><a href="${fileUrl}" target="_blank" style="color:inherit; opacity:0.8;"><i class="bi bi-file-earmark"></i> Attachment</a>`;
    }
    html += `<div class="message-meta">${time}</div>`;

    div.innerHTML = html;
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    // Unread badge if on Notes tab & not my message
    if (!isMe && notesPanel.style.display !== "none") {
        unreadMessages++;
        unreadCountEl.innerText = unreadMessages;
        unreadCountEl.style.display = "inline";
    }
}

// WebRTC Logic
function createPeerConnection() {
    peerConnection = new RTCPeerConnection(configuration);

    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            connection.invoke("SendSignal", ROOM_ID, "ice-candidate", JSON.stringify(event.candidate));
        }
    };

    peerConnection.ontrack = (event) => {
        remoteVideo.srcObject = event.streams[0];
        if (remotePlaceholder) remotePlaceholder.style.display = "none";
    };

    localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStream);
    });
}

async function createOffer() {
    createPeerConnection();
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    await connection.invoke("SendSignal", ROOM_ID, "offer", JSON.stringify(offer));
}

// Send message
async function sendMessage() {
    const msg = messageInput.value.trim();
    if (!msg) return;
    try {
        await connection.invoke("SendMessage", ROOM_ID, msg, null);
        messageInput.value = "";
    } catch (e) {
        console.error("Send failed:", e);
        showModal("Error", "Failed to send message. Please try again.");
    }
}

btnSendMessage.addEventListener("click", sendMessage);
messageInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendMessage();
});

// End call
// End call
btnEndCall.addEventListener("click", async () => {
    try {
        console.log("End Call clicked. IS_DOCTOR:", IS_DOCTOR);
        if (IS_DOCTOR) {
            const confirmed = await safeShowConfirm(
                "End Consultation?",
                "Are you sure you want to end this consultation? This action cannot be undone and will close the room for everyone."
            );
            if (confirmed) {
                console.log("Invoking EndSession");
                await connection.invoke("EndSession", ROOM_ID);
            }
        } else {
            const confirmed = await safeShowConfirm(
                "Leave Room?",
                "Are you sure you want to leave the room? You can rejoin later as long as the doctor is still here."
            );
            if (confirmed) {
                window.location.href = "/Dashboard";
            }
        }
    } catch (e) {
        console.error("End Call error:", e);
        if (confirm("Action failed. Force leave?")) window.location.href = "/Dashboard";
    }
});

// Helper for confirm
async function safeShowConfirm(title, body) {
    try {
        if (typeof showConfirm === 'function') {
            return await showConfirm(title, body);
        }
    } catch (e) {
        console.error("Custom confirm failed", e);
    }
    return confirm(title + "\n" + body);
}

// Toggle Audio
btnToggleAudio.addEventListener("click", () => {
    const audioTrack = localStream.getAudioTracks()[0];
    if (!audioTrack) return;
    audioTrack.enabled = !audioTrack.enabled;
    const icon = btnToggleAudio.querySelector("i");
    btnToggleAudio.classList.toggle("active", !audioTrack.enabled);
    icon.className = audioTrack.enabled ? "bi bi-mic-fill" : "bi bi-mic-mute-fill";
});

// Toggle Video
btnToggleVideo.addEventListener("click", () => {
    const videoTrack = localStream.getVideoTracks()[0];
    if (!videoTrack) return;
    videoTrack.enabled = !videoTrack.enabled;
    const icon = btnToggleVideo.querySelector("i");
    btnToggleVideo.classList.toggle("active", !videoTrack.enabled);
    icon.className = videoTrack.enabled ? "bi bi-camera-video-fill" : "bi bi-camera-video-off-fill";
});

// Initialize
start();
