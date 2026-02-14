// Check if we have cookies set by server and save to localStorage for SignalR
// This is a bridge because standard SignalR lib doesn't read non-HttpOnly cookies easily in all configs, 
// but we explicitly set HttpOnly=false for 'jwtToken' in AuthController.

function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}

const token = getCookie("jwtToken");
if (token) {
    localStorage.setItem("jwtToken", token);
    console.log("Token synced to localStorage");
}
