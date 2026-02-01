import { auth, db } from './firebase-config.js';
import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const loginForm = document.getElementById('loginForm');
const errorMsg = document.getElementById('errorMsg');
const btnLogin = document.getElementById('btnLogin');

if (loginForm) {
    loginForm.onsubmit = async (e) => {
        e.preventDefault(); 
        btnLogin.disabled = true;
        btnLogin.textContent = "Đang kiểm tra...";
        errorMsg.style.display = 'none';

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {

            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;



            const idTokenResult = await user.getIdTokenResult(true);

            if (idTokenResult.claims.admin) {

                window.location.href = '/';
            } else {

                alert("Tài khoản của bạn không có quyền Admin");
                await signOut(auth);
            }

        } catch (error) {
            console.error(error);
            errorMsg.textContent = error.message.includes('auth') ? "Email hoặc mật khẩu không đúng!" : error.message;
            errorMsg.style.display = 'block';
            btnLogin.disabled = false;
            btnLogin.textContent = "Đăng nhập";
        }
    };
}



if (window.location.pathname !== '/login') {
    onAuthStateChanged(auth, async (user) => {
        if (!user) {

            window.location.href = '/login';
        } else {
            const token = await user.getIdTokenResult();
            if (!token.claims.admin) {
                alert("Bạn không phải Admin!");
                await signOut(auth);
            }
        }
    });
} else {

    onAuthStateChanged(auth, (user) => {
        if (user) {
            window.location.href = '/';
        }
    });
}


window.logout = async () => {
    try {
        await signOut(auth);
        window.location.href = '/login';
    } catch (error) {
        console.error("Logout Error:", error);
    }
};
