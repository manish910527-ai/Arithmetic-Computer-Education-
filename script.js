// AAPKA NAYA API URL YAHAN HAI
const API_URL = "https://script.google.com/macros/s/AKfycbxQX4mu_FSY5WdWUIG5gkSgBlwQygbXgTB61fp3v4MY14DmN4cpDQuU1rg1kXfgCSvw/exec";

// Global Variables
let currentUser = null; 
let fetchedData = { courses: [], tests: [] };

// Test Engine Variables
let currentTestId = "";
let testQuestions = [];
let currentQIndex = 0;
let userAnswers = {}; 
let timerInterval = null;
let timeLeft = 0; 

// Helper Function: YouTube link ko embed me badalna
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

// Helper Function: Profile UI update karna
function updateProfileUI() {
    if(!currentUser) return;
    document.getElementById('prof-name').innerText = currentUser.name || "Student";
    document.getElementById('prof-mobile').innerText = "+91 " + currentUser.mobile;
    document.getElementById('prof-state').innerText = currentUser.state || "N/A";
    let unlocked = currentUser.unlocked;
    document.getElementById('prof-unlocked').innerText = (unlocked && unlocked.trim() !== "") ? unlocked : "No Premium Courses";
    document.getElementById('open-login-btn').innerHTML = "👨‍🎓 My Profile";
}

document.addEventListener("DOMContentLoaded", function() {
    
    // SAFE AUTO-LOGIN CHECK
    try {
        const storedUser = localStorage.getItem('aceUser');
        if (storedUser) {
            currentUser = JSON.parse(storedUser);
            updateProfileUI();
        }
    } catch(e) {
        localStorage.removeItem('aceUser');
    }

    // ==================== 1. SPLASH SCREEN & AUTO-LOGIN LOGIC ====================
    setTimeout(() => {
        const splashScreen = document.getElementById('splash-screen');
        const dashboard = document.getElementById('dashboard');
        const loginModal = document.getElementById('login-modal');
        
        if(splashScreen && dashboard && loginModal) {
            splashScreen.style.opacity = '0';
            setTimeout(() => {
                splashScreen.classList.add('hidden');
                
                // Agar baccha login nahi hai, toh seedha Login page dikhao
                if(!currentUser) {
                    loginModal.classList.remove('hidden');
                    loginModal.style.display = 'flex';
                    document.getElementById('close-login').style.display = 'none'; // Close button hide karein
                } else {
                    dashboard.classList.remove('hidden');
                    document.getElementById('close-login').style.display = 'block';
                }
            }, 500);
        }
    }, 3500);

    // ==================== 2. FETCH DATA FROM GOOGLE SHEETS ====================
    fetchLiveContent();

    // ==================== 3. TOP NAV CARDS SCROLL ====================
    const scrollToSection = (id) => {
        const section = document.getElementById(id);
        if(section) {
            const yOffset = -70; 
            const y = section.getBoundingClientRect().top + window.pageYOffset + yOffset;
            window.scrollTo({top: y, behavior: 'smooth'});
        }
    };

    document.getElementById('nav-courses').onclick = () => scrollToSection('courses-section');
    document.getElementById('nav-pdfs').onclick = () => scrollToSection('pdfs-section');
    document.getElementById('nav-tests').onclick = () => scrollToSection('tests-section');
    document.getElementById('nav-mocks').onclick = () => scrollToSection('tests-section');
    
    document.getElementById('nav-results').onclick = () => {
        if(currentUser) {
            document.getElementById('dashboard').classList.add('hidden');
            document.getElementById('profile-section').classList.remove('hidden');
        } else { alert("🔐 Please login first to view your test results!"); }
    };

    document.getElementById('side-nav-pdfs').onclick = (e) => { e.preventDefault(); closeAll(); scrollToSection('pdfs-section'); };
    document.getElementById('side-nav-tests').onclick = (e) => { e.preventDefault(); closeAll(); scrollToSection('tests-section'); };

    // ==================== 4. MODALS & UI ====================
    const loginModal = document.getElementById('login-modal');
    const detailsModal = document.getElementById('course-details-modal');
    const dashboard = document.getElementById('dashboard');
    const profileSection = document.getElementById('profile-section');
    const adminPanel = document.getElementById('admin-panel');
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    
    document.getElementById('menu-icon').onclick = () => { sidebar.classList.add('active'); sidebarOverlay.style.display = 'block'; };
    
    const closeAll = () => {
        sidebar.classList.remove('active'); sidebarOverlay.style.display = 'none';
        if(currentUser) {
            loginModal.classList.add('hidden'); loginModal.style.display = ''; 
        }
    };
    
    document.getElementById('close-btn').onclick = closeAll;
    sidebarOverlay.onclick = closeAll;
    
    document.getElementById('close-login').onclick = () => {
        if(currentUser) {
            loginModal.classList.add('hidden');
            loginModal.style.display = '';
        }
    };
    
    document.getElementById('close-details').onclick = () => {
        detailsModal.classList.add('hidden');
        document.getElementById('cd-content').innerHTML = ''; // Stops video playback
    };
    
    document.getElementById('open-login-btn').onclick = (e) => {
        e.preventDefault(); closeAll();
        loginModal.classList.remove('hidden'); loginModal.style.display = 'flex';
        document.getElementById('close-login').style.display = 'block'; 
    };

    // ==================== 5. LOGIN/REGISTER LOGIC ====================
    const tabLogin = document.getElementById('tab-login');
    const tabRegister = document.getElementById('tab-register');
    const tabAdmin = document.getElementById('tab-admin');
    const formLogin = document.getElementById('student-login-form');
    const formRegister = document.getElementById('student-register-form');
    const formAdmin = document.getElementById('admin-login-form');

    function switchTab(activeTab, showForm) {
        tabLogin.classList.remove('active'); tabRegister.classList.remove('active'); tabAdmin.classList.remove('active');
        formLogin.classList.add('hidden'); formRegister.classList.add('hidden'); formAdmin.classList.add('hidden');
        activeTab.classList.add('active'); showForm.classList.remove('hidden');
    }
    
    tabLogin.onclick = () => switchTab(tabLogin, formLogin);
    tabRegister.onclick = () => switchTab(tabRegister, formRegister);
    tabAdmin.onclick = () => switchTab(tabAdmin, formAdmin);

    formRegister.onsubmit = async (e) => {
        e.preventDefault();
        const btn = document.getElementById('btn-register'); btn.innerText = "Registering...";
        const payload = {
            action: 'register', mobile: document.getElementById('reg-mobile').value, email: document.getElementById('reg-email').value, 
            dob: document.getElementById('reg-dob').value, state: document.getElementById('reg-state').value, password: document.getElementById('reg-pass').value
        };
        try {
            let res = await fetch(API_URL, { method: 'POST', body: JSON.stringify(payload) });
            let data = await res.json();
            if (data.status === 'success') { alert("Success! Please login now."); switchTab(tabLogin, formLogin); formRegister.reset(); } 
            else { alert("Error: " + data.message); }
        } catch(err) { alert("Network Error."); }
        btn.innerText = "Register Now";
    };

    formLogin.onsubmit = async (e) => {
        e.preventDefault();
        const btn = document.getElementById('btn-login'); btn.innerText = "Authenticating...";
        const payload = { action: 'login', mobile: document.getElementById('login-mobile').value, password: document.getElementById('login-pass').value };
        try {
            let res = await fetch(API_URL, { method: 'POST', body: JSON.stringify(payload) });
            let data = await res.json();
            if (data.status === 'success') {
                currentUser = data.user; 
                localStorage.setItem('aceUser', JSON.stringify(currentUser)); // Save session
                updateProfileUI();
                
                loginModal.classList.add('hidden'); 
                document.getElementById('close-login').style.display = 'block';
                dashboard.classList.remove('hidden'); 
                formLogin.reset();
            } else { alert("Login Failed: " + data.message); }
        } catch(err) { alert("Network Error! Please try again."); }
        btn.innerText = "Login";
    };

    formAdmin.onsubmit = async (e) => {
        e.preventDefault();
        const btn = document.getElementById('btn-admin'); btn.innerText = "Verifying...";
        const payload = { action: 'admin_login', admin_id: document.getElementById('admin-id').value, admin_pass: document.getElementById('admin-pass').value };
        try {
            let res = await fetch(API_URL, { method: 'POST', body: JSON.stringify(payload) });
            let data = await res.json();
            if (data.status === 'success') {
                loginModal.classList.add('hidden'); dashboard.classList.add('hidden'); adminPanel.classList.remove('hidden'); formAdmin.reset();
            } else { alert("Admin Error: " + data.message); }
        } catch(err) { alert("Network Error!"); }
        btn.innerText = "Access Portal";
    };

    document.getElementById('back-to-dash-student').onclick = () => { profileSection.classList.add('hidden'); dashboard.classList.remove('hidden'); };
    document.getElementById('back-to-dash-admin').onclick = () => { adminPanel.classList.add('hidden'); dashboard.classList.remove('hidden'); };
    
    document.querySelectorAll('.logout-btn').forEach(btn => {
        btn.onclick = () => {
            currentUser = null; 
            localStorage.removeItem('aceUser'); 
            document.getElementById('open-login-btn').innerHTML = "🔐 Login / Register";
            profileSection.classList.add('hidden'); adminPanel.classList.add('hidden'); dashboard.classList.add('hidden');
            loginModal.classList.remove('hidden'); loginModal.style.display = 'flex';
            document.getElementById('close-login').style.display = 'none'; 
            alert("Logged out successfully!");
        };
    });

    // ==================== 6. ENGINE: FETCH UI CARDS ====================
    async function fetchLiveContent() {
        try {
            let res = await fetch(API_URL, { method: 'POST', body: JSON.stringify({ action: 'get_content' }) });
            let data = await res.json();
            if(data.status === 'success') {
                fetchedData.courses = data.courses || [];
                fetchedData.tests = data.tests || [];
                renderAllSections();
            }
        } catch (error) { console.log("Fetch Error", error); }
    }

    function renderAllSections() {
        const videoWrapper = document.getElementById('video-courses-wrapper');
        const pdfWrapper = document.getElementById('pdf-notes-wrapper');
        const testWrapper = document.getElementById('test-series-wrapper');

        if(videoWrapper) videoWrapper.innerHTML = ''; 
        if(pdfWrapper) pdfWrapper.innerHTML = ''; 
        if(testWrapper) testWrapper.innerHTML = ''; 

        let videos = fetchedData.courses.filter(c => c.type && c.type.toLowerCase() === 'video');
        let pdfs = fetchedData.courses.filter(c => c.type && c.type.toLowerCase() === 'pdf');
        let tests = fetchedData.tests;

        if(videos.length === 0 && videoWrapper) videoWrapper.innerHTML = "<p style='color:#aebcd0; font-size:14px; padding-left:10px;'>No video courses found.</p>";
        else videos.forEach(c => { if(videoWrapper) videoWrapper.appendChild(createItemCard(c, 'video')) });

        if(pdfs.length === 0 && pdfWrapper) pdfWrapper.innerHTML = "<p style='color:#aebcd0; font-size:14px; padding-left:10px;'>No PDF notes found.</p>";
        else pdfs.forEach(c => { if(pdfWrapper) pdfWrapper.appendChild(createItemCard(c, 'pdf')) });

        if(tests.length === 0 && testWrapper) testWrapper.innerHTML = "<p style='color:#aebcd0; font-size:14px; padding-left:10px;'>No test series found.</p>";
        else tests.forEach(t => { if(testWrapper) testWrapper.appendChild(createTestCard(t)) });
    }

    function createItemCard(item, type) {
        let icon = type === 'video' ? '🎬' : '📄';
        if(item.category && item.category.toLowerCase().includes('tally')) icon = '📊';
        else if(item.category && item.category.toLowerCase().includes('basic')) icon = '🖥️';
        let priceText = (item.price == 0 || item.price == "") ? '<span style="color:green;">Free</span>' : `<span style="color:red;">₹${item.price}</span>`;
        let div = document.createElement('div'); div.className = 'course-item';
        div.innerHTML = `<div class="course-icon">${icon}</div><h4>${item.name}</h4><p>${item.category} | ${priceText}</p><button class="view-btn" onclick="openCourseDetails('${item.id}', false)">View Details</button>`;
        return div;
    }

    function createTestCard(test) {
        let priceText = (test.price == 0 || test.price == "") ? '<span style="color:green;">Free</span>' : `<span style="color:red;">₹${test.price}</span>`;
        let div = document.createElement('div'); div.className = 'course-item'; div.style.borderTop = "4px solid #ce9c3b"; 
        div.innerHTML = `<div class="course-icon">⏱️</div><h4>${test.name}</h4><p>${test.questions} Qs | ${test.time} Mins<br>${priceText}</p><button class="view-btn" style="background:#ce9c3b; color:#0b2d63;" onclick="openCourseDetails('${test.id}', true)">Start Test</button>`;
        return div;
    }

    // ==================== 8. ADMIN UNLOCK LOGIC ====================
    document.getElementById('btn-verify').onclick = async () => {
        const mobile = document.getElementById('verify-mobile').value;
        const itemId = document.getElementById('verify-item').value;
        const statusBox = document.getElementById('verify-status');
        const btn = document.getElementById('btn-verify');

        if(mobile.length !== 10 || itemId.trim() === "") {
            statusBox.style.color = "red"; statusBox.innerText = "❌ Enter valid mobile & Item ID."; return;
        }

        btn.innerText = "Verifying..."; statusBox.innerText = "";
        const payload = { action: 'unlock_item', mobile: mobile, item_id: itemId };

        try {
            let res = await fetch(API_URL, { method: 'POST', body: JSON.stringify(payload) });
            let data = await res.json();
            if (data.status === 'success') {
                statusBox.style.color = "green"; statusBox.innerText = `✅ Success! Unlocked.`;
                document.getElementById('verify-mobile').value = ''; document.getElementById('verify-item').value = '';
            } else {
                statusBox.style.color = "red"; statusBox.innerText = "❌ " + data.message;
            }
        } catch(err) { statusBox.style.color = "red"; statusBox.innerText = "❌ Network Error!"; }
        btn.innerText = "Verify & Unlock";
    };
});

// ==================== 7. EXAM ENGINE CORE ====================
// Note: Yeh functions bahar hone chahiye taaki HTML ke 'onclick' inko dhoond sakein
window.startLiveExam = async function(testId, testName, testTime) {
    document.getElementById('course-details-modal').classList.add('hidden'); 
    document.getElementById('dashboard').classList.add('hidden'); 
    document.getElementById('test-engine-container').classList.remove('hidden'); 
    
    document.getElementById('te-title').innerText = testName;
    document.getElementById('te-qtext').innerText = "Loading exam questions from server...";
    document.getElementById('te-options').innerHTML = '';
    document.getElementById('te-loading').style.display = 'inline';
    
    currentTestId = testId;
    currentQIndex = 0;
    userAnswers = {};
    clearInterval(timerInterval);

    try {
        let res = await fetch(API_URL, { method: 'POST', body: JSON.stringify({ action: 'get_questions', test_id: testId }) });
        let data = await res.json();
        
        document.getElementById('te-loading').style.display = 'none';
        
        if(data.status === 'success' && data.questions.length > 0) {
            testQuestions = data.questions;
            timeLeft = parseInt(testTime) * 60; 
            window.startTimer();
            window.renderCurrentQuestion();
        } else {
            document.getElementById('te-qtext').innerText = "Error: No questions found in database for this test.";
        }
    } catch(e) {
        document.getElementById('te-loading').style.display = 'none';
        document.getElementById('te-qtext').innerText = "Network Error! Could not load questions.";
    }
};

window.startTimer = function() {
    window.updateTimerUI();
    timerInterval = setInterval(() => {
        timeLeft--;
        window.updateTimerUI();
        if(timeLeft <= 0) {
            clearInterval(timerInterval);
            alert("⏰ Time is up! Submitting exam automatically.");
            window.submitExam();
        }
    }, 1000);
};

window.updateTimerUI = function() {
    let m = Math.floor(timeLeft / 60);
    let s = timeLeft % 60;
    document.getElementById('te-timer').innerText = `⏳ ${m < 10 ? '0'+m : m}:${s < 10 ? '0'+s : s}`;
    if(timeLeft <= 60) document.getElementById('te-timer').style.color = "red"; 
};

window.renderCurrentQuestion = function() {
    if(testQuestions.length === 0) return;
    let q = testQuestions[currentQIndex];
    
    document.getElementById('te-qno').innerText = `Question ${currentQIndex + 1} of ${testQuestions.length}`;
    document.getElementById('te-qtext').innerText = `Q${currentQIndex + 1}. ${q.question}`;
    
    let optionsHtml = '';
    let opts = [ {key:'A', val:q.optA}, {key:'B', val:q.optB}, {key:'C', val:q.optC}, {key:'D', val:q.optD} ];
    
    opts.forEach(opt => {
        if(opt.val && opt.val.trim() !== "") {
            let isChecked = userAnswers[currentQIndex] === opt.key ? 'checked' : '';
            optionsHtml += `
                <label class="option-label" onclick="selectOption(${currentQIndex}, '${opt.key}')">
                    <input type="radio" name="q_opt" class="option-input" value="${opt.key}" ${isChecked}> 
                    <span style="font-weight:bold; color:#ce9c3b; margin-right:5px;">${opt.key}.</span> ${opt.val}
                </label>
            `;
        }
    });
    document.getElementById('te-options').innerHTML = optionsHtml;

    document.getElementById('btn-prev').disabled = currentQIndex === 0;
    
    if(currentQIndex === testQuestions.length - 1) {
        document.getElementById('btn-next').classList.add('hidden');
        document.getElementById('btn-submit-exam').classList.remove('hidden');
    } else {
        document.getElementById('btn-next').classList.remove('hidden');
        document.getElementById('btn-next').disabled = false;
        document.getElementById('btn-submit-exam').classList.add('hidden');
    }
};

window.selectOption = function(qIndex, answerKey) {
    userAnswers[qIndex] = answerKey;
    const radios = document.getElementsByName('q_opt');
    for(let i=0; i<radios.length; i++){ if(radios[i].value === answerKey) radios[i].checked = true; }
};

document.getElementById('btn-next').onclick = () => { if(currentQIndex < testQuestions.length - 1) { currentQIndex++; window.renderCurrentQuestion(); } };
document.getElementById('btn-prev').onclick = () => { if(currentQIndex > 0) { currentQIndex--; window.renderCurrentQuestion(); } };
document.getElementById('btn-submit-exam').onclick = () => { if(confirm("Are you sure you want to submit the exam?")) window.submitExam(); };

window.submitExam = function() {
    clearInterval(timerInterval);
    document.getElementById('test-engine-container').classList.add('hidden');
    
    let correct = 0;
    let wrong = 0;
    
    testQuestions.forEach((q, index) => {
        let uAns = userAnswers[index];
        if(uAns) {
            if(uAns.trim().toUpperCase() === q.answer.toString().trim().toUpperCase()) { correct++; } 
            else { wrong++; }
        }
    });

    document.getElementById('tr-score').innerText = `${correct} / ${testQuestions.length}`;
    document.getElementById('tr-correct').innerText = `✅ Correct: ${correct}`;
    document.getElementById('tr-wrong').innerText = `❌ Wrong: ${wrong}`;
    
    document.getElementById('test-result-modal').classList.remove('hidden');
    document.getElementById('test-result-modal').style.display = 'flex';
};

document.getElementById('btn-close-result').onclick = () => {
    document.getElementById('test-result-modal').classList.add('hidden');
    document.getElementById('dashboard').classList.remove('hidden');
};

// ==================== 9. DETAILS MODAL LOGIC ====================
window.openCourseDetails = function(itemId, isTest) {
    let item = isTest ? fetchedData.tests.find(t => t.id === itemId) : fetchedData.courses.find(c => c.id === itemId);
    if(!item) return;

    let isPremium = item.price > 0;
    let isUnlocked = false;

    if (isPremium) {
        if (!currentUser) { alert("This is Premium Content. Please Login or Register first."); return; }
        if (currentUser.unlocked && currentUser.unlocked.toString().indexOf(itemId) !== -1) { isUnlocked = true; }
    }

    const modal = document.getElementById('course-details-modal');
    const title = document.getElementById('cd-title');
    const content = document.getElementById('cd-content');

    title.innerText = item.name;

    if (isPremium && !isUnlocked) {
        const upiLink = `upi://pay?pa=9589769913@ybl&pn=Arithmetic%20Computer%20Education&am=${item.price}&cu=INR&tn=Course%20Purchase`;
        content.innerHTML = `
            <div style="text-align:center; padding: 20px;">
                <h2 style="font-size:40px; margin-bottom:10px;">🔒</h2>
                <h3 style="color:#d32f2f; margin-bottom:10px;">Premium Content</h3>
                <p style="color:#333; margin-bottom:15px; font-size: 16px;">Course Fee: <strong>₹${item.price}</strong></p>
                <a href="${upiLink}" style="display:block; background:#28a745; color:white; padding:12px; border-radius:8px; text-decoration:none; font-weight:bold; margin-bottom:15px; box-shadow: 0 4px 6px rgba(0,0,0,0.2);">
                    Pay ₹${item.price} via UPI App
                </a>
                <p style="font-size:13px; color:#666; background:#f9f9f9; padding: 10px; border-radius: 5px;">
                    Send a screenshot to Admin WhatsApp (+91 9589769913) after payment to unlock immediately.
                </p>
            </div>`;
    } else {
        if(isTest) {
            content.innerHTML = `
            <div style="text-align:center; padding: 20px;">
                <h2 style="font-size:40px; margin-bottom:10px;">📝</h2>
                <p style="margin-bottom:15px; color:#0b2d63; font-weight: bold;">
                    Questions: ${item.questions} <br> Time Limit: ${item.time} Mins
                </p>
                <button class="submit-btn" style="background:#ce9c3b; color:#0b2d63;" onclick="startLiveExam('${item.id}', '${item.name}', '${item.time}')">Start Exam Now</button>
            </div>`;
        } else {
            let cType = item.type ? item.type.toLowerCase() : '';
            if (cType === 'video') { 
                let safeUrl = getEmbedUrl(item.link); 
                content.innerHTML = `<iframe width="100%" height="220" src="${safeUrl}" frameborder="0" allowfullscreen style="border-radius:10px; border: 1px solid #ccc;"></iframe>`; 
            } 
            else if (cType === 'pdf') { 
                content.innerHTML = `<div style="text-align:center; padding: 20px;"><h2 style="font-size:40px; margin-bottom:10px;">📄</h2><a href="${item.link}" target="_blank" class="submit-btn" style="display:inline-block; width:auto; padding:10px 20px;">View PDF</a></div>`; 
            }
        }
    }
    modal.style.display = 'flex'; modal.classList.remove('hidden');
};
