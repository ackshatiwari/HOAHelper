const addComplaintBtn = document.getElementById('add-complaint-btn');
const complaintDialog = document.getElementById('complaint-dialog');
const complaintForm = document.getElementById('complaint-form');
const webcam = document.getElementById('webcam');
const captureBtn = document.getElementById('capture-btn');
const canvas = document.getElementById('canvasElement');
const context = canvas.getContext('2d');
const photoPreview = document.getElementById('photoPreview');
const complaintsTable = document.getElementById('complaints-table');
const audioIcon = document.getElementById('audioIcon');
const stopIcon = document.getElementById('stopIcon');

let mediaRecorder;
let audioChunks = [];
let isRecording = false;



audioIcon.addEventListener('click', async () => {
    if (!isRecording) {
        stopIcon.disabled = false;

        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];

        mediaRecorder.ondataavailable = event => {
            audioChunks.push(event.data);
        };
        mediaRecorder.onstop = async () => {

            const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });

            const formData = new FormData();
            formData.append('audio', audioBlob, 'recording.webm');

            const response = await fetch('/speech/transcribe', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();
            console.log('Transcription:', data.transcription);
            document.getElementById('complaint-textarea').value += " " + data.transcription;
        };

        mediaRecorder.start();
        isRecording = true;

        console.log("Recording started");

    } else {
        stopIcon.disabled = true;
        mediaRecorder.stop();
        isRecording = false;
        console.log("Recording stopped");

    }

});

stopIcon.addEventListener('click', () => {
    if (isRecording) {
        mediaRecorder.stop();
        isRecording = false;
        stopIcon.disabled = true;
        console.log("Recording stopped by user");
    }
});



// helper: convert dataURL to Blob so we can send it as a file
function dataURLtoBlob(dataurl) {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
}

// simple HTML escaper
function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, function (s) {
        return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[s];
    });
}

async function retrieveHundredComplaints() {
    const response = await fetch('/getComplaints');
    const data = await response.json();
    console.log('Retrieved complaints:', data.complaints);
    // You can further process or display the complaints as needed
    if (data.complaints && data.complaints.length > 0) {
        data.complaints.forEach(complaint => {
            const row = complaintsTable.insertRow();
            row.insertCell().textContent = complaint.homeowner_name || 'N/A';
            row.insertCell().textContent = complaint.description || 'N/A';
            row.insertCell().textContent = complaint.created_at || 'N/A';
            row.insertCell().textContent = complaint.status || 'N/A';
            row.insertCell().textContent = complaint.longitude + ', ' + complaint.latitude || 'N/A';
        });
    }
}

async function viewRecentComplaints() {
    //retrieve recent complaints limited to five for the user based on email stored in sessionStorage
    const email = sessionStorage.getItem('email');
    console.log('Retrieved email from sessionStorage for recent complaints:', email);

    // This function is no longer used; ticket rendering is handled by fetchAndRenderUserTickets().
}

// Fetch user's recent complaints and render into Open / Resolved ticket lists
async function fetchAndRenderUserTickets() {
    const email = sessionStorage.getItem('email');
    if (!email) return;
    try {
        const response = await fetch(`/getRecentComplaints?email=${encodeURIComponent(email)}`);
        const data = await response.json();
        const complaints = data.complaints || [];
        const tbodyOpen = document.getElementById('open-tickets-body');
        const tbodyResolved = document.getElementById('resolved-tickets-body');
        if (tbodyOpen) tbodyOpen.innerHTML = '';
        if (tbodyResolved) tbodyResolved.innerHTML = '';

        complaints.forEach(c => {
            const isClosed = (c.status && c.status.toLowerCase() === 'closed') || (c.status && c.status.toLowerCase() === 'resolved');
            const created = c.created_at ? c.created_at.split('T')[0] : (c.created_at || 'N/A');
            const desc = c.title || (c.description ? c.description.split('\n')[0].slice(0, 200) : '');
            let latestComment = '';
            if (c.comments && Array.isArray(c.comments) && c.comments.length) latestComment = c.comments[c.comments.length - 1];
            else if (c.latest_comment) latestComment = c.latest_comment;
            else if (c.comment) latestComment = c.comment;

            const actionsHtml = !isClosed
                ? `
                    <button class="btn ghost" data-id="${c.report_id || c.id || ''}" data-action="withdraw">Withdraw</button>
                    <button class="btn primary" data-id="${c.report_id || c.id || ''}" data-action="nudge">Nudge</button>
                    <button class="btn" data-id="${c.report_id || c.id || ''}" data-action="update">Update</button>
                  `
                : `
                    <button class="btn" data-id="${c.report_id || c.id || ''}" data-action="reopen">Reopen</button>
                    <button class="btn ghost" data-id="${c.report_id || c.id || ''}" data-action="view">View</button>
                    <button class="btn" data-id="${c.report_id || c.id || ''}" data-action="download">Download</button>
                  `;

            const lastUpdated = created; // template value: same as submitted date
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${created}</td>
                <td>${lastUpdated}</td>
                <td><div style="font-weight:600">${escapeHtml(desc)}</div><div class="muted" style="margin-top:6px">${(c.address || '')}</div></td>
                <td>${escapeHtml(latestComment || '')}</td>
                <td>${actionsHtml}</td>
            `;

            if (!isClosed) {
                if (tbodyOpen) tbodyOpen.appendChild(row);
            } else {
                if (tbodyResolved) tbodyResolved.appendChild(row);
            }
        });

        // attach simple delegation for action buttons
        [tbodyOpen, tbodyResolved].forEach(tbody => {
            if (!tbody) return;
            tbody.querySelectorAll('button[data-action]').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const action = btn.getAttribute('data-action');
                    const id = btn.getAttribute('data-id');
                    console.log('Action', action, 'on', id);
                    // TODO: wire actions (withdraw/nudge/update/reopen/view/download)
                    alert(`${action} clicked for ${id}`);
                });
            });
        });

    } catch (err) {
        console.error('Error fetching user tickets:', err);
    }
}



//Google Maps Initialization
let map, marker;
function initMap() {
    map = new google.maps.Map(document.getElementById("map"), {
        center: { lat: 38.9696, lng: -77.3861 }, // Loudoun Valley area
        zoom: 15,
        gestureHandling: "greedy",
        restriction: {
            latLngBounds: {
                north: 38.996179,
                south: 38.963514,
                east: -77.481720,
                west: -77.530721
            },
        },
    });

    map.addListener("click", (e) => {
        const pos = e.latLng;
        if (marker) marker.setMap(null);
        marker = new google.maps.Marker({ position: pos, map });
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const email = sessionStorage.getItem('email');
    console.log('Retrieved email from sessionStorage:', email);
    if (email) {
        document.getElementById('logged-in-as').innerHTML = `${email} | Logged in as Homeowner`;
        fetchAndRenderUserTickets();
        // ensure Enter Manual and AI buttons exist (in case DOM loaded earlier)
        const addComplaintBtn = document.getElementById('add-complaint-btn');
        if (addComplaintBtn) addComplaintBtn.addEventListener('click', ()=>{ const dlg = document.getElementById('add-mode-dialog'); if(dlg){ dlg.showModal(); }});
    }
    else {
        window.location.href = '/auth';
    }
});
if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices.getUserMedia({ video: true })
        .then((stream) => {
            webcam.srcObject = stream;
        })
        .catch((err) => {
            console.error("An error occurred: " + err);
            alert("Could not access the camera. Please allow camera permissions.");
        });
} else {
    alert("getUserMedia not supported in this browser.");
}

captureBtn.addEventListener('click', (e) => {
    canvas.width = webcam.videoWidth;
    canvas.height = webcam.videoHeight;
    context.drawImage(webcam, 0, 0, canvas.width, canvas.height);
    photoPreview.src = canvas.toDataURL('image/png');
    photoPreview.style.display = 'block';
});

// Show unified complaint dialog with chooser
addComplaintBtn.addEventListener('click', () => {
    document.getElementById('create-chooser').style.display = 'block';
    const manual = document.getElementById('manual-panel');
    const ai = document.getElementById('ai-panel');
    if (manual) manual.style.display = 'none';
    if (ai) ai.style.display = 'none';
    complaintDialog.showModal();
});

// Close dialog helper
function closeComplaintDialog() {
    stopAiCamera();
    stopWebcamStream();
    complaintDialog.close();
}

document.getElementById('chooser-cancel')?.addEventListener('click', closeComplaintDialog);
document.querySelectorAll('#close-dialog').forEach(el => el.addEventListener('click', closeComplaintDialog));

// chooser buttons
document.getElementById('chooser-manual-btn')?.addEventListener('click', () => {
    document.getElementById('create-chooser').style.display = 'none';
    document.getElementById('manual-panel').style.display = 'block';
    setTimeout(() => initMap(), 300);
});
document.getElementById('chooser-ai-btn')?.addEventListener('click', () => {
    document.getElementById('create-chooser').style.display = 'none';
    document.getElementById('ai-panel').style.display = 'block';
});

// AI camera controls
let aiCameraStream = null;
async function startAiCamera() {
    const v = document.getElementById('ai-webcam');
    try {
        aiCameraStream = await navigator.mediaDevices.getUserMedia({ video: true });
        v.srcObject = aiCameraStream;
        v.style.display = 'block';
        document.getElementById('ai-capture-btn').style.display = 'inline-block';
    } catch (err) {
        console.error('camera error', err);
        alert('Could not access camera');
    }
}

function stopAiCamera() {
    if (aiCameraStream) {
        aiCameraStream.getTracks().forEach(t => t.stop());
        aiCameraStream = null;
    }
    const v = document.getElementById('ai-webcam');
    if (v) v.style.display = 'none';
    const btn = document.getElementById('ai-capture-btn');
    if (btn) btn.style.display = 'none';
}

document.getElementById('ai-start-camera-btn')?.addEventListener('click', () => startAiCamera());
document.getElementById('ai-capture-btn')?.addEventListener('click', () => {
    const v = document.getElementById('ai-webcam');
    const c = document.getElementById('ai-canvas');
    c.width = v.videoWidth;
    c.height = v.videoHeight;
    const ctx = c.getContext('2d');
    ctx.drawImage(v, 0, 0);
    const dataUrl = c.toDataURL('image/png');
    document.getElementById('ai-image-preview').src = dataUrl;
    document.getElementById('ai-image-preview').style.display = 'block';
    stopAiCamera();
});

// AI picture/audio UI toggles and file previews
(() => {
    const aiChoosePicture = document.getElementById('ai-choose-picture');
    const aiChooseAudio = document.getElementById('ai-choose-audio');
    const aiPicturePanel = document.getElementById('ai-picture-panel');
    const aiAudioPanel = document.getElementById('ai-audio-panel');
    const aiUploadImage = document.getElementById('ai-upload-image');
    const aiUploadAudio = document.getElementById('ai-upload-audio');
    const aiPreviewArea = document.getElementById('ai-preview-area');
    const aiImagePreview = document.getElementById('ai-image-preview');
    const aiAudioPlayback = document.getElementById('ai-audio-playback');

    if (aiChoosePicture) {
        aiChoosePicture.addEventListener('click', () => {
            if (aiPicturePanel) aiPicturePanel.style.display = 'block';
            if (aiAudioPanel) aiAudioPanel.style.display = 'none';
            if (aiPreviewArea) aiPreviewArea.innerText = 'Picture mode — select or capture an image.';
        });
    }
    if (aiChooseAudio) {
        aiChooseAudio.addEventListener('click', () => {
            if (aiPicturePanel) aiPicturePanel.style.display = 'none';
            if (aiAudioPanel) aiAudioPanel.style.display = 'block';
            if (aiPreviewArea) aiPreviewArea.innerText = 'Audio mode — record or upload audio.';
        });
    }

    if (aiUploadImage) {
        aiUploadImage.addEventListener('change', (e) => {
            const file = e.target.files && e.target.files[0];
            if (!file) return;
            const url = URL.createObjectURL(file);
            if (aiImagePreview) { aiImagePreview.src = url; aiImagePreview.style.display = 'block'; }
            if (aiPreviewArea) aiPreviewArea.innerText = file.name;
        });
    }

    if (aiUploadAudio) {
        aiUploadAudio.addEventListener('change', (e) => {
            const file = e.target.files && e.target.files[0];
            if (!file) return;
            const url = URL.createObjectURL(file);
            if (aiAudioPlayback) { aiAudioPlayback.src = url; aiAudioPlayback.style.display = 'block'; }
            if (aiPreviewArea) aiPreviewArea.innerText = file.name;
        });
    }

    // AI panel back/cancel button
    document.getElementById('ai-cancel-btn')?.addEventListener('click', () => {
        if (document.getElementById('ai-panel')) document.getElementById('ai-panel').style.display = 'none';
        if (document.getElementById('create-chooser')) document.getElementById('create-chooser').style.display = 'block';
        if (aiPreviewArea) aiPreviewArea.innerText = 'No media selected.';
        stopAiCamera();
        stopAudioRecording();
    });
})();

// AI audio record (separate from manual microphone)
let aiMediaRecorder = null;
let aiAudioChunks = [];
async function startAudioRecording() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        aiMediaRecorder = new MediaRecorder(stream);
        aiAudioChunks = [];
        aiMediaRecorder.ondataavailable = (e) => aiAudioChunks.push(e.data);
        aiMediaRecorder.onstop = () => {
            const blob = new Blob(aiAudioChunks, { type: 'audio/webm' });
            const url = URL.createObjectURL(blob);
            document.getElementById('ai-audio-playback').src = url;
        };
        aiMediaRecorder.start();
        document.getElementById('ai-record-btn').disabled = true;
        document.getElementById('ai-stop-btn').disabled = false;
    } catch (err) {
        console.error('audio error', err);
        alert('Could not access microphone');
    }
}

function stopAudioRecording() {
    if (aiMediaRecorder) aiMediaRecorder.stop();
    document.getElementById('ai-record-btn').disabled = false;
    document.getElementById('ai-stop-btn').disabled = true;
}

document.getElementById('ai-record-btn')?.addEventListener('click', () => startAudioRecording());
document.getElementById('ai-stop-btn')?.addEventListener('click', () => stopAudioRecording());

// AI generate: autofill manual form
document.getElementById('ai-generate-btn')?.addEventListener('click', () => {
    const preview = document.getElementById('ai-preview-area');
    const text = preview.innerText || preview.textContent || '';
    document.getElementById('complaint-textarea').value = text;
    const aiImg = document.getElementById('ai-image-preview');
    if (aiImg && aiImg.src) {
        const p = document.getElementById('photoPreview');
        p.src = aiImg.src;
        p.style.display = 'block';
    }
    document.getElementById('ai-panel').style.display = 'none';
    document.getElementById('manual-panel').style.display = 'block';
    document.getElementById('create-chooser').style.display = 'none';
});

function stopWebcamStream() {
    const v = document.getElementById('webcam');
    if (v && v.srcObject) {
        const s = v.srcObject;
        if (s.getTracks) s.getTracks().forEach(t => t.stop());
        v.srcObject = null;
    }
}

complaintForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const uploadImageInput = document.getElementById('uploadImageInput');
    const camImgSrc = photoPreview.src;
    const complaintTextarea = document.getElementById('complaint-textarea');
    const complaintType = document.getElementById('complaint-type');
    const complaintDate = document.getElementById('complaint-date');

    const formData = new FormData(complaintForm);

    // append camera capture as file (if present) and selected files (multiple)
    if (camImgSrc && camImgSrc !== 'data:,') {
        const blob = dataURLtoBlob(camImgSrc);
        formData.append('images', blob, 'camera.png');
    }
    const files = uploadImageInput.files;
    for (let i = 0; i < files.length; i++) formData.append('images', files[i]);
    // include email for user lookup
    formData.append('email', sessionStorage.getItem('email') || '');
    if (!complaintTextarea.value.trim()) {
        alert("Please enter a complaint description.");
        return;
    }
    formData.append("complaintText", complaintTextarea.value);
    formData.append("complaintType", complaintType.value);
    if (!complaintType.value) {
        alert("Please select a complaint type.");
        return;
    }
    if (!complaintDate.value) {
        formData.append("complaintDate", new Date().toISOString().split('T')[0]);
    } else {
        formData.append("complaintDate", complaintDate.value);
    }
    // no longer append single `fileImage` field; all images are sent as `images`.

    if (marker) {
        console.log("Marker exists, at ", marker.getPosition().lat(), marker.getPosition().lng());
        formData.append("latitude", marker.getPosition().lat());
        formData.append("longitude", marker.getPosition().lng());
    } else {
        alert("Please select a location on the map.");
        return;
    }

    fetch('/submitComplaint', {
        method: 'POST',
        body: formData
    })
        .then(response => {
            if (response.ok) {
                alert("Complaint submitted successfully!");
                complaintDialog.close();
                window.location.reload();
            } else {
                alert("Failed to submit complaint.");
            }
        })
        .catch(error => {
            console.error('Error submitting complaint:', error);
            alert("An error occurred while submitting the complaint.");
        });
});

