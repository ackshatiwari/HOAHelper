// Boilerplate DOM references for admin page
// Lightweight helpers and stable element references used by admin UI scripts.

// small helper
const $id = (id) => document.getElementById(id);



// Search / filters
const searchInput = $id('q');
const filterButtons = Array.from(document.querySelectorAll('.filter-btn'));

// Report detail / moderation fields
const commentTextarea = $id('comment');
const actionSelect = $id('action');
const groupSelect = $id('group');
const assigneeInput = $id('assignee');
const tagsInput = $id('tags');
const staffTable = $id('staffTable');
const staffTableBody = staffTable.querySelector('tbody');

// Action buttons (first match for each style)
const saveButton = document.querySelector('.btn.primary');
const previewButton = document.querySelector('.btn.ghost');
const closeCaseButton = document.querySelector('.btn.warn');

// Data / visuals
const relatedTable = document.querySelector('.card table');
const reportImages = Array.from(document.querySelectorAll('.images img'));

// Data table
const reportsTable = $id('reports-table');


// Filters
const allReportsBtn = $id('all-reports-btn');
const openBtn = $id('open-btn');
const closedBtn = $id('closed-btn');
const redirectedBtn = $id('redirected-btn');





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

document.addEventListener('DOMContentLoaded', async () => {
    const reports = await fetchReports();
    console.log(reports[0].user_id);
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


// Filters Event Listener

allReportsBtn.addEventListener('click', async () => {
    // Implement logic to show all reports
    console.log('All Reports filter clicked');
    // You can re-render the table with all reports or implement client-side filtering
    const reports = await fetchReports();
    console.log(reports[0].user_id);
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

    // Make the button that is clicked have like a dark green border and slight green background, and remove that styling from the other buttons
    allReportsBtn.style.border = '2px solid #4caf50';
    allReportsBtn.style.backgroundColor = '#e8f5e9';

    openBtn.style.border = '1px solid #ccc';
    openBtn.style.backgroundColor = '';
    closedBtn.style.border = '1px solid #ccc';
    closedBtn.style.backgroundColor = '';
    redirectedBtn.style.border = '1px solid #ccc';
    redirectedBtn.style.backgroundColor = '';
});

openBtn.addEventListener('click', async () => {
    console.log('Open filter clicked');
    const reports = await fetchReports();
    const filteredReports = reports.filter(report => report.status === 'unresolved');
    console.log('Filtered reports:', filteredReports);
    let userDetailsForEachReport = [];
    for (let report of filteredReports) {
        try {
            const response = await fetch(`/api/users/${report.user_id}`);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const userDetails = await response.json();
            userDetailsForEachReport.push(userDetails);
        } catch (error) {
            console.error(`Error fetching user details for report ${report.report_id}:`, error);
            userDetailsForEachReport.push({ name: 'Unknown User' }); // Fallback in case of error
        }
    }
    renderReportsTable(filteredReports, userDetailsForEachReport);
    // Make the button that is clicked have like a dark green border and slight green background, and remove that styling from the other buttons
    openBtn.style.border = '2px solid #4caf50';
    openBtn.style.backgroundColor = '#e8f5e9';

    allReportsBtn.style.border = '1px solid #ccc';
    allReportsBtn.style.backgroundColor = '';
    closedBtn.style.border = '1px solid #ccc';
    closedBtn.style.backgroundColor = '';
    redirectedBtn.style.border = '1px solid #ccc';
    redirectedBtn.style.backgroundColor = '';
});

closedBtn.addEventListener('click', async () => {
    console.log('Closed filter clicked');
    const reports = await fetchReports();
    const filteredReports = reports.filter(report => report.status === 'closed');
    let userDetailsForEachReport = [];
    for (let report of filteredReports) {
        try {
            const response = await fetch(`/api/users/${report.user_id}`);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const userDetails = await response.json();
            userDetailsForEachReport.push(userDetails);
        } catch (error) {
            console.error(`Error fetching user details for report ${report.report_id}:`, error);
            userDetailsForEachReport.push({ name: 'Unknown User' }); // Fallback in case of error
        }
    }
    renderReportsTable(filteredReports, userDetailsForEachReport);

    // Make the button that is clicked have like a dark green border and slight green background, and remove that styling from the other buttons
    closedBtn.style.border = '2px solid #4caf50';
    closedBtn.style.backgroundColor = '#e8f5e9';

    allReportsBtn.style.border = '1px solid #ccc';
    allReportsBtn.style.backgroundColor = '';
    openBtn.style.border = '1px solid #ccc';
    openBtn.style.backgroundColor = '';
    redirectedBtn.style.border = '1px solid #ccc';
    redirectedBtn.style.backgroundColor = '';
});

redirectedBtn.addEventListener('click', async () => {
    console.log('Redirected filter clicked');
    //I have not implemented redirected status in the backend yet, so this is just a placeholder for now
    renderReportDetails([], { name: 'N/A', address: 'N/A' });
    // Make the button that is clicked have like a dark green border and slight green background, and remove that styling from the other buttons
    redirectedBtn.style.border = '2px solid #4caf50';
    redirectedBtn.style.backgroundColor = '#e8f5e9';

    allReportsBtn.style.border = '1px solid #ccc';
    allReportsBtn.style.backgroundColor = '';
    openBtn.style.border = '1px solid #ccc';
    openBtn.style.backgroundColor = '';
    closedBtn.style.border = '1px solid #ccc';
    closedBtn.style.backgroundColor = '';

});




groupSelect.addEventListener('change', async () => {
    //now prints a table showing the assigne names for each staff group
    const group = groupSelect.value;
    console.log('Selected group:', group);
    try {
        const response = await fetch(`/api/admin/listStaff/${group}`);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const groupDetails = await response.json();
        console.log('Fetched group details:', groupDetails);
        staffTable.style.display = 'block';
        staffTableBody.innerHTML = '';
        for(let staff of groupDetails.data) {
            const newRow = document.createElement('tr');
            newRow.innerHTML = `
                <td>${staff.full_name}</td>
                <td>${staff.email}</td>
            `;
            staffTableBody.appendChild(newRow);
        }
    }
    catch (error) {
        console.error('Error fetching group details:', error);
        showToast('Failed to fetch group details', 'error');
        return;
    }


})




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
            userDetails.images = [];
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
    //first clear existing table rows
    const tbody = reportsTable.querySelector('tbody');
    tbody.innerHTML = '';


    if (!reports || reports.length === 0) {
        reportsTable.innerHTML = '<p>No reports found.</p>';
        return;
    }

    for (let report of reports) {
        console.log('Report:', report);
        const newRow = document.createElement('tr');
        newRow.setAttribute('data-report-id', report.report_id);
        newRow.addEventListener('click', () => {
            console.log('Navigating to report detail page for report ID:', report.report_id);
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



