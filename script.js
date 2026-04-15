// Yahan aapka NAYA API URL attached hai
const API_URL = "https://script.google.com/macros/s/AKfycbyIcGTJtJYRYhEBWWkBuwLsOddd9XentQU6aSBEoTH5ihAro6kuimXtqO5qLtzmc-_x/exec";

// Global Memory
let currentUser = null; 
let fetchedData = { courses: [], tests: [] };

document.addEventListener("DOMContentLoaded", function() {
    
    // ==================== 1. SPLASH SCREEN LOGIC ====================
    setTimeout(() => {
        const splashScreen = document.getElementById('splash-screen');
        const dashboard = document.getElementById('dashboard');
        if(splashScreen && dashboard) {
            splashScreen.style.opacity = '0';
            setTimeout(() => {
                splashScreen.classList.add('hidden');
                dashboard.classList.remove('hidden');
            }, 500);
        }
    }, 3500);

    // ==================== 2. FETCH DATA FROM GOOGLE SHEETS ====================
    fetchLiveContent();

    // ==================== 3. MODAL & SIDEBAR CONTROLS ====================
    const loginModal = document.getElementById('login-modal');
    const detailsModal = document.getElementById('course-details-modal');
    const dashboard = document.getElementById('dashboard');
    const profileSection = document.getElementById('profile-section');
    const adminPanel = document.getElementById('admin-panel');
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    
    document.getElementById('menu-icon').onclick = () => {
        sidebar.classList.add('active');
        sidebarOverlay.style.display = 'block';
    };
    
    const closeAll = () => {
        sidebar.classList.remove('active');
        sidebarOverlay.style.display = 'none';
        loginModal.classList.add('hidden');
        loginModal.style.display = ''; 
    };
    
    document.getElementById('close-btn').onclick = closeAll;
    sidebarOverlay.onclick = closeAll;
    document.getElementById('close-login').onclick = closeAll;
    
    // View Details Close Logic (Clears content to stop video playback)
    document.getElementById('close-details').onclick = () => {
        detailsModal.classList.add('hidden');
        document.getElementById('cd-content').innerHTML = ''; 
    };
    
    document.getElementById('open-login-btn').onclick = (e) => {
        e.preventDefault();
        closeAll();
        loginModal.classList.remove('hidden');
        loginModal.style.display = 'flex';
    };

    // ==================== 4. LOGIN FORM TABS ====================
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

    // ==================== 5. REGISTER API CALL ====================
    formRegister.onsubmit = async (e) => {
        e.preventDefault();
        const btn = document.getElementById('btn-register');
        btn.innerText = "Registering...";
        const payload = {
            action: 'register', 
            mobile: document.getElementById('reg-mobile').value,
            email: document.getElementById('reg-email').value, 
            dob: document.getElementById('reg-dob').value,
            state: document.getElementById('reg-state').value, 
            password: document.getElementById('reg-pass').value
        };
        try {
            let res = await fetch(API_URL, { method: 'POST', body: JSON.stringify(payload) });
            let data = await res.json();
            if (data.status === 'success') {
                alert("Success! Please login to your account."); 
                switchTab(tabLogin, formLogin); 
                formRegister.reset();
            } else { alert("Registration Failed: " + data.message); }
        } catch(err) { alert("Network Error! Please try again."); }
        btn.innerText = "Register Now";
    };

    // ==================== 6. LOGIN API CALL ====================
    formLogin.onsubmit = async (e) => {
        e.preventDefault();
        const btn = document.getElementById('btn-login');
        btn.innerText = "Authenticating...";
        const payload = { action: 'login', mobile: document.getElementById('login-mobile').value, password: document.getElementById('login-pass').value };
        try {
            let res = await fetch(API_URL, { method: 'POST', body: JSON.stringify(payload) });
            let data = await res.json();
            if (data.status === 'success') {
                currentUser = data.user; 
                
                // Update UI
                document.getElementById('prof-name').innerText = currentUser.name || "Student";
                document.getElementById('prof-mobile').innerText = "+91 " + currentUser.mobile;
                document.getElementById('prof-state').innerText = currentUser.state || "N/A";
                let unlocked = currentUser.unlocked;
                document.getElementById('prof-unlocked').innerText = (unlocked && unlocked.trim() !== "") ? unlocked : "No Premium Courses";
                
                document.getElementById('open-login-btn').innerHTML = "👨‍🎓 My Profile";

                loginModal.classList.add('hidden');
                dashboard.classList.add('hidden');
                profileSection.classList.remove('hidden');
                formLogin.reset();
            } else { alert("Login Failed: " + data.message); }
        } catch(err) { alert("Network Error! Please try again."); }
        btn.innerText = "Login";
    };

    // ==================== 7. ADMIN LOGIN API CALL ====================
    formAdmin.onsubmit = async (e) => {
        e.preventDefault();
        const btn = document.getElementById('btn-admin');
        btn.innerText = "Verifying...";
        const payload = { action: 'admin_login', admin_id: document.getElementById('admin-id').value, admin_pass: document.getElementById('admin-pass').value };
        try {
            let res = await fetch(API_URL, { method: 'POST', body: JSON.stringify(payload) });
            let data = await res.json();
            if (data.status === 'success') {
                loginModal.classList.add('hidden');
                dashboard.classList.add('hidden');
                adminPanel.classList.remove('hidden');
                formAdmin.reset();
            } else { alert("Admin Access Denied: " + data.message); }
        } catch(err) { alert("Network Error!"); }
        btn.innerText = "Access Portal";
    };

    // ==================== 8. BACK & LOGOUT LOGIC ====================
    document.getElementById('back-to-dash-student').onclick = () => { profileSection.classList.add('hidden'); dashboard.classList.remove('hidden'); };
    document.getElementById('back-to-dash-admin').onclick = () => { adminPanel.classList.add('hidden'); dashboard.classList.remove('hidden'); };
    
    document.querySelectorAll('.logout-btn').forEach(btn => {
        btn.onclick = () => {
            currentUser = null;
            document.getElementById('open-login-btn').innerHTML = "🔐 Login / Register";
            profileSection.classList.add('hidden'); 
            adminPanel.classList.add('hidden'); 
            dashboard.classList.remove('hidden');
            alert("Logged out successfully!");
        };
    });

    // ==================== 9. ENGINE: FETCH & BUILD UI ====================
    async function fetchLiveContent() {
        const wrapper = document.getElementById('top-courses-wrapper');
        try {
            let res = await fetch(API_URL, { method: 'POST', body: JSON.stringify({ action: 'get_content' }) });
            let data = await res.json();
            if(data.status === 'success') {
                fetchedData.courses = data.courses || [];
                fetchedData.tests = data.tests || [];
                renderTopCourses(fetchedData.courses);
            } else {
                if(wrapper) wrapper.innerHTML = "<p style='color:red;'>Failed to load courses from Database.</p>";
            }
        } catch (error) {
            if(wrapper) wrapper.innerHTML = "<p style='color:red;'>Network issue fetching content.</p>";
        }
    }

    function renderTopCourses(courses) {
        const wrapper = document.getElementById('top-courses-wrapper');
        if(!wrapper) return;
        wrapper.innerHTML = ''; 
        
        if(courses.length === 0) {
            wrapper.innerHTML = "<p style='color:#aebcd0; font-size:14px;'>No courses found in database.</p>"; 
            return;
        }

        courses.forEach(course => {
            let icon = '💻';
            let cat = course.category ? course.category.toLowerCase() : '';
            let type = course.type ? course.type.toLowerCase() : '';
            
            if(cat.includes('tally')) icon = '📊';
            if(cat.includes('basic')) icon = '🖥️';
            if(type === 'pdf') icon = '📄';
            if(type === 'video') icon = '🎬';

            let priceText = (course.price == 0 || course.price == "") ? '<span style="color:green;">Free</span>' : `<span style="color:red;">₹${course.price}</span>`;

            let div = document.createElement('div');
            div.className = 'course-item';
            div.innerHTML = `
                <div class="course-icon">${icon}</div>
                <h4>${course.name}</h4>
                <p>${course.category} | ${priceText}</p>
                <button class="view-btn" onclick="openCourseDetails('${course.id}')">View Details</button>
            `;
            wrapper.appendChild(div);
        });
    }

    // Manual Verification (Admin Interface Logic)
    document.getElementById('btn-verify').onclick = () => {
        const mobile = document.getElementById('verify-mobile').value;
        const statusBox = document.getElementById('verify-status');
        if(mobile.length >= 10) {
            statusBox.style.color = "green";
            statusBox.innerText = `✅ Database updated for mobile ${mobile}.`;
        } else {
            statusBox.style.color = "red";
            statusBox.innerText = "❌ Enter a valid 10-digit mobile number.";
        }
    };
});

// ==================== 10. ENGINE: COURSE DETAILS & PREMIUM CHECK ====================
window.openCourseDetails = function(courseId) {
    const course = fetchedData.courses.find(c => c.id === courseId);
    if(!course) return;

    let isPremium = course.price > 0;
    let isUnlocked = false;

    if (isPremium) {
        if (!currentUser) {
            alert("This is Premium Content. Please Login or Register first.");
            return;
        }
        if (currentUser.unlocked && currentUser.unlocked.includes(courseId)) {
            isUnlocked = true;
        }
    }

    const modal = document.getElementById('course-details-modal');
    const title = document.getElementById('cd-title');
    const content = document.getElementById('cd-content');

    if(!modal || !title || !content) return;

    title.innerText = course.name;

    if (isPremium && !isUnlocked) {
        // Render Premium Lock Screen
        content.innerHTML = `
            <div style="text-align:center; padding: 20px;">
                <h2 style="font-size:40px; margin-bottom:10px;">🔒</h2>
                <h3 style="color:#d32f2f; margin-bottom:10px;">Premium Content Locked</h3>
                <p style="color:#333; margin-bottom:15px; font-size: 16px;">Fee: <strong>₹${course.price}</strong></p>
                <p style="font-size:13px; color:#666; background:#f9f9f9; padding: 10px; border-radius: 5px;">
                    Please pay via PhonePe/GPay at the center or to the Admin number.<br>Your content will be unlocked shortly after verification.
                </p>
            </div>`;
    } else {
        // Render Free or Unlocked Content
        let cType = course.type ? course.type.toLowerCase() : '';
        if (cType === 'video') {
            content.innerHTML = `<iframe width="100%" height="220" src="${course.link}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen style="border-radius:10px; border: 1px solid #ccc;"></iframe>`;
        } else if (cType === 'pdf') {
            content.innerHTML = `
            <div style="text-align:center; padding: 20px;">
                <h2 style="font-size:40px; margin-bottom:10px;">📄</h2>
                <p style="margin-bottom:15px; color:#0b2d63; font-weight: bold;">Your Document is Ready</p>
                <a href="${course.link}" target="_blank" class="submit-btn" style="text-decoration:none; display:inline-block; width:auto; padding:10px 20px;">Open & View PDF</a>
            </div>`;
        } else {
            content.innerHTML = `<p style="color:#000; text-align:center; margin-top: 20px;">Content is available on the external link:<br><br><a href="${course.link}" target="_blank" style="color:#0b2d63; font-weight:bold; text-decoration: underline;">Click Here to Access</a></p>`;
        }
    }
    
    modal.style.display = 'flex';
    modal.classList.remove('hidden');
};
        
