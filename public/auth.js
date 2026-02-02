const signInBtn = document.getElementById('sign-in-btn');
const signUpBtn = document.getElementById('sign-up-btn');
const signInDiv = document.getElementById('sign-in-div');
const signUpDiv = document.getElementById('sign-up-div');
const signInForm = document.getElementById('sign-in-form');
const signUpForm = document.getElementById('sign-up-form');


signInBtn.addEventListener('click', () => {
    signInDiv.style.display = 'block';
    signUpDiv.style.display = 'none';
});

signUpBtn.addEventListener('click', () => {
    signUpDiv.style.display = 'block';
    signInDiv.style.display = 'none';
});

signInForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value
    const password = document.getElementById('password').value;
    
    fetch('/signin', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            sessionStorage.clear();
            sessionStorage.setItem('email', email);
            window.location.href = '/homeowner';
        } else {
            alert('Sign in failed');
        }
    });
});
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
    const formData = new FormData(signUpForm);
    console.log(formData);
    fetch('/signup', {
        method: 'POST',
        body: JSON.stringify({ email, name, address, phone_number, gender, race, password, confirmPassword }),
        headers: {
            'Content-Type': 'application/json'
        }
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
    });
});

