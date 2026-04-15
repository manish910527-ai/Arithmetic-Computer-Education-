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

// Helper: YouTube Fix
function getEmbedUrl(url) {
    if (!url) return "";
    try {
        if (url.includes("watch?v=")) return url.replace("watch?v=", "embed/").split("&")[0];
        if (url.includes("youtu.be/")) return url.replace("youtu.be/", "www.youtube.com/embed/").split("?")[0];
    } catch(e) { console.error("URL error"); }
    return url;
}

// UI Update Function
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
    
    // 1. SPLASH SCREEN REMOVER (Isse bahar rakha hai taaki ye har haal mein chale)
    const removeSplash = () => {
        const splash = document.getElementById('splash-screen');
        const dash = document.getElementById('dashboard');
        const login = document.getElementById('login-modal');
        
        if(splash) {
            splash.style.opacity = '0';
            setTimeout(() => {
                splash.classList.add('hidden');
                if(!currentUser && login) {
                    login.classList.remove('hidden');
                    login.style.display = 'flex';
                    if(document.getElementById('close-login')) document.getElementById('close-login').style.display = 'none';
                } else if(dash) {
                    dash.classList.remove('hidden');
                }
            }, 600);
        }
    };
    
    // 3.5 seconds baad splash screen ko hatane ka order
    setTimeout(removeSplash, 3500);

    // 2. AUTO-LOGIN
    try {
        const stored = localStorage.getItem('aceUser');
        if(stored) {
            currentUser = JSON.parse(stored);
            updateProfileUI();
        }
    } catch(e) { localStorage.removeItem('aceUser'); }

    // 3. FETCH CONTENT
    fetchLiveContent();

    // 4. NAVIGATION & BUTTONS
    const navIds = ['nav-courses', 'nav-pdfs', 'nav-tests', 'nav-mocks'];
    const sections = ['courses-section', 'pdfs-section', 'tests-section', 'tests-section'];
    
    navIds.forEach((id, index) => {
        let el = document.getElementById(id);
        if(el) el.onclick = () => {
            const sec = document.getElementById(sections[index]);
            if(sec) window.scrollTo({ top: sec.offsetTop - 70, behavior: 'smooth' });
        };
    });

    if(document.getElementById('nav-results')) {
        document.getElementById('nav-results').onclick = () => {
            if(currentUser) {
                document.getElementById('dashboard').classList.add('hidden');
                document.getElementById('profile-section').classList.remove('hidden');
            } else { alert("🔐 Login first!"); }
        };
    }

    // Modal Controls
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

    // Login Form Tabs Logic
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

    // 5. LOGIN ACTION
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
    
    // Admin Unlock Button
    const verifyBtn = document.getElementById('btn-verify');
    if(verifyBtn) {
        verifyBtn.onclick = async () => {
            const mobile = document.getElementById('verify-mobile').value;
            const item = document.getElementById('verify-item').value;
            if(mobile.length !== 10) return alert("Enter 10 digit mobile");
            verifyBtn.innerText = "Processing...";
            try {
                const res = await fetch(API_URL, { method: 'POST', body: JSON.stringify({ action: 'unlock_item', mobile, item_id: item }) });
                const data = await res.json();
                alert(data.message);
            } catch(e) { alert("Failed"); }
            verifyBtn.innerText = "Verify & Unlock";
        };
    }

    // Logout
    document.querySelectorAll('.logout-btn').forEach(b => b.onclick = () => { localStorage.clear(); location.reload(); });
});

// 6. CONTENT LOADER
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

// 7. TEST ENGINE
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
    document.getElementById('btn-prev').disabled = currentQIndex === 0;
    document.getElementById('btn-next').classList.toggle('hidden', currentQIndex === testQuestions.length-1);
    document.getElementById('btn-submit-exam').classList.toggle('hidden', currentQIndex !== testQuestions.length-1);
}

window.setAns = (v) => { userAnswers[currentQIndex] = v; };
document.getElementById('btn-next').onclick = () => { currentQIndex++; renderQ(); };
document.getElementById('btn-prev').onclick = () => { currentQIndex--; renderQ(); };
document.getElementById('btn-submit-exam').onclick = submitExam;

function submitExam() {
    clearInterval(timerInterval);
    let score = 0;
    testQuestions.forEach((q, i) => { if(userAnswers[i] === q.answer) score++; });
    document.getElementById('tr-score').innerText = `${score} / ${testQuestions.length}`;
    document.getElementById('test-engine-container').classList.add('hidden');
    document.getElementById('test-result-modal').classList.remove('hidden');
    document.getElementById('test-result-modal').style.display = 'flex';
}
document.getElementById('btn-close-result').onclick = () => location.reload();
