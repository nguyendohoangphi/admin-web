import { db } from './firebase-config.js';
import { collection, getDocs, doc, deleteDoc, addDoc, updateDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const productList = document.getElementById('product-list');
const loading = document.getElementById('loading');
const searchInput = document.getElementById('searchInput');

let allProducts = [];


const modal = document.getElementById('addProductModal');
const btnAdd = document.getElementById('btn-add-product');
const btnClose = document.getElementById('btn-close-modal');
const form = document.getElementById('addProductForm');
const modalTitle = document.querySelector('#addProductModal h2');
const fileInput = document.getElementById('p-file');
const imageUrlInput = document.getElementById('p-image');

let isEditMode = false;
let editId = null;
// Tags Logic
let allTags = [];

async function loadTagsForForm() {
    const tagsContainer = document.getElementById('tags-container');
    if (!tagsContainer) {
        console.error("Tags container not found!");
        return;
    }

    try {
        const snap = await getDocs(collection(db, "Tags"));
        allTags = [];
        snap.forEach(d => allTags.push(d.data()));

        tagsContainer.innerHTML = '';
        if (allTags.length === 0) {
            tagsContainer.innerHTML = '<small style="color:grey;">Chưa có tag nào. Hãy tạo tag trước.</small>';
            return;
        }

        allTags.forEach(tag => {
            const wrapper = document.createElement('label');
            wrapper.style = "display: flex; align-items: center; gap: 5px; cursor: pointer; background: #f8fafc; padding: 4px 8px; border-radius: 4px; border: 1px solid #e2e8f0; font-size: 13px;";
            wrapper.innerHTML = `
                <input type="checkbox" name="product-tags" value="${tag.slug}">
                <span>${tag.name}</span>
            `;
            tagsContainer.appendChild(wrapper);
        });

    } catch (e) {
        console.error("Tags error:", e);
        tagsContainer.innerHTML = '<small style="color:red;">Lỗi tải tags</small>';
    }
}

// Helper to get selected tags
function getSelectedTags() {
    const checkboxes = document.getElementsByName('product-tags');
    const selected = [];
    checkboxes.forEach(cb => {
        if (cb.checked) selected.push(cb.value);
    });
    return selected;
}

// Helper to set selected tags
function setSelectedTags(tags = []) {
    const checkboxes = document.getElementsByName('product-tags');
    checkboxes.forEach(cb => {
        cb.checked = tags.includes(cb.value);
    });
}


// Handle file upload
if (fileInput) {
    fileInput.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('image', file);

        try {
            const response = await fetch('/upload?folder=images/drink/product', {
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
    modalTitle.textContent = "Thêm sản phẩm mới";
    form.reset();
    setSelectedTags([]); // Clear tags
    modal.style.display = "flex";
    loadTagsForForm(); // Load tags when opening modal
};
if (btnClose) btnClose.onclick = () => { modal.style.display = "none"; };
window.onclick = (event) => { if (event.target == modal) modal.style.display = "none"; };


if (form) {
    form.onsubmit = async (e) => {
        e.preventDefault();

        const name = document.getElementById('p-name').value;
        const category = document.getElementById('p-category').value;
        const price = parseFloat(document.getElementById('p-price').value);
        const image = document.getElementById('p-image').value;
        const desc = document.getElementById('p-desc').value;

        try {
            const productData = {
                name: name,
                imageUrl: image,
                description: desc,
                price: price,
                type: category,
                tags: getSelectedTags(), // Save tags
                createDate: isEditMode ? allProducts.find(p => p.id === editId).createDate : new Date().toISOString()
            };

            if (!isEditMode) {
                // New product
                productData.rating = 5.0;
                productData.reviewCount = 0;
                const docRef = doc(collection(db, "Products"));
                await setDoc(docRef, { ...productData, id: docRef.id });
                alert("Thêm sản phẩm thành công!");
            } else {
                // Update existing
                await setDoc(doc(db, "Products", editId), { ...productData, id: editId }, { merge: true });
                alert("Cập nhật sản phẩm thành công!");
            }

            // Reset state
            isEditMode = false;
            editId = null;
            modal.style.display = "none";
            form.reset();
            loadProducts();

        } catch (error) {
            console.error("Error saving product: ", error);
            alert("Lỗi: " + error.message);
        }
    };
}


if (searchInput) {
    searchInput.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        const filtered = allProducts.filter(p =>
            p.name.toLowerCase().includes(term) ||
            p.type.toLowerCase().includes(term)
        );
        renderTable(filtered);
    });
}

async function loadProducts() {
    try {
        productList.innerHTML = '';
        loading.style.display = 'block';

        // Fetch Products and Tags in parallel
        const [prodSnap, tagSnap] = await Promise.all([
            getDocs(collection(db, "Products")),
            getDocs(collection(db, "Tags"))
        ]);

        // Process Tags
        allTags = [];
        tagSnap.forEach(d => allTags.push(d.data()));

        loading.style.display = 'none';

        if (prodSnap.empty) {
            productList.innerHTML = '<tr><td colspan="6" style="text-align:center">Chưa có sản phẩm nào.</td></tr>';
            return;
        }

        allProducts = [];
        prodSnap.forEach(doc => {
            const data = doc.data();
            allProducts.push({ ...data, id: doc.id });
        });
        renderTable(allProducts);

    } catch (error) {
        console.error(error);
        loading.textContent = 'Lỗi tải dữ liệu: ' + error.message;
    }
}

function renderTable(products) {
    productList.innerHTML = '';
    products.forEach((data) => {
        const row = document.createElement('tr');
        const price = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(data.price);
        let imgSrc = data.imageUrl;

        if (imgSrc && !imgSrc.startsWith('http')) {

        } else if (!imgSrc) {
            imgSrc = 'https://placehold.co/100';
        }

        row.innerHTML = `
            <td><img src="${imgSrc}" alt="" class="product-thumb"></td>
            <td class="fw-bold">${data.name}</td>
            <td class="text-primary">${price}</td>
            <td><span class="badge">${data.type}</span></td>
            <td>
                ${(data.tags || []).map(slug => `<span class="badge" style="background:#f1f5f9; color:#475569; margin-right:4px;">${getTagName(slug)}</span>`).join('')}
            </td>
            <td>
                <div class="rating">
                    <span class="material-icons-round start-icon">star</span>
                    ${data.rating ? data.rating.toFixed(1) : 'N/A'} (${data.reviewCount || 0})
                </div>
            </td>
            <td>
                <button class="btn-icon btn-delete" data-id="${data.id}">
                    <span class="material-icons-round">delete</span>
                </button>
                <button class="btn-icon btn-edit" data-id="${data.id}">
                    <span class="material-icons-round">edit</span>
                </button>
            </td>
        `;
        productList.appendChild(row);
    });


    document.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = btn.getAttribute('data-id');
            if (confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) {
                await deleteProduct(id);
            }
        });
    }); // Close btn-delete loop

    // Bind edit events
    document.querySelectorAll('.btn-edit').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-id');
            editProduct(id);
        });
    });
}

// Helper to look up tag name
function getTagName(slug) {
    const tag = allTags.find(t => t.slug === slug);
    return tag ? tag.name : slug;
}

// editProduct is no longer on window
async function editProduct(id) {
    const product = allProducts.find(p => p.id === id);
    if (!product) return;

    isEditMode = true;
    editId = id;
    modalTitle.textContent = "Cập nhật sản phẩm";

    document.getElementById('p-name').value = product.name;
    document.getElementById('p-category').value = product.type;
    document.getElementById('p-price').value = product.price;
    document.getElementById('p-image').value = product.imageUrl;
    document.getElementById('p-desc').value = product.description || '';



    // Load tags first, then select them
    await loadTagsForForm();
    setSelectedTags(product.tags || []);

    modal.style.display = "flex";
};

async function deleteProduct(id) {
    try {
        await deleteDoc(doc(db, "Products", id));
        alert('Đã xóa thành công!');
        loadProducts();
    } catch (error) {
        console.error(error);
        alert('Lỗi khi xóa: ' + error.message);
    }
}


document.addEventListener('DOMContentLoaded', loadProducts);
