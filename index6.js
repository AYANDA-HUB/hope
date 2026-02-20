// subscription/index.js
const SUB_API = "http://127.0.0.1:8181/subscriptions";
const ADMIN_SUB_API = "http://127.0.0.1:8181/admin/vouchers";

async function initSubscription() {
    const token = localStorage.getItem("access_token");
    const user = JSON.parse(localStorage.getItem("loggedInUser"));
    const role = user?.role?.toLowerCase() || (user?.user?.role?.toLowerCase());

    if (!token) return;

    // Show/Hide containers based on role
    const adminBox = document.getElementById("adminSubscription");
    const studentBox = document.getElementById("studentSubscription");

    if (role === "admin") {
        if (adminBox) adminBox.style.display = "block";
        if (studentBox) studentBox.style.display = "none";
        loadAdminVouchers();
    } else {
        if (adminBox) adminBox.style.display = "none";
        if (studentBox) studentBox.style.display = "block";
        checkSubscriptionStatus();
    }
}

// --- STUDENT ACTIONS ---
async function checkSubscriptionStatus() {
    try {
        const res = await fetch(`${SUB_API}/status`, {
            headers: { "Authorization": `Bearer ${localStorage.getItem("access_token")}` }
        });
        const data = await res.json();
        
        const statusEl = document.getElementById("currentStatus");
        const expiryEl = document.getElementById("expiryDateText");
        
        if (statusEl) statusEl.textContent = data.status.toUpperCase();
        if (expiryEl) expiryEl.textContent = data.expires_at ? `Expires on: ${data.expires_at}` : (data.message || "");
        
        statusEl.className = data.status === "active" ? "status-active" : "status-inactive";
    } catch (err) {
        console.error("Failed to fetch status", err);
    }
}

async function redeemVoucher() {
    const code = document.getElementById("voucherCodeInput").value.trim();
    if (!code) return alert("Please enter a code");

    try {
        const res = await fetch(`${SUB_API}/redeem-voucher`, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${localStorage.getItem("access_token")}`
            },
            body: JSON.stringify({ voucher_code: code })
        });

        const data = await res.json();
        if (res.ok) {
            alert("Success: " + data.message);
            checkSubscriptionStatus();
        } else {
            alert("Error: " + (data.detail || "Invalid voucher"));
        }
    } catch (err) {
        alert("Server error. Try again later.");
    }
}

// --- ADMIN ACTIONS ---
async function loadAdminVouchers() {
    try {
        const res = await fetch(ADMIN_SUB_API, {
            headers: { "Authorization": `Bearer ${localStorage.getItem("access_token")}` }
        });
        const vouchers = await res.json();
        const list = document.getElementById("adminVoucherList");
        if (!list) return;

        list.innerHTML = vouchers.map(v => `
            <div class="voucher-item">
                <code>${v.code}</code> | Plan: ${v.plan} | 
                <span class="${v.is_redeemed ? 'red' : 'green'}">
                    ${v.is_redeemed ? 'Redeemed' : 'Available'}
                </span>
            </div>
        `).join('');
    } catch (err) {
        console.error("Could not load vouchers", err);
    }
}

// Global listeners
document.addEventListener("click", (e) => {
    if (e.target.id === "redeemBtn") redeemVoucher();
    if (e.target.id === "generateVouchersBtn") generateAdminVouchers();
});

async function generateAdminVouchers() {
    const payload = {
        plan: document.getElementById("vPlan").value,
        amount: parseFloat(document.getElementById("vAmount").value),
        quantity: parseInt(document.getElementById("vQty").value),
        expires_at: document.getElementById("vExpiry").value || null
    };

    const res = await fetch(`${ADMIN_SUB_API}/generate`, {
        method: "POST",
        headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("access_token")}`
        },
        body: JSON.stringify(payload)
    });

    if (res.ok) {
        alert("Vouchers Generated Successfully");
        loadAdminVouchers();
    }
}