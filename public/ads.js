import { db } from './firebase-config.js';
import { collection, getDocs, doc, deleteDoc, setDoc, updateDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const listElement = document.getElementById('ads-list');
const loading = document.getElementById('loading');
const searchInput = document.getElementById('searchInput');

let allAds = [];

const modal = document.getElementById('adModal');
const btnAdd = document.getElementById('btn-add-ad');
const btnClose = document.getElementById('btn-close-modal');
const form = document.getElementById('adForm');
const modalTitle = document.getElementById('modal-title');
const fileInput = document.getElementById('a-file');
const imageUrlInput = document.getElementById('a-imageUrl');

let isEditMode = false;
let editId = null;

if (btnAdd) btnAdd.onclick = () => {
    isEditMode = false;
    modalTitle.textContent = "Thêm banner mới";
    form.reset();
    modal.style.display = "flex";
};

if (btnClose) btnClose.onclick = () => { modal.style.display = "none"; };
window.onclick = (event) => { if (event.target == modal) modal.style.display = "none"; };

// Simple upload handler if user selects a file
if (fileInput) {
    fileInput.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('image', file);

        try {
            const response = await fetch('/upload?folder=images/banner', {
                method: 'POST',
                body: formData
            });
            const result = await response.json();
            if (result.path) {
                // Force the path to be in assets/images/banner/ as requested
                const fileName = result.path.split('/').pop();
                imageUrlInput.value = 'assets/images/banner/' + fileName;
            }
        } catch (error) {
            console.error("Upload error:", error);
            alert("Lỗi tải ảnh lên.");
        }
    };
}

if (form) {
    form.onsubmit = async (e) => {
        e.preventDefault();

        const name = document.getElementById('a-name').value;
        const imageUrl = document.getElementById('a-imageUrl').value;

        try {
            const adData = {
                name: name,
                imageUrl: imageUrl,
                createDate: isEditMode ? allAds.find(a => a.id === editId).createDate : new Date().toISOString()
            };

            if (!isEditMode) {
                const adRef = doc(collection(db, "Ads"));
                await setDoc(adRef, { ...adData, id: adRef.id });
                alert("Thêm banner thành công!");
            } else {
                // Use setDoc with merge: true to avoid "No document to update" error
                // and ensure the id is also saved inside the document
                await setDoc(doc(db, "Ads", editId), { ...adData, id: editId }, { merge: true });
                alert("Cập nhật banner thành công!");
            }

            // Reset state
            isEditMode = false;
            editId = null;
            modal.style.display = "none";
            form.reset();
        } catch (error) {
            console.error("Error saving ad: ", error);
            alert("Lỗi: " + error.message);
        }
    };
}

if (searchInput) {
    searchInput.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        const filtered = allAds.filter(ad =>
            ad.name.toLowerCase().includes(term)
        );
        renderTable(filtered);
    });
}

function loadAds() {
    loading.style.display = 'block';

    onSnapshot(collection(db, "Ads"), (querySnapshot) => {
        loading.style.display = 'none';

        if (querySnapshot.empty) {
            listElement.innerHTML = '<tr><td colspan="4" style="text-align:center">Chưa có banner nào.</td></tr>';
            allAds = [];
            return;
        }

        allAds = [];
        querySnapshot.forEach(doc => {
            const data = doc.data();
            // Ensure document ID (doc.id) takes precedence over any internal 'id' field
            allAds.push({ ...data, id: doc.id });
        });

        // Sort by createDate desc
        allAds.sort((a, b) => new Date(b.createDate) - new Date(a.createDate));

        renderTable(allAds);
    }, (error) => {
        console.error("Error loading ads:", error);
        loading.textContent = 'Lỗi tải dữ liệu: ' + error.message;
    });
}

function renderTable(ads) {
    listElement.innerHTML = '';
    ads.forEach((data) => {
        const row = document.createElement('tr');

        let imgSrc = data.imageUrl || 'https://placehold.co/200x100';
        if (!imgSrc.startsWith('http') && !imgSrc.startsWith('assets')) {
            imgSrc = 'assets/' + imgSrc;
        }

        row.innerHTML = `
            <td><img src="${imgSrc}" alt="" style="width: 120px; height: 60px; object-fit: cover; border-radius: 8px;"></td>
            <td class="fw-bold">${data.name}</td>
            <td>${new Date(data.createDate).toLocaleString('vi-VN')}</td>
            <td>
                <button class="btn-icon btn-delete" data-id="${data.id}">
                    <span class="material-icons-round">delete</span>
                </button>
                <button class="btn-icon btn-edit" onclick="editAd('${data.id}')">
                    <span class="material-icons-round">edit</span>
                </button>
            </td>
        `;
        listElement.appendChild(row);
    });

    document.querySelectorAll('.btn-delete').forEach(btn => {
        btn.onclick = async () => {
            const id = btn.getAttribute('data-id');
            if (confirm('Xóa banner này?')) {
                try {
                    await deleteDoc(doc(db, "Ads", id));
                    alert('Đã xóa!');
                } catch (e) {
                    alert('Lỗi: ' + e.message);
                }
            }
        };
    });
}

window.editAd = (id) => {
    const ad = allAds.find(a => a.id === id);
    if (!ad) return;

    isEditMode = true;
    editId = id;
    modalTitle.textContent = "Cập nhật banner";

    document.getElementById('a-name').value = ad.name;
    document.getElementById('a-imageUrl').value = ad.imageUrl;

    modal.style.display = "flex";
};

document.addEventListener('DOMContentLoaded', loadAds);
