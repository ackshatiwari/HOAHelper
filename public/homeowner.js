const addComplaintBtn = document.getElementById('add-complaint-btn');
const complaintDialog = document.getElementById('complaint-dialog');
const complaintForm = document.getElementById('complaint-form');
const webcam = document.getElementById('webcam');
const captureBtn = document.getElementById('capture-btn');
const canvas = document.getElementById('canvasElement');
const context = canvas.getContext('2d');
const photoPreview = document.getElementById('photoPreview');
const complaintsTable = document.getElementById('complaints-table');
const yourReportsTable = document.getElementById('your-reports-table');

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

    const response = await fetch(`/getRecentComplaints?email=${encodeURIComponent(email)}`);
    const data = await response.json();
    console.log('Retrieved recent complaints:', data.complaints);
    // Process or display recent complaints as needed
    if (data.complaints && data.complaints.length > 0) {
        data.complaints.forEach(complaint => {
            const row = yourReportsTable.insertRow();
            row.insertCell().textContent = complaint.description || 'N/A';
            row.insertCell().textContent = complaint.created_at || 'N/A';
            row.insertCell().textContent = complaint.status || 'N/A';
        });
    } else {
        const yourReportsDiv = document.getElementById('your-reports');
        const noReportsMsg = document.createElement('p');
        noReportsMsg.textContent = 'You have not submitted any complaints yet.';
        yourReportsDiv.appendChild(noReportsMsg);
        yourReportsTable.style.display = 'none';
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
        retrieveHundredComplaints();
        viewRecentComplaints();
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

addComplaintBtn.addEventListener('click', () => {
    complaintDialog.showModal();
    initMap();


});

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

