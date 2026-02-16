// Boilerplate DOM references for admin page
// Lightweight helpers and stable element references used by admin UI scripts.

// small helper
const $id = (id) => document.getElementById(id);

// Toast helper: shows a short notification in the bottom-right
function showToast(message, type = 'success', duration = 3500) {
    const container = $id('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = 'toast ' + (type === 'error' ? 'error' : 'success');
    toast.innerHTML = `<div class="msg">${message}</div><button class="close-btn" aria-label="Dismiss">&times;</button>`;
    const closeBtn = toast.querySelector('.close-btn');
    let removeTimer = null;
    const removeToast = () => {
        toast.style.animation = 'toast-out 200ms ease forwards';
        setTimeout(() => { if (toast.parentNode) toast.parentNode.removeChild(toast); }, 220);
        if (removeTimer) clearTimeout(removeTimer);
    };
    closeBtn.addEventListener('click', removeToast);
    container.appendChild(toast);
    removeTimer = setTimeout(removeToast, duration);
}

// Search / filters
const searchInput = $id('q');
const filterButtons = Array.from(document.querySelectorAll('.filter-btn'));

// Report detail / moderation fields
const commentTextarea = $id('comment');
const actionSelect = $id('action');
const groupSelect = $id('group');
const assigneeInput = $id('assignee');
const tagsInput = $id('tags');

// Action buttons (first match for each style)
const saveButton = document.querySelector('.btn.primary');
const previewButton = document.querySelector('.btn.ghost');
const closeCaseButton = document.querySelector('.btn.warn');

// Data / visuals
const relatedTable = document.querySelector('.card table');
const reportImages = Array.from(document.querySelectorAll('.images img'));

// Data table
const reportsTable = $id('reports-table');

document.addEventListener('DOMContentLoaded', async () => {
    // Initial setup can go here if needed
    const reports = await fetchReports();
    console.log(reports[0].user_id);
    // Fetch user details for each report using forEach
    let userDetailsForEachReport = [];
    for (let report of reports) {
        try {
            const response = await fetch(`/api/users/${report.user_id}`);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const userDetails = await response.json();
            console.log('Fetched user details for report:', report.report_id, userDetails);
            userDetailsForEachReport.push(userDetails);
        } catch (error) {
            console.error(`Error fetching user details for report ${report.report_id}:`, error);
            userDetailsForEachReport.push({ name: 'Unknown User' }); // Fallback in case of error
        }
    }
    reports.forEach((report, index) => {
        report.homeowner_name = userDetailsForEachReport[index].name;
    });

    renderReportsTable(reports, userDetailsForEachReport);


});


saveButton.addEventListener('click', async () => {
    const selectedAction = actionSelect.value;
    let reportId = '';
    if ($id('report-header')) {
        reportId = $id('report-header').textContent.split('#RP-')[1].trim();
        console.log(reportId);
    } else {
        console.error('Report header element not found. Cannot determine report ID.');
        showToast('Unable to determine report ID', 'error');
        return;
    }

    try {
        if (selectedAction === 'save') {
            console.log('Saving comment:', commentTextarea.value);
            console.log('Report ID for saving comment:', reportId);
            const res = await fetch(`/api/admin/comment/${reportId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ comment: commentTextarea.value })
            });
            if (res.ok) {
                showToast('Comment saved', 'success');
            } else {
                showToast('Failed to save comment', 'error');
            }

        } else if (selectedAction === 'close') {
            console.log('Closing case with comment:', commentTextarea.value);
            console.log('Report ID for closing case:', reportId);
            const res = await fetch(`/api/admin/close/${reportId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ comment: commentTextarea.value })
            });
            if (res.ok) {
                showToast('Case closed', 'success');
            } else {
                showToast('Failed to close case', 'error');
            }

        } else if (selectedAction === 'redirect') {
            // Optionally implement redirect feedback
            showToast('Redirect action queued', 'success');
        }
    } catch (err) {
        console.error('Action failed:', err);
        showToast('Network error — try again', 'error');
    }
});


function renderReportDetails(report, userDetails) {
    console.log("User details for report:", userDetails);
    console.log('Rendering details for report:', report);
    $id('report-header').textContent = `Report #RP-${report.report_id}`;
    $id('report-author-details').textContent = `Reported by: ${userDetails.name} · ${new Date(report.complaint_date).toLocaleDateString()} · Address: ${userDetails.address}`;
    $id('report-category').textContent = `Category: ${report.category}`;
    $id('status').textContent = report.status;
    if (report.status === 'unresolved') { $id('status').style.backgroundColor = '#f44336'; $id('status').style.color = 'white'; }
    else if (report.status === 'in progress') $id('status').style.backgroundColor = '#ff9800';
    else if (report.status === 'resolved') $id('status').style.backgroundColor = '#4caf50';
    else if (report.status === 'closed') $id('status').style.backgroundColor = '#9e9e9e';
    $id('complaint-summary').textContent = report.description;


    //get images for the report and display them in the images div
    fetch(`/api/images/${report.user_id}&${report.report_id}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            console.log('Fetched images for report:', report.report_id, data.images);
            userDetails.images = data.images;
            const imgDiv = $id('report-images');
            imgDiv.innerHTML = '';
            if (userDetails.images && userDetails.images.length > 0) {
                userDetails.images.forEach((imgUrl, index) => {
                    const img = document.createElement('img');
                    img.src = imgUrl;
                    img.alt = `Report image ${index + 1}`;
                    imgDiv.appendChild(img);
                });
            } else {
                imgDiv.textContent = 'No images available for this report.';
            }
        })
        .catch(error => {
            console.error(`Error fetching images for report ${report.report_id}:`, error);
            userDetails.images = []; // Fallback to empty array if there's an error
        });


}



async function fetchReports() {
    try {
        const response = await fetch('/api/reports');
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const result = await response.json();
        console.log('Fetched reports:', result);
        return result.reports;

    } catch (error) {
        console.error('Error fetching reports:', error);
    }
}

function renderReportsTable(reports, userDetails) {
    if (!reports || reports.length === 0) {
        reportsTable.innerHTML = '<p>No reports found.</p>';
        return;
    }

    for (let report of reports) {
        console.log('Report:', report);
        const newRow = document.createElement('tr');
        newRow.setAttribute('data-report-id', report.report_id);
        //add click functionality to row to navigate to report detail page
        newRow.addEventListener('click', () => {
            console.log('Navigating to report detail page for report ID:', report.report_id);
            //render the report details along with the corresponding user details
            renderReportDetails(report, userDetails.find(user => user.name === report.homeowner_name));
        });
        newRow.innerHTML = `
        <td id='report-id-${report.report_id}'>${report.report_id}</td>
        <td id="report-report-${report.report_id}">${report.category}</td>
        <td id="report-category-${report.report_id}">${report.description}</td>
        <td id="report-reported-${report.report_id}">${report.complaint_date}</td>
        <td id="report-status-${report.report_id}">${report.status}</td>
    `;
        reportsTable.querySelector('tbody').appendChild(newRow);
    }


}



