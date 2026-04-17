// AAPKA FINAL API URL
const API_URL = "https://script.google.com/macros/s/AKfycbxQX4mu_FSY5WdWUIG5gkSgBlwQygbXgTB61fp3v4MY14DmN4cpDQuU1rg1kXfgCSvw/exec";

// Global Variables
let currentUser = null; 
let fetchedData = { courses: [], tests: [] };
let currentTestId = "";
let testQuestions = [];
let currentQIndex = 0;
let userAnswers = {}; 
let timerInterval = null;
let timeLeft = 0; 

function getEmbedUrl(url) {
    if (!url) return "";
    try {
        if (url.includes("watch?v=")) return url.replace("watch?v=", "embed/").split("&")[0];
        if (url.includes("youtu.be/")) return url.replace("youtu.be/", "www.youtube.com/embed/").split("?")[0];
    } catch(e) { console.error("URL error"); }
    return url;
}

function updateProfileUI() {
    if(!currentUser) return;
    const ids = { 'prof-name': currentUser.name, 'prof-mobile': "+91 "+currentUser.mobile, 'prof-state': currentUser.state, 'prof-unlocked': currentUser.unlocked || "None" };
    for (let id in ids) {
        let el = document.getElementById(id);
        if(el) el.innerText = ids[id];
    }
    let loginBtn = document.getElementById('open-login-btn');
    if(loginBtn) loginBtn.innerHTML = "👨‍🎓 My Profile";
}

document.addEventListener("DOMContentLoaded", function() {
    
    // Splash Screen
    const removeSplash = () => {
        const splash = document.getElementById('splash-screen');
        const dash = document.getElementById('dashboard');
        const login = document.getElementById('login-modal');
        
        if(splash) {
            splash.style.opacity = '0';
            setTimeout(() => {
                splash.classList.add('hidden');
                
                // ================= AUTO ADMIN LOGIN =================
                if(localStorage.getItem("adminAuth") === "true"){
                    document.getElementById("dashboard").classList.add("hidden");
                    document.getElementById("admin-panel").classList.remove("hidden");
                } 
                else if(!currentUser && login) {
                    login.classList.remove('hidden');
                    login.style.display = 'flex';
                    if(document.getElementById('close-login')) document.getElementById('close-login').style.display = 'none';
                } 
                else if(dash) {
                    dash.classList.remove('hidden');
                }
            }, 600);
        }
    };
    setTimeout(removeSplash, 3500);

    // Auto Login
    try {
        const stored = localStorage.getItem('aceUser');
        if(stored) {
            currentUser = JSON.parse(stored);
            updateProfileUI();
        }
    } catch(e) { localStorage.removeItem('aceUser'); }

    fetchLiveContent();

    // Navigations (Dashboard Cards)
    const navIds = ['nav-courses', 'nav-pdfs', 'nav-tests', 'nav-mocks'];
    const sections = ['courses-section', 'pdfs-section', 'tests-section', 'tests-section'];
    navIds.forEach((id, index) => {
        let el = document.getElementById(id);
        if(el) el.onclick = () => {
            const sec = document.getElementById(sections[index]);
            if(sec) window.scrollTo({ top: sec.offsetTop - 70, behavior: 'smooth' });
        };
    });

    // YouTube Click Event
    const ytBtn = document.getElementById('nav-youtube');
    if(ytBtn) {
        ytBtn.onclick = () => {
            window.open('https://youtube.com/@arthmeticcomputereducation?si=A2vbUDLIIGjSf2Or', '_blank');
        };
    }

    if(document.getElementById('nav-results')) {
        document.getElementById('nav-results').onclick = () => {
            if(currentUser) {
                document.getElementById('dashboard').classList.add('hidden');
                document.getElementById('profile-section').classList.remove('hidden');
            } else { alert("🔐 Login first!"); }
        };
    }

    // Sidebar & Overlays Setup
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    if(document.getElementById('menu-icon')) {
        document.getElementById('menu-icon').onclick = () => { 
            if(sidebar) sidebar.classList.add('active'); 
            if(overlay) overlay.style.display = 'block'; 
        };
    }

    window.closeAll = () => {
        if(sidebar) sidebar.classList.remove('active');
        if(overlay) overlay.style.display = 'none';
        if(currentUser && document.getElementById('login-modal')) document.getElementById('login-modal').classList.add('hidden');
    };

    if(document.getElementById('close-btn')) document.getElementById('close-btn').onclick = window.closeAll;
    if(overlay) overlay.onclick = window.closeAll;

    // ==========================================
    // SIDEBAR LINKS CLICK LOGIC
    // ==========================================
    
    // 1. Sidebar Login / Profile Button
    const openLoginBtn = document.getElementById('open-login-btn');
    if(openLoginBtn) {
        openLoginBtn.onclick = (e) => {
            e.preventDefault();
            window.closeAll(); 
            if(currentUser) {
                document.getElementById('dashboard').classList.add('hidden');
                document.getElementById('profile-section').classList.remove('hidden');
            } else {
                const loginModal = document.getElementById('login-modal');
                loginModal.classList.remove('hidden');
                loginModal.style.display = 'flex';
                if(document.getElementById('close-login')) document.getElementById('close-login').style.display = 'block';
            }
        };
    }

    // 2. Sidebar Dashboard Button
    const sideDashBtn = document.querySelector('a[href="#dashboard"]');
    if(sideDashBtn) {
        sideDashBtn.onclick = (e) => {
            e.preventDefault();
            window.closeAll();
            document.getElementById('profile-section').classList.add('hidden');
            document.getElementById('admin-panel').classList.add('hidden');
            document.getElementById('test-engine-container').classList.add('hidden');
            document.getElementById('dashboard').classList.remove('hidden');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        };
    }

    // 3. Sidebar Test Series Button
    const sideTestBtn = document.getElementById('side-nav-tests');
    if(sideTestBtn) {
        sideTestBtn.onclick = (e) => {
            e.preventDefault();
            window.closeAll();
            document.getElementById('dashboard').classList.remove('hidden');
            document.getElementById('profile-section').classList.add('hidden');
            const sec = document.getElementById('tests-section');
            if(sec) window.scrollTo({ top: sec.offsetTop - 70, behavior: 'smooth' });
        };
    }

    // 4. Sidebar PDF Notes Button
    const sidePdfBtn = document.getElementById('side-nav-pdfs');
    if(sidePdfBtn) {
        sidePdfBtn.onclick = (e) => {
            e.preventDefault();
            window.closeAll();
            document.getElementById('dashboard').classList.remove('hidden');
            document.getElementById('profile-section').classList.add('hidden');
            const sec = document.getElementById('pdfs-section');
            if(sec) window.scrollTo({ top: sec.offsetTop - 70, behavior: 'smooth' });
        };
    }

    // ================= SIDEBAR ADMIN BUTTON =================
    const openAdminBtn = document.getElementById('open-admin-btn');
    if(openAdminBtn){
        openAdminBtn.onclick = (e) => {
            e.preventDefault();

            window.closeAll(); // sidebar close

            const loginModal = document.getElementById('login-modal');
            loginModal.classList.remove('hidden');
            loginModal.style.display = 'flex';

            // Direct admin tab open
            document.getElementById('tab-admin').click();
        };
    }

    // ==========================================

    // PROPER MODAL CLOSE (Cross Button)
    const closeDetailsBtn = document.getElementById('close-details');
    if(closeDetailsBtn) {
        closeDetailsBtn.onclick = () => {
            const modal = document.getElementById('course-details-modal');
            modal.classList.add('hidden');
            modal.style.display = 'none';
            document.getElementById('cd-content').innerHTML = ''; 
        };
    }
    
    const closeLoginBtn = document.getElementById('close-login');
    if(closeLoginBtn) {
        closeLoginBtn.onclick = () => {
            const modal = document.getElementById('login-modal');
            modal.classList.add('hidden');
            modal.style.display = 'none';
        }
    }

    // Auth Forms Tabs
    const tabs = ['tab-login', 'tab-register', 'tab-admin'];
    const forms = ['student-login-form', 'student-register-form', 'admin-login-form'];
    tabs.forEach((tabId, i) => {
        let t = document.getElementById(tabId);
        if(t) t.onclick = () => {
            tabs.forEach(id => document.getElementById(id).classList.remove('active'));
            forms.forEach(id => document.getElementById(id).classList.add('hidden'));
            t.classList.add('active');
            document.getElementById(forms[i]).classList.remove('hidden');
        };
    });

    // Login Submission
    const loginForm = document.getElementById('student-login-form');
    if(loginForm) {
        loginForm.onsubmit = async (e) => {
            e.preventDefault();
            const btn = document.getElementById('btn-login');
            btn.innerText = "Verifying...";
            try {
                const res = await fetch(API_URL, { method: 'POST', body: JSON.stringify({
                    action: 'login',
                    mobile: document.getElementById('login-mobile').value,
                    password: document.getElementById('login-pass').value
                })});
                const data = await res.json();
                if(data.status === 'success') {
                    currentUser = data.user;
                    localStorage.setItem('aceUser', JSON.stringify(currentUser));
                    updateProfileUI();
                    document.getElementById('login-modal').classList.add('hidden');
                    document.getElementById('dashboard').classList.remove('hidden');
                } else { alert(data.message); }
            } catch(err) { alert("Server error"); }
            btn.innerText = "Login";
        };
    }

    // ================= ADMIN LOGIN =================
    const adminForm = document.getElementById('admin-login-form');
    if(adminForm){
        adminForm.addEventListener("submit", function(e){
            e.preventDefault();

            const id = document.getElementById("admin-id").value.trim();
            const pass = document.getElementById("admin-pass").value.trim();

            if(id === "ace_admin" && pass === "ace@123"){
                localStorage.setItem("adminAuth", "true");

                document.getElementById("login-modal").classList.add("hidden");
                document.getElementById("dashboard").classList.add("hidden");
                document.getElementById("admin-panel").classList.remove("hidden");

            } else {
                alert("❌ Invalid Admin Credentials");
            }
        });
    }
    
    // Back Buttons in Profile/Admin
    document.getElementById('back-to-dash-student').onclick = () => {
        document.getElementById('profile-section').classList.add('hidden');
        document.getElementById('dashboard').classList.remove('hidden');
    };
    
    if(document.getElementById('back-to-dash-admin')){
        document.getElementById('back-to-dash-admin').onclick = () => {
            document.getElementById('admin-panel').classList.add('hidden');
            document.getElementById('dashboard').classList.remove('hidden');
        };
    }

    // ================= LOGOUT FIX =================
    function setupLogout() {
        document.querySelectorAll('.logout-btn').forEach(btn => {
            btn.onclick = () => {
                localStorage.removeItem('aceUser');
                localStorage.removeItem('adminAuth');

                alert("✅ Logged out successfully");

                // UI reset
                document.getElementById('admin-panel').classList.add('hidden');
                document.getElementById('profile-section').classList.add('hidden');
                document.getElementById('dashboard').classList.remove('hidden');

                location.reload(); // safe reload
            };
        });
    }
    setupLogout();

    // ================= SAFE EVENTS (Next, Prev, Submit, Exit) =================
    if(document.getElementById('btn-next')){
        document.getElementById('btn-next').onclick = () => { currentQIndex++; renderQ(); };
    }

    if(document.getElementById('btn-prev')){
        document.getElementById('btn-prev').onclick = () => { currentQIndex--; renderQ(); };
    }

    if(document.getElementById('btn-submit-exam')){
        document.getElementById('btn-submit-exam').onclick = submitExam;
    }

    if(document.getElementById('exit-test-btn')){
        document.getElementById('exit-test-btn').onclick = () => {
            if(confirm("Kya aap test se bahar aana chahte hain?")){
                clearInterval(timerInterval);
                document.getElementById('test-engine-container').classList.add('hidden');
                document.getElementById('dashboard').classList.remove('hidden');
                // State reset
                currentQIndex = 0;
                userAnswers = {};
            }
        };
    }

    // ================= RESULT CLOSE FIX =================
    const btnCloseResult = document.getElementById('btn-close-result');
    if(btnCloseResult){
        btnCloseResult.onclick = () => {
            document.getElementById('test-result-modal').classList.add('hidden');
            document.getElementById('test-result-modal').style.display = 'none';
            document.getElementById('dashboard').classList.remove('hidden');
        };
    }

    // ================= ADMIN SECURE BACK NAVIGATION =================
    window.onpageshow = function() {
        if(localStorage.getItem("adminAuth") !== "true"){
            document.getElementById("admin-panel").classList.add("hidden");
        }
    };

});

// Content Fetcher
async function fetchLiveContent() {
    try {
        const res = await fetch(API_URL, { method: 'POST', body: JSON.stringify({ action: 'get_content' }) });
        const data = await res.json();
        if(data.status === 'success') {
            fetchedData.courses = data.courses || [];
            fetchedData.tests = data.tests || [];
            renderUI();
        }
    } catch(e) { console.error("Data load failed"); }
}

function renderUI() {
    const vWrap = document.getElementById('video-courses-wrapper');
    const pWrap = document.getElementById('pdf-notes-wrapper');
    const tWrap = document.getElementById('test-series-wrapper');
    if(vWrap) vWrap.innerHTML = ''; if(pWrap) pWrap.innerHTML = ''; if(tWrap) tWrap.innerHTML = '';

    fetchedData.courses.forEach(c => {
        const type = c.type.toLowerCase();
        const div = document.createElement('div'); div.className = 'course-item';
        div.innerHTML = `<div class="course-icon">${type==='video'?'🎬':'📄'}</div><h4>${c.name}</h4><p>₹${c.price || '0'}</p><button class="view-btn" onclick="openDetails('${c.id}', false)">View</button>`;
        if(type==='video' && vWrap) vWrap.appendChild(div);
        if(type==='pdf' && pWrap) pWrap.appendChild(div);
    });

    fetchedData.tests.forEach(t => {
        const div = document.createElement('div'); div.className = 'course-item'; div.style.borderTop = "4px solid #ce9c3b";
        div.innerHTML = `<div class="course-icon">⏱️</div><h4>${t.name}</h4><p>${t.questions} Qs</p><button class="view-btn" style="background:#ce9c3b;color:#000" onclick="openDetails('${t.id}', true)">Start</button>`;
        if(tWrap) tWrap.appendChild(div);
    });
}

// ================= TEST ENGINE =================
window.openDetails = function(id, isTest) {
    const item = isTest ? fetchedData.tests.find(x=>x.id===id) : fetchedData.courses.find(x=>x.id===id);
    if(!item) return;

    if(item.price > 0 && (!currentUser || !currentUser.unlocked || !currentUser.unlocked.includes(id))) {
        const upi = `upi://pay?pa=9589769913@ybl&pn=ArithmeticComputer&am=${item.price}&cu=INR`;
        document.getElementById('cd-content').innerHTML = `<div style="text-align:center;padding:10px"><h2>🔒 Premium</h2><p>Fee: ₹${item.price}</p><a href="${upi}" class="submit-btn" style="text-decoration:none;display:block">Pay via UPI</a></div>`;
    } else {
        if(isTest) {
            document.getElementById('cd-content').innerHTML = `<div style="text-align:center;padding:10px"><h2>📝 ${item.name}</h2><button class="submit-btn" onclick="startExam('${item.id}', ${item.time})">Start Now</button></div>`;
        } else {
            if(item.type.toLowerCase()==='video') document.getElementById('cd-content').innerHTML = `<iframe width="100%" height="220" src="${getEmbedUrl(item.link)}" frameborder="0" allowfullscreen></iframe>`;
            else document.getElementById('cd-content').innerHTML = `<a href="${item.link}" target="_blank" class="submit-btn">Open PDF</a>`;
        }
    }
    document.getElementById('cd-title').innerText = item.name;
    document.getElementById('course-details-modal').classList.remove('hidden');
    document.getElementById('course-details-modal').style.display = 'flex';
};

window.startExam = async function(id, time) {
    document.getElementById('course-details-modal').classList.add('hidden');
    document.getElementById('dashboard').classList.add('hidden');
    document.getElementById('test-engine-container').classList.remove('hidden');
    
    try {
        const res = await fetch(API_URL, { method: 'POST', body: JSON.stringify({ action: 'get_questions', test_id: id }) });
        const data = await res.json();
        if(data.status === 'success') {
            testQuestions = data.questions; currentQIndex = 0; userAnswers = {};
            timeLeft = time * 60;
            renderQ();
            timerInterval = setInterval(() => {
                timeLeft--;
                let m = Math.floor(timeLeft/60), s = timeLeft%60;
                document.getElementById('te-timer').innerText = `⏳ ${m}:${s<10?'0'+s:s}`;
                if(timeLeft<=0) submitExam();
            }, 1000);
        }
    } catch(e) { alert("Error loading exam"); }
};

function renderQ() {
    let q = testQuestions[currentQIndex];
    document.getElementById('te-qno').innerText = `Q ${currentQIndex+1} of ${testQuestions.length}`;
    document.getElementById('te-qtext').innerText = q.question;
    let h = '';
    [{k:'A',v:q.optA},{k:'B',v:q.optB},{k:'C',v:q.optC},{k:'D',v:q.optD}].forEach(o => {
        if(o.v) h += `<label class="option-label" onclick="setAns('${o.k}')"><input type="radio" name="opt" ${userAnswers[currentQIndex]===o.k?'checked':''}> ${o.k}. ${o.v}</label>`;
    });
    document.getElementById('te-options').innerHTML = h;
    
    if(document.getElementById('btn-prev')){
        document.getElementById('btn-prev').disabled = currentQIndex === 0;
    }
    
    const btnNext = document.getElementById('btn-next');
    if(btnNext){
        btnNext.classList.toggle('hidden', currentQIndex === testQuestions.length-1);
        btnNext.disabled = false; 
    }

    if(document.getElementById('btn-submit-exam')){
        document.getElementById('btn-submit-exam').classList.toggle('hidden', currentQIndex !== testQuestions.length-1);
    }
}

window.setAns = (v) => { userAnswers[currentQIndex] = v; };

function submitExam() {
    clearInterval(timerInterval);
    let score = 0;
    testQuestions.forEach((q, i) => { if(userAnswers[i] === q.answer) score++; });
    
    document.getElementById('tr-score').innerText = `${score} / ${testQuestions.length}`;
    document.getElementById('test-engine-container').classList.add('hidden');
    document.getElementById('test-result-modal').classList.remove('hidden');
    document.getElementById('test-result-modal').style.display = 'flex';
}
