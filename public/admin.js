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

    //Fetch the images for each report
    for (let user of userDetailsForEachReport) {
        try {
            const response = await fetch(`/api/images/${user.user_id}`);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const images = await response.json();
            console.log('Fetched images for user:', user.user_id, images);
            user.images = images;
        } catch (error) {
            console.error(`Error fetching images for user ${user.user_id}:`, error);
            user.images = []; // Fallback in case of error
        }
    }

    renderReportsTable(reports, userDetailsForEachReport);



});

function renderReportDetails(report, userDetails) {
    console.log("User details for report:", userDetails);
    console.log('Rendering details for report:', report);
    $id('report-header').textContent = `Report #RP-${report.report_id}`;
    $id('report-author-details').textContent = `Reported by: ${userDetails.name} · ${new Date(report.complaint_date).toLocaleDateString()} · Address: ${userDetails.address}`;
    $id('report-category').textContent = `Category: ${report.category}`;
    $id('status').textContent = report.status;
    $id('complaint-summary').textContent = report.description;
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



