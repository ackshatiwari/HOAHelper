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

// Export references for other modules (optional)

// Notes:
// - These are only DOM pointers / boilerplate. Attach event listeners in separate JS logic files.
// - If you prefer different selectors or ids, update admin.html or these variables accordingly.'



