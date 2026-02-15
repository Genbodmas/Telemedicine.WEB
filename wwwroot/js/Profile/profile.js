(function () {
    const API_BASE = document.querySelector('meta[name="api-base"]')?.content || 'https://localhost:7182';

    const getToken = () => document.cookie.split(';').find(c => c.trim().startsWith('jwtToken='))?.split('=')[1] || localStorage.getItem('jwtToken');
    const TOKEN = getToken();

    if (!TOKEN) {
        window.location.href = '/Auth/Login';
        return;
    }


    const fullNameInput = document.getElementById('fullName');
    const emailInput = document.getElementById('email');
    const phoneInput = document.getElementById('phoneNumber');
    const addressInput = document.getElementById('address');
    const specialtyInput = document.getElementById('specialty');
    const bioInput = document.getElementById('bio');


    const avatarImg = document.getElementById('profileAvatar');
    const avatarInput = document.getElementById('avatarInput');
    const profileName = document.getElementById('profileName');
    const profileRole = document.getElementById('profileRole');
    const displayEmail = document.getElementById('displayEmail');
    const displayPhone = document.getElementById('displayPhone');
    const displayAddress = document.getElementById('displayAddress');

    const btnSave = document.getElementById('btnSave');
    const container = document.querySelector('.container');


    loadProfile();

    async function loadProfile() {
        try {
            const res = await fetch(`${API_BASE}/api/User/profile`, {
                headers: { 'Authorization': `Bearer ${TOKEN}` }
            });
            const payload = await res.json();

            if (payload.succeeded) {
                const user = payload.data;


                fullNameInput.value = user.fullName || '';
                emailInput.value = user.email || '';
                phoneInput.value = user.phoneNumber || '';
                addressInput.value = user.address || '';
                specialtyInput.value = user.specialty || '';
                bioInput.value = user.bio || '';


                updateSidebar(user);


                if (user.profilePictureUrl) {
                    avatarImg.src = `/Profile/ProxyImage?url=${encodeURIComponent(user.profilePictureUrl)}`;
                }


                if (user.role === 'Patient') {
                    const container = document.getElementById('specialtyContainer');
                    if (container) container.style.display = 'none';
                }
            } else {
                showToast('Error', 'Failed to load profile data.', 'danger');
            }
        } catch (e) {
            console.error('Failed to load profile', e);
            showToast('Error', 'Could not connect to server.', 'danger');
        }
    }

    function updateSidebar(user) {
        profileName.innerText = user.fullName || 'User';
        profileRole.innerText = user.role || 'Member';
        displayEmail.innerText = user.email || 'N/A';
        displayPhone.innerText = user.phoneNumber || 'N/A';
        displayAddress.innerText = user.address || 'N/A';
    }


    document.getElementById('profileForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const originalBtnText = btnSave.innerHTML;
        btnSave.disabled = true;
        btnSave.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Saving...';

        const payload = {
            fullName: fullNameInput.value,
            phoneNumber: phoneInput.value,
            address: addressInput.value,
            specialty: specialtyInput.value,
            bio: bioInput.value
        };

        try {
            const res = await fetch(`${API_BASE}/api/User/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${TOKEN}`
                },
                body: JSON.stringify(payload)
            });
            const data = await res.json();

            if (data.succeeded) {
                showToast('Success', 'Profile updated successfully!', 'success');


                profileName.innerText = payload.fullName;
                displayPhone.innerText = payload.phoneNumber || 'N/A';
                displayAddress.innerText = payload.address || 'N/A';

            } else {
                showToast('Failed', data.message || 'Update failed.', 'danger');
            }
        } catch (e) {
            console.error(e);
            showToast('Error', 'An error occurred while saving.', 'danger');
        } finally {
            btnSave.disabled = false;
            btnSave.innerHTML = originalBtnText;
        }
    });


    avatarInput.addEventListener('change', async () => {
        const file = avatarInput.files[0];
        if (!file) return;


        const originalSrc = avatarImg.src;
        avatarImg.style.opacity = '0.5';

        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch(`${API_BASE}/api/User/upload-avatar`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${TOKEN}` },
                body: formData
            });
            const data = await res.json();

            if (data.succeeded) {
                avatarImg.src = `/Profile/ProxyImage?url=${encodeURIComponent(data.data)}`;
                showToast('Success', 'Profile picture updated!', 'success');
            } else {
                showToast('Error', 'Avatar upload failed: ' + data.message, 'danger');
                avatarImg.src = originalSrc;
            }
        } catch (e) {
            console.error(e);
            showToast('Error', 'Error uploading avatar.', 'danger');
            avatarImg.src = originalSrc;
        } finally {
            avatarImg.style.opacity = '1';
        }
    });


    function showToast(title, message, type = 'primary') {
        const toastHtml = `
            <div class="toast align-items-center text-white bg-${type} border-0 position-fixed bottom-0 end-0 m-3" role="alert" aria-live="assertive" aria-atomic="true" style="z-index: 1100;">
                <div class="d-flex">
                    <div class="toast-body">
                        <strong>${title}</strong>: ${message}
                    </div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
                </div>
            </div>
        `;


        const div = document.createElement('div');
        div.innerHTML = toastHtml;
        document.body.appendChild(div.firstElementChild);

        const toastEl = document.body.lastElementChild;
        const toast = new bootstrap.Toast(toastEl, { delay: 3000 });
        toast.show();

        toastEl.addEventListener('hidden.bs.toast', () => {
            toastEl.remove();
        });
    }

})();
