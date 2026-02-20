document.addEventListener("DOMContentLoaded", () => {
  const API = "http://127.0.0.1:8181";

  const chatbotBox = document.getElementById("chatbotBox");
  const chatbotInput = document.getElementById("chatbotInput");
  const chatbotSendBtn = document.getElementById("chatbotSendBtn");
  const chatbotImageInput = document.getElementById("chatbotImageInput");
  const chatbotImageBtn = document.getElementById("chatbotImageBtn");
  const newChatBtn = document.getElementById("newChatBtn");
  const voiceToggleBtn = document.getElementById("voiceToggleBtn");

  const currentUser = JSON.parse(localStorage.getItem("loggedInUser"));
  const token = localStorage.getItem("access_token");
  let voiceEnabled = true;

  // -------------------- VOICE SUPPORT (UPGRADED TO STRIP DOLLARS) --------------------
  function speakText(text) {
    if (!voiceEnabled || !text || !window.speechSynthesis) return;
    if (window.speechSynthesis.speaking) window.speechSynthesis.cancel();

    // Remove LaTeX symbols so the voice engine doesn't read them literally
    let cleanText = text
      .replace(/\$\$/g, '')        // Remove double dollar signs
      .replace(/\$/g, '')          // Remove single dollar signs
      .replace(/\\ce\{/g, '')      // Remove chemistry tags
      .replace(/\\frac\{/g, '')    // Remove fraction tags
      .replace(/[\{\}]/g, '')      // Remove curly braces
      .replace(/\\/g, '');         // Remove backslashes

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = "en-US";
    utterance.rate = 1;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  }

  if (voiceToggleBtn) {
    voiceToggleBtn.addEventListener("click", () => {
      voiceEnabled = !voiceEnabled;
      voiceToggleBtn.innerHTML = voiceEnabled
        ? '<i class="fas fa-volume-up"></i>'
        : '<i class="fas fa-volume-mute"></i>';
      if (!voiceEnabled && window.speechSynthesis) window.speechSynthesis.cancel();
    });
  }

  // -------------------- MESSAGE RENDER (UPGRADED FOR MATH) --------------------
  function appendMessage(sender, content, isImage = false) {
    const existingThinking = document.querySelector(".thinking-row");
    if (existingThinking) existingThinking.remove();

    const row = document.createElement("div");
    row.classList.add("message", sender);

    const avatar = document.createElement("div");
    avatar.classList.add("avatar");
    avatar.innerHTML = sender === "user" ? "👤" : "✨";

    const messageContent = document.createElement("div");
    messageContent.classList.add("message-content");

    if (isImage) {
      const img = document.createElement("img");
      img.src = `data:image/png;base64,${content}`;
      img.style.width = "100%";
      img.style.borderRadius = "12px";
      messageContent.appendChild(img);
    } else {
      // Use div instead of pre for MathJax compatibility
      const textContainer = document.createElement("div");
      textContainer.style.whiteSpace = "pre-wrap";
      // Using innerHTML so MathJax can see the LaTeX code
      textContainer.innerHTML = content; 
      messageContent.appendChild(textContainer);
      
      if (sender === "bot" && voiceEnabled) speakText(content);
    }

    row.appendChild(avatar);
    row.appendChild(messageContent);
    chatbotBox.appendChild(row);
    chatbotBox.scrollTop = chatbotBox.scrollHeight;

    // Tell MathJax to process the new message
    if (window.MathJax && !isImage) {
      MathJax.typesetPromise([messageContent]).catch((err) => console.error("MathJax Error:", err));
    }
  }

  // -------------------- THINKING --------------------
  function showThinking() {
    const row = document.createElement("div");
    row.classList.add("message", "bot", "thinking-row");
    row.innerHTML = `
      <div class="avatar">✨</div>
      <div class="message-content thinking">
        Thinking<span class="dot"></span><span class="dot"></span><span class="dot"></span>
      </div>
    `;
    chatbotBox.appendChild(row);
    chatbotBox.scrollTop = chatbotBox.scrollHeight;
  }

  // -------------------- NEW CHAT --------------------
  newChatBtn.addEventListener("click", () => {
    if (confirm("Clear this conversation?")) {
      chatbotBox.innerHTML = "";
      if (window.speechSynthesis) window.speechSynthesis.cancel();
    }
  });

  chatbotImageBtn.addEventListener("click", () => chatbotImageInput.click());

  // -------------------- SEND MESSAGE --------------------
  async function sendMessage() {
    const text = chatbotInput.value.trim();
    if (!text) return;

    appendMessage("user", text);
    chatbotInput.value = "";
    showThinking();

    try {
      const res = await fetch(`${API}/chatbot/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ text, user_id: currentUser.id })
      });

      if (!res.ok) throw new Error("Server error");

      const data = await res.json();
      appendMessage("bot", data.response);

    } catch (err) {
      appendMessage("bot", "I'm having trouble connecting right now, please try again later.");
    }
  }

  chatbotSendBtn.addEventListener("click", sendMessage);
  chatbotInput.addEventListener("keydown", e => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendMessage();
    }
  });

  // -------------------- IMAGE UPLOAD --------------------
  chatbotImageInput.addEventListener("change", async () => {
    const file = chatbotImageInput.files[0];
    if (!file) return;

    appendMessage("user", "[Image Uploaded]");
    showThinking();

    const formData = new FormData();
    formData.append("user_id", currentUser.id);
    formData.append("file", file);
    formData.append("text", "Explain this image.");

    try {
      const res = await fetch(`${API}/chatbot/send-image`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
        body: formData
      });

      if (!res.ok) throw new Error("Image error");
      const data = await res.json();

      if (data.image) {
        appendMessage("bot", data.response);
        appendMessage("bot", data.image, true);
      } else {
        appendMessage("bot", data.response);
      }

    } catch (err) {
      appendMessage("bot", "Failed to process image.");
    }
  });
});