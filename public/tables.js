import { db } from './firebase-config.js';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const tableList = document.getElementById('table-list');
const loading = document.getElementById('loading');
const btnAddTable = document.getElementById('btn-add-table');
const addTableModal = document.getElementById('addTableModal');
const btnCloseModal = document.getElementById('btn-close-modal');
const addTableForm = document.getElementById('addTableForm');

// Modal Logic
if (btnAddTable) {
    btnAddTable.onclick = () => {
        addTableForm.reset();
        addTableModal.style.display = "flex";
    };
}

if (btnCloseModal) {
    btnCloseModal.onclick = () => addTableModal.style.display = "none";
}

window.onclick = (event) => {
    if (event.target == addTableModal) {
        addTableModal.style.display = "none";
    }
};

// Firestore Logic
// Real-time listener
function loadTables() {
    loading.style.display = 'block';

    onSnapshot(collection(db, "Table"), (querySnapshot) => {
        loading.style.display = 'none';
        tableList.innerHTML = '';

        if (querySnapshot.empty) {
            tableList.innerHTML = '<tr><td colspan="4" style="text-align:center">Chưa có bàn nào.</td></tr>';
            return;
        }

        const tables = [];
        querySnapshot.forEach((doc) => {
            // Fix: Spread data first, then overwrite with metadata ID to avoid conflicts
            tables.push({ ...doc.data(), id: doc.id });
        });

        // Sort by nameTable
        tables.sort((a, b) => {
            const nameA = a.nameTable || '';
            const nameB = b.nameTable || '';
            return nameA.localeCompare(nameB, undefined, { numeric: true, sensitivity: 'base' });
        });

        tables.forEach(table => {
            const row = document.createElement('tr');

            // Updated Fields: nameTable, isBooked, isVisible
            let statusBadge = table.isBooked
                ? '<span class="badge" style="background-color: #ef4444; color: white;">Đang có khách</span>'
                : '<span class="badge" style="background-color: #10b981; color: white;">Bàn trống</span>';

            if (table.isVisible === false) {
                statusBadge += ' <span class="badge" style="background-color: #6B7280; color: white; margin-left:5px;">Đang ẩn</span>';
            }

            const createDate = table.createDate || '';

            row.innerHTML = `
                <td class="fw-bold">${table.nameTable || 'Không tên'}</td>
                <td>${statusBadge}</td>
                <td class="text-xs text-grey">${createDate}</td>
                <td>
                    <button class="btn-icon text-red" onclick="deleteTable('${table.id}', '${table.nameTable}')">
                        <span class="material-icons-round">delete</span>
                    </button>
                    ${table.isBooked ?
                    `<button class="btn-icon text-green" title="Reset bàn" onclick="resetTable('${table.id}')">
                            <span class="material-icons-round">restart_alt</span>
                        </button>` : ''
                }
                </td>
            `;
            tableList.appendChild(row);
        });

    }, (error) => {
        console.error("Error loading tables: ", error);
        loading.textContent = 'Lỗi tải dữ liệu: ' + error.message;
    });
}

async function addTable(e) {
    e.preventDefault();
    const name = document.getElementById('t-name').value;

    // Get current date string
    const now = new Date();
    const dateStr = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()}`;

    try {
        // Updated Collection Name: Table
        // Updated Fields: nameTable, isBooked, createDate
        await addDoc(collection(db, "Table"), {
            nameTable: name,
            isBooked: false,
            createDate: dateStr
        });
        addTableModal.style.display = "none";
        loadTables();
        alert("Thêm bàn thành công!");
    } catch (error) {
        console.error("Error adding table: ", error);
        alert("Lỗi khi thêm bàn: " + error.message);
    }
}

window.deleteTable = async (id, name) => {
    if (confirm(`Bạn có chắc muốn xóa ${name}?`)) {
        try {
            // Updated Collection Name: Table
            await deleteDoc(doc(db, "Table", id));
            loadTables();
        } catch (error) {
            console.error("Error deleting table: ", error);
            alert("Lỗi khi xóa bàn");
        }
    }
};

window.resetTable = async (id) => {
    if (!id) {
        alert("Lỗi: ID bàn không hợp lệ.");
        return;
    }

    if (confirm("Đặt lại trạng thái bàn thành TRỐNG?")) {
        try {
            await updateDoc(doc(db, "Table", id), {
                isBooked: false
            });
            loadTables();
        } catch (error) {
            console.error("Error resetting table: ", error);
            alert("Lỗi khi reset bàn: " + error.message);
        }
    }
};

if (addTableForm) {
    addTableForm.addEventListener('submit', addTable);
}

// Initial Load
document.addEventListener('DOMContentLoaded', loadTables);
