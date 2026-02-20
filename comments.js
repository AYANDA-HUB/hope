/**
 * Handles the reaction logic for a specific comment.
 * @param {number} commentId 
 * @param {string} emoji 
 */
window.reactToComment = async (commentId, emoji = "❤️") => {
    try {
        const res = await fetch(`${CHANNELS_API_URL}/contents/comments/${commentId}/react`, {
            method: "POST",
            headers: headers, // Uses the global headers from your index.js
            body: JSON.stringify({ emoji: emoji })
        });

        if (res.ok) {
            // Update the UI counter for this specific comment
            loadCommentReactionCount(commentId);
        }
    } catch (err) {
        console.error("Error reacting to comment:", err);
    }
};

/**
 * Fetches the total reactions for a comment and updates the specific span.
 */
async function loadCommentReactionCount(commentId) {
    try {
        // Note: You may need a GET endpoint in your FastAPI to fetch all reactions for a comment
        const res = await fetch(`${CHANNELS_API_URL}/contents/comments/${commentId}/reactions`, { headers });
        if (res.ok) {
            const data = await res.json(); 
            // Expecting data to be a list of { emoji: string, total: number }
            const total = data.reduce((sum, r) => sum + r.total_reactions, 0);
            const countSpan = document.getElementById(`comment-react-count-${commentId}`);
            if (countSpan) countSpan.textContent = total;
        }
    } catch (err) {
        console.error("Error loading comment reactions:", err);
    }
}

/**
 * Update your existing loadComments function in index.js to include the reaction UI
 */
async function loadCommentsWithReactions(contentId) {
    const list = document.getElementById(`comments-list-${contentId}`);
    if (!list) return;

    try {
        const res = await fetch(`${CHANNELS_API_URL}/contents/${contentId}/comments`, { headers });
        const comments = await res.json();
        
        list.innerHTML = comments.length === 0 ? "<p style='color:#bbb; font-size:12px;'>No comments.</p>" : "";

        comments.forEach(c => {
            const commentDiv = document.createElement("div");
            commentDiv.className = "comment-item";
            commentDiv.style.cssText = "font-size: 13px; margin-bottom: 10px; border-bottom: 1px solid #f9f9f9; padding-bottom: 5px;";
            
            commentDiv.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                    <div>
                        <strong>${c.username}</strong>: ${c.comment_text}
                    </div>
                    <div class="comment-actions">
                        <button onclick="reactToComment(${c.id})" 
                                style="background:none; border:none; cursor:pointer; font-size:11px; color:#666;">
                            🤍 <span id="comment-react-count-${c.id}">0</span>
                        </button>
                    </div>
                </div>
            `;
            list.appendChild(commentDiv);
            
            // Trigger initial load of counts for this comment
            loadCommentReactionCount(c.id);
        });
        
        list.scrollTop = list.scrollHeight;
    } catch (err) {
        console.error(err);
    }
}
/**
 * Updated loadComments function using the 'fullname' field
 */
async function loadCommentsWithReactions(contentId) {
    const list = document.getElementById(`comments-list-${contentId}`);
    if (!list) return;

    try {
        const res = await fetch(`${CHANNELS_API_URL}/contents/${contentId}/comments`, { headers });
        const comments = await res.json();
        
        list.innerHTML = comments.length === 0 ? "<p style='color:#bbb; font-size:12px;'>No comments.</p>" : "";

        comments.forEach(c => {
            // Use the registered fullname, fallback to username if empty
            const displayName = c.fullname || c.username;

            const commentDiv = document.createElement("div");
            // Container for name + bubble
            commentDiv.style.cssText = "display: flex; flex-direction: column; margin-bottom: 12px; align-items: flex-start;";
            
            commentDiv.innerHTML = `
                <span class="comment-author" style="font-weight: 700; font-size: 12px; margin-bottom: 2px; color: #444; margin-left: 4px;">
                    ${displayName}
                </span>
                <div style="display: flex; align-items: center; gap: 10px; width: 100%;">
                    <div class="comment-bubble" style="
                        background-color: #f0f2f5; 
                        padding: 8px 14px; 
                        border-radius: 18px; 
                        font-size: 13px; 
                        color: #050505;
                        width: fit-content; 
                        max-width: 85%; 
                        word-wrap: break-word;
                        line-height: 1.4;
                    ">
                        ${c.comment_text}
                    </div>
                    <div class="comment-actions">
                        <button onclick="reactToComment(${c.id})" 
                                style="background:none; border:none; cursor:pointer; font-size:12px; color:#65676b; display: flex; align-items: center; gap: 3px;">
                            ❤️ <span id="comment-react-count-${c.id}">0</span>
                        </button>
                    </div>
                </div>
            `;
            list.appendChild(commentDiv);
            
            // Load reactions for this specific comment
            loadCommentReactionCount(c.id);
        });
        
        list.scrollTop = list.scrollHeight;
    } catch (err) {
        console.error("Error loading comments:", err);
    }
}