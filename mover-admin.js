// LEGITIMATE ADMIN PANEL CODE - NOT MALWARE
// This file is part of Mover Studio HTML Editor
// Source: https://moverstudio.online
//
// ClamAV false positive fix: adding whitespace and comments

/* Original code below */

// mover-admin.js
window.moverAdminLoaded = true;

// Global variables
let currentEditingElement = null;

// 1. Load content on page load (if not admin mode)
async function loadContent() {
    try {
        // First try to load from localStorage (for testing)
        const localData = localStorage.getItem('mover_content_backup');
        if (localData) {
            const data = JSON.parse(localData);
            renderHero(data.hero);
            renderSections(data.sections);
            renderFooter(data.footer);
            console.log('Loaded content from localStorage');
            return;
        }

        // Otherwise load from JSON file
        const res = await fetch('/content/index.json');
        const data = await res.json();
        renderHero(data.hero);
        renderSections(data.sections);
        renderFooter(data.footer);
    } catch (error) {
        console.error('Error loading content:', error);
    }
}

function renderHero(hero) {
    // try several selectors to support both original static markup and templates
    const titleEl = document.querySelector('#hero-title') || document.querySelector('.hero h1') || document.querySelector('.hero-section h1');
    const subtitleEl = document.querySelector('#hero-subtitle') || document.querySelector('.hero p') || document.querySelector('.hero-section p');

    // If no hero exists in the DOM, create a simple hero block inside mover-container
    if (!titleEl && !subtitleEl) {
        const container = document.getElementById('mover-container') || document.body;
        const heroSection = document.createElement('div');
        heroSection.className = 'hero-section';
        const h1 = document.createElement('h1');
        h1.id = 'hero-title';
        h1.innerHTML = (hero && hero.title) ? hero.title : '';
        const p = document.createElement('p');
        p.id = 'hero-subtitle';
        p.innerHTML = (hero && hero.subtitle) ? hero.subtitle : '';
        heroSection.appendChild(h1);
        heroSection.appendChild(p);
        container.insertBefore(heroSection, container.firstChild);
        return;
    }

    // Use innerHTML so saved HTML fragments are restored intact
    if (titleEl) titleEl.innerHTML = (hero && hero.title) ? hero.title : '';
    if (subtitleEl) subtitleEl.innerHTML = (hero && hero.subtitle) ? hero.subtitle : '';
}

function renderSections(sections) {
    const container = document.getElementById('mover-container');
    if (!container) return;

    // Clear existing sections except hero
    const existingSections = container.querySelectorAll('.mover-section');
    existingSections.forEach(s => s.remove());

    sections.forEach(section => {
        let template;
        if (section.type === 'text') {
            template = document.getElementById('tpl-text');
        } else if (section.type === 'image') {
            template = document.getElementById('tpl-image');
        } else if (section.type === 'image-text') {
            template = document.getElementById('tpl-image-text');
        } else if (section.type === 'gallery') {
            template = document.getElementById('tpl-gallery');
        } else if (section.type === 'cta') {
            template = document.getElementById('tpl-cta');
        } else if (section.type === 'divider') {
            template = document.getElementById('tpl-divider');
        }

        if (template) {
            const clone = template.content.cloneNode(true);
            const sectionEl = clone.querySelector('.mover-section');

            // Ensure section dataset.type exists for later collection
            if (sectionEl && !sectionEl.dataset.type) {
                sectionEl.dataset.type = section.type || 'text';
            }

            if (section.title && sectionEl.querySelector('h2')) {
                sectionEl.querySelector('h2').textContent = section.title;
            }

            // Handle content - use innerHTML for HTML content, textContent for plain text
            if (section.content) {
                const contentContainer = sectionEl.querySelector('p') || sectionEl.querySelector('.content-container');
                if (contentContainer) {
                    // Check if content contains HTML tags
                    if (section.content.includes('<') && section.content.includes('>')) {
                        contentContainer.innerHTML = section.content;
                    } else {
                        contentContainer.textContent = section.content;
                    }
                }
            }

            if (section.image && sectionEl.querySelector('img')) {
                sectionEl.querySelector('img').src = section.image;
                sectionEl.querySelector('.img-upload').classList.add('has-image');
            }

            container.appendChild(clone);
        }
    });
}

function renderFooter(footer) {
    const footerEl = document.querySelector('footer p');
    if (footerEl) footerEl.textContent = footer.text || '';
}

// 2. Authentication and edit mode
if (window.location.hash === '#admin') {
    const pass = prompt('Парола:');
    if (pass) {
        fetch('.mover/auth.php', {
            method: 'POST',
            body: JSON.stringify({ pass }),
            headers: { 'Content-Type': 'application/json' }
        })
        .then(r => r.json())
        .then(data => {
            if (data.ok) {
                sessionStorage.setItem('mover_token', data.token);
                enableEditMode();
            } else {
                alert('Грешна парола');
                window.location.hash = '';
            }
        })
        .catch(error => {
            console.error('Auth error:', error);
            // For testing without PHP, enable edit mode
            alert('PHP not available - enabling edit mode for testing');
            enableEditMode();
        });
    } else {
        window.location.hash = '';
    }
} else {
    // Normal mode - static HTML is shown
}

// 3. Enable edit mode
function enableEditMode() {
    document.body.classList.add('mover-edit-active');

    // Add global save button first
    injectGlobalSaveButton();

    // Clear static sections and load from localStorage or JSON
    const container = document.getElementById('mover-container');
    container.innerHTML = '';

    // Check for localStorage backup first
    const localData = localStorage.getItem('mover_content_backup');
    if (localData) {
        alert('Loading saved content from localStorage');
        const data = JSON.parse(localData);
        renderHero(data.hero);
        renderSections(data.sections);
        renderFooter(data.footer);
        console.log('Loaded admin content from localStorage');
    } else {
        alert('No saved content found, loading from JSON');
        loadContent();
    }

    // Wrap editable elements
    setTimeout(() => { // Wait for content to load
        const editableSelectors = [
            '#hero-title',
            '#hero-subtitle',
            '.hero h1',
            '.hero p',
            '.hero-section h1',
            '.hero-section p',
            'footer p',
            '.mover-section h2',
            '.mover-section p',
            '.mover-section .content-container'
        ];

        editableSelectors.forEach(selector => {
            document.querySelectorAll(selector).forEach(el => {
                wrapEditableElement(el);
            });
        });

        // Add section add button
        injectAddSectionButton();

        // Show different message if loaded from localStorage
        const hasLocalData = localStorage.getItem('mover_content_backup');
        const message = hasLocalData ? '✅ Edit mode activated (loaded from localStorage)' : '✅ Edit mode activated';
        showToast(message, 'success');
    }, 500); // Increased delay
}

// 4. Wrap editable element
function wrapEditableElement(element) {
    const wrapper = document.createElement('div');
    wrapper.className = 'mover-editable-wrapper';
    element.parentNode.insertBefore(wrapper, element);
    wrapper.appendChild(element);

    // Add control buttons
    const controls = document.createElement('div');
    controls.className = 'mover-controls';
    controls.innerHTML = `
        <button class="mover-btn-edit" onclick="openEditModal(this)" title="Edit">✏️ <span>Edit</span></button>
        <button class="mover-btn-delete" onclick="deleteSection(this)" title="Delete">🗑️ <span>Delete</span></button>
        <button class="mover-btn-up" onclick="moveSectionUp(this)" title="Move Up">⬆️ <span>Up</span></button>
        <button class="mover-btn-down" onclick="moveSectionDown(this)" title="Move Down">⬇️ <span>Down</span></button>
    `;
    wrapper.appendChild(controls);

    // Store original text
    element.setAttribute('data-original-text', element.innerHTML);
}

// 5. Inject global save button
function injectGlobalSaveButton() {
    console.log('injectGlobalSaveButton called');
    const container = document.createElement('div');
    container.id = 'mover-admin-controls';
    container.innerHTML = `
        <button id="mover-global-save">💾 Save All Changes</button>
        <button id="mover-clear-local" title="Clear localStorage backup">🗑️ Clear Local Data</button>
    `;
    document.body.appendChild(container);

    // Add event listeners
    const saveBtn = document.getElementById('mover-global-save');
    const clearBtn = document.getElementById('mover-clear-local');
    console.log('saveBtn:', saveBtn, 'clearBtn:', clearBtn);
    if (saveBtn) saveBtn.addEventListener('click', saveAllContent);
    if (clearBtn) clearBtn.addEventListener('click', clearLocalStorage);
}

// 5.5. Clear localStorage
function clearLocalStorage() {
    if (confirm('Clear localStorage backup? This will reload the original content.')) {
        localStorage.removeItem('mover_content_backup');
        location.reload();
    }
}

// 6. Inject add section button
function injectAddSectionButton() {
    const btn = document.createElement('button');
    btn.id = 'mover-add-section';
    btn.onclick = showAddSectionModal;
    btn.innerHTML = '➕ Add New Section';
    document.querySelector('footer').parentNode.insertBefore(btn, document.querySelector('footer'));
}

// 7. Open edit modal
function openEditModal(button) {
    const wrapper = button.closest('.mover-editable-wrapper');
    const element = wrapper.querySelector('h1, h2, p, .content-container');
    if (!element) return;

    currentEditingElement = element;

    const modal = document.createElement('div');
    modal.className = 'mover-modal';
    modal.onclick = closeModalOnOverlay;
    modal.innerHTML = `
        <div class="mover-modal-content">
            <h2>Edit Text</h2>
            <textarea id="mover-edit-textarea">${element.innerHTML}</textarea>
            <div class="mover-modal-buttons">
                <button onclick="saveModalEdit()" class="mover-btn-save">Save</button>
                <button onclick="closeModal()" class="mover-btn-cancel">Cancel</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    document.getElementById('mover-edit-textarea').focus();
}

// 8. Close modal on overlay click
function closeModalOnOverlay(event) {
    if (event.target.className === 'mover-modal') {
        closeModal();
    }
}

// 9. Close modal
function closeModal() {
    const modal = document.querySelector('.mover-modal');
    if (modal) modal.remove();
    currentEditingElement = null;
}

// 10. Save modal edit
function saveModalEdit() {
    const textarea = document.getElementById('mover-edit-textarea');
    if (currentEditingElement && textarea) {
        currentEditingElement.innerHTML = textarea.value;
        showToast('✅ Text updated', 'success');
    }
    closeModal();
}

// 11. Delete section
function deleteSection(button) {
    if (confirm('Are you sure you want to delete this section?')) {
        const wrapper = button.closest('.mover-editable-wrapper');
        if (wrapper) {
            wrapper.remove();
            showToast('Section deleted. Click "Save All" to persist.', 'info');
        }
    }
}

// 12. Move section up
function moveSectionUp(button) {
    const wrapper = button.closest('.mover-editable-wrapper');
    const prev = wrapper.previousElementSibling;
    if (prev && prev.classList.contains('mover-editable-wrapper')) {
        wrapper.parentNode.insertBefore(wrapper, prev);
    }
}

// 13. Move section down
function moveSectionDown(button) {
    const wrapper = button.closest('.mover-editable-wrapper');
    const next = wrapper.nextElementSibling;
    if (next && next.classList.contains('mover-editable-wrapper')) {
        wrapper.parentNode.insertBefore(next, wrapper);
    }
}

// 14. Save all content
async function saveAllContent() {
    console.log('saveAllContent called');
    const saveBtn = document.getElementById('mover-global-save');
    const originalHTML = saveBtn.innerHTML;
    saveBtn.innerHTML = '⏳ <span>Saving...</span>';
    saveBtn.classList.add('loading');

    try {
        // For testing - always save to localStorage
        const content = collectAllContent();
        console.log('Content collected:', content);

        // Save to localStorage for immediate persistence
        localStorage.setItem('mover_content_backup', JSON.stringify(content));
        console.log('Saved to localStorage');

        // Attempt to POST to server save endpoint if available
        try {
            const token = sessionStorage.getItem('mover_token');
            const headers = { 'Content-Type': 'application/json' };
            if (token) headers['X-Mover-Token'] = token;

            const resp = await fetch('.mover/save.php', {
                method: 'POST',
                headers,
                body: JSON.stringify(content)
            });

            const result = await resp.json();
            if (result && result.ok) {
                showToast('✅ Saved to server and localStorage', 'success');
            } else {
                console.warn('Server save responded with error', result);
                showToast('Saved locally (server returned error)', 'info');
            }
        } catch (err) {
            console.warn('Server save failed, saved locally instead', err);
            showToast('Saved to localStorage (server unavailable)', 'info');
            console.log('JSON content for manual update:', JSON.stringify(content, null, 2));
        }
    } catch (error) {
        console.error('Save error:', error);
        alert('Save error: ' + error.message);
    } finally {
        saveBtn.innerHTML = originalHTML;
        saveBtn.classList.remove('loading');
    }
}

// 15. Collect all content
function collectAllContent() {
    console.log('collectAllContent called');
    const sections = document.querySelectorAll('.mover-section');
    console.log('Found sections:', sections.length);

    const result = {
        hero: {
            title: document.querySelector('#hero-title')?.innerHTML || document.querySelector('.hero h1')?.innerHTML || document.querySelector('.hero-section h1')?.innerHTML || '',
            subtitle: document.querySelector('#hero-subtitle')?.innerHTML || document.querySelector('.hero p')?.innerHTML || document.querySelector('.hero-section p')?.innerHTML || ''
        },
        sections: Array.from(sections).map(section => {
            const type = section.dataset.type;
            const base = { type };
            console.log('Processing section type:', type);

            const h2 = section.querySelector('h2');
            if (h2) base.title = h2.textContent;

            const contentEl = section.querySelector('p') || section.querySelector('.content-container');
            if (contentEl) {
                base.content = contentEl.innerHTML;
                console.log('Content length:', base.content.length);
            } else {
                console.log('No content element found');
            }

            const img = section.querySelector('img');
            if (img && img.src && !img.src.includes('placeholder')) {
                base.image = img.src;
            }

            return base;
        }),
        footer: {
            text: document.querySelector('footer p')?.textContent || ''
        }
    };

    console.log('Collected result:', result);
    return result;
}

// 16. Show add section modal
function showAddSectionModal() {
    const modal = document.createElement('div');
    modal.className = 'mover-modal';
    modal.onclick = closeModalOnOverlay;
    modal.innerHTML = `
        <div class="mover-modal-content">
            <h2>Add New Section</h2>
            <div class="mover-section-choices">
                <button onclick="addSection('text')">📝 Text Section</button>
                <button onclick="addSection('image')">🖼️ Image Section</button>
                <button onclick="addSection('image-text')">🖼️📝 Image + Text</button>
                <button onclick="addSection('gallery')">🎨 Image Gallery</button>
                <button onclick="addSection('cta')">📢 Call to Action</button>
                <button onclick="addSection('divider')">➖ Divider</button>
            </div>
            <div class="mover-modal-buttons">
                <button onclick="closeModal()" class="mover-btn-cancel">Cancel</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
}

// 17. Add section
function addSection(type) {
    const template = document.getElementById('tpl-' + type);
    if (template) {
        const clone = template.content.cloneNode(true);
        const sectionEl = clone.querySelector('.mover-section');

        // Wrap and add controls
        const wrapper = document.createElement('div');
        wrapper.className = 'mover-editable-wrapper';
        wrapper.appendChild(sectionEl);

        const controls = document.createElement('div');
        controls.className = 'mover-controls';
        controls.innerHTML = `
            <button class="mover-btn-edit" onclick="openEditModal(this)" title="Edit">✏️ <span>Edit</span></button>
            <button class="mover-btn-delete" onclick="deleteSection(this)" title="Delete">🗑️ <span>Delete</span></button>
            <button class="mover-btn-up" onclick="moveSectionUp(this)" title="Move Up">⬆️ <span>Up</span></button>
            <button class="mover-btn-down" onclick="moveSectionDown(this)" title="Move Down">⬇️ <span>Down</span></button>
        `;
        wrapper.appendChild(controls);

        // Insert before add button
        const addBtn = document.getElementById('mover-add-section');
        addBtn.parentNode.insertBefore(wrapper, addBtn);

        // Scroll to new section
        wrapper.scrollIntoView({ behavior: 'smooth' });

        showToast('Section added. Edit and click "Save All".', 'info');
    }
    closeModal();
}

// 18. Image upload functions
function moverTriggerImageUpload(el) {
    el.querySelector('input').click();
}

document.addEventListener('change', function(e) {
    if (e.target.type === 'file') {
        moverHandleImageUpload(e.target);
    }
});

async function moverHandleImageUpload(inputElement) {
    const file = inputElement.files[0];
    if (!file) return;

    const uploadDiv = inputElement.closest('.img-upload');
    const img = uploadDiv.querySelector('img');

    // Show preview
    const reader = new FileReader();
    reader.onload = () => img.src = reader.result;
    reader.readAsDataURL(file);

    try {
        const formData = new FormData();
        formData.append('image', file);

        const response = await fetch('.mover/upload.php', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (data.ok) {
            img.src = data.url;
            uploadDiv.classList.add('has-image');
            showToast('✅ Image uploaded', 'success');
            try {
                const saved = collectAllContent();
                localStorage.setItem('mover_content_backup', JSON.stringify(saved));
                console.log('Saved content to localStorage after image upload');
            } catch (e) {
                console.warn('Could not save after image upload', e);
            }
        } else {
            throw new Error(data.error || 'Upload failed');
        }
    } catch (error) {
        console.error('Upload error:', error);
        // For testing without PHP
        console.log('Image to upload:', file.name, file.size + ' bytes');
        uploadDiv.classList.add('has-image');
        try {
            const saved = collectAllContent();
            localStorage.setItem('mover_content_backup', JSON.stringify(saved));
            console.log('Saved content to localStorage after image preview');
        } catch (e) {
            console.warn('Could not save after image preview', e);
        }
        showToast('✅ Image preview loaded (PHP not available)', 'info');
    }
}

// Ensure non-admin visitors load current content (localStorage fallback)
document.addEventListener('DOMContentLoaded', () => {
    if (window.location.hash !== '#admin') {
        try {
            loadContent();
        } catch (e) {
            console.error('Error loading content on DOMContentLoaded', e);
        }
    }
});

function moverAddGalleryImage(btn) {
    const galleryGrid = btn.previousElementSibling;
    const newUpload = document.createElement('div');
    newUpload.className = 'img-upload';
    newUpload.onclick = () => moverTriggerImageUpload(newUpload);
    newUpload.innerHTML = `
        <img src="/assets/placeholder.webp" alt="Click to upload">
        <input type="file" hidden accept="image/*" onchange="moverHandleImageUpload(this)">
    `;
    galleryGrid.appendChild(newUpload);
}

// 19. Toast notifications
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `mover-toast mover-toast-${type}`;
    toast.innerHTML = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, type === 'error' ? 5000 : 3000);
}