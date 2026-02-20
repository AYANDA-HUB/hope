/**
 * Registers a view for a specific content item.
 * Called automatically when content is rendered or viewed.
 */
async function registerContentView(contentId) {
    try {
        const res = await fetch(`${CHANNELS_API_URL}/contents/${contentId}/view`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            }
        });
        if (res.ok) {
            const data = await res.json();
            updateViewBadgeUI(contentId, data.total_views);
        }
    } catch (err) {
        console.error("Error registering view:", err);
    }
}

/**
 * Updates the view count icon/text on the UI
 */
function updateViewBadgeUI(contentId, totalViews) {
    const viewSpan = document.getElementById(`view-count-${contentId}`);
    if (viewSpan) {
        viewSpan.textContent = totalViews;
    }
}

/**
 * Enhanced Render Function for Channel Posts
 * Use this inside your loadContents loop.
 */
function createContentCard(item) {
    const card = document.createElement("div");
    card.className = "content-card";
    
    // 1. Register the view immediately when the card is created/loaded
    registerContentView(item.id);

    card.innerHTML = `
        <div class="content-body">
            ${item.text_content ? `<p>${item.text_content}</p>` : ""}
            ${item.file_url ? renderMedia(item.file_url) : ""}
        </div>
        
        <div class="content-metadata" style="display: flex; gap: 15px; margin-top: 10px; color: #888; font-size: 12px;">
            <span><i class="fa-solid fa-eye"></i> <span id="view-count-${item.id}">...</span> views</span>
            <span id="timestamp"><i class="fa-regular fa-clock"></i> Just now</span>
        </div>

        <div class="reaction-comment-bar">
            <button onclick="handleLike(${item.id})"><i class="fa-solid fa-heart"></i></button>
            <button onclick="toggleComments(${item.id})"><i class="fa-solid fa-comment"></i> Comments</button>
        </div>
    `;
    
    return card;
}

function renderMedia(url) {
    const ext = url.split('.').pop().toLowerCase();
    if (['png', 'jpg', 'jpeg', 'gif'].includes(ext)) {
        return `<img src="${CHANNELS_API_URL}/${url}" class="content-media">`;
    }
    return `<a href="${CHANNELS_API_URL}/${url}" target="_blank" class="file-btn">
                <i class="fa-solid fa-file-arrow-down"></i> Download File
            </a>`;
}