// -----------------------------
// channels/index.js
// -----------------------------

const CHANNELS_API_URL = "http://127.0.0.1:8181";

// --- Current user session ---
const currentUser = JSON.parse(localStorage.getItem("loggedInUser")) || { role: "student", username: "DemoUser", id: 0 };
const token = localStorage.getItem("access_token");
const role = currentUser.role ? currentUser.role.toLowerCase().trim() : "student"; 
const headers = {
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`
};

// --- Initial Load ---
window.addEventListener("DOMContentLoaded", () => {
  const root = document.getElementById("channels-root");
  if (!root) return;

  renderChannelsLayout();
  loadChannels();

  function renderChannelsLayout() {
    const canCreate = (role === "instructor" || role === "admin");
    const createBtnHtml = canCreate 
      ? `<button id="createChannelBtn" class="create-btn"><i class="fa-solid fa-circle-plus"></i> Create Channel</button>` 
      : "";

    root.innerHTML = `
      <div class="channels-container">
        <div class="channels-header">
          <h2><i class="fa-solid fa-tv"></i> Channels</h2>
          ${createBtnHtml}
        </div>
        <div class="search-wrapper" style="margin-bottom: 20px;">
            <input type="text" id="channelSearch" placeholder=" Search channels..." 
                   style="width: 100%; padding: 12px; border-radius: 8px; border: 1px solid #ddd; font-size: 14px; font-family: Arial, FontAwesome, sans-serif;">
        </div>
        <div id="joined-section">
            <h4 style="color: #666; font-size: 12px; letter-spacing: 1px; margin-bottom: 10px;">MY CHANNELS</h4>
            <div id="channels-list" class="channels-list" style="display:flex; flex-wrap: wrap; gap: 10px; margin-bottom: 30px;"></div>
        </div>
        <div id="suggested-section">
            <h4 style="color: #666; font-size: 12px; letter-spacing: 1px; margin-bottom: 10px;">DISCOVER</h4>
            <div id="suggested-list" class="channels-list" style="display:flex; flex-wrap: wrap; gap: 10px;"></div>
        </div>
        <div id="channel-view" class="hidden"></div>
      </div>
    `;

    if (canCreate) {
      document.getElementById("createChannelBtn")?.addEventListener("click", renderCreateChannelForm);
    }
    document.getElementById("channelSearch").oninput = (e) => filterChannels(e.target.value.toLowerCase());
  }

  function filterChannels(query) {
    document.querySelectorAll(".channel-btn").forEach(btn => {
        btn.style.display = btn.dataset.name.includes(query) ? "flex" : "none";
    });
  }

  function renderCreateChannelForm() {
    root.innerHTML = `
      <div class="channel-form">
        <button class="back-btn-ui"><i class="fa-solid fa-arrow-left"></i> Back</button>
        <h3>Create New Channel</h3>
        <input id="channelName" type="text" placeholder="Channel name">
        <textarea id="channelDesc" placeholder="Channel description..."></textarea>
        <button id="saveChannel" class="save-btn">Create</button>
      </div>
    `;
    document.querySelector(".back-btn-ui").onclick = () => { renderChannelsLayout(); loadChannels(); };
    document.getElementById("saveChannel").onclick = async () => {
      const name = document.getElementById("channelName").value.trim();
      const desc = document.getElementById("channelDesc").value.trim();
      if (!name) return alert("Channel name required");
      try {
        const res = await fetch(`${CHANNELS_API_URL}/channels`, {
          method: "POST", headers, body: JSON.stringify({ name, description: desc })
        });
        if (res.ok) { renderChannelsLayout(); loadChannels(); }
      } catch (err) { console.error(err); }
    };
  }

  async function loadChannels() {
    const list = document.getElementById("channels-list");
    const suggestedList = document.getElementById("suggested-list");
    try {
      const res = await fetch(`${CHANNELS_API_URL}/channels`, { headers });
      const channels = await res.json();
      list.innerHTML = ""; suggestedList.innerHTML = "";

      for (const c of channels) {
        const statusRes = await fetch(`${CHANNELS_API_URL}/channels/${c.id}/follow-status`, { headers });
        const { is_following } = await statusRes.json();
        
        const btn = document.createElement("button");
        btn.className = "channel-btn";
        btn.dataset.name = c.name.toLowerCase();
        btn.onclick = () => openChannel(c);
        btn.innerHTML = `<span>${c.name}</span>`;

        // Right-click delete channel (Admin or Owner)
        const isOwner = String(currentUser.id) === String(c.instructor_id || c.owner_id);
        if (role === "admin" || isOwner) {
          btn.oncontextmenu = async (e) => {
            e.preventDefault();
            if (confirm(`Delete channel "${c.name}"?`)) {
              await fetch(`${CHANNELS_API_URL}/channels/${c.id}`, { method: "DELETE", headers });
              loadChannels();
            }
          };
        }
        if (is_following) list.appendChild(btn);
        else { btn.style.borderStyle = "dashed"; suggestedList.appendChild(btn); }
      }
    } catch (err) { console.error(err); }
  }

  function openChannel(channel) {
    const view = document.getElementById("channel-view");
    ["joined-section", "suggested-section", "search-wrapper", "channels-header"].forEach(id => {
      const el = document.getElementById(id) || document.querySelector("."+id);
      if (el) el.style.display = "none";
    });
    view.classList.remove("hidden");

    const isOwner = String(currentUser.id) === String(channel.instructor_id || channel.owner_id);
    const canManageContent = (role === "admin" || (role === "instructor" && isOwner));

    view.innerHTML = `
      <div class="channel-detail-header" style="border-bottom: 1px solid #ddd; padding-bottom: 10px; margin-bottom: 15px;">
        <button id="backToChannels" class="back-btn"><i class="fa-solid fa-arrow-left"></i> Back</button>
        <h3 style="margin: 10px 0;">${channel.name}</h3>
        <div class="follow-section" style="display: flex; align-items: center; gap: 10px;">
            <span id="follower-count-${channel.id}" style="font-weight: bold;">0</span> Followers
            <button id="follow-btn-${channel.id}" class="follow-btn">Loading...</button>
        </div>
      </div>
      <div id="channel-contents" class="contents-area"></div>
      ${canManageContent ? renderPostControls(channel.id) : ""}
    `;

    if (typeof refreshFollowUI === "function") refreshFollowUI(channel.id);
    document.getElementById("backToChannels").onclick = () => {
      view.classList.add("hidden");
      renderChannelsLayout(); loadChannels();
    };
    loadContents(channel, canManageContent);
  }

  function renderPostControls(channelId) {
    return `
      <div class="post-bar-wrapper">
        <div class="post-input-container">
          <label for="postFile" class="icon-btn-upload"><i class="fa-solid fa-circle-plus"></i><input type="file" id="postFile" style="display:none" onchange="handleFileSelect(this)"></label>
          <textarea id="postText" placeholder="Write a message..." rows="1"></textarea>
          <button class="icon-btn-send" onclick="handleUniversalSend(${channelId})"><i class="fa-solid fa-paper-plane"></i></button>
        </div>
        <div id="file-status" style="color: #28a745; font-size: 11px; margin-top: 2px;"></div>
      </div>
    `;
  }

  window.handleFileSelect = (input) => {
    const status = document.getElementById("file-status");
    if (status && input.files.length > 0) status.textContent = "📎 Attached: " + input.files[0].name;
  };

  window.handleUniversalSend = async (channelId) => {
    const textInput = document.getElementById("postText");
    const fileInput = document.getElementById("postFile");
    const text = textInput.value.trim();

    try {
      if (fileInput.files.length > 0) {
        const form = new FormData();
        form.append("file", fileInput.files[0]);
        form.append("title", text || fileInput.files[0].name);

        // Remove Content-Type to allow browser to set boundary for multipart
        const uploadHeaders = { ...headers };
        delete uploadHeaders["Content-Type"];

        await fetch(`${CHANNELS_API_URL}/channels/${channelId}/upload`, {
          method: "POST",
          headers: uploadHeaders,
          body: form
        });
      } else if (text) {
        // Match backend ContentCreate schema (body and title)
        await fetch(`${CHANNELS_API_URL}/channels/${channelId}/text`, {
          method: "POST",
          headers: headers,
          body: JSON.stringify({ body: text, title: "Update" })
        });
      }

      textInput.value = "";
      fileInput.value = "";
      document.getElementById("file-status").textContent = "";
      loadContents({id: channelId}, true);
    } catch (err) {
      console.error("Upload Error:", err);
    }
  };

  async function loadContents(channel, canManageContent) {
    const box = document.getElementById("channel-contents");
    try {
      const res = await fetch(`${CHANNELS_API_URL}/channels/${channel.id}/contents`, { headers });
      const items = await res.json();
      box.innerHTML = items.length === 0 ? "<p class='no-content'>No posts yet.</p>" : "";
      
      items.forEach(i => {
        registerContentView(i.id);
        const div = document.createElement("div");
        div.className = "content-card";

        // Right-click delete content (Admin or Channel Owner)
        if (canManageContent) {
          div.oncontextmenu = (e) => {
            e.preventDefault();
            if (confirm("Delete this content?")) deleteChannelContent(i.id, channel.id, canManageContent);
          };
        }

        if (i.text_content) div.innerHTML += `<p>${i.text_content}</p>`;
        if (i.file_url) {
          const ext = i.file_url.split('.').pop().toLowerCase();
          if (['mp4','webm','ogg'].includes(ext)) {
            div.innerHTML += `<video controls class="content-media" style="max-width:100%; border-radius:8px;"><source src="${CHANNELS_API_URL}/${i.file_url}" type="video/${ext}"></video>`;
          } else if (['png','jpg','jpeg','gif','webp'].includes(ext)) {
            div.innerHTML += `<img src="${CHANNELS_API_URL}/${i.file_url}" class="content-media">`;
          } else {
            div.innerHTML += `<div class="file-link"><a href="${CHANNELS_API_URL}/${i.file_url}" target="_blank"><i class="fa-solid fa-paperclip"></i> Download File</a></div>`;
          }
        }

        div.innerHTML += `<div class="view-badge" style="font-size: 11px; color: #888; margin: 5px 0;"><i class="fa-solid fa-eye"></i> <span id="view-count-${i.id}">0</span> views</div>`;
        addReactionsAndComments(div, i.id, canManageContent);
        box.appendChild(div);
      });
      box.scrollTop = box.scrollHeight;
    } catch (err) { console.error(err); }
  }

  async function deleteChannelContent(contentId, channelId, canManage) {
    try {
        const res = await fetch(`${CHANNELS_API_URL}/channels/content/${contentId}`, { 
            method: "DELETE", 
            headers 
        });

        if (res.ok) {
            loadContents({id: channelId}, canManage);
        } else if (res.status === 404) {
            // Secondary attempt for the specific route logic
            const resAlt = await fetch(`${CHANNELS_API_URL}/channels/${channelId}/content/${contentId}`, { 
                method: "DELETE", 
                headers 
            });
            if (resAlt.ok) loadContents({id: channelId}, canManage);
        }
    } catch (err) {
        console.error("Delete Error:", err);
    }
  }

  function addReactionsAndComments(container, contentId, isChannelOwner) {
    const bar = document.createElement("div");
    bar.className = "reaction-comment-bar";
    const reactBtn = document.createElement("button");
    reactBtn.innerHTML = `<i class="fa-solid fa-heart"></i> <span id="reaction-count-${contentId}">0</span>`;
    reactBtn.onclick = async () => {
      await fetch(`${CHANNELS_API_URL}/channels/react/${contentId}/react`, { method: "POST", headers, body: JSON.stringify({ emoji: "❤️" }) });
      loadReactionSummary(contentId);
    };
    const commentBtn = document.createElement("button");
    commentBtn.innerHTML = `<i class="fa-solid fa-comment"></i> Comments`;
    commentBtn.onclick = () => {
      const c = document.getElementById(`comments-${contentId}`);
      c.style.display = c.style.display === "none" ? "block" : "none";
      if (c.style.display === "block") loadCommentsWithReactions(contentId, isChannelOwner);
    };
    bar.append(reactBtn, commentBtn);
    container.appendChild(bar);
    addCommentBox(container, contentId, isChannelOwner);
    loadReactionSummary(contentId);
  }

  async function loadReactionSummary(id) {
    const res = await fetch(`${CHANNELS_API_URL}/channels/react/${id}`, { headers });
    const data = await res.json();
    const total = data.reduce((sum, r) => sum + r.total_reactions, 0);
    if (document.getElementById(`reaction-count-${id}`)) document.getElementById(`reaction-count-${id}`).textContent = total;
  }

  function addCommentBox(container, contentId, isChannelOwner) {
    const box = document.createElement("div");
    box.id = `comments-${contentId}`;
    box.className = "comment-box-container";
    box.style.display = "none";
    box.innerHTML = `
      <div style="background: #fdfdfd; padding: 10px; margin-top: 10px; border: 1px solid #eee; border-radius: 8px;">
        <div id="comments-list-${contentId}" style="max-height: 200px; overflow-y: auto; margin-bottom: 12px;"></div>
        <div style="display: flex; gap: 8px;">
          <input id="comment-in-${contentId}" type="text" placeholder="Comment..." style="flex:1; border-radius:20px; padding:6px 12px; border:1px solid #ddd;">
          <button onclick="sendComment(${contentId}, ${isChannelOwner})" style="background:#007bff; border:none; border-radius:50%; width:32px; height:32px; color:white;"><i class="fa-solid fa-paper-plane"></i></button>
        </div>
      </div>`;
    container.appendChild(box);
  }

  window.sendComment = async (contentId, isChannelOwner) => {
    const input = document.getElementById(`comment-in-${contentId}`);
    if (!input.value.trim()) return;
    await fetch(`${CHANNELS_API_URL}/contents/${contentId}/comment`, { method: "POST", headers, body: JSON.stringify({ comment: input.value.trim() }) });
    input.value = ""; loadCommentsWithReactions(contentId, isChannelOwner);
  };

  async function loadCommentsWithReactions(contentId, isChannelOwner) {
    const list = document.getElementById(`comments-list-${contentId}`);
    try {
      const res = await fetch(`${CHANNELS_API_URL}/contents/${contentId}/comments`, { headers });
      const comments = await res.json();
      list.innerHTML = comments.length === 0 ? "<p style='color:#bbb; font-size:12px;'>No comments.</p>" : "";
      comments.forEach(c => {
        const cDiv = document.createElement("div");
        const displayName = (c.first_name && c.last_name) ? `${c.first_name} ${c.last_name}` : c.username;
        cDiv.innerHTML = `
            <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 8px;">
                <div><strong>${displayName}</strong>: ${c.comment_text}</div>
                <button onclick="reactToComment(${c.id})" style="background:none; border:none; color:#666;"><i class="fa-regular fa-heart"></i> <span id="comment-react-count-${c.id}">0</span></button>
            </div>`;
        
        // Right-click delete comment (Author or Channel Owner)
        const isAuthor = String(currentUser.id) === String(c.user_id);
        if (isAuthor || isChannelOwner) {
          cDiv.oncontextmenu = async (e) => {
            e.preventDefault();
            if (confirm("Delete comment?")) {
              await fetch(`${CHANNELS_API_URL}/contents/comments/${c.id}`, { method: "DELETE", headers });
              loadCommentsWithReactions(contentId, isChannelOwner);
            }
          };
        }
        list.appendChild(cDiv);
        loadCommentReactionCount(c.id);
      });
    } catch (err) { console.error(err); }
  }

  window.reactToComment = async (id) => {
    await fetch(`${CHANNELS_API_URL}/contents/comments/${id}/react`, { method: "POST", headers, body: JSON.stringify({ emoji: "❤️" }) });
    loadCommentReactionCount(id);
  };

  async function loadCommentReactionCount(id) {
    const res = await fetch(`${CHANNELS_API_URL}/contents/comments/${id}/reactions`, { headers });
    const data = await res.json();
    const total = data.reduce((sum, r) => sum + r.total_reactions, 0);
    if (document.getElementById(`comment-react-count-${id}`)) document.getElementById(`comment-react-count-${id}`).textContent = total;
  }

  async function registerContentView(contentId) {
    try {
      const res = await fetch(`${CHANNELS_API_URL}/contents/${contentId}/view`, { method: "POST", headers });
      if (res.ok) {
        const data = await res.json();
        const span = document.getElementById(`view-count-${contentId}`);
        if (span) span.textContent = data.total_views;
      }
    } catch (err) { console.error(err); }
  }

});
