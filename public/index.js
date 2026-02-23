// Header sign-in scroll
const headerSignInBtn = document.getElementById('header-sign-in-btn');
if (headerSignInBtn) {
    headerSignInBtn.addEventListener('click', () => {
        const authSection = document.getElementById('auth-section');
        if (authSection) authSection.scrollIntoView({ behavior: 'smooth' });
    });
}

// Auth toggle buttons
const authSignInBtn = document.getElementById('auth-sign-in-btn');
const authSignUpBtn = document.getElementById('auth-sign-up-btn');
const signInDiv = document.getElementById('sign-in-div');
const signUpDiv = document.getElementById('sign-up-div');
const signInForm = document.getElementById('sign-in-form');
const signUpForm = document.getElementById('sign-up-form');

if (authSignInBtn && authSignUpBtn && signInDiv && signUpDiv) {
    authSignInBtn.addEventListener('click', () => {
        signInDiv.style.display = 'block';
        signUpDiv.style.display = 'none';
        authSignInBtn.classList.add('active');
        authSignUpBtn.classList.remove('active');
    });

    authSignUpBtn.addEventListener('click', () => {
        signUpDiv.style.display = 'block';
        signInDiv.style.display = 'none';
        authSignUpBtn.classList.add('active');
        authSignInBtn.classList.remove('active');
    });
}

// Sign-in form submit
if (signInForm) {
    signInForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        fetch('/signin', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
            headers: { 'Content-Type': 'application/json' }
        })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    sessionStorage.clear();
                    sessionStorage.setItem('email', email);
                    sessionStorage.setItem('role', data.role);
                    window.location.href = data.redirectedWebpage || '/homeowner';
                } else {
                    alert(data.message || 'Sign in failed');
                }
            })
            .catch(err => console.error('Sign in error', err));
    });
}

// Sign-up form submit
if (signUpForm) {
    signUpForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementsByName('sign-up-email')[0].value;
        const name = document.getElementsByName('sign-up-name')[0].value;
        const address = document.getElementsByName('home-address')[0].value;
        const phone_number = document.getElementsByName('phone-number')[0].value;
        const gender = document.getElementsByName('gender')[0].value;
        const race = document.getElementsByName('race')[0].value;
        const password = document.getElementsByName('sign-up-password')[0].value;
        const confirmPassword = document.getElementsByName('sign-up-confirm-password')[0].value;

        fetch('/signup', {
            method: 'POST',
            body: JSON.stringify({ email, name, address, phone_number, gender, race, password, confirmPassword }),
            headers: { 'Content-Type': 'application/json' }
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    sessionStorage.clear();
                    sessionStorage.setItem('email', email);
                    window.location.href = '/homeowner';
                } else {
                    alert('Sign up failed');
                }
            })
            .catch(err => console.error('Sign up error', err));
    });
}

// Create report button
const createReportBtn = document.getElementById('create-report-btn');
if (createReportBtn) {
    createReportBtn.addEventListener('click', () => {
        window.location.href = '/homeowner';
    });
}