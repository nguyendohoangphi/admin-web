import { db } from './firebase-config.js';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, orderBy } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const tableBody = document.getElementById('tagsTableBody');
const modal = document.getElementById('tagModal');
const btnAdd = document.getElementById('btn-add-tag');
const btnSave = document.getElementById('btn-save-tag');
const closeBtns = document.querySelectorAll('.close-modal, .close-modal-btn');

let isEditing = false;
let currentTagId = null;

// ==================== LOAD & DISPLAY ====================
async function loadTags() {
    tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Đang tải...</td></tr>';

    try {
        const q = query(collection(db, "Tags"), orderBy("createDate", "desc"));
        const querySnapshot = await getDocs(q);

        tableBody.innerHTML = '';
        let index = 1;

        if (querySnapshot.empty) {
            tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Chưa có tag nào.</td></tr>';
            return;
        }

        querySnapshot.forEach((docSnap) => {
            const tag = docSnap.data();
            const row = document.createElement('tr');

            row.innerHTML = `
                <td>${index++}</td>
                <td style="font-weight: 500;">${tag.name}</td>
                <td><code style="background:#f1f5f9; padding: 2px 6px; border-radius: 4px;">${tag.slug}</code></td>
                <td>${new Date(tag.createDate).toLocaleDateString('vi-VN')}</td>
                <td style="text-align: right;">
                    <div class="action-buttons" style="justify-content: flex-end;">
                        <button class="btn-icon edit-btn" data-id="${docSnap.id}" data-name="${tag.name}" data-slug="${tag.slug}">
                            <span class="material-icons-round">edit</span>
                        </button>
                        <button class="btn-icon delete-btn" data-id="${docSnap.id}">
                            <span class="material-icons-round" style="color:#ef4444;">delete</span>
                        </button>
                    </div>
                </td>
            `;
            tableBody.appendChild(row);
        });

        attachEventListeners();

    } catch (error) {
        console.error("Error loading tags:", error);
        tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:red;">Lỗi: ${error.message}</td></tr>`;
    }
}

function attachEventListeners() {
    // Edit Buttons
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.onclick = () => {
            isEditing = true;
            currentTagId = btn.dataset.id;
            document.getElementById('modalTitle').innerText = "Chỉnh sửa Tag";
            document.getElementById('tagName').value = btn.dataset.name;
            document.getElementById('tagSlug').value = btn.dataset.slug;
            modal.style.display = 'flex';
        };
    });

    // Delete Buttons
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.onclick = async () => {
            if (confirm("Bạn có chắc muốn xóa tag này?")) {
                try {
                    await deleteDoc(doc(db, "Tags", btn.dataset.id));
                    loadTags();
                } catch (error) {
                    alert("Lỗi khi xóa: " + error.message);
                }
            }
        };
    });
}

// ==================== ADD / UPDATE ====================
btnAdd.onclick = () => {
    isEditing = false;
    currentTagId = null;
    document.getElementById('modalTitle').innerText = "Thêm Tag Mới";
    document.getElementById('tagName').value = '';
    document.getElementById('tagSlug').value = '';
    modal.style.display = 'flex';
};

btnSave.onclick = async () => {
    const name = document.getElementById('tagName').value.trim();
    let slug = document.getElementById('tagSlug').value.trim();

    if (!name || !slug) {
        alert("Vui lòng nhập tên và mã slug!");
        return;
    }

    // Auto format slug: lowercase, no spaces
    slug = slug.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    const btnText = btnSave.innerText;
    btnSave.disabled = true;
    btnSave.innerText = "Đang lưu...";

    try {
        const tagData = {
            name: name,
            slug: slug,
            lastUpdate: new Date().toISOString()
        };

        if (isEditing) {
            await updateDoc(doc(db, "Tags", currentTagId), tagData);
        } else {
            tagData.createDate = new Date().toISOString();
            await addDoc(collection(db, "Tags"), tagData);
        }

        modal.style.display = 'none';
        loadTags();

    } catch (error) {
        console.error(error);
        alert("Lỗi: " + error.message);
    } finally {
        btnSave.disabled = false;
        btnSave.innerText = btnText;
    }
};

// ==================== MODAL HELPERS ====================
closeBtns.forEach(btn => btn.onclick = () => modal.style.display = 'none');
window.onclick = (e) => { if (e.target == modal) modal.style.display = 'none'; };

// ==================== AUTO GENERATE SLUG ====================
document.getElementById('tagName').oninput = (e) => {
    if (!isEditing) { // Only auto-gen when adding new
        const val = e.target.value;
        const slug = val.toLowerCase()
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Remove accents
            .replace(/\s+/g, '-') // Replace spaces with -
            .replace(/[đĐ]/g, 'd')
            .replace(/[^a-z0-9-]/g, ''); // Remove special chars

        document.getElementById('tagSlug').value = slug;
    }
};

// Start
document.addEventListener('DOMContentLoaded', loadTags);
