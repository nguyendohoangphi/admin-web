import { seedCategoriesAndProducts } from './seed.js';


document.addEventListener('DOMContentLoaded', () => {
    console.log("Admin Dashboard Loaded");










    const btnSeed = document.getElementById('btn-seed-data');
    if (btnSeed) {
        btnSeed.addEventListener('click', (e) => {
            e.preventDefault();
            seedCategoriesAndProducts();
        });
    }


    menuItems.forEach(item => {
        item.addEventListener('click', function () {

            if (this.getAttribute('href') === '#') {
                menuItems.forEach(i => i.classList.remove('active'));
                this.classList.add('active');
            }
        });
    });
});
