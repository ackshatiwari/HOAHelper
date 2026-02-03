const addComplaintBtn = document.getElementById('add-complaint-btn');
const complaintDialog = document.getElementById('complaint-dialog');
const complaintForm = document.getElementById('complaint-form');
const webcam = document.getElementById('webcam');
const captureBtn = document.getElementById('capture-btn');
const canvas = document.getElementById('canvasElement');
const context = canvas.getContext('2d');
const photoPreview = document.getElementById('photoPreview');



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

