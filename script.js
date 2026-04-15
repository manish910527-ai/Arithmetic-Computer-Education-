// AAPKA LATEST API URL
const API_URL = "https://script.google.com/macros/s/AKfycbxQX4mu_FSY5WdWUIG5gkSgBlwQygbXgTB61fp3v4MY14DmN4cpDQuU1rg1kXfgCSvw/exec";

// Global Memory
let currentUser = null; 
let fetchedData = { courses: [], tests: [] };
let currentTestId = "";
let testQuestions = [];
let currentQIndex = 0;
let userAnswers = {}; 
let timerInterval = null;
let timeLeft = 0; 

// YouTube Link Fixer
function getEmbedUrl(url) {
    if (!url) return "";
    let finalUrl = url;
    if (url.includes("watch?v=")) {
        finalUrl = url.replace("watch?v=", "embed/");
        finalUrl = finalUrl.split("&")[0]; 
    } else if (url.includes("youtu.be/")) {
        finalUrl = url.replace("youtu.be/", "www.youtube.com/embed/");
        finalUrl = finalUrl.split("?")[0];
    }
    return finalUrl;
}

// Profile UI Update
function updateProfileUI() {
    if(!currentUser) return;
    if(document.getElementById('prof-name')) document.getElementById('prof-name').innerText = currentUser.name || "Student";
    if(document.getElementById('prof-mobile')) document.getElementById('prof-mobile').innerText = "+91 " + currentUser.mobile;
    if(document.getElementById('prof-state')) document.getElementById('prof-state').innerText = currentUser.state || "N/A";
    
    let unlocked = currentUser.unlocked;
    if(document.getElementById('prof-unlocked')) {
        document.getElementById('prof-unlocked').innerText = (unlocked && unlocked.trim() !== "") ? unlocked : "No Premium Courses";
    }
    if(document.getElementById('open-login-btn')) document.getElementById('open-login-btn').innerHTML = "👨‍🎓 My Profile";
}

document.addEventListener("DOMContentLoaded", function() {
    
    // Auto-Login Check
    const storedUser = localStorage.getItem('aceUser');
    if (storedUser) {
        try {
            currentUser = JSON.parse(storedUser);
            updateProfileUI();
        } catch(e) { localStorage.removeItem('aceUser'); }
    }

    // SPLASH SCREEN & FORCE LOGIN
    setTimeout(() => {
        const splashScreen = document.getElementById('splash-screen');
        const dashboard = document.getElementById('dashboard');
        const loginModal = document.getElementById('login-modal');
        
        if(splashScreen) splashScreen.style.opacity = '0';
        
        setTimeout(() => {
            if(splashScreen) splashScreen.classList.add('hidden');
            
            if(!currentUser) {
                if(loginModal) {
                    loginModal.classList.remove('hidden');
                    loginModal.style.display = 'flex';
                    if(document.getElementById('close-login')) document.getElementById('close-login').style.display = 'none';
                }
            } else {
                if(dashboard) dashboard.classList.remove('hidden');
            }
        }, 500);
    }, 3500);

    fetchLiveContent();

    // NAVIGATION SCROLL
    const scrollToSection = (id) => {
        const section = document.getElementById(id);
        if(section) {
            const yOffset = -70; 
            const y = section.getBoundingClientRect().top + window.pageYOffset + yOffset;
            window.scrollTo({top: y, behavior: 'smooth'});
        }
    };

    if(document.getElementById('nav-courses')) document.getElementById('nav-courses').onclick = () => scrollToSection('courses-section');
    if(document.getElementById('nav-pdfs')) document.getElementById('nav-pdfs').onclick = () => scrollToSection('pdfs-section');
    if(document.getElementById('nav-tests')) document.getElementById('nav-tests').onclick = () => scrollToSection('tests-section');
    if(document.getElementById('nav-mocks')) document.getElementById('nav-mocks').onclick = () => scrollToSection('tests-section');
    
    if(document.getElementById('nav-results')) {
        document.getElementById('nav-results').onclick = () => {
            if(currentUser) {
                document.getElementById('dashboard').classList.add('hidden');
                document.getElementById('profile-section').classList.remove('hidden');
            } else { alert("🔐 Please login first!"); }
        };
    }

    // MODAL & SIDEBAR
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    
    if(document.getElementById('menu-icon')) {
        document.getElementById('menu-icon').onclick = () => {
            sidebar.classList.add('active');
            sidebarOverlay.style.display = 'block';
        };
    }
    
    const closeAll = () => {
        if(sidebar) sidebar.classList.remove('active');
        if(sidebarOverlay) sidebarOverlay.style.display = 'none';
        if(currentUser && document.getElementById('login-modal')) {
            document.getElementById('login-modal').classList.add('hidden');
        }
    };
    
    if(document.getElementById('close-btn')) document.getElementById('close-btn').onclick = closeAll;
    if(sidebarOverlay) sidebarOverlay.onclick = closeAll;
    
    if(document.getElementById('close-login')) {
        document.getElementById('close-login').onclick = () => {
            if(currentUser) document.getElementById('login-modal').classList.add('hidden');
        };
    }

    if(document.getElementById('close-details')) {
        document.getElementById('close-details').onclick = () => {
            document.getElementById('course-details-modal').classList.add('hidden');
            document.getElementById('cd-content').innerHTML = ''; 
        };
    }

    if(document.getElementById('open-login-btn')) {
        document.getElementById('open-login-btn').onclick = (e) => {
            e.preventDefault(); closeAll();
            const modal = document.getElementById('login-modal');
            modal.classList.remove('hidden'); modal.style.display = 'flex';
            document.getElementById('close-login').style.display = 'block'; 
        };
    }

    // LOGIN / REGISTER TABS
    const tabLogin = document.getElementById('tab-login');
    const tabRegister = document.getElementById('tab-register');
    const tabAdmin = document.getElementById('tab-admin');
    const formLogin = document.getElementById('student-login-form');
    const formRegister = document.getElementById('student-register-form');
    const formAdmin = document.getElementById('admin-login-form');

    function switchTab(activeTab, showForm) {
        [tabLogin, tabRegister, tabAdmin].forEach(t => t && t.classList.remove('active'));
        [formLogin, formRegister, formAdmin].forEach(f => f && f.classList.add('hidden'));
        if(activeTab) activeTab.classList.add('active');
        if(showForm) showForm.classList.remove('hidden');
    }
    
    if(tabLogin) tabLogin.onclick = () => switchTab(tabLogin, formLogin);
    if(tabRegister) tabRegister.onclick = () => switchTab(tabRegister, formRegister);
    if(tabAdmin) tabAdmin.onclick = () => switchTab(tabAdmin, formAdmin);

    // FORMS SUBMIT
    if(formRegister) {
        formRegister.onsubmit = async (e) => {
            e.preventDefault();
            const btn = document.getElementById('btn-register'); btn.innerText = "Processing...";
            const payload = {
                action: 'register', mobile: document.getElementById('reg-mobile').value,
                email: document.getElementById('reg-email').value, dob: document.getElementById('reg-dob').value,
                state: document.getElementById('reg-state').value, password: document.getElementById('reg-pass').value
            };
            try {
                let res = await fetch(API_URL, { method: 'POST', body: JSON.stringify(payload) });
                let data = await res.json();
                if (data.status === 'success') { alert("Success! Login now."); switchTab(tabLogin, formLogin); } 
                else { alert("Error: " + data.message); }
            } catch(err) { alert("Network Error."); }
            btn.innerText = "Register Now";
        };
    }

    if(formLogin) {
        formLogin.onsubmit = async (e) => {
            e.preventDefault();
            const btn = document.getElementById('btn-login'); btn.innerText = "Verifying...";
            const payload = { action: 'login', mobile: document.getElementById('login-mobile').value, password: document.getElementById('login-pass').value };
            try {
                let res = await fetch(API_URL, { method: 'POST', body: JSON.stringify(payload) });
                let data = await res.json();
                if (data.status === 'success') {
                    currentUser = data.user; 
                    localStorage.setItem('aceUser', JSON.stringify(currentUser));
                    updateProfileUI();
                    document.getElementById('login-modal').classList.add('hidden');
                    document.getElementById('dashboard').classList.remove('hidden');
                } else { alert("Error: " + data.message); }
            } catch(err) { alert("Error connecting to server."); }
            btn.innerText = "Login";
        };
    }

    if(formAdmin) {
        formAdmin.onsubmit = async (e) => {
            e.preventDefault();
            const btn = document.getElementById('btn-admin'); btn.innerText = "Accessing...";
            const payload = { action: 'admin_login', admin_id: document.getElementById('admin-id').value, admin_pass: document.getElementById('admin-pass').value };
            try {
                let res = await fetch(API_URL, { method: 'POST', body: JSON.stringify(payload) });
                let data = await res.json();
                if (data.status === 'success') {
                    document.getElementById('login-modal').classList.add('hidden');
                    document.getElementById('admin-panel').classList.remove('hidden');
                } else { alert("Admin Error: " + data.message); }
            } catch(err) { alert("Network Error."); }
            btn.innerText = "Access Portal";
        };
    }

    // LOGOUT
    document.querySelectorAll('.logout-btn').forEach(btn => {
        btn.onclick = () => {
            currentUser = null; 
            localStorage.removeItem('aceUser'); 
            location.reload(); // Hard reset for safety
        };
    });

    // ADMIN UNLOCK
    if(document.getElementById('btn-verify')) {
        document.getElementById('btn-verify').onclick = async () => {
            const mobile = document.getElementById('verify-mobile').value;
            const itemId = document.getElementById('verify-item').value;
            const statusBox = document.getElementById('verify-status');
            if(mobile.length !== 10 || itemId === "") return alert("Check inputs");
            
            statusBox.innerText = "Updating Database...";
            try {
                let res = await fetch(API_URL, { method: 'POST', body: JSON.stringify({ action: 'unlock_item', mobile, item_id: itemId }) });
                let data = await res.json();
                statusBox.innerText = data.status === 'success' ? "✅ Unlocked!" : "❌ " + data.message;
            } catch(e) { statusBox.innerText = "❌ Connection Failed"; }
        };
    }

    // FETCH CONTENT
    async function fetchLiveContent() {
        try {
            let res = await fetch(API_URL, { method: 'POST', body: JSON.stringify({ action: 'get_content' }) });
            let data = await res.json();
            if(data.status === 'success') {
                fetchedData.courses = data.courses || [];
                fetchedData.tests = data.tests || [];
                renderAllSections();
            }
        } catch (e) { console.log("Fetch failed"); }
    }

    function renderAllSections() {
        const vWrap = document.getElementById('video-courses-wrapper');
        const pWrap = document.getElementById('pdf-notes-wrapper');
        const tWrap = document.getElementById('test-series-wrapper');
        [vWrap, pWrap, tWrap].forEach(w => w && (w.innerHTML = ''));

        fetchedData.courses.filter(c => c.type.toLowerCase() === 'video').forEach(c => vWrap.appendChild(createCard(c, 'video')));
        fetchedData.courses.filter(c => c.type.toLowerCase() === 'pdf').forEach(c => pWrap.appendChild(createCard(c, 'pdf')));
        fetchedData.tests.forEach(t => tWrap.appendChild(createTestCard(t)));
    }

    function createCard(item, type) {
        let icon = type === 'video' ? '🎬' : '📄';
        if(item.category.toLowerCase().includes('tally')) icon = '📊';
        let div = document.createElement('div'); div.className = 'course-item';
        div.innerHTML = `<div class="course-icon">${icon}</div><h4>${item.name}</h4><p>${item.category} | ${item.price == 0 ? 'Free' : '₹'+item.price}</p><button class="view-btn" onclick="openCourseDetails('${item.id}', false)">View</button>`;
        return div;
    }

    function createTestCard(test) {
        let div = document.createElement('div'); div.className = 'course-item'; div.style.borderTop = "4px solid #ce9c3b";
        div.innerHTML = `<div class="course-icon">⏱️</div><h4>${test.name}</h4><p>${test.questions} Qs | ${test.time} Min</p><button class="view-btn" style="background:#ce9c3b; color:#000" onclick="openCourseDetails('${test.id}', true)">Start</button>`;
        return div;
    }
});

// EXAM ENGINE
window.startLiveExam = async function(id, name, time) {
    document.getElementById('course-details-modal').classList.add('hidden');
    document.getElementById('dashboard').classList.add('hidden');
    document.getElementById('test-engine-container').classList.remove('hidden');
    
    document.getElementById('te-title').innerText = name;
    document.getElementById('te-options').innerHTML = 'Loading questions...';
    
    try {
        let res = await fetch(API_URL, { method: 'POST', body: JSON.stringify({ action: 'get_questions', test_id: id }) });
        let data = await res.json();
        if(data.status === 'success') {
            testQuestions = data.questions; timeLeft = time * 60;
            currentQIndex = 0; userAnswers = {};
            startTimer(); renderQuestion();
        }
    } catch(e) { alert("Test failed to load"); }
};

function startTimer() {
    timerInterval = setInterval(() => {
        timeLeft--;
        let m = Math.floor(timeLeft/60), s = timeLeft%60;
        document.getElementById('te-timer').innerText = `⏳ ${m}:${s < 10 ? '0'+s : s}`;
        if(timeLeft <= 0) { clearInterval(timerInterval); submitExam(); }
    }, 1000);
}

function renderQuestion() {
    let q = testQuestions[currentQIndex];
    document.getElementById('te-qno').innerText = `Question ${currentQIndex+1} of ${testQuestions.length}`;
    document.getElementById('te-qtext').innerText = q.question;
    
    let html = '';
    [{k:'A',v:q.optA},{k:'B',v:q.optB},{k:'C',v:q.optC},{k:'D',v:q.optD}].forEach(o => {
        if(o.v) html += `<label class="option-label" onclick="selectOption(${currentQIndex},'${o.k}')"><input type="radio" name="opt" value="${o.k}" ${userAnswers[currentQIndex]==o.k?'checked':''}> ${o.k}. ${o.v}</label>`;
    });
    document.getElementById('te-options').innerHTML = html;
    document.getElementById('btn-prev').disabled = currentQIndex === 0;
    document.getElementById('btn-next').classList.toggle('hidden', currentQIndex === testQuestions.length-1);
    document.getElementById('btn-submit-exam').classList.toggle('hidden', currentQIndex !== testQuestions.length-1);
}

window.selectOption = (idx, val) => { userAnswers[idx] = val; };
document.getElementById('btn-next').onclick = () => { currentQIndex++; renderQuestion(); };
document.getElementById('btn-prev').onclick = () => { currentQIndex--; renderQuestion(); };
document.getElementById('btn-submit-exam').onclick = () => { if(confirm("Submit Exam?")) submitExam(); };

function submitExam() {
    clearInterval(timerInterval);
    let correct = 0;
    testQuestions.forEach((q, i) => { if(userAnswers[i] === q.answer) correct++; });
    document.getElementById('tr-score').innerText = `${correct} / ${testQuestions.length}`;
    document.getElementById('test-engine-container').classList.add('hidden');
    document.getElementById('test-result-modal').classList.remove('hidden');
    document.getElementById('test-result-modal').style.display = 'flex';
}
document.getElementById('btn-close-result').onclick = () => location.reload();

// VIEW DETAILS & UPI
window.openCourseDetails = function(id, isTest) {
    let item = isTest ? fetchedData.tests.find(t=>t.id===id) : fetchedData.courses.find(c=>c.id===id);
    if(!item) return;

    if (item.price > 0 && (!currentUser || !currentUser.unlocked || !currentUser.unlocked.includes(id))) {
        const upi = `upi://pay?pa=9589769913@ybl&pn=Arithmetic%20Computer&am=${item.price}&cu=INR`;
        document.getElementById('cd-content').innerHTML = `<div style="text-align:center;padding:20px"><h2>🔒 Premium</h2><p>Fee: ₹${item.price}</p><a href="${upi}" style="display:block;background:#28a745;color:#fff;padding:12px;border-radius:8px;text-decoration:none">Pay via UPI App</a><p style="font-size:12px;margin-top:10px">Send screenshot to 9589769913 to unlock.</p></div>`;
    } else {
        if(isTest) {
            document.getElementById('cd-content').innerHTML = `<div style="text-align:center;padding:20px"><h2>📝 ${item.name}</h2><p>${item.questions} Qs | ${item.time} Mins</p><button class="submit-btn" style="background:#ce9c3b;color:#000" onclick="startLiveExam('${item.id}','${item.name}',${item.time})">Start Exam Now</button></div>`;
        } else {
            if(item.type.toLowerCase()==='video') document.getElementById('cd-content').innerHTML = `<iframe width="100%" height="220" src="${getEmbedUrl(item.link)}" frameborder="0" allowfullscreen></iframe>`;
            else document.getElementById('cd-content').innerHTML = `<div style="text-align:center;padding:20px"><h2>📄 PDF Ready</h2><a href="${item.link}" target="_blank" class="submit-btn">Open PDF</a></div>`;
        }
    }
    document.getElementById('cd-title').innerText = item.name;
    document.getElementById('course-details-modal').classList.remove('hidden');
    document.getElementById('course-details-modal').style.display = 'flex';
};
            
