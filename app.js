// ---------------------
// DARK MODE TOGGLE
// ---------------------
document.getElementById("theme-toggle")?.addEventListener("click", () => {
  document.body.dataset.theme =
    document.body.dataset.theme === "dark" ? "" : "dark";
});

// API BASE
const API_BASE = "http://127.0.0.1:8181";

// ---------------------
// REGISTER
// ---------------------
async function register() {
  const fullname = document.getElementById("reg-fullname").value.trim();
  const phoneRaw = document.getElementById("reg-phone").value.trim();
  const schoolId = document.getElementById("reg-school").value.trim();
  const password = document.getElementById("reg-pass").value.trim();
  const role = document.getElementById("role").value;
  const msg = document.getElementById("reg-msg");

  msg.innerText = "";

  if (!fullname) return (msg.innerText = "Full name required");
  if (!/^\d{10}$/.test(phoneRaw))
    return (msg.innerText = "Phone must be 10 digits");
  if (!schoolId || isNaN(schoolId))
    return (msg.innerText = "Valid school ID required");
  if (!/(?=.*[a-z])(?=.*[A-Z]).{6,}/.test(password))
    return (msg.innerText = "Weak password");

  const payload = {
    fullname: fullname,
    phone_number: phoneRaw, // backend expects 0XXXXXXXXX
    password: password,
    role: role,
    school_id: Number(schoolId),
  };

  try {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      msg.innerText = data.detail || "Registration failed";
      return;
    }

    msg.innerText = `Registered successfully! Your username is ${data.username}`;
  } catch (err) {
    console.error(err);
    msg.innerText = "Server error";
  }
}

// ---------------------
// LOGIN
// ---------------------
async function login() {
  const username = document.getElementById("login-user").value.trim();
  const password = document.getElementById("login-pass").value.trim();
  const msg = document.getElementById("log-msg");

  msg.innerText = "";

  if (!username || !password) {
    msg.innerText = "Username and password required";
    return;
  }

  const formData = new FormData();
  formData.append("username", username);
  formData.append("password", password);

  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      body: formData,
    });

    const data = await res.json();

    if (!res.ok) {
      msg.innerText = data.detail || "Login failed";
      return;
    }

    // Store auth info
    localStorage.setItem("access_token", data.access_token);
    localStorage.setItem("token_type", data.token_type);

    msg.innerText = "Login successful! Redirecting...";

    setTimeout(() => {
      window.location.href = "dashboard.html";
    }, 800);
  } catch (err) {
    console.error(err);
    msg.innerText = "Server error";
  }
}
