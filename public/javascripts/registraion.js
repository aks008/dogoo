
// Function to toggle password visibility
function togglePassword(id) {
    const passwordField = document.getElementById(id);
    const fieldType = passwordField.type === 'password' ? 'text' : 'password';
    passwordField.type = fieldType;
}

// Confirm password validation
document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("registerForm").addEventListener("submit", function (event) {
        event.preventDefault();

        // Clear previous error messages
        const formError = document.getElementById("formError");
        const passwordError = document.getElementById("passwordError");
        const errorElement = document.getElementById("errorForRegistration");
        errorElement.textContent = "";  // Clear the error message
        errorElement.style.color = ""; // Reset color
        const loaderOverlay = document.getElementById("loader-overlay");
        loaderOverlay.style.display = "flex";
        // Get form field values
        const firstName = document.getElementById("firstName").value;
        const lastName = document.getElementById("lastName").value;
        const gender = document.getElementById("gender").value;
        const birthdate = document.getElementById("birthdate").value;
        const email = document.getElementById("email").value;
        const phone = document.getElementById("phone").value;
        const password = document.getElementById("password").value;
        const confirmPassword = document.getElementById("confirmPassword").value;

        // Validate First Name
        if (!firstName) {
            errorElement.textContent = "First Name is required.";
            errorElement.style.color = "red";
            return;
        }

        // Validate Last Name
        if (!lastName) {
            errorElement.textContent = "Last Name is required.";
            errorElement.style.color = "red";
            return;
        }

        // Validate Gender
        if (!gender) {
            errorElement.textContent = "Please select a gender.";
            errorElement.style.color = "red";
            return;
        }

        // Validate Birthdate
        if (!birthdate) {
            errorElement.textContent = "Birthdate is required.";
            errorElement.style.color = "red";
            return;
        }

        // Validate Email
        const emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
        if (!email || !emailPattern.test(email)) {
            errorElement.textContent = "Invalid email format.";
            errorElement.style.color = "red";
            return;
        }

        // Validate Phone Number
        const phonePattern = /^\+?[1-9]\d{1,14}$/;
        if (!phone || !phonePattern.test(phone)) {
            alert("Invalid phone number format.");
            return;
        }

        // Password validation
        if (password !== confirmPassword) {
            passwordError.style.display = "block";
            return;
        } else {
            passwordError.style.display = "none";
        }

        // Registration logic
        axios.post('/users/register', { firstName, lastName, gender, birthdate, email, phone, password })
            .then(successResponse => {
                // Call login API
                return axios.post('/users/login', { email, password });
            })
            .then(loginResponse => {
                const token = loginResponse.data.token;
                localStorage.setItem('token', token);
                window.location.href = "/"; // Redirect after login
            })
            .catch(error => {
                console.log(error);
                if (error.response && error.response.status === 400) {
                    // User already exists
                    errorElement.textContent = "User already exists.";
                    errorElement.style.color = "red";
                } else {
                    console.error('Error:', error);
                    alert("An unexpected error occurred. Please try again.");
                }
            }).finally(() => {
                // Hide Loader after response
                loaderOverlay.style.display = "none";
            });
    });


    document.getElementById('loginForm').addEventListener('submit', function (event) {
        event.preventDefault(); // Prevent the form from submitting the traditional way
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        const loaderOverlay = document.getElementById("loader-overlay");
        loaderOverlay.style.display = "flex";

        // Send login request via AJAX (using Axios)
        axios.post(`/users/login`, { email, password })
            .then(response => {
                localStorage.setItem('token', response.data.token);
                // Handle login success, such as redirecting to the dashboard
                window.location.href = "/";  // Redirect to the dashboard page or desired route
            })
            .catch(error => {
                console.error('Login error:', error);
                // Display error message on failure
                const formError = document.getElementById('formErrorForLogin');
                formError.style.display = 'block'; // Show the error message
                formError.innerHTML = 'Invalid credentials. Please try again.'; // Display custom error message
            }).finally(() => {
                // Hide Loader after response
                loaderOverlay.style.display = "none";
            });
    });
});




