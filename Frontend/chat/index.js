/**
 * EDU_SA_V2 - ADVANCED CHAT SYSTEM CORE
 * VERSION: 2.1.4 (INSTRUCTOR UPGRADE)
 * FEATURES: REPLIES, REACTIONS, DYNAMIC WAVEFORMS, PROFESSIONAL MODALS, GROUP MANAGEMENT
 * UPGRADE: FULL INSTRUCTOR GROUP CREATION AND MEMBER MANAGEMENT LOGIC
 */

// --- 1. DYNAMIC UI STYLES ---
const contextMenuStyle = document.createElement('style');
contextMenuStyle.innerHTML = `
    /* Context Menu & Interactions */
    .custom-context-menu {
        position: fixed; background: #ffffff; border-radius: 12px;
        box-shadow: 0 10px 25px rgba(0,0,0,0.15); z-index: 10000;
        padding: 8px; min-width: 200px; border: 1px solid #eaeaea;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        animation: menuFadeIn 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }
    @keyframes menuFadeIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
    
    .reaction-bar { display: flex; justify-content: space-around; padding: 10px 5px; border-bottom: 1px solid #f5f5f5; margin-bottom: 6px; }
    .reaction-btn { cursor: pointer; font-size: 22px; transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
    .reaction-btn:hover { transform: scale(1.5); }
    
    .menu-item { padding: 12px 14px; cursor: pointer; font-size: 14px; color: #444; border-radius: 8px; display: flex; align-items: center; gap: 12px; transition: all 0.2s; }
    .menu-item:hover { background: #f8f9fa; color: #007bff; }
    .menu-item i { width: 18px; text-align: center; color: #6c757d; }
    .menu-item-delete { color: #dc3545 !important; }
    .menu-item-delete:hover { background: #fff5f5 !important; }

    /* Messaging UI Elements */
    #replyPreview { 
        display: none; background: #ffffff; border-left: 5px solid #007bff; 
        padding: 12px 15px; margin: 10px; border-radius: 8px; position: relative; 
        font-size: 13px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        border: 1px solid #eee; border-left-width: 5px;
    }
    #replyPreview .close-reply { position: absolute; right: 10px; top: 10px; cursor: pointer; color: #adb5bd; font-size: 18px; }
    #replyPreview strong { color: #007bff; display: block; margin-bottom: 3px; }

    .unread-badge { 
        background-color: #25D366; color: white; font-size: 11px; font-weight: 700; 
        min-width: 20px; height: 20px; border-radius: 50%; display: flex; 
        align-items: center; justify-content: center; box-shadow: 0 2px 4px rgba(37, 211, 102, 0.3);
    }

    /* Voice Note Player Styles */
    .custom-vn-player { 
        display: flex; align-items: center; gap: 12px; background: #f1f3f4; 
        padding: 8px 16px; border-radius: 30px; min-width: 220px; 
        transition: background 0.3s;
    }
    .vn-play-btn { 
        background: #007bff; color: #fff; border: none; width: 36px; height: 36px; 
        border-radius: 50%; cursor: pointer; display: flex; align-items: center; 
        justify-content: center; box-shadow: 0 4px 6px rgba(0,123,255,0.2);
    }
    .vn-waves { display: flex; align-items: center; gap: 3px; height: 28px; flex-grow: 1; }
    .wave-bar { width: 3px; background: #ced4da; border-radius: 4px; transition: height 0.2s ease-in-out; }
    .wave-bar.active { background: #007bff; animation: wave-pulse 1.2s infinite ease-in-out; }
    @keyframes wave-pulse { 0%, 100% { transform: scaleY(1); } 50% { transform: scaleY(1.8); } }

    /* Professional Modal Overlays */
    #addMemberModal, #createGroupModal, #viewMembersModal {
        display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(15, 23, 42, 0.65); backdrop-filter: blur(8px);
        justify-content: center; align-items: center; z-index: 11000;
        transition: all 0.3s ease;
    }
    .modal-content { 
        background: #fff; padding: 30px; border-radius: 20px; width: 95%; max-width: 450px; 
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); transform: translateY(0);
        animation: modalSlideUp 0.3s ease-out;
    }
    @keyframes modalSlideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    
    .modal-header { font-size: 22px; font-weight: 800; margin-bottom: 20px; color: #1a1a1a; display: flex; align-items: center; gap: 12px; }
    .modal-footer { display: flex; justify-content: flex-end; gap: 12px; margin-top: 25px; }
    
    .btn-modal { padding: 12px 24px; border-radius: 10px; font-weight: 600; cursor: pointer; border: none; transition: all 0.2s; font-size: 15px; }
    .btn-close { background: #f8f9fa; color: #495057; }
    .btn-close:hover { background: #e9ecef; }
    .btn-primary { background: #007bff; color: #fff; box-shadow: 0 4px 6px rgba(0,123,255,0.15); }
    .btn-primary:hover { background: #0056b3; transform: translateY(-1px); }

    .modal-input { 
        width: 100%; padding: 14px; border: 2px solid #edf2f7; border-radius: 12px; 
        margin-bottom: 15px; outline: none; transition: border-color 0.2s; font-size: 16px;
    }
    .modal-input:focus { border-color: #007bff; background: #fff; }

    .create-group-btn { 
        width: 100%; padding: 15px; background: #f0f7ff; color: #007bff; 
        border: 2px dashed #b2d7ff; border-radius: 12px; font-weight: 700; 
        margin-bottom: 20px; cursor: pointer; transition: all 0.2s; display: flex;
        align-items: center; justify-content: center; gap: 10px;
    }
    .create-group-btn:hover { background: #007bff; color: #fff; border-style: solid; }

    /* Group Header Action Buttons */
    .group-header-actions { display: flex; gap: 8px; margin-left: auto; }
    .action-pill { 
        background: #f1f3f4; padding: 6px 12px; border-radius: 20px; 
        font-size: 12px; font-weight: 600; cursor: pointer; color: #5f6368;
        border: 1px solid #dadce0; transition: all 0.2s;
    }
    .action-pill:hover { background: #007bff; color: #fff; border-color: #007bff; }

    .member-list-item { 
        display: flex; align-items: center; gap: 10px; padding: 10px; 
        border-bottom: 1px solid #f1f1f1; 
    }
`;
document.head.appendChild(contextMenuStyle);

// --- 2. GLOBAL CONSTANTS & CONFIG ---
const BASE_URL = "http://127.0.0.1:8181";
const CHAT_API = `${BASE_URL}/chat_messages`;
const WS_URL = `ws://127.0.0.1:8181/chat_messages/ws`;

// --- 3. APPLICATION STATE ---
let selectedUserId = null;
let selectedGroupId = null;
let selectedCommunityId = null;
let socket = null;
let chatMode = "one-to-one"; 
let voiceBlob = null;
let currentTargetGroupId = null;
let replyData = null;

// Audio context state
let audioContext = null;
let analyser = null;
let dataArray = null;
let animationId = null;
let mediaRecorder = null;
let audioChunks = [];
let recordingInterval = null;

// --- 4. CORE UTILITIES ---
const safeText = (val) => {
    if (val === null || val === undefined) return "";
    return String(val).trim();
};

const getAuthHeaders = () => ({
    "Content-Type": "application/json",
    "Authorization": `Bearer ${localStorage.getItem("access_token")}`
});

const getCurrentUser = () => {
    const raw = localStorage.getItem("loggedInUser");
    if (!raw) return null;
    try {
        const parsed = JSON.parse(raw);
        return parsed.user ? parsed.user : parsed;
    } catch (e) { return null; }
};

async function refreshAccessToken() {
    console.log("[Auth] Attempting token refresh...");
    try {
        const refreshToken = localStorage.getItem("refresh_token");
        if (!refreshToken) throw new Error("No refresh token");

        const response = await fetch(`${BASE_URL}/auth/refresh`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refresh_token: refreshToken })
        });

        if (response.ok) {
            const data = await response.json();
            localStorage.setItem("access_token", data.access_token);
            return data.access_token;
        }
        throw new Error("Refresh failed");
    } catch (err) {
        console.error("[Auth] Session expired.");
        localStorage.clear();
        window.location.href = "/login.html";
        return null;
    }
}

// --- 5. CORE WEBSOCKET LOGIC ---
function connectWebSocket(userId) {
    if (socket) {
        console.log("[WS] Closing existing connection...");
        socket.close();
    }

    console.log(`[WS] Connecting for user ${userId}...`);
    socket = new WebSocket(`${WS_URL}/${userId}`);

    socket.onopen = () => console.log("[WS] Connection established.");

    socket.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            console.log("[WS] Received:", data.type);
            
            const currentTarget = selectedUserId || selectedGroupId || "community";
            
            const isPersonalMsg = chatMode === "one-to-one" && data.sender_id === selectedUserId;
            const isGroupMsg = chatMode === "group" && data.group_id === selectedGroupId;
            const isCommunityMsg = chatMode === "community" && data.type.includes("community");
            const isUpdate = data.type === "new_reaction" || data.type === "delete_message";

            if (isPersonalMsg || isGroupMsg || isCommunityMsg || isUpdate) {
                loadConversation(currentTarget);
            }
            loadRecentChats();
        } catch (e) {
            console.error("[WS] Message error:", e);
        }
    };

    socket.onclose = (e) => {
        console.log("[WS] Disconnected. Reconnecting in 3s...");
        setTimeout(() => connectWebSocket(userId), 3000);
    };

    socket.onerror = (err) => console.error("[WS] Error:", err);
}

// --- 6. VOICE NOTE ENGINE ---
async function toggleVoiceRecording() {
    const btn = document.getElementById("chatVoiceBtn");
    if (!mediaRecorder || mediaRecorder.state === "inactive") {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(stream);
            audioChunks = [];
            
            mediaRecorder.ondataavailable = e => audioChunks.push(e.data);
            mediaRecorder.onstop = async () => {
                voiceBlob = new Blob(audioChunks, { type: 'audio/webm' });
                await handleSendMessage();
            };
            
            mediaRecorder.start();
            btn.innerHTML = `<i class="fas fa-stop"></i>`;
            btn.style.color = "red";
        } catch (err) { alert("Microphone access denied."); }
    } else {
        mediaRecorder.stop();
        btn.innerHTML = `<i class="fas fa-microphone"></i>`;
        btn.style.color = "";
    }
}

function playVoice(url, btn) {
    let audio = btn.audio;
    const waveContainer = btn.parentElement.querySelector('.vn-waves');
    
    if (!audio) {
        audio = new Audio(url);
        btn.audio = audio;
        
        waveContainer.innerHTML = '';
        const barCount = 25;
        for (let i = 0; i < barCount; i++) {
            const bar = document.createElement('div');
            bar.className = 'wave-bar';
            bar.style.height = (6 + Math.random() * 16) + 'px';
            waveContainer.appendChild(bar);
        }

        audio.onplay = () => {
            btn.innerHTML = '<i class="fas fa-pause"></i>';
            waveContainer.querySelectorAll('.wave-bar').forEach((bar, idx) => {
                bar.classList.add('active');
                bar.style.animationDelay = (idx * 0.04) + 's';
            });
        };

        audio.onpause = () => {
            btn.innerHTML = '<i class="fas fa-play"></i>';
            waveContainer.querySelectorAll('.wave-bar').forEach(bar => bar.classList.remove('active'));
        };

        audio.onended = () => {
            btn.innerHTML = '<i class="fas fa-play"></i>';
            waveContainer.querySelectorAll('.wave-bar').forEach(bar => bar.classList.remove('active'));
        };
    }

    if (audio.paused) {
        document.querySelectorAll('audio').forEach(a => a.pause());
        audio.play();
    } else {
        audio.pause();
    }
}

// --- 7. MESSAGE HANDLING & API ---
async function handleSendMessage() {
    const chatInput = document.getElementById("chatInput");
    const chatImageInput = document.getElementById("chatImageInput");
    const chatVoiceBtn = document.getElementById("chatVoiceBtn");
    const me = getCurrentUser();

    const hasText = chatInput.value && chatInput.value.trim().length > 0;
    const hasVoice = voiceBlob !== null;
    const hasImage = chatImageInput?.files && chatImageInput.files[0];

    if (!hasText && !hasVoice && !hasImage) return;

    let messageType = "text";
    let imageUrl = null;
    let voiceUrl = null;

    try {
        if (hasImage) {
            messageType = "image";
            imageUrl = await fileToBase64(chatImageInput.files[0]);
        } else if (hasVoice) {
            messageType = "voice";
            voiceUrl = await blobToBase64(voiceBlob);
        }

        let messageText = chatInput.value.trim() || null;
        
        if (replyData) {
            messageText = `[Replying to ${replyData.name}: ${replyData.text}] ${messageText || ""}`;
            closeReplyPreview();
        }

        let endpoint = "";
        const payload = { 
            school_id: parseInt(me.school_id || 0),
            message: messageText,
            message_type: messageType,
            image_url: imageUrl,
            voice_note_url: voiceUrl
        };

        if (chatMode === "one-to-one") {
            endpoint = `${CHAT_API}/`;
            payload.receiver_id = selectedUserId;
        } else if (chatMode === "group") {
            endpoint = `${CHAT_API}/groups/${selectedGroupId}/messages`;
            payload.group_id = selectedGroupId;
        } else {
            if (me.role?.toLowerCase() !== "instructor") return alert("Restricted to instructors.");
            endpoint = `${CHAT_API}/community`;
        }

        let response = await fetch(endpoint, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            chatInput.value = "";
            voiceBlob = null;
            if (chatImageInput) chatImageInput.value = null;
            chatVoiceBtn.innerHTML = `<i class="fas fa-microphone"></i>`;
            chatVoiceBtn.style.color = "";
            
            const currentId = selectedUserId || selectedGroupId || "community";
            loadConversation(currentId);
            loadRecentChats();
        }
    } catch (err) { console.error("[Chat] Send failure:", err); }
}

function renderMessages(messages) {
    const chatBox = document.getElementById("chatBox");
    if (!chatBox) return;
    
    chatBox.innerHTML = "";
    const me = getCurrentUser();
    const myId = me?.id || me?.user?.id;

    messages.forEach(msg => {
        const isMe = msg.sender_id === myId;
        const div = document.createElement("div");
        div.className = `msg ${isMe ? "sent" : "received"}`;
        div.setAttribute("data-msg-id", msg.id);
        
        div.oncontextmenu = (e) => {
            e.preventDefault();
            const existing = document.querySelector(".custom-context-menu");
            if (existing) existing.remove();

            const menu = document.createElement("div");
            menu.className = "custom-context-menu";
            menu.style.left = `${e.clientX}px`;
            menu.style.top = `${e.clientY}px`;

            const reactions = document.createElement("div");
            reactions.className = "reaction-bar";
            ["❤️", "👍", "🔥", "😂", "😮"].forEach(emoji => {
                const span = document.createElement("span");
                span.className = "reaction-btn";
                span.innerText = emoji;
                span.onclick = () => { handleAddReaction(msg.id, emoji); menu.remove(); };
                reactions.appendChild(span);
            });
            menu.appendChild(reactions);

            const replyItem = document.createElement("div");
            replyItem.className = "menu-item";
            replyItem.innerHTML = `<i class="fas fa-reply"></i> Reply`;
            replyItem.onclick = () => {
                const sender = msg.sender_name || msg.sender_fullname || "User";
                const previewText = msg.message_type === "text" ? msg.message : `[${msg.message_type}]`;
                replyData = { name: sender, text: previewText };
                const previewDiv = document.getElementById("replyPreview");
                previewDiv.style.display = "block";
                previewDiv.innerHTML = `
                    <span class="close-reply" onclick="closeReplyPreview()">&times;</span>
                    <strong>Replying to ${sender}</strong>
                    <div style="color:#666; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${previewText}</div>
                `;
                document.getElementById("chatInput").focus();
                menu.remove();
            };
            menu.appendChild(replyItem);

            if (isMe) {
                const delItem = document.createElement("div");
                delItem.className = "menu-item menu-item-delete";
                delItem.innerHTML = `<i class="fas fa-trash-alt"></i> Delete Message`;
                delItem.onclick = () => { handleDeleteMessage(msg.id, chatMode); menu.remove(); };
                menu.appendChild(delItem);
            }
            document.body.appendChild(menu);
        };

        let senderNameHtml = (chatMode !== "one-to-one" && !isMe) 
            ? `<div style="font-size:11px; font-weight:bold; color:#075e54; margin-bottom:4px;">${msg.sender_name || "User"}</div>` 
            : "";

        let content = "";
        if (msg.message_type === "image") {
            content = `<img src="${msg.image_url}" class="chat-img" style="max-width:250px; border-radius:12px; cursor:pointer;" onclick="window.open(this.src)">`;
        } else if (msg.message_type === "voice") {
            content = `
                <div class="custom-vn-player">
                    <button class="vn-play-btn" onclick="playVoice('${msg.voice_note_url}', this)">
                        <i class="fas fa-play"></i>
                    </button>
                    <div class="vn-waves"></div>
                </div>`;
        } else {
            let text = safeText(msg.message);
            if (text.startsWith("[Replying to")) {
                const parts = text.split("] ");
                const replyHead = parts.shift().replace("[", "");
                const actualMsg = parts.join("] ");
                content = `
                    <div style="background:rgba(0,0,0,0.05); padding:6px 10px; border-radius:6px; font-size:12px; margin-bottom:6px; border-left:3px solid #007bff;">
                        ${replyHead}
                    </div>
                    <div class="msg-text">${actualMsg}</div>`;
            } else {
                content = `<div class="msg-text">${text}</div>`;
            }
        }

        let reactionHtml = (msg.reactions && msg.reactions.length > 0) 
            ? `<div style="margin-top:5px; display:flex; gap:3px;">${msg.reactions.map(r => `<span style="background:#fff; border-radius:10px; padding:2px 6px; font-size:11px; box-shadow:0 1px 2px rgba(0,0,0,0.1);">${r.reaction}</span>`).join("")}</div>` 
            : "";

        div.innerHTML = senderNameHtml + content + reactionHtml;
        chatBox.appendChild(div);
    });
    chatBox.scrollTop = chatBox.scrollHeight;
}

// --- 8. PROFESSIONAL GROUP & MODAL MANAGEMENT ---
async function executeGroupCreation() {
    const input = document.getElementById("newGroupNameInput");
    const name = input ? input.value.trim() : "";
    if (!name) return alert("Please enter a group name.");

    try {
        let response = await fetch(`${CHAT_API}/groups`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify({ name: name })
        });
        if (response.ok) {
            closeGroupModal();
            input.value = "";
            loadRecentChats();
        } else {
            const errData = await response.json();
            alert(errData.detail || "Failed to create group.");
        }
    } catch (err) { console.error("Group creation error:", err); }
}

function handleCreateGroup() {
    const modal = document.getElementById("createGroupModal");
    if (modal) {
        modal.style.display = "flex";
        document.getElementById("newGroupNameInput").focus();
    }
}

function closeGroupModal() {
    const modal = document.getElementById("createGroupModal");
    if (modal) modal.style.display = "none";
}

function renderUserList(items, isOneToOne) {
    const listContainer = document.getElementById("user-list");
    if (!listContainer) return;
    listContainer.innerHTML = "";

    const me = getCurrentUser();
    const isInstructor = (me?.role || "").toLowerCase() === "instructor";

    if (chatMode === "group" && isInstructor) {
        const createBtn = document.createElement("button");
        createBtn.className = "create-group-btn";
        createBtn.innerHTML = `<i class="fas fa-plus-circle"></i> Create New Group`;
        createBtn.onclick = handleCreateGroup;
        listContainer.appendChild(createBtn);
    }

    if (!Array.isArray(items) || items.length === 0) {
        listContainer.innerHTML += `<p style="text-align:center; padding:20px; color:#999;">No ${chatMode} found.</p>`;
        return;
    }

    items.forEach(u => {
        const item = document.createElement("div");
        item.className = "user-item";
        const displayName = u.fullname || u.name || "Unknown";
        const unreadCount = u.unread_count || 0;
        const badge = unreadCount > 0 ? `<span class="unread-badge">${unreadCount}</span>` : "";

        item.innerHTML = `
            <div style="display:flex; align-items:center; gap:12px; width:100%;">
                <div style="width:42px; height:42px; background:#e9ecef; border-radius:50%; display:flex; align-items:center; justify-content:center; color:#007bff; font-weight:700; font-size:16px;">
                    ${displayName.charAt(0).toUpperCase()}
                </div>
                <div style="flex:1;">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <span style="font-weight:600; color:#2d3436;">${displayName}</span>
                        ${badge}
                    </div>
                </div>
            </div>`;
        item.onclick = () => selectChat(u);
        listContainer.appendChild(item);
    });
}

// --- 9. LIFECYCLE & DOM INIT ---
document.addEventListener("DOMContentLoaded", () => {
    const me = getCurrentUser();
    if (!me) return;

    connectWebSocket(me.id || me.user?.id);

    const sendBtn = document.getElementById("chatSendBtn");
    if (sendBtn) sendBtn.onclick = handleSendMessage;
    
    const chatInput = document.getElementById("chatInput");
    if (chatInput) {
        chatInput.onkeypress = (e) => { if (e.key === "Enter") handleSendMessage(); };
    }

    const chatImageBtn = document.getElementById("chatImageBtn");
    const chatImageInput = document.getElementById("chatImageInput");
    if (chatImageBtn && chatImageInput) {
        chatImageBtn.onclick = () => chatImageInput.click();
        chatImageInput.onchange = async () => {
            if (chatImageInput.files.length > 0) await handleSendMessage();
        };
    }

    // Voice button initialization
    const chatVoiceBtn = document.getElementById("chatVoiceBtn");
    if (chatVoiceBtn) chatVoiceBtn.onclick = toggleVoiceRecording;

    const tabs = { "oneToOneTab": "one-to-one", "groupTab": "group", "communityTab": "community" };
    Object.keys(tabs).forEach(id => {
        const el = document.getElementById(id);
        if (el) el.onclick = () => switchChatMode(tabs[id]);
    });

    loadRecentChats();
    
    document.addEventListener("click", (e) => {
        const menu = document.querySelector(".custom-context-menu");
        if (menu && !menu.contains(e.target)) menu.remove();
    });

    // Binding existing modal buttons for Group Creation
    const confirmCreateBtn = document.querySelector("#createGroupModal .btn-primary");
    if(confirmCreateBtn) confirmCreateBtn.onclick = executeGroupCreation;
});

// --- 10. HELPER FUNCTIONS ---
function closeReplyPreview() {
    replyData = null;
    const preview = document.getElementById("replyPreview");
    if (preview) preview.style.display = "none";
}

function switchChatMode(mode) {
    chatMode = mode;
    selectedUserId = null;
    selectedGroupId = null;
    closeReplyPreview();
    
    // Clear header actions when switching modes
    const existingActions = document.getElementById("groupHeaderActions");
    if (existingActions) existingActions.remove();

    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    const btnId = mode === "one-to-one" ? "oneToOneTab" : (mode === "group" ? "groupTab" : "communityTab");
    document.getElementById(btnId)?.classList.add("active");

    const header = document.getElementById("activeChatPartner");
    const chatBox = document.getElementById("chatBox");

    if (mode === "community") {
        header.textContent = "School Announcements";
        document.getElementById("chatInput").disabled = false;
        document.getElementById("chatSendBtn").disabled = false;
        loadConversation("community");
    } else {
        header.textContent = "Select a conversation";
        chatBox.innerHTML = `<p style="text-align:center; padding:50px; color:#aaa;">Select a ${mode} to start.</p>`;
        document.getElementById("chatInput").disabled = true;
        document.getElementById("chatSendBtn").disabled = true;
        loadRecentChats();
    }
}

async function loadRecentChats() {
    try {
        let url = (chatMode === "group") ? `${CHAT_API}/groups` : `${CHAT_API}/recent_chats`;
        let res = await fetch(url, { headers: getAuthHeaders() });
        if (res.ok) {
            const data = await res.json();
            renderUserList(data, chatMode === "one-to-one");
        }
    } catch (e) { console.error("Recent load error:", e); }
}

async function loadConversation(id) {
    try {
        let ep = "";
        if (id === "community") ep = `${CHAT_API}/community`;
        else if (chatMode === "one-to-one") ep = `${CHAT_API}/conversation/${id}`;
        else ep = `${CHAT_API}/groups/${id}/messages`;

        const res = await fetch(ep, { headers: getAuthHeaders() });
        if (res.ok) {
            const messages = await res.json();
            renderMessages(messages);
        }
    } catch (e) { console.error("Conv load error:", e); }
}

function selectChat(u) {
    const header = document.getElementById("activeChatPartner");
    const input = document.getElementById("chatInput");
    const btn = document.getElementById("chatSendBtn");

    // Remove existing actions if any
    const existingActions = document.getElementById("groupHeaderActions");
    if (existingActions) existingActions.remove();

    if (chatMode === "one-to-one") {
        selectedUserId = u.id;
        header.textContent = u.fullname;
    } else {
        selectedGroupId = u.id;
        header.textContent = u.name;

        // Inject Group Action Buttons (Add/View Members)
        const actionContainer = document.createElement("div");
        actionContainer.id = "groupHeaderActions";
        actionContainer.className = "group-header-actions";
        actionContainer.innerHTML = `
            <div class="action-pill" onclick="openAddMemberModal()"><i class="fas fa-user-plus"></i> Add</div>
            <div class="action-pill" onclick="handleViewMembers()"><i class="fas fa-users"></i> Members</div>
        `;
        header.parentElement.appendChild(actionContainer);
    }

    if (input) input.disabled = false;
    if (btn) btn.disabled = false;

    loadConversation(u.id);
}

// Additional Modal Trigger Functions
function openAddMemberModal() {
    const modal = document.getElementById("addMemberModal");
    if (modal) modal.style.display = "flex";
}

async function executeAddMemberToGroup() {
    const emailInput = document.getElementById("addMemberEmailInput");
    const email = emailInput ? emailInput.value.trim() : "";
    if (!email) return alert("Please enter a student email.");

    try {
        // Correct endpoint for adding members
        const response = await fetch(`${CHAT_API}/groups/${selectedGroupId}/add_member_by_email`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify({ email: email })
        });
        if (response.ok) {
            alert("Member added successfully!");
            emailInput.value = "";
            document.getElementById("addMemberModal").style.display = "none";
        } else {
            const data = await response.json();
            alert(data.detail || "User not found or already in group.");
        }
    } catch (e) { alert("An error occurred."); }
}

async function handleViewMembers() {
    let modal = document.getElementById("viewMembersModal");
    if (!modal) {
        modal = document.createElement('div');
        modal.id = "viewMembersModal";
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header"><i class="fas fa-users"></i> Group Members</div>
                <div id="membersListBody" style="max-height:300px; overflow-y:auto; margin-bottom:15px;"></div>
                <div class="modal-footer">
                    <button class="btn-modal btn-close" onclick="this.closest('#viewMembersModal').style.display='none'">Close</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }
    
    const body = document.getElementById("membersListBody");
    body.innerHTML = "Loading...";
    modal.style.display = "flex";

    try {
        const res = await fetch(`${CHAT_API}/groups/${selectedGroupId}/members`, { headers: getAuthHeaders() });
        if (res.ok) {
            const members = await res.json();
            body.innerHTML = members.map(m => `
                <div class="member-list-item">
                    <div style="width:30px; height:30px; background:#eee; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:bold;">${(m.fullname || m.name || "?")[0]}</div>
                    <span>${m.fullname || m.name}</span>
                </div>
            `).join('') || "No members yet.";
        }
    } catch (e) { body.innerHTML = "Error loading members."; }
}

const fileToBase64 = (file) => new Promise((r, j) => {
    const rd = new FileReader();
    rd.readAsDataURL(file);
    rd.onload = () => r(rd.result);
    rd.onerror = j;
});

const blobToBase64 = (blob) => new Promise((r, j) => {
    const rd = new FileReader();
    rd.readAsDataURL(blob);
    rd.onloadend = () => r(rd.result);
    rd.onerror = j;
});

async function handleAddReaction(messageId, emoji) {
    try {
        // Path parameter {msg_type} for Backend
        const type = chatMode === "one-to-one" ? "personal" : chatMode;
        await fetch(`${CHAT_API}/react/${type}`, { 
            method: "POST", 
            headers: getAuthHeaders(), 
            body: JSON.stringify({ message_id: messageId, reaction: emoji }) 
        });
    } catch (e) { console.error("Reaction failed"); }
}

async function handleDeleteMessage(messageId, mode) {
    if (!confirm("Delete this message?")) return;
    try {
        // Path parameter {msg_type} for Backend delete route
        const type = mode === "one-to-one" ? "personal" : mode;
        const response = await fetch(`${CHAT_API}/delete/${type}/${messageId}`, { 
            method: "DELETE", 
            headers: getAuthHeaders() 
        });
        
        if (response.ok) {
            // OPTION A: Immediately remove from UI without waiting for WS
            const msgEl = document.querySelector(`[data-msg-id="${messageId}"]`);
            if (msgEl) msgEl.remove();
            
            // OPTION B: Refresh the conversation to ensure sync
            const currentTarget = selectedUserId || selectedGroupId || "community";
            loadConversation(currentTarget);
        }
    } catch (e) { console.error("Delete failed"); }
}

/**
 * REPLIES, REACTIONS, DYNAMIC WAVEFORMS, PROFESSIONAL MODALS, GROUP MANAGEMENT
 * VERSION: 2.1.4 (INSTRUCTOR UPGRADE)
 * END CORE SYSTEM SCRIPT

 */
