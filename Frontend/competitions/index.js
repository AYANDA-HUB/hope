const COMP_API_URL = "http://127.0.0.1:8181/competitions";

// --- HELPERS ---
const getCompAuthHeaders = () => ({
    "Authorization": `Bearer ${localStorage.getItem("access_token")}`,
    "Content-Type": "application/json"
});

document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem("access_token");
    const cachedUser = localStorage.getItem("loggedInUser");
    let userRole = "guest";
    
    if (cachedUser) {
        try {
            const user = JSON.parse(cachedUser);
            // Support both direct and nested role structures
            userRole = (user.role || user.user?.role || "guest").toLowerCase().trim();
        } catch (e) {
            console.error("User parsing error", e);
        }
    }

    // Show admin form only if user is admin
    const adminForm = document.getElementById("adminCompetitionForm");
    if (adminForm) {
        adminForm.style.display = (userRole === "admin") ? "block" : "none";
    }

    // Initial Load
    if (token) {
        fetchCompetitions();
    }

    // --- CREATE COMPETITION ---
    const createBtn = document.getElementById("createCompBtn");
    if (createBtn) {
        createBtn.onclick = async () => {
            const data = {
                title: document.getElementById("compTitle").value,
                description: document.getElementById("compDesc").value,
                level: document.getElementById("compLevel").value,
                venue: document.getElementById("compVenue").value,
                start_datetime: document.getElementById("compDate").value,
                district: document.getElementById("compDistrict").value,
                province: document.getElementById("compProvince").value
            };

            // Basic Validation
            if (!data.title || !data.start_datetime) return alert("Title and Date are required");

            try {
                const response = await fetch(`${COMP_API_URL}/`, {
                    method: "POST",
                    headers: getCompAuthHeaders(),
                    body: JSON.stringify(data)
                });

                if (response.ok) {
                    alert("Competition created successfully!");
                    // Clear form
                    document.querySelectorAll("#adminCompetitionForm input, #adminCompetitionForm textarea").forEach(el => el.value = "");
                    fetchCompetitions(); 
                } else {
                    const err = await response.json();
                    alert(`Error: ${err.detail || "Failed to create"}`);
                }
            } catch (error) {
                console.error("Create error:", error);
                alert("Connection failed");
            }
        };
    }
});

// --- FETCH & RENDER ---
async function fetchCompetitions() {
    const listContainer = document.getElementById("competitionsList");
    if (!listContainer) return;

    // Show loading state
    listContainer.innerHTML = "<p>Loading competitions...</p>";

    try {
        const response = await fetch(`${COMP_API_URL}/`, {
            headers: getCompAuthHeaders()
        });

        if (response.status === 401) {
            listContainer.innerHTML = "<p>Please log in to view competitions.</p>";
            return;
        }

        const competitions = await response.json();

        // FIX: Check if data is an array before using .length or .map
        if (!Array.isArray(competitions)) {
            console.error("Unexpected response format:", competitions);
            listContainer.innerHTML = "<p>Error: Could not load data format.</p>";
            return;
        }

        if (competitions.length === 0) {
            listContainer.innerHTML = "<p>No upcoming competitions found.</p>";
            return;
        }

        listContainer.innerHTML = competitions.map(comp => `
            <div class="comp-card" style="border: 1px solid #ddd; padding: 15px; border-radius: 8px; margin-bottom: 10px; background: #fff;">
                <h4 style="margin: 0 0 5px 0; color: #1e293b;">${comp.title}</h4>
                <p style="margin: 0 0 10px 0; font-size: 0.9em; color: #64748b;">${comp.description}</p>
                <div style="font-size: 0.8em; color: #475569;">
                    📍 ${comp.venue} <br> 
                    📅 ${new Date(comp.start_datetime).toLocaleString()}
                </div>
                <div style="display: inline-block; margin-top: 10px; padding: 2px 8px; background: #dbeafe; color: #2563eb; border-radius: 4px; font-size: 0.75em; font-weight: bold;">
                    ${comp.level.toUpperCase()}
                </div>
            </div>
        `).join('');

    } catch (error) {
        console.error("Fetch error:", error);
        listContainer.innerHTML = "<p>Unable to connect to the server.</p>";
    }
}
