// Yahan aapka original Google Apps Script API URL dala gaya hai
const API_URL = "https://script.google.com/macros/s/AKfycby792N3uJaq_HFrJo9RxYXRKTpFYY3L8DrBR5EaH6BdsRaRXaqlrptr6X-JkEnABbri/exec";

document.addEventListener("DOMContentLoaded", function() {
    
    // ==================== SPLASH SCREEN ====================
    setTimeout(() => {
        const splashScreen = document.getElementById('splash-screen');
        const dashboard = document.getElementById('dashboard');

        splashScreen.style.opacity = '0';
        setTimeout(() => {
            splashScreen.classList.add('hidden');
            dashboard.classList.remove('hidden');
        }, 500);
    }, 3500);

    // ==================== SELECTORS ====================
    const loginModal = document.getElementById('login-modal');
    const dashboard = document.getElementById('dashboard');
    const profileSection = document.getElementById('profile-section');
    const adminPanel = document.getElementById('admin-panel');
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    
    // ==================== SIDEBAR & MODAL ====================
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
    
    document.getElementById('open-login-btn').onclick = (e) => {
        e.preventDefault();
        closeAll();
        loginModal.classList.remove('hidden');
        loginModal.style.display = 'flex';
    };

    // ==================== LOGIN TABS ====================
    const tabLogin = document.getElementById('tab-login');
    const tabRegister = document.getElementById('tab-register');
    const tabAdmin = document.getElementById('tab-admin');
    
    const formLogin = document.getElementById('student-login-form');
    const formRegister = document.getElementById('student-register-form');
    const formAdmin = document.getElementById('admin-login-form');

    function switchTab(activeTab, showForm) {
        tabLogin.classList.remove('active');
        tabRegister.classList.remove('active');
        tabAdmin.classList.remove('active');
        formLogin.classList.add('hidden');
        formRegister.classList.add('hidden');
        formAdmin.classList.add('hidden');
        activeTab.classList.add('active');
        showForm.classList.remove('hidden');
    }

    tabLogin.onclick = () => switchTab(tabLogin, formLogin);
    tabRegister.onclick = () => switchTab(tabRegister, formRegister);
    tabAdmin.onclick = () => switchTab(tabAdmin, formAdmin);

    // ==================== 1. STUDENT REGISTRATION (LIVE API) ====================
    formRegister.onsubmit = async (e) => {
        e.preventDefault();
        const btn = document.getElementById('btn-register');
        btn.innerText = "Registering Please Wait...";
        
        const payload = {
            action: 'register',
            mobile: document.getElementById('reg-mobile').value,
            email: document.getElementById('reg-email').value,
            dob: document.getElementById('reg-dob').value,
            state: document.getElementById('reg-state').value,
            password: document.getElementById('reg-pass').value
        };

        try {
            let res = await fetch(API_URL, { 
                method: 'POST', 
                body: JSON.stringify(payload) 
            });
            let data = await res.json();
            
            if (data.status === 'success') {
                alert("Registration Successful! Please login now.");
                switchTab(tabLogin, formLogin); 
                formRegister.reset();
            } else {
                alert("Registration Error: " + data.message);
            }
        } catch(err) {
            alert("Network Error! Please check your internet connection.");
        }
        btn.innerText = "Register Now";
    };

    // ==================== 2. STUDENT LOGIN (LIVE API) ====================
    formLogin.onsubmit = async (e) => {
        e.preventDefault();
        const btn = document.getElementById('btn-login');
        btn.innerText = "Logging in...";

        const payload = {
            action: 'login',
            mobile: document.getElementById('login-mobile').value,
            password: document.getElementById('login-pass').value
        };

        try {
            let res = await fetch(API_URL, { 
                method: 'POST', 
                body: JSON.stringify(payload) 
            });
            let data = await res.json();
            
            if (data.status === 'success') {
                document.getElementById('prof-name').innerText = data.user.name || "Student";
                document.getElementById('prof-mobile').innerText = "+91 " + data.user.mobile;
                document.getElementById('prof-state').innerText = data.user.state || "N/A";
                
                let unlocked = data.user.unlocked;
                document.getElementById('prof-unlocked').innerText = (unlocked && unlocked.trim() !== "") ? unlocked : "No Premium Courses";

                loginModal.classList.add('hidden');
                loginModal.style.display = '';
                dashboard.classList.add('hidden');
                profileSection.classList.remove('hidden');
                formLogin.reset();
            } else {
                alert("Login Error: " + data.message);
            }
        } catch(err) {
            alert("Network Error! Please check your internet connection.");
        }
        btn.innerText = "Login";
    };

    // ==================== 3. ADMIN LOGIN (LIVE API) ====================
    formAdmin.onsubmit = async (e) => {
        e.preventDefault();
        const btn = document.getElementById('btn-admin');
        btn.innerText = "Verifying Access...";

        const payload = {
            action: 'admin_login',
            admin_id: document.getElementById('admin-id').value,
            admin_pass: document.getElementById('admin-pass').value
        };

        try {
            let res = await fetch(API_URL, { 
                method: 'POST', 
                body: JSON.stringify(payload) 
            });
            let data = await res.json();
            
            if (data.status === 'success') {
                loginModal.classList.add('hidden');
                loginModal.style.display = '';
                dashboard.classList.add('hidden');
                adminPanel.classList.remove('hidden');
                formAdmin.reset();
            } else {
                alert("Admin Error: " + data.message);
            }
        } catch(err) {
            alert("Network Error! Please check your internet connection.");
        }
        btn.innerText = "Access Portal";
    };

    // ==================== BACK BUTTONS ====================
    document.getElementById('back-to-dash-student').onclick = () => {
        profileSection.classList.add('hidden');
        dashboard.classList.remove('hidden');
    };
    
    document.getElementById('back-to-dash-admin').onclick = () => {
        adminPanel.classList.add('hidden');
        dashboard.classList.remove('hidden');
    };

    // ==================== ADMIN MANUAL VERIFICATION (Mock for now) ====================
    document.getElementById('btn-verify').onclick = () => {
        const mobile = document.getElementById('verify-mobile').value;
        const statusBox = document.getElementById('verify-status');
        
        if(mobile.length >= 10) {
            statusBox.style.color = "green";
            statusBox.innerText = `✅ Success! Validation complete for ${mobile}.`;
        } else {
            statusBox.style.color = "red";
            statusBox.innerText = "❌ Enter valid 10-digit number.";
        }
    };

    // ==================== LOGOUT ====================
    document.querySelectorAll('.logout-btn').forEach(btn => {
        btn.onclick = () => {
            profileSection.classList.add('hidden');
            adminPanel.classList.add('hidden');
            dashboard.classList.remove('hidden');
            alert("Logged out successfully!");
        };
    });
});
          
