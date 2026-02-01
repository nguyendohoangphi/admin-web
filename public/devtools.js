import { db } from './firebase-config.js';
import { collection, addDoc, getDocs, updateDoc, doc, writeBatch } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { seedCategoriesAndProducts } from './seed.js';


const tableBody = document.getElementById('bulkTableBody');
const btnAddRow = document.getElementById('btn-add-row');
const btnSaveAll = document.getElementById('btn-save-all');

let rowCount = 0;

function addRow() {
    rowCount++;
    const tr = document.createElement('tr');
    tr.id = `row-${rowCount}`;

    tr.innerHTML = `
        <td style="text-align:center; color:grey;">${rowCount}</td>
        <td>
            <div class="cell-image" id="drop-${rowCount}" onclick="document.getElementById('file-${rowCount}').click()">
                <span class="material-icons-round" style="font-size: 20px; color: #cbd5e0;">add_photo_alternate</span>
                <img id="img-${rowCount}">
                <input type="file" id="file-${rowCount}" accept="image/*" style="display: none;">
            </div>
        </td>
        <td><input type="text" class="inp-name" placeholder="Tên sản phẩm"></td>
        <td>
            <select class="inp-cat">
                <option value="Coffee">Cà phê</option>
                <option value="Freeze">Đá Xay</option>
                <option value="Tea">Trà</option>
                <option value="Cake">Bánh Ngọt</option>
                <option value="Snack">Ăn Vặt</option>
                <option value="Juice">Nước Ép</option>
                <option value="Cocoa">Sô cô la</option>
            </select>
        </td>
        <td><input type="number" class="inp-price" value="45000"></td>
        <td><input type="text" class="inp-desc" placeholder="Mô tả..."></td>
        <td style="text-align:center;">
            <span class="material-icons-round btn-remove-row" onclick="removeRow(${rowCount})">delete</span>
        </td>
    `;

    tableBody.appendChild(tr);


    const dropZone = tr.querySelector(`#drop-${rowCount}`);
    const fileInput = tr.querySelector(`#file-${rowCount}`);
    const imgPreview = tr.querySelector(`#img-${rowCount}`);

    fileInput.onchange = () => handleFileSelect(fileInput.files[0], dropZone, imgPreview);

    dropZone.ondragover = (e) => { e.preventDefault(); dropZone.style.borderColor = '#C67C4E'; };
    dropZone.ondragleave = () => { dropZone.style.borderColor = '#cbd5e0'; };
    dropZone.ondrop = (e) => {
        e.preventDefault();
        dropZone.style.borderColor = '#cbd5e0';
        if (e.dataTransfer.files.length) {
            fileInput.files = e.dataTransfer.files;
            handleFileSelect(e.dataTransfer.files[0], dropZone, imgPreview);
        }
    };
}

function handleFileSelect(file, dropZone, imgPreview) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        imgPreview.src = e.target.result;
        dropZone.classList.add('has-file');
    };
    reader.readAsDataURL(file);
}

window.removeRow = (id) => {
    document.getElementById(`row-${id}`).remove();
};


if (tableBody) {
    for (let i = 0; i < 5; i++) addRow();


    btnAddRow.onclick = addRow;

    btnSaveAll.onclick = async () => {
        const rows = tableBody.querySelectorAll('tr');
        if (rows.length === 0) return;

        if (!confirm(`Bạn có chắc muốn lưu ${rows.length} sản phẩm này không?`)) return;

        let successCount = 0;

        for (const tr of rows) {
            const name = tr.querySelector('.inp-name').value;
            const cat = tr.querySelector('.inp-cat').value;
            const price = parseFloat(tr.querySelector('.inp-price').value);
            const desc = tr.querySelector('.inp-desc').value;
            const fileInput = tr.querySelector('input[type="file"]');

            if (!name) continue;

            try {
                let imageUrl = 'https://placehold.co/100';


                if (fileInput.files.length > 0) {
                    const formData = new FormData();
                    formData.append('image', fileInput.files[0]);
                    const res = await fetch('/upload?folder=images/drink/product', { method: 'POST', body: formData });
                    if (res.ok) {
                        const data = await res.json();
                        imageUrl = data.path;
                    }
                }


                await addDoc(collection(db, "Products"), {
                    createDate: new Date().toISOString(),
                    name: name,
                    imageUrl: imageUrl,
                    description: desc,
                    rating: 5.0,
                    reviewCount: 0,
                    price: price,
                    type: cat
                });

                successCount++;
                tr.remove();

            } catch (error) {
                console.error(error);
                tr.style.background = '#fee2e2';
                alert(`Lỗi ở dòng sản phẩm "${name}": ${error.message}`);
            }
        }

        if (successCount > 0) {
            alert(`Xong! Đã nhập thành công ${successCount} sản phẩm!`);

            if (tableBody.children.length === 0) addRow();
        }
    };
}


const btnSeed = document.getElementById('btn-run-seed');
if (btnSeed) {
    btnSeed.onclick = () => {
        if (confirm("Bạn có chắc chắn muốn nạp dữ liệu mẫu?")) {
            seedCategoriesAndProducts();
        }
    };
}



const themeSwitch = document.getElementById('themeSwitch');
if (themeSwitch) {

    themeSwitch.checked = localStorage.getItem('theme') === 'dark';

    themeSwitch.onchange = () => {
        window.toggleTheme(themeSwitch.checked);
    };
}





async function bulkUpdatePrice(percent) {
    if (!confirm(`Bạn có chắc muốn thay đổi giá toàn bộ sản phẩm (${percent > 0 ? '+' : ''}${percent}%)?`)) return;

    const batch = writeBatch(db);
    const snap = await getDocs(collection(db, "Products"));

    snap.forEach(docSnap => {
        const data = docSnap.data();
        const currentPrice = data.price || 0;


        let updateData = {};
        if (data.originalPrice === undefined) {
            updateData.originalPrice = currentPrice;
        }

        const newPrice = Math.round(currentPrice * (1 + percent / 100));
        updateData.price = newPrice;

        batch.update(doc(db, "Products", docSnap.id), updateData);
    });

    await batch.commit();
    alert("Đã cập nhật giá hàng loạt!");
}

const btnInc = document.getElementById('btn-inc-price');
const btnDec = document.getElementById('btn-dec-price');
if (btnInc) btnInc.onclick = () => bulkUpdatePrice(10);
if (btnDec) btnDec.onclick = () => bulkUpdatePrice(-10);


const btnReset = document.getElementById('btn-reset-price');
if (btnReset) {
    btnReset.onclick = async () => {
        if (!confirm("Bạn có chắc muốn khôi phục giá gốc cho toàn bộ sản phẩm?")) return;

        const batch = writeBatch(db);
        const snap = await getDocs(collection(db, "Products"));
        let count = 0;

        snap.forEach(docSnap => {
            const data = docSnap.data();
            if (data.originalPrice !== undefined) {
                batch.update(doc(db, "Products", docSnap.id), {
                    price: data.originalPrice


                });
                count++;
            }
        });

        if (count > 0) {
            await batch.commit();
            alert(`Đã khôi phục giá cho ${count} sản phẩm!`);
        } else {
            alert("Không tìm thấy giá gốc nào để khôi phục.");
        }
    };
}


async function setVisibility(visible) {





    if (!confirm(`Bạn có chắc muốn ${visible ? 'HIỆN' : 'ẨN'} toàn bộ sản phẩm?`)) return;

    const batch = writeBatch(db);
    const snap = await getDocs(collection(db, "Products"));

    snap.forEach(docSnap => {
        batch.update(doc(db, "Products", docSnap.id), { isVisible: visible });
    });

    await batch.commit();
    alert(`Đã ${visible ? 'Hiện' : 'Ẩn'} tất cả!`);
}

const btnHide = document.getElementById('btn-hide-all');
const btnShow = document.getElementById('btn-show-all');
if (btnHide) btnHide.onclick = () => setVisibility(false);
if (btnShow) btnShow.onclick = () => setVisibility(true);


const btnDeleteAll = document.getElementById('btn-delete-all');
if (btnDeleteAll) {
    btnDeleteAll.onclick = async () => {
        if (!confirm("⚠️ CẢNH BÁO: Bạn có chắc chắn muốn XÓA SẠCH toàn bộ sản phẩm không?")) return;
        if (!confirm("⛔️ Hành động này KHÔNG THỂ khôi phục! Bạn thực sự muốn xóa?")) return;

        const btnText = btnDeleteAll.innerHTML;
        btnDeleteAll.disabled = true;
        btnDeleteAll.innerHTML = "Đang xóa...";

        try {

            const snap = await getDocs(collection(db, "Products"));
            if (snap.empty) {
                alert("Không có sản phẩm nào để xóa.");
                return;
            }


            const batchFactory = () => writeBatch(db);
            let batch = batchFactory();
            let count = 0;
            let batchCount = 0;

            for (const docSnap of snap.docs) {
                batch.delete(doc(db, "Products", docSnap.id));
                count++;
                batchCount++;

                if (batchCount >= 400) {
                    await batch.commit();
                    batch = batchFactory();
                    batchCount = 0;
                }
            }

            await batch.commit();
            alert(`🗑 Đã xóa vĩnh viễn ${count} sản phẩm!`);

        } catch (error) {
            console.error(error);
            alert("Lỗi khi xóa: " + error.message);
        } finally {
            btnDeleteAll.disabled = false;
            btnDeleteAll.innerHTML = btnText;
        }
    };
}

// Table Maintenance
async function updateAllTables(updateData, confirmMsg, successMsg) {
    if (!confirm(confirmMsg)) return;
    try {
        const snap = await getDocs(collection(db, "Table"));
        if (snap.empty) {
            alert("Không có bàn nào.");
            return;
        }
        const batch = writeBatch(db);
        snap.forEach(docSnap => {
            batch.update(doc(db, "Table", docSnap.id), updateData);
        });
        await batch.commit();
        alert(successMsg);
    } catch (error) {
        console.error(error);
        alert("Lỗi: " + error.message);
    }
}

const btnResetTables = document.getElementById('btn-reset-tables');
const btnHideTables = document.getElementById('btn-hide-tables');
const btnShowTables = document.getElementById('btn-show-tables');

if (btnResetTables) btnResetTables.onclick = () => updateAllTables(
    { isBooked: false },
    "Bạn có chắc muốn ĐẶT LẠI tất cả bàn thành TRỐNG?",
    "Đã đặt lại tất cả bàn!"
);

if (btnHideTables) btnHideTables.onclick = () => updateAllTables(
    { isVisible: false },
    "Bạn có chắc muốn ẨN toàn bộ bàn khỏi ứng dụng?",
    "Đã ẩn tất cả bàn!"
);

if (btnShowTables) btnShowTables.onclick = () => updateAllTables(
    { isVisible: true },
    "Bạn có chắc muốn HIỆN toàn bộ bàn?",
    "Đã hiển thị tất cả bàn!"
);

document.addEventListener('DOMContentLoaded', loadProducts);
