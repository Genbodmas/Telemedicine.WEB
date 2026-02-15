"use strict";

(function () {
    const apiBaseMeta = document.querySelector('meta[name="api-base"]');
    const API_BASE_URL = apiBaseMeta ? apiBaseMeta.content : 'https://localhost:7182';

    const getCookie = (name) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
    };

    // Check for token in cookie or localStorage
    const TOKEN = getCookie('jwtToken') || localStorage.getItem('jwtToken');

    if (!TOKEN) return; // Not logged in

    const connection = new signalR.HubConnectionBuilder()
        .withUrl(`${API_BASE_URL}/telemedicineHub?access_token=${TOKEN}`)
        .withAutomaticReconnect()
        .build();

    connection.on("ReceiveNotification", (message) => {
        showToast(message);
    });

    connection.start().then(() => {
        console.log("Notification Service Connected");
    }).catch(err => console.error("Notification Service Error", err));

    function showToast(message) {
        // Create toast element
        const toastHtml = `
            <div class="toast align-items-center text-white bg-primary border-0" role="alert" aria-live="assertive" aria-atomic="true">
                <div class="d-flex">
                    <div class="toast-body">
                        <i class="bi bi-bell-fill me-2"></i> ${message}
                    </div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
                </div>
            </div>
        `;

        const container = document.getElementById('toastContainer');
        if (container) {
            const div = document.createElement('div');
            div.innerHTML = toastHtml;
            const toastEl = div.firstElementChild;
            container.appendChild(toastEl);

            const toast = new bootstrap.Toast(toastEl, { delay: 5000 });
            toast.show();

            toastEl.addEventListener('hidden.bs.toast', () => {
                toastEl.remove();
            });
        }
    }
})();
