
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
                // User registration successful, proceed with login
                return axios.post('/users/login', { email, password });
            })
            .then(loginResponse => {
                // If login is successful, save the token and redirect
                const token = loginResponse.data.token;
                localStorage.setItem('token', token);
                window.location.href = "/"; // Redirect after login
            })
            .catch(error => {
                console.log('Full Error:', error); // Log the full error object for debugging

                // Handle error based on the response status
                if (error.response) {
                    // Check if the error status is 400 (user already exists or validation failed)
                    if (error.response.status === 400) {
                        if (error.response.data && error.response.data.message === 'User already exists') {
                            // If the error message is "User already exists", show the appropriate message
                            errorElement.textContent = "User already exists.";
                            errorElement.style.color = "red";
                        } else {
                            // Handle other 400 errors (validation failures, etc.)
                            errorElement.textContent = "Validation error: " + error.response.data.message;
                            errorElement.style.color = "red";
                        }
                    } else if (error.response.status === 500) {
                        // Server error, inform the user
                        errorElement.textContent = "Server error. Please try again later.";
                        errorElement.style.color = "red";
                    } else {
                        // Handle any other error responses
                        errorElement.textContent = "Unexpected error: " + error.response.data.message || "Please try again.";
                        errorElement.style.color = "red";
                    }
                } else {
                    // If no response was received (network error or timeout)
                    console.error('Error:', error);
                    errorElement.textContent = "Network error. Please check your internet connection.";
                    errorElement.style.color = "red";
                }
            })
            .finally(() => {
                // Hide the loader after the request completes (success or failure)
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
                formError.innerHTML = 'Invalid Username & Password.'; // Display custom error message
            }).finally(() => {
                // Hide Loader after response
                loaderOverlay.style.display = "none";
            });
    });
});




