import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut, sendPasswordResetEmail, sendEmailVerification } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getDatabase, ref, set, get, onValue, update, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// 1. CONFIGURATION (Lojik 1: SSL/Firebase)
const firebaseConfig = {
    apiKey: "AIzaSyB1VTPakleoggsbLdpm_HS7nSb3A7A99Qw",
    authDomain: "echanj-plus-778cd.firebaseapp.com",
    databaseURL: "https://echanj-plus-778cd-default-rtdb.firebaseio.com",
    projectId: "echanj-plus-778cd",
    storageBucket: "echanj-plus-778cd.firebasestorage.app",
    messagingSenderId: "111144762929",
    appId: "1:111144762929:web:e64ce9a6da65781c289f10",
    measurementId: "G-J1BQRF32ZW"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

// Global State
let userData = null;

// ==========================================
// I. OTANTIFIKASYON & SEKIRITE (PWEN 3)
// ==========================================

// Lojik 7: Jenere ARS-ID Inik (6 chif)
const generateArsID = () => "ARS-" + Math.floor(100000 + Math.random() * 900000);

// Lojik 9: Netwayaj (Trim)
const clean = (val) => val.trim();

window.handleSignup = async () => {
    const name = clean(document.getElementById('sign-name').value);
    const email = clean(document.getElementById('sign-email').value);
    const pass = document.getElementById('sign-pass').value;
    const phone = clean(document.getElementById('sign-phone').value);
    const terms = document.getElementById('accept-terms').checked;

    // Lojik 2: Sekirite Modpas (Majiskil nan kòmansman)
    if (!/^[A-Z]/.test(pass)) return alert("Modpas la dwe kòmanse ak yon lèt Majiskil!");
    if (pass.length < 6) return alert("Modpas la dwe gen omwen 6 karaktè.");
    if (!terms) return alert("Ou dwe asepte kondisyon yo.");

    try {
        const userCred = await createUserWithEmailAndPassword(auth, email, pass);
        // Lojik 3: Verifikasyon Gmail
        await sendEmailVerification(userCred.user);
        
        const arsID = generateArsID();
        await set(ref(db, `users/${userCred.user.uid}`), {
            fullname: name,
            email: email,
            phone: phone,
            arsID: arsID,
            balance: 0,
            points: 0,
            status: "Inactif",
            lastLogin: serverTimestamp() // Lojik 8
        });
        
        alert("Kont kreye! Tanpri verifye email ou anvan ou konekte.");
        toggleAuth('login');
    } catch (e) { alert("Erè: " + e.message); }
};

window.handleLogin = async () => {
    const email = clean(document.getElementById('login-email').value);
    const pass = document.getElementById('login-pass').value;
    try {
        const userCred = await signInWithEmailAndPassword(auth, email, pass);
        if (!userCred.user.emailVerified) {
            alert("Email ou poko verifye!");
            await signOut(auth);
        }
    } catch (e) { alert("Email oswa Modpas enkòrèk!"); }
};

// Lojik 5: Auto-Logout apre 30 minit
let timer;
const resetTimer = () => {
    clearTimeout(timer);
    timer = setTimeout(() => { if(auth.currentUser) signOut(auth); }, 1800000);
};
window.onmousemove = resetTimer;
window.onkeypress = resetTimer;

// ==========================================
// II. GESTYON DONE DIRÈK (PWEN 4)
// ==========================================

onAuthStateChanged(auth, (user) => {
    const authPage = document.getElementById('auth-page');
    const homePage = document.getElementById('home-page');

    if (user && user.emailVerified) {
        authPage.classList.add('hidden');
        homePage.classList.remove('hidden');

        // Lojik 10: Balans & Deteksyon ID
        const userRef = ref(db, `users/${user.uid}`);
        onValue(userRef, (snap) => {
            userData = snap.val();
            if (userData) {
                // Deteksyon si ID a manke (Lojik Reparasyon)
                if (!userData.arsID) {
                    update(userRef, { arsID: generateArsID() });
                    return;
                }

                // AFICHAJ NAN AKÈY (Dashboard)
                document.getElementById('user-balance').innerText = userData.balance.toFixed(2);
                if(document.getElementById('user-name-home')) {
                    document.getElementById('user-name-home').innerText = userData.fullname;
                }
                if(document.getElementById('user-id-home')) {
                    document.getElementById('user-id-home').innerText = userData.arsID;
                }

                // AFICHAJ NAN SIDEBAR
                document.getElementById('side-name').innerText = userData.fullname;
                document.getElementById('side-id').innerText = userData.arsID;
                
                // Lojik 6: Maskay Done (jo***@gmail.com)
                let [userPart, domain] = userData.email.split("@");
                document.getElementById('side-email').innerText = userPart.substring(0,2) + "***@" + domain;
            }
        });

        // Lojik 28: Night Mode Otomatik (6h PM)
        if(new Date().getHours() >= 18 || new Date().getHours() < 6) {
            document.body.classList.add('night-mode');
        }

    } else {
        authPage.classList.remove('hidden');
        homePage.classList.add('hidden');
    }
});

// ==========================================
// III. SIK TRANZAKSYON & USSD (PWEN 2)
// ==========================================

window.openDialer = function(rezo) {
    let montan = prompt("Konbe Gdes w ap voye?");
    if (!montan || isNaN(montan)) return;

    // Lojik 14: Limit Minimòm
    if (montan < 100) return alert("Minimòm lan se 100 HTG.");

    // Lojik 12: Kalkil 16.5% (Rate 0.835)
    let resevwa = (montan * 0.835).toFixed(2);
    
    if(confirm(`W ap voye ${montan} HTG.\nW ap resevwa ${resevwa} HTG sou balans ou.\n\nÈske w konfime tranzaksyon an?`)) {
        
        // Lojik 13: USSD Otomatik
        let code = (rezo === 'natcom') 
            ? `*123*88888888*32160708*${montan}%23` 
            : `*128*50947111123*${montan}%23`;
            
        window.location.href = "tel:" + code;
        
        // Lojik 16: Tranzaksyon "En attente"
        const transID = "TR-" + Date.now();
        set(ref(db, `transactions/${transID}`), {
            uid: auth.currentUser.uid,
            arsID: userData.arsID,
            fullname: userData.fullname,
            type: "Echanj",
            rezo: rezo,
            montan: montan,
            resevwa: resevwa,
            status: "En attente", // Lojik 17
            date: serverTimestamp()
        });
    }
};

// ==========================================
// IV. NAVIGASYON & UI (PWEN 1)
// ==========================================

window.showPage = (id, el) => {
    document.querySelectorAll('main section').forEach(s => s.classList.add('hidden'));
    const target = document.getElementById(id);
    if(target) target.classList.remove('hidden');
    
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    if(el) el.classList.add('active');
};

window.toggleAuth = (type) => {
    document.getElementById('login-section').classList.toggle('hidden', type === 'signup');
    document.getElementById('signup-section').classList.toggle('hidden', type === 'login');
};

window.toggleSidebar = () => {
    document.getElementById('sidebar').classList.toggle('active-sidebar');
};

window.handleLogout = () => signOut(auth);

window.handleForgotPassword = () => {
    const email = prompt("Ekri email ou pou reset modpas la:");
    if(email) sendPasswordResetEmail(auth, email).then(() => alert("Lyen reset la voye!"));
};

// Lojik 29: Carousel Otomatik (4 segonn)
let currentSlide = 0;
setInterval(() => {
    const slider = document.getElementById('carousel-slider');
    if(slider) {
        currentSlide = (currentSlide + 1) % 3;
        slider.style.transform = `translateX(-${currentSlide * 100}%)`;
    }
}, 4000);
  


// ==========================================
// LOJIK CAROUSEL OTOMATIK (5 IMAJ)
// ==========================================
let currentIdx = 0;
const slidesCount = 5;

function runCarousel() {
    const slider = document.getElementById('carousel-slider');
    
    // Nou tcheke si slider a egziste anvan nou kòmanse
    if (!slider) return;

    setInterval(() => {
        currentIdx++;
        
        // Si nou rive nan fen, nou tounen nan 0
        if (currentIdx >= slidesCount) {
            currentIdx = 0;
        }
        
        // Kalkile distans pou glise (0%, 20%, 40%, 60%, 80%)
        let translateValue = currentIdx * 20; 
        slider.style.transform = `translateX(-${translateValue}%)`;
        
    }, 4000); // 4 segonn
}

// Lanse fonksyon an
runCarousel();



// ==========================================
// V. SISTÈM RETRÈ PWOFESYONÈL (AVÈK DEDIKSYON)
// ==========================================

// 1. FONKSYON POU LOUVRI MODAL KONFIMASYON
window.openRetreConfirm = function() {
    const non = document.getElementById('retre-name').value.trim();
    const tel = document.getElementById('retre-phone').value.trim();
    const metod = document.getElementById('retre-method').value;
    const montanInput = document.getElementById('retre-amount').value;
    const montan = parseFloat(montanInput);

    // Verifikasyon si bwat yo vid
    if (!non || !tel || !montanInput || isNaN(montan)) {
        alert("⚠️ Tanpri ranpli tout chan yo kòrèkteman!");
        return;
    }

    // Verifikasyon montan minimòm
    if (montan < 100) {
        alert("❌ Minimòm retrè se 100 HTG.");
        return;
    }

    // VERIFIKASYON BALANS (Lojik: Èske l gen ase kòb?)
    if (userData) {
        if (montan > userData.balance) {
            alert(`🚫 Balans ou pa ase! \nOu gen: ${userData.balance.toFixed(2)} HTG \nOu bezwen: ${montan.toFixed(2)} HTG`);
            return;
        }
    } else {
        alert("⚠️ Done kont ou poko chaje. Tann yon segond.");
        return;
    }

    // Ranpli ti bwat konfimasyon an (Preview)
    const preview = document.getElementById('retre-preview-data');
    if (preview) {
        preview.innerHTML = `
            <div style="font-size: 14px; color: #172b4d;">
                <p><strong>Metòd:</strong> ${metod}</p>
                <p><strong>Resevwa sou:</strong> ${tel}</p>
                <p><strong>Non:</strong> ${non}</p>
                <p style="color:#0052cc; font-size:18px; margin-top:10px; border-top:1px solid #ddd; padding-top:10px;">
                    <strong>W ap retire:</strong> ${montan.toFixed(2)} HTG
                </p>
                <p style="font-size:12px; color:#6b778c;">Balans apre retrè: ${(userData.balance - montan).toFixed(2)} HTG</p>
            </div>
        `;
    }

    // Montre Modal la
    document.getElementById('modal-confirm-retre').classList.remove('hidden');
};

// 2. FONKSYON POU FÈMEN MODAL KONFIMASYON (ANILE)
window.closeRetreConfirm = () => {
    document.getElementById('modal-confirm-retre').classList.add('hidden');
};

// 3. FONKSYON FINAL: VOYE DEMANN LAN & REDI BALANS LAN
window.submitRetre = async () => {
    const non = document.getElementById('retre-name').value.trim();
    const tel = document.getElementById('retre-phone').value.trim();
    const metod = document.getElementById('retre-method').value;
    const montan = parseFloat(document.getElementById('retre-amount').value);

    // Kache modal la touswit
    window.closeRetreConfirm();

    try {
        const user = auth.currentUser;
        if (!user || !userData) return;

        // KALKIL MATEMATIK (Egzanp: 250 - 150 = 100)
        const nouvoBalans = userData.balance - montan;

        // Kreye yon ID inik pou tranzaksyon an
        const transID = "RET-" + Date.now();

        // --- OPERASYON FIREBASE ---
        
        // A. Anrejistre tranzaksyon retrè a nan branch 'transactions'
        await set(ref(db, `transactions/${transID}`), {
            uid: user.uid,
            arsID: userData.arsID || "N/A",
            fullname: userData.fullname || "Itilizatè",
            type: "Retrè",
            method: metod,
            phone: tel,
            receiver: non,
            amount: montan,
            status: "En attente",
            timestamp: serverTimestamp()
        });

        // B. Mete ajou Balans lan nan branch 'users' (Rediksyon)
        await update(ref(db, `users/${user.uid}`), {
            balance: nouvoBalans
        });

        // --- SIKSÈ VIZYÈL ---
        
        const successModal = document.getElementById('modal-success');
        if (successModal) {
            successModal.classList.remove('hidden');

            // Netwaye bwat yo nan fòm lan
            document.getElementById('retre-name').value = "";
            document.getElementById('retre-phone').value = "";
            document.getElementById('retre-amount').value = "";

            // Tann 5 segond epi kache siksè a, epi tounen nan dashboard
            setTimeout(() => {
                successModal.classList.add('hidden');
                // Rele fonksyon navigasyon ou a
                if (typeof window.showPage === "function") {
                    window.showPage('home-page'); 
                } else {
                    location.reload(); // Si showPage pa disponib
                }
            }, 5000);
        }

    } catch (e) {
        console.error("Erè nan pwosesis retrè a:", e);
        alert("⚠️ Gen yon pwoblèm koneksyon. Kòb la pa dedwi. Eseye ankò.");
    }
};
            
