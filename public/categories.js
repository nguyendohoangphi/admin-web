import { db } from './firebase-config.js';
import { collection, getDocs, doc, deleteDoc, setDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const listElement = document.getElementById('category-list');
const loading = document.getElementById('loading');
const searchInput = document.getElementById('searchInput');

let allCategories = [];


const modal = document.getElementById('addCategoryModal');
const btnAdd = document.getElementById('btn-add-category');
const btnClose = document.getElementById('btn-close-modal');
const form = document.getElementById('addCategoryForm');
const modalTitle = document.querySelector('#addCategoryModal h2');
const fileInput = document.getElementById('c-file');
const imageUrlInput = document.getElementById('c-image');
let isEditMode = false;
let editId = null;

// Handle file upload
if (fileInput) {
    fileInput.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('image', file);

        try {
            const response = await fetch('/upload?folder=images/drink/category', {
                method: 'POST',
                body: formData
            });
            const result = await response.json();
            if (result.path) {
                imageUrlInput.value = result.path;
            }
        } catch (error) {
            console.error("Upload error:", error);
            alert("Lỗi tải ảnh lên.");
        }
    };
}

if (btnAdd) btnAdd.onclick = () => {
    isEditMode = false;
    modalTitle.textContent = "Thêm danh mục mới";
    form.reset();
    document.getElementById('c-name').disabled = false;
    modal.style.display = "flex";
};
if (btnClose) btnClose.onclick = () => { modal.style.display = "none"; };
window.onclick = (event) => { if (event.target == modal) modal.style.display = "none"; };


if (form) {
    form.onsubmit = async (e) => {
        e.preventDefault();

        const displayName = document.getElementById('c-displayName').value;
        const name = document.getElementById('c-name').value;
        const image = document.getElementById('c-image').value;

        try {
            const catData = {
                name: name,
                displayName: displayName,
                imageUrl: image,
                createDate: isEditMode ? allCategories.find(c => c.id === editId).createDate : new Date().toISOString()
            };

            if (!isEditMode) {
                // New category
                const catRef = doc(collection(db, "Category"));
                await setDoc(catRef, { ...catData, id: catRef.id });
                alert("Thêm danh mục thành công!");
            } else {
                // Update existing
                await setDoc(doc(db, "Category", editId), { ...catData, id: editId }, { merge: true });
                alert("Cập nhật danh mục thành công!");
            }

            // Reset state
            isEditMode = false;
            editId = null;
            modal.style.display = "none";
            form.reset();
            loadCategories();

        } catch (error) {
            console.error("Error saving category: ", error);
            alert("Lỗi: " + error.message);
        }
    };
}


if (searchInput) {
    searchInput.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        const filtered = allCategories.filter(cat =>
            cat.displayName.toLowerCase().includes(term) ||
            cat.name.toLowerCase().includes(term)
        );
        renderTable(filtered);
    });
}

async function loadCategories() {
    try {
        listElement.innerHTML = '';
        loading.style.display = 'block';

        const querySnapshot = await getDocs(collection(db, "Category"));

        loading.style.display = 'none';

        if (querySnapshot.empty) {
            listElement.innerHTML = '<tr><td colspan="4" style="text-align:center">Chưa có danh mục nào.</td></tr>';
            return;
        }

        allCategories = [];
        querySnapshot.forEach(doc => {
            const data = doc.data();
            allCategories.push({ ...data, id: doc.id });
        });

        renderTable(allCategories);

    } catch (error) {
        console.error(error);
        loading.textContent = 'Lỗi tải dữ liệu: ' + error.message;
    }
}

function renderTable(categories) {
    listElement.innerHTML = '';
    categories.forEach((data) => {
        const row = document.createElement('tr');

        let imgSrc = data.imageUrl || 'https://placehold.co/100';
        if (!imgSrc.startsWith('http') && !imgSrc.startsWith('assets')) {
            imgSrc = 'assets/' + imgSrc;
        }

        row.innerHTML = `
            <td><img src="${imgSrc}" alt="" class="product-thumb"></td>
            <td class="fw-bold">${data.displayName}</td>
            <td>${data.name}</td>
            <td>
                <button class="btn-icon btn-delete" data-id="${data.id}">
                    <span class="material-icons-round">delete</span>
                </button>
                <button class="btn-icon btn-edit" onclick="editCategory('${data.id}')">
                    <span class="material-icons-round">edit</span>
                </button>
            </td>
        `;
        listElement.appendChild(row);
    });


    document.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = btn.getAttribute('data-id');
            if (confirm('Bạn có chắc chắn muốn xóa danh mục này? Lưu ý: Các sản phẩm thuộc danh mục này sẽ vẫn còn.')) {
                await deleteCategory(id);
            }
        });
    });
}

window.editCategory = (id) => {
    const cat = allCategories.find(c => c.id === id);
    if (!cat) return;

    isEditMode = true;
    editId = id;
    modalTitle.textContent = "Cập nhật danh mục";

    document.getElementById('c-displayName').value = cat.displayName;
    document.getElementById('c-name').value = cat.name;



    document.getElementById('c-name').value = cat.name;
    document.getElementById('c-image').value = cat.imageUrl;

    modal.style.display = "flex";
};

async function deleteCategory(id) {
    try {
        await deleteDoc(doc(db, "Category", id));
        alert('Đã xóa thành công!');
        loadCategories();
    } catch (error) {
        console.error(error);
        alert('Lỗi khi xóa: ' + error.message);
    }
}


document.addEventListener('DOMContentLoaded', loadCategories);
