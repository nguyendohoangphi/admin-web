import { db } from './firebase-config.js';
import { collection, getDocs, doc, updateDoc, orderBy, query, onSnapshot } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const listElement = document.getElementById('order-list');
const loading = document.getElementById('loading');
const searchInput = document.getElementById('searchInput');

let allOrders = [];


const detailModal = document.getElementById('orderDetailModal');
const btnCloseDetail = document.getElementById('btn-close-detail');
const detailContent = document.getElementById('order-detail-content');

if (btnCloseDetail) btnCloseDetail.onclick = () => detailModal.style.display = "none";
window.onclick = (event) => { if (event.target == detailModal) detailModal.style.display = "none"; };


if (searchInput) {
    searchInput.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        const filtered = allOrders.filter(o =>
            o.name.toLowerCase().includes(term) ||
            o.id.toLowerCase().includes(term) ||
            o.phone.toLowerCase().includes(term)
        );
        renderTable(filtered);
    });
}

// Real-time listener
function loadOrders() {
    loading.style.display = 'block';

    // Subscribe to real-time updates
    onSnapshot(collection(db, "Order"), (querySnapshot) => {
        loading.style.display = 'none';

        if (querySnapshot.empty) {
            listElement.innerHTML = '<tr><td colspan="7" style="text-align:center">Chưa có đơn hàng nào.</td></tr>';
            return;
        }

        allOrders = [];
        querySnapshot.forEach(doc => allOrders.push({ id: doc.id, ...doc.data() }));

        // Robust sorting function
        allOrders.sort((a, b) => {
            // Priority 1: Firestore Server Timestamp
            if (a.timestamp && b.timestamp) {
                // handle nulls or potential errors
                try {
                    return b.timestamp.toMillis() - a.timestamp.toMillis();
                } catch (e) { }
            }

            // Priority 2: Parse "dd/MM/yyyy – HH:mm:ss" string
            const parseDate = (str) => {
                if (!str) return 0;
                try {
                    // Match: 30/01/2026 - 16:04:54 or 30/01/2026 – 16:04:54
                    const parts = str.split(/[-–]/);
                    const datePart = parts[0].trim();
                    const timePart = parts[1] ? parts[1].trim() : "00:00:00";

                    const [d, m, y] = datePart.split('/').map(Number);
                    const [H, M, S] = timePart.split(':').map(Number);

                    return new Date(y, m - 1, d, H, M, S).getTime();
                } catch (e) {
                    return new Date(str).getTime() || 0;
                }
            };

            return parseDate(b.createDate) - parseDate(a.createDate);
        });

        renderTable(allOrders);
    }, (error) => {
        console.error("Error loading orders:", error);
        loading.textContent = 'Lỗi tải dữ liệu: ' + error.message;
    });
}

function renderTable(orders) {
    listElement.innerHTML = '';
    orders.forEach((data) => {
        const row = document.createElement('tr');

        const total = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(parseFloat(data.total) || 0);
        const statusClass = getStatusClass(data.statusOrder);

        row.innerHTML = `
            <td><span class="text-grey">#${data.id.substring(0, 8)}...</span></td>
            <td>
                <div class="fw-bold">${data.name}</div>
                <div class="text-xs text-grey">${data.phone}</div>
            </td>
            <td class="text-primary fw-bold">${total}</td>
            <td>${data.table}</td>
            <td>${formatDate(data.timeOrder)}</td>
            <td><span class="badge ${statusClass}">${data.statusOrder}</span></td>
            <td>
                <button class="btn-icon btn-view" onclick="viewOrderDetails('${data.id}')">
                    <span class="material-icons-round">visibility</span>
                </button>
                 <button class="btn-icon text-green" title="Hoàn thành" onclick="updateStatus('${data.id}', 'Finished')">
                    <span class="material-icons-round">check_circle</span>
                </button>
            </td>
        `;
        listElement.appendChild(row);
    });
}


window.viewOrderDetails = (orderId) => {
    const order = allOrders.find(o => o.id === orderId);
    if (!order) return;

    let itemsHtml = '';
    if (order.cartItems && order.cartItems.length > 0) {
        itemsHtml = `<table class="data-table" style="margin-top: 10px;">
                        <thead><tr style="background: #f8f9fa;"><th>Món</th><th>SL</th><th>Giá</th></tr></thead>
                        <tbody>`;
        order.cartItems.forEach(item => {
            const price = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.totalPrice || 0);

            const prodName = item.product ? item.product.name : 'Unknown Product';
            const prodDetails = `${item.size || ''}`;

            itemsHtml += `<tr>
                <td>${prodName} <br> <span class="text-xs text-grey">${prodDetails}</span></td>
                <td>x${item.quantity}</td>
                <td>${price}</td>
             </tr>`;
        });
        itemsHtml += `</tbody></table>`;
    } else {
        itemsHtml = '<p>Không có danh sách món (Old Data).</p>';
    }

    const noteHtml = order.note ? `<div style="margin-top: 15px; background: #fff7ed; padding: 10px; border-radius: 8px;"><strong>Ghi chú:</strong> ${order.note}</div>` : '';

    detailContent.innerHTML = `
        <div style="margin-bottom: 15px;">
            <p><strong>Khách hàng:</strong> ${order.name} - ${order.phone}</p>
            <p><strong>Bàn:</strong> ${order.table}</p>
            <p><strong>Thời gian:</strong> ${formatDate(order.timeOrder)}</p>
             <p><strong>Trạng thái:</strong> <span class="badge ${getStatusClass(order.statusOrder)}">${order.statusOrder}</span></p>
        </div>
        <h4>Danh sách món:</h4>
        ${itemsHtml}
        ${noteHtml}
        <div style="margin-top: 15px; text-align: right; font-size: 18px; font-weight: bold; color: var(--primary-color);">
            Tổng cộng: ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(parseFloat(order.total) || 0)}
        </div>
    `;

    detailModal.style.display = "flex";
};

function getStatusClass(status) {
    switch (status) {
        case 'Waiting': return 'bg-yellow';
        case 'Processing': return 'bg-blue';
        case 'Shipping': return 'bg-purple';
        case 'Finished': return 'bg-green';
        default: return '';
    }
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    return dateStr;
}

async function updateOrderStatus(id, newStatus) {
    if (!confirm(`Cập nhật trạng thái đơn hàng thành ${newStatus}?`)) return;

    try {
        const orderRef = doc(db, "Order", id);
        await updateDoc(orderRef, {
            statusOrder: newStatus
        });
        alert("Cập nhật thành công!");
        loadOrders();
    } catch (e) {
        console.error(e);
        alert("Lỗi: " + e.message);
    }
}


document.addEventListener('DOMContentLoaded', loadOrders);
window.updateStatus = updateOrderStatus;
