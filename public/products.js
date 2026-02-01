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
    modal.style.display = "flex";
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

        const querySnapshot = await getDocs(collection(db, "Products"));

        loading.style.display = 'none';

        if (querySnapshot.empty) {
            productList.innerHTML = '<tr><td colspan="6" style="text-align:center">Chưa có sản phẩm nào.</td></tr>';
            return;
        }

        allProducts = [];
        querySnapshot.forEach(doc => {
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
                <div class="rating">
                    <span class="material-icons-round start-icon">star</span>
                    ${data.rating ? data.rating.toFixed(1) : 'N/A'} (${data.reviewCount || 0})
                </div>
            </td>
            <td>
                <button class="btn-icon btn-delete" data-id="${data.id}">
                    <span class="material-icons-round">delete</span>
                </button>
                <button class="btn-icon btn-edit" onclick="editProduct('${data.id}')">
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
    });
}

window.editProduct = (id) => {
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
