import { db } from './firebase-config.js';
import { collection, getCountFromServer, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

async function loadDashboardStats() {
    try {
        console.log("Loading stats...");


        const prodSnapshot = await getCountFromServer(collection(db, "Products"));
        document.getElementById('total-products').textContent = prodSnapshot.data().count;


        const orderSnapshot = await getDocs(collection(db, "Order"));
        let totalRevenue = 0;
        let totalOrders = orderSnapshot.size;

        orderSnapshot.forEach(doc => {
            const data = doc.data();


            const revenue = parseFloat(data.total) || 0;
            totalRevenue += revenue;
        });

        document.getElementById('total-orders').textContent = totalOrders;
        document.getElementById('total-revenue').textContent = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalRevenue);


        const catSnapshot = await getDocs(collection(db, "Category"));
        document.getElementById('total-categories').textContent = catSnapshot.size;


        renderCharts(orderSnapshot);

    } catch (error) {
        console.error("Error loading stats:", error);
    }
}

function renderCharts(orderSnapshot) {
    if (orderSnapshot.empty) return;


    const revenueByDate = {};
    const statusCounts = { 'Waiting': 0, 'Processing': 0, 'Shipping': 0, 'Finished': 0 };

    orderSnapshot.forEach(doc => {
        const data = doc.data();
        const total = parseFloat(data.total) || 0;




        let dateKey = 'Unknown';
        if (data.createDate) {
            const dateObj = new Date(data.createDate);
            dateKey = `${dateObj.getDate()}/${dateObj.getMonth() + 1}`;
        }


        revenueByDate[dateKey] = (revenueByDate[dateKey] || 0) + total;


        if (statusCounts[data.statusOrder] !== undefined) {
            statusCounts[data.statusOrder]++;
        }
    });


    const sortedDates = Object.keys(revenueByDate).slice(-7);
    const revenueData = sortedDates.map(date => revenueByDate[date]);


    const ctxRevenue = document.getElementById('revenueChart');
    if (window.revenueChartInstance) window.revenueChartInstance.destroy();

    window.revenueChartInstance = new Chart(ctxRevenue, {
        type: 'line',
        data: {
            labels: sortedDates,
            datasets: [{
                label: 'Doanh thu (VND)',
                data: revenueData,
                borderColor: '#C67C4E',
                backgroundColor: 'rgba(198, 124, 78, 0.1)',
                tension: 0.4,
                fill: true,
                pointBackgroundColor: '#C67C4E'
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false },
                tooltip: {
                    mode: 'index',
                    intersect: false
                }
            },
            scales: {
                x: {
                    grid: { color: document.body.classList.contains('dark-mode') ? '#4a5568' : '#e2e8f0' },
                    ticks: { color: document.body.classList.contains('dark-mode') ? '#a0aec0' : '#64748b' }
                },
                y: {
                    grid: { color: document.body.classList.contains('dark-mode') ? '#4a5568' : '#e2e8f0' },
                    ticks: { color: document.body.classList.contains('dark-mode') ? '#a0aec0' : '#64748b' }
                }
            }
        }
    });



    const ctxOrder = document.getElementById('orderChart');
    if (window.orderChartInstance) window.orderChartInstance.destroy();

    const isDark = document.body.classList.contains('dark-mode');


    const bgColors = isDark
        ? ['#4a5568', '#3182ce', '#805ad5', '#059669']
        : ['#E2E8F0', '#3B82F6', '#8B5CF6', '#10B981'];

    window.orderChartInstance = new Chart(ctxOrder, {
        type: 'doughnut',
        data: {
            labels: ['Chờ duyệt', 'Đang làm', 'Giao hàng', 'Hoàn thành'],
            datasets: [{
                data: [
                    statusCounts['Waiting'],
                    statusCounts['Processing'],
                    statusCounts['Shipping'],
                    statusCounts['Finished']
                ],
                backgroundColor: bgColors,
                borderColor: isDark ? '#2d3748' : '#fff',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            cutout: '70%',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: isDark ? '#e2e8f0' : '#4a5568',
                        padding: 20,
                        usePointStyle: true
                    }
                }
            }
        }
    });
}


window.addEventListener('themeChanged', () => {

    loadDashboardStats();
});

document.addEventListener('DOMContentLoaded', loadDashboardStats);
