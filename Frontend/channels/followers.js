// followers.js - Utility for Channel Subscriptions

/**
 * Fetches both follow status and follower count in parallel.
 * Returns: { isFollowing: boolean, count: number }
 */
async function getFollowData(channelId) {
    try {
        const [statusRes, countRes] = await Promise.all([
            fetch(`${CHANNELS_API_URL}/channels/${channelId}/follow-status`, { 
                headers: { "Authorization": `Bearer ${localStorage.getItem("access_token")}` } 
            }),
            fetch(`${CHANNELS_API_URL}/channels/${channelId}/followers/count`, { 
                headers: { "Authorization": `Bearer ${localStorage.getItem("access_token")}` } 
            })
        ]);

        const statusData = await statusRes.json();
        const countData = await countRes.json();

        return {
            isFollowing: statusData.is_following,
            count: countData.followers
        };
    } catch (error) {
        console.error("Error fetching follow data:", error);
        return { isFollowing: false, count: 0 };
    }
}

/**
 * Toggles the follow status of a channel.
 * Returns: boolean (true if successful)
 */
async function handleFollowToggle(channelId, currentIsFollowing) {
    const endpoint = currentIsFollowing ? 'unfollow' : 'follow';
    const method = currentIsFollowing ? 'DELETE' : 'POST';

    try {
        const response = await fetch(`${CHANNELS_API_URL}/channels/${channelId}/${endpoint}`, {
            method: method,
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${localStorage.getItem("access_token")}`
            }
        });

        if (!response.ok) {
            const err = await response.json();
            alert(err.detail || "Action failed");
            return false;
        }

        return true;
    } catch (error) {
        console.error("Follow toggle error:", error);
        return false;
    }
}

/**
 * Updates the UI elements related to following.
 */
async function refreshFollowUI(channelId) {
    const btn = document.getElementById(`follow-btn-${channelId}`);
    const countSpan = document.getElementById(`follower-count-${channelId}`);
    
    if (!btn || !countSpan) return;

    // Set loading state
    btn.disabled = true;
    
    const data = await getFollowData(channelId);
    
    // Update count
    countSpan.textContent = data.count;
    
    // Update button appearance
    btn.disabled = false;
    btn.textContent = data.isFollowing ? "Unfollow" : "Follow";
    
    if (data.isFollowing) {
        btn.classList.add("following");
    } else {
        btn.classList.remove("following");
    }

    // Set the click handler
    btn.onclick = async () => {
        const success = await handleFollowToggle(channelId, data.isFollowing);
        if (success) {
            refreshFollowUI(channelId); // Recursive refresh to update state
        }
    };
}

