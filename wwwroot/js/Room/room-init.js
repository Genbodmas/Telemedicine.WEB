// Room page initialization — role-based logic, notes saving
(function () {
    document.addEventListener("DOMContentLoaded", () => {
        const role = localStorage.getItem("userRole");
        if (role !== "Doctor") {
            const tabNotes = document.getElementById("tabNotes");
            if (tabNotes) tabNotes.style.display = "none";
        }

        document.getElementById("btnSaveNote")?.addEventListener("click", async () => {
            const content = document.getElementById("noteContent").value;
            const status = document.getElementById("noteStatus");
            if (!content) return;
            status.innerText = "Saving...";
            try {
                const response = await fetch(`${API_BASE_URL}/api/Consultation/notes-room`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${TOKEN}`
                    },
                    // Use PascalCase to match DTO
                    body: JSON.stringify({ RoomId: ROOM_ID, Content: content })
                });
                if (response.ok) {
                    status.innerText = "✓ Note saved!";
                    status.style.color = "#22c55e";
                    setTimeout(() => status.innerText = "", 3000);
                } else {
                    status.innerText = "Failed to save.";
                    status.style.color = "#ef4444";
                }
            } catch (e) {
                console.error(e);
                status.innerText = "Error saving note.";
                status.style.color = "#ef4444";
            }
        });
    });
})();
