window.addEventListener("DOMContentLoaded", async () => {
  const API = "http://127.0.0.1:8181";

  const sidebar = document.getElementById("sidebar");
  const sidebarMenu = document.getElementById("sidebarMenu");
  const sidebarToggle = document.getElementById("sidebarToggle");
  const sidebarOverlay = document.getElementById("sidebarOverlay");
  const sections = document.querySelectorAll(".section");

  let currentUser = null;
  let token = localStorage.getItem("access_token");

  // --- THEME TOGGLE LOGIC ---
  const themeToggle = document.getElementById("themeToggle");
  
  const applyTheme = (theme) => {
    if (theme === "dark") {
      document.body.classList.add("dark-mode");
      if (themeToggle) themeToggle.innerHTML = '<i class="fas fa-sun"></i> <span>Light Mode</span>';
    } else {
      document.body.classList.remove("dark-mode");
      if (themeToggle) themeToggle.innerHTML = '<i class="fas fa-moon"></i> <span>Dark Mode</span>';
    }
  };

  // Initialize theme from local storage
  const savedTheme = localStorage.getItem("theme") || "light";
  applyTheme(savedTheme);

  if (themeToggle) {
    themeToggle.onclick = () => {
      const isDark = document.body.classList.toggle("dark-mode");
      const newTheme = isDark ? "dark" : "light";
      localStorage.setItem("theme", newTheme);
      applyTheme(newTheme);
    };
  }

  const getRole = () => {
    if (!currentUser) return "guest";
    const role = currentUser.role || (currentUser.user && currentUser.user.role);
    return role ? role.toLowerCase().trim() : "guest";
  };

  async function fetchCurrentUser() {
    if (!token) return null;
    try {
      const res = await fetch(`${API}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Session expired");
      const data = await res.json();
      
      localStorage.setItem("loggedInUser", JSON.stringify(data));
      currentUser = data;
      updateProfileUI(data);
      
      return data;
    } catch (err) {
      console.error("Auth verify failed:", err);
      logout(); // This will now trigger redirect to index.html
      return null;
    }
  }

  function updateProfileUI(user) {
    const userNameElement = document.getElementById("userNameDisplay");
    const userImgElement = document.getElementById("userAvatar");
    
    if (userNameElement) userNameElement.textContent = user.fullname;
    if (userImgElement && user.profile_picture) {
      userImgElement.src = `${API}/${user.profile_picture}`;
    }
  }

  const sidebarConfig = {
    admin: [
      { name: "🏠 Home", section: "home" },
      { name: "🏫 Schools", section: "schools" },
      { name: "👤 Admins", section: "admins" },
      { name: "📺 Channels", section: "channels" },
      { name: "🏆 Competetions", section: "competitions" },
      { name: "💳 Vouchers", section: "subscription" },
    ],
    instructor: [
      { name: "🏠 Home", section: "home" },
      { name: "💬 Chat", section: "chat" },
      { name: "📺 Channels", section: "channels" },
      { name: "📚 Subjects", section: "subjects" },
    ],
    student: [
      { name: "🏠 Home", section: "home" },
      { name: "💬 Chat", section: "chat" },
      { name: "📺 Channels", section: "channels" },
      { name: "🏆 Competetions", section: "competitions" },
      { name: "🤖 Chatbot", section: "chatbot" },
      { name: "📚 Subjects", section: "subjects" },
      { name: "💳 Subscription", section: "subscription" },
    ],
    guest: [{ name: "🏠 Home", section: "home" }],
  };

  async function renderSidebar() {
    sidebarMenu.innerHTML = "";
    const role = getRole();
    const currentToken = localStorage.getItem("access_token");

    let isStudent = (role === "student");
    let isActive = true;

    if (isStudent && currentToken) {
      try {
        const res = await fetch(`${API}/subscriptions/status`, {
          headers: { Authorization: `Bearer ${currentToken}` }
        });
        const data = await res.json();
        isActive = (data.status === "active");
      } catch (err) {
        isActive = false; 
      }
    }

    const items = sidebarConfig[role] || sidebarConfig["guest"];

    items.forEach((item) => {
      if (isStudent && !isActive) {
        if (item.section !== "home" && item.section !== "subscription") {
          return; 
        }
      }

      const li = document.createElement("li");
      li.textContent = item.name;
      li.style.cursor = "pointer";
      
      li.onclick = () => {
        showSection(item.section);
        
        if (item.section === "subscription" && typeof initSubscription === "function") {
          initSubscription();
        }
        if (item.section === "schools" && typeof loadSchools === "function") {
          loadSchools();
        }
        if (item.section === "channels" && typeof loadChannels === "function") {
          loadChannels();
        }

        closeSidebar();
      };
      sidebarMenu.appendChild(li);
    });

    if (isStudent && !isActive) {
      showSection("subscription");
      if (typeof initSubscription === "function") initSubscription();
    }
  }

  function showSection(id) {
    sections.forEach((s) => s.classList.remove("active"));
    const target = document.getElementById(id);
    if (target) target.classList.add("active");
  }

  function closeSidebar() {
    sidebar.style.left = "-250px";
    sidebarOverlay.style.width = "0";
  }

  sidebarToggle.onclick = () => {
    sidebar.style.left = "0";
    sidebarOverlay.style.width = "100%";
  };
  sidebarOverlay.onclick = closeSidebar;

  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.onsubmit = async (e) => {
      e.preventDefault();
      const username = document.getElementById("loginUsername").value;
      const password = document.getElementById("loginPassword").value;

      try {
        const res = await fetch(`${API}/auth/login-json`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
        });

        if (!res.ok) throw new Error("Login failed");

        const data = await res.json();
        token = data.access_token;
        localStorage.setItem("access_token", token);

        await fetchCurrentUser();
        await renderSidebar(); 
        await loadDashboardData();
        showSection("home");
        alert("Welcome back!");
      } catch (err) { alert(err.message); }
    };
  }

  async function loadDashboardData() {
    const role = getRole();
    if (role === "guest") return;
    try {
      const res = await fetch(`${API}/auth/${role}/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (role === "admin" && data.admins) {
            renderAdminsList(data.admins);
        }
      }
    } catch (err) { console.error("Dashboard error:", err); }
  }

  function renderAdminsList(admins) {
      const adminContainer = document.getElementById("adminListBody");
      if (!adminContainer) return;
      adminContainer.innerHTML = "";
      admins.forEach(adm => {
          const tr = document.createElement("tr");
          tr.innerHTML = `<td>${adm.username}</td><td>${adm.fullname}</td>`;
          adminContainer.appendChild(tr);
      });
  }

  // --- REINFORCED LOGOUT FUNCTION ---
  function logout() {
    const theme = localStorage.getItem("theme"); 
    localStorage.clear();
    if (theme) localStorage.setItem("theme", theme); 
    // Redirect to index.html instead of just reloading
    window.location.href = "index.html"; 
  }

  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.onclick = (e) => {
      e.preventDefault();
      logout();
    };
  }

  const cachedUser = localStorage.getItem("loggedInUser");
  if (cachedUser) {
      currentUser = JSON.parse(cachedUser);
      updateProfileUI(currentUser);
  }

  if (token) await fetchCurrentUser();
  await renderSidebar();
  if (token) loadDashboardData();
});
