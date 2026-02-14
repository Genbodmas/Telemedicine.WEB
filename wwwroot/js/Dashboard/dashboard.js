// Dashboard page JS — Availability management & display
(function () {
    const API_BASE = document.querySelector('meta[name="api-base"]')?.content || 'https://localhost:7182';
    const TOKEN = document.cookie.split(';').find(c => c.trim().startsWith('jwtToken='))?.split('=')[1]
        || localStorage.getItem('jwtToken');
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    // Patient: Show doctor availability when selecting a doctor
    const doctorSelect = document.getElementById('doctorSelect');
    if (doctorSelect) {
        doctorSelect.addEventListener('change', async function () {
            const doctorId = this.value;
            const infoDiv = document.getElementById('availabilityInfo');
            const slotsDiv = document.getElementById('availabilitySlots');
            if (!doctorId) { infoDiv.style.display = 'none'; return; }

            try {
                const res = await fetch(`${API_BASE}/api/Availability/${doctorId}`, {
                    headers: { 'Authorization': `Bearer ${TOKEN}` }
                });
                const data = await res.json();
                if (data.succeeded && data.data.length > 0) {
                    slotsDiv.innerHTML = data.data
                        .filter(s => s.isActive || s.IsActive)
                        .map(s => {
                            const day = s.dayOfWeek !== undefined ? s.dayOfWeek : s.DayOfWeek;
                            const start = s.startTime || s.StartTime;
                            const end = s.endTime || s.EndTime;
                            return `<div class="list-group-item py-1 px-2"><strong>${dayNames[day]}</strong>: ${start} - ${end}</div>`;
                        })
                        .join('');
                    infoDiv.style.display = 'block';
                } else {
                    slotsDiv.innerHTML = '<div class="text-muted small py-1">No availability set</div>';
                    infoDiv.style.display = 'block';
                }
            } catch (e) {
                console.error('Error fetching availability:', e);
            }
        });
    }

    // Doctor: Load and manage availability
    const myAvailDiv = document.getElementById('myAvailabilitySlots');
    const btnSet = document.getElementById('btnSetAvailability');

    if (myAvailDiv) {
        loadMyAvailability();
    }

    async function loadMyAvailability() {
        try {
            const res = await fetch(`${API_BASE}/api/Availability/my`, {
                headers: { 'Authorization': `Bearer ${TOKEN}` }
            });
            const data = await res.json();
            if (data.succeeded && data.data.length > 0) {
                myAvailDiv.innerHTML = data.data.map(s => `
                    <div class="d-flex justify-content-between align-items-center border-bottom py-1">
                        <span class="small">
                            <strong>${dayNames[s.dayOfWeek]}</strong>: ${s.startTime} - ${s.endTime}
                            ${s.isActive ? '<span class="badge bg-success">Active</span>' : '<span class="badge bg-secondary">Inactive</span>'}
                        </span>
                        <button class="btn btn-sm btn-outline-danger py-0 px-1" data-delete-id="${s.id}">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                `).join('');

                // Attach delete handlers
                myAvailDiv.querySelectorAll('[data-delete-id]').forEach(btn => {
                    btn.addEventListener('click', () => deleteSlot(parseInt(btn.dataset.deleteId)));
                });
            } else {
                myAvailDiv.innerHTML = '<p class="text-muted text-center small">No slots set yet.</p>';
            }
        } catch (e) {
            myAvailDiv.innerHTML = '<p class="text-danger small">Error loading availability.</p>';
        }
    }

    if (btnSet) {
        btnSet.addEventListener('click', async () => {
            const status = document.getElementById('availStatus');
            const payload = {
                dayOfWeek: parseInt(document.getElementById('availDay').value),
                startTime: document.getElementById('availStart').value,
                endTime: document.getElementById('availEnd').value,
                isActive: true
            };

            status.innerText = 'Saving...';
            try {
                const res = await fetch(`${API_BASE}/api/Availability/set`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${TOKEN}` },
                    body: JSON.stringify(payload)
                });
                const data = await res.json();
                if (data.succeeded) {
                    status.innerText = '✓ Saved!';
                    status.style.color = '#22c55e';
                    loadMyAvailability();
                } else {
                    status.innerText = data.message || 'Failed';
                    status.style.color = '#ef4444';
                }
            } catch (e) {
                status.innerText = 'Error saving.';
                status.style.color = '#ef4444';
            }
            setTimeout(() => status.innerText = '', 3000);
        });
    }

    async function deleteSlot(id) {
        if (!confirm('Delete this slot?')) return;
        try {
            await fetch(`${API_BASE}/api/Availability/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${TOKEN}` }
            });
            loadMyAvailability();
        } catch (e) {
            console.error('Delete failed:', e);
        }
    }
})();
