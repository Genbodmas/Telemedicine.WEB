document.addEventListener("DOMContentLoaded", () => {
    syncAuthFromCookies();
    updateIdentityUI();
});

function syncAuthFromCookies() {
    const token = getCookie("jwtToken");
    const name = getCookie("userName");
    const role = getCookie("userRole");
    const id = getCookie("userId");

    if (token) localStorage.setItem("jwtToken", decodeURIComponent(token));
    if (name) localStorage.setItem("userName", decodeURIComponent(name));
    if (role) localStorage.setItem("userRole", decodeURIComponent(role));
    if (id) localStorage.setItem("userId", decodeURIComponent(id));
}

function updateIdentityUI() {
    const name = localStorage.getItem("userName");
    const role = localStorage.getItem("userRole");
    const identityContainer = document.getElementById("identityContainer");
    const authLinks = document.getElementById("authLinks");

    if (name && identityContainer && authLinks) {
        // User is logged in
        identityContainer.innerHTML = `
            <span class="navbar-text me-3">
                Hello, <strong>${name}</strong> (${role})
            </span>
            <a class="btn btn-outline-danger btn-sm" href="#" onclick="logout()">Logout</a>
        `;
        authLinks.style.display = "none";
    } else if (identityContainer && authLinks) {
        // User is not logged in
        identityContainer.innerHTML = "";
        authLinks.style.display = "flex";
    }
}

function logout() {
    localStorage.clear();
    window.location.href = "/Auth/Logout";
}

function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}
