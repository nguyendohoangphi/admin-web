import { db } from './firebase-config.js';
import { collection, addDoc, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { seedData } from './data.js';

export async function seedCategoriesAndProducts() {
    console.log("Starting Seed Data...");
    alert("Bắt đầu nạp dữ liệu... Vui lòng chờ.");

    try {
        for (const catData of seedData) {
            const catName = catData.name;
            const products = catData.products;

            console.log(`Processing Category: ${catName}`);



            for (const prodData of products) {
                console.log(`Processing Product: ${prodData.name}`);


                const productsRef = collection(db, "Products");
                const q = query(productsRef, where("name", "==", prodData.name));
                const querySnapshot = await getDocs(q);

                if (!querySnapshot.empty) {
                    console.log(`Product already exists: ${prodData.name} -> SKIPPED`);
                    continue;
                }


                const newProduct = {
                    createDate: new Date().toISOString(),
                    name: prodData.name,
                    imageUrl: prodData.image,
                    description: prodData.description,
                    rating: 4.0 + (Math.random() * 0.9),
                    reviewCount: Math.floor(10 + Math.random() * 90),
                    price: prodData.price,
                    type: catName
                };

                await addDoc(productsRef, newProduct);
                console.log(`Added Product: ${prodData.name}`);
            }
        }

        alert("Nạp dữ liệu thành công!");
    } catch (error) {
        console.error("Error seeding data:", error);
        alert("Lỗi khi nạp dữ liệu: " + error.message);
    }
}
