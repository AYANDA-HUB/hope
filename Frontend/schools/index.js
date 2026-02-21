const API_URL = "http://127.0.0.1:8181";

// Load schools when the section is shown
async function loadSchools() {
    const token = localStorage.getItem("access_token");
    const listContainer = document.getElementById("schoolsList");
    
    try {
        const res = await fetch(`${API_URL}/schools/`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        if (!res.ok) throw new Error("Failed to fetch schools");
        
        const schools = await res.json();
        listContainer.innerHTML = ""; // Clear list

        schools.forEach(school => {
            const li = document.createElement("li");
            li.className = "school-item";
            li.innerHTML = `
                <div>
                    <strong>${school.name}</strong><br>
                    <small>${school.district}, ${school.province}</small>
                </div>
                <button class="delete-btn" onclick="deleteSchool(${school.id})">🗑️</button>
            `;
            listContainer.appendChild(li);
        });
    } catch (err) {
        console.error(err);
    }
}

// Add New School
async function handleAddSchool() {
    const token = localStorage.getItem("access_token");
    const name = document.getElementById("schoolName").value;
    const district = document.getElementById("schoolDistrict").value;
    const province = document.getElementById("schoolProvince").value;

    if (!name || !district || !province) return alert("Fill all fields");

    try {
        const res = await fetch(`${API_URL}/schools/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ name, district, province })
        });

        if (res.ok) {
            // Clear inputs
            document.getElementById("schoolName").value = "";
            document.getElementById("schoolDistrict").value = "";
            document.getElementById("schoolProvince").value = "";
            loadSchools(); // Refresh list
        } else {
            const data = await res.json();
            alert(data.detail || "Error creating school");
        }
    } catch (err) {
        console.error(err);
    }
}

// Delete School
async function deleteSchool(id) {
    if (!confirm("Are you sure you want to delete this school?")) return;
    
    const token = localStorage.getItem("access_token");
    try {
        const res = await fetch(`${API_URL}/schools/${id}`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok) loadSchools();
    } catch (err) {
        console.error(err);
    }
}

// Attach Event Listeners
document.addEventListener("DOMContentLoaded", () => {
    const addBtn = document.getElementById("addSchoolBtn");
    if (addBtn) addBtn.onclick = handleAddSchool;
});
// Fetch and display statistics
async function loadSchoolStats() {
    const token = localStorage.getItem("access_token");
    
    try {
        const res = await fetch(`${API_URL}/schools/stats`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        
        if (!res.ok) throw new Error("Could not fetch stats");
        
        const stats = await res.json();

        // Update the UI (Ensure these IDs exist in your HTML)
        if (document.getElementById("statTotalSchools")) 
            document.getElementById("statTotalSchools").textContent = stats.total_schools;
        if (document.getElementById("statTotalUsers")) 
            document.getElementById("statTotalUsers").textContent = stats.total_users;
        if (document.getElementById("statTotalInstructors")) 
            document.getElementById("statTotalInstructors").textContent = stats.total_instructors;
        if (document.getElementById("statTotalStudents")) 
            document.getElementById("statTotalStudents").textContent = stats.total_students;

    } catch (err) {
        console.error("Stats Error:", err);
    }
}
