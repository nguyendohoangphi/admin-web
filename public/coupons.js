import { db } from './firebase-config.js';
import { collection, doc, setDoc, deleteDoc, onSnapshot, query, orderBy } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const couponList = document.getElementById('coupon-list');
const loading = document.getElementById('loading');
const searchInput = document.getElementById('searchInput');

const modal = document.getElementById('couponModal');
const btnAdd = document.getElementById('btn-add-coupon');
const btnClose = document.getElementById('btn-close-modal');
const form = document.getElementById('couponForm');
const modalTitle = document.getElementById('modal-title');

let allCoupons = [];
let isEditMode = false;
let editId = null;

// Modal Logic
if (btnAdd) {
    btnAdd.onclick = () => {
        isEditMode = false;
        editId = null;
        modalTitle.textContent = "Thêm mã giảm giá mới";
        form.reset();
        document.getElementById('status-group').style.display = 'none';
        modal.style.display = "flex";

        // Set default expiry date to 30 days from now
        const defaultExpiry = new Date();
        defaultExpiry.setDate(defaultExpiry.getDate() + 30);
        document.getElementById('cp-expiry').value = defaultExpiry.toISOString().split('T')[0];
    };
}

if (btnClose) btnClose.onclick = () => { modal.style.display = "none"; };
window.onclick = (event) => { if (event.target == modal) modal.style.display = "none"; };

// CRUD Operations
if (form) {
    form.onsubmit = async (e) => {
        e.preventDefault();

        const code = document.getElementById('cp-code').value.trim().toUpperCase();
        const discount = parseInt(document.getElementById('cp-discount').value);
        const expiryDate = document.getElementById('cp-expiry').value;
        const isActive = isEditMode ? (document.getElementById('cp-status').value === 'true') : true;

        try {
            const couponData = {
                code: code,
                discount: discount,
                expiryDate: expiryDate, // YYYY-MM-DD
                isActive: isActive,
                createDate: isEditMode ? allCoupons.find(c => c.id === editId).createDate : new Date().toISOString()
            };

            if (!isEditMode) {
                // Check if code already exists
                const existing = allCoupons.find(c => c.code === code);
                if (existing) {
                    alert("Mã code này đã tồn tại!");
                    return;
                }
                const cpRef = doc(collection(db, "Coupons"));
                await setDoc(cpRef, { ...couponData, id: cpRef.id });
                alert("Thêm mã giảm giá thành công!");
            } else {
                await setDoc(doc(db, "Coupons", editId), { ...couponData, id: editId }, { merge: true });
                alert("Cập nhật mã giảm giá thành công!");
            }

            modal.style.display = "none";
            form.reset();
        } catch (error) {
            console.error("Error saving coupon:", error);
            alert("Lỗi: " + error.message);
        }
    };
}

// Load Data
function loadCoupons() {
    loading.style.display = 'block';
    const q = query(collection(db, "Coupons"), orderBy("createDate", "desc"));

    onSnapshot(q, (snapshot) => {
        loading.style.display = 'none';
        allCoupons = [];
        snapshot.forEach(doc => {
            allCoupons.push({ ...doc.data(), id: doc.id });
        });
        renderTable(allCoupons);
    }, (error) => {
        console.error("Load error:", error);
        loading.innerHTML = "Lỗi tải dữ liệu: " + error.message;
    });
}

function renderTable(coupons) {
    couponList.innerHTML = '';
    const now = new Date().toISOString().split('T')[0];

    coupons.forEach(cp => {
        const isExpired = cp.expiryDate < now;
        const statusText = isExpired ? '<span class="badge" style="background:#EF4444; color:white;">Quá hạn</span>' :
            (cp.isActive ? '<span class="badge" style="background:#10B981; color:white;">Hoạt động</span>' :
                '<span class="badge" style="background:#6B7280; color:white;">Đang ẩn</span>');

        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="fw-bold text-primary">${cp.code}</td>
            <td>${cp.discount}%</td>
            <td class="text-xs">${new Date(cp.createDate).toLocaleDateString('vi-VN')}</td>
            <td>${new Date(cp.expiryDate).toLocaleDateString('vi-VN')}</td>
            <td>${statusText}</td>
            <td>
                <button class="btn-icon" onclick="editCoupon('${cp.id}')">
                    <span class="material-icons-round">edit</span>
                </button>
                <button class="btn-icon text-red" onclick="deleteCoupon('${cp.id}')">
                    <span class="material-icons-round">delete</span>
                </button>
            </td>
        `;
        couponList.appendChild(row);
    });
}

// Interactions
window.editCoupon = (id) => {
    const cp = allCoupons.find(c => c.id === id);
    if (!cp) return;

    isEditMode = true;
    editId = id;
    modalTitle.textContent = "Chỉnh sửa mã giảm giá";

    document.getElementById('cp-code').value = cp.code;
    document.getElementById('cp-discount').value = cp.discount;
    document.getElementById('cp-expiry').value = cp.expiryDate;
    document.getElementById('cp-status').value = cp.isActive.toString();
    document.getElementById('status-group').style.display = 'block';

    modal.style.display = "flex";
};

window.deleteCoupon = async (id) => {
    if (confirm("Bạn có chắc chắn muốn xóa mã giảm giá này?")) {
        try {
            await deleteDoc(doc(db, "Coupons", id));
            alert("Đã xóa mã giảm giá.");
        } catch (error) {
            console.error(error);
            alert("Lỗi khi xóa.");
        }
    }
};

// Search Logic
if (searchInput) {
    searchInput.addEventListener('input', (e) => {
        const term = e.target.value.toUpperCase();
        const filtered = allCoupons.filter(c => c.code.includes(term));
        renderTable(filtered);
    });
}

document.addEventListener('DOMContentLoaded', loadCoupons);
