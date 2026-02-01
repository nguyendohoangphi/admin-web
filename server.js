require('dotenv').config();
const express = require('express');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const admin = require('firebase-admin');




try {
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {

        const serviceAccountPath = path.resolve(process.env.GOOGLE_APPLICATION_CREDENTIALS);
        if (fs.existsSync(serviceAccountPath)) {
            const serviceAccount = require(serviceAccountPath);
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount)
            });
            console.log("✅ Firebase Admin initialized with service account.");
        } else {
            console.error("❌ Service Account file not found at:", serviceAccountPath);
        }
    } else {

        admin.initializeApp();
        console.log("⚠️ Initialized default Firebase Admin (Expecting Cloud Environment).");
    }
} catch (e) {
    console.error("❌ Failed to initialize Firebase Admin:", e.message);
}

const app = express();
const port = 3000;


const uploadDir = path.join(__dirname, 'public', 'assets', 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const subFolder = req.query.folder || 'uploads';
        const targetDir = path.join(__dirname, 'public', 'assets', subFolder);
        if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
        }
        cb(null, targetDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });


app.use(express.json());
app.use(express.static('public'));




app.post('/admin/set-claim', async (req, res) => {
    const { email, admin: isAdmin } = req.body;
    const secret = req.headers['x-admin-secret'];


    if (secret !== process.env.DEV_MASTER_SECRET) {
        return res.status(403).json({ error: "Unauthorized. Invalid Secret." });
    }

    try {
        const user = await admin.auth().getUserByEmail(email);
        await admin.auth().setCustomUserClaims(user.uid, { admin: isAdmin });
        res.json({ message: `Success! User ${email} admin claim set to ${isAdmin}` });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/products', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'products.html'));
});

app.get('/categories', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'categories.html'));
});

app.get('/orders', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'orders.html'));
});

app.get('/tables', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'tables.html'));
});

app.get('/coupons', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'coupons.html'));
});

app.get('/ads', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'ads.html'));
});

app.get('/devtools', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'devtools.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});


app.post('/upload', upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }

    const subFolder = req.query.folder || 'uploads';
    const relativePath = 'assets/' + subFolder + '/' + req.file.filename;
    res.json({ path: relativePath });
});


app.listen(port, () => {
    console.log(`Admin Web App listening at http://localhost:${port}`);
    if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        console.warn("⚠️  WARNING: No GOOGLE_APPLICATION_CREDENTIALS set. Admin features may fail.");
    }
});
