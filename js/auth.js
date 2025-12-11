// Authentication functions
let authToken = localStorage.getItem('auth_token');
let currentUser = JSON.parse(localStorage.getItem('current_user') || 'null');

// Check if user is logged in
function isLoggedIn() {
    return authToken !== null && currentUser !== null;
}

// Get auth token
function getAuthToken() {
    return authToken;
}

// Get current user
function getCurrentUser() {
    return currentUser;
}

// Set auth data
function setAuthData(token, user) {
    authToken = token;
    currentUser = user;
    localStorage.setItem('auth_token', token);
    localStorage.setItem('current_user', JSON.stringify(user));
}

// Clear auth data
function clearAuthData() {
    authToken = null;
    currentUser = null;
    localStorage.removeItem('auth_token');
    localStorage.removeItem('current_user');
}

// Make authenticated API request
function makeAuthRequest(url, method, data) {
    return $.ajax({
        url: `${API_CONFIG.baseURL}${url}`,
        method: method,
        contentType: 'application/json',
        headers: {
            'Authorization': `Bearer ${authToken}`
        },
        data: data ? JSON.stringify(data) : null
    });
}

// Login form handler
$(document).ready(function() {
    // Login form
    $('#login-form').on('submit', function(e) {
        e.preventDefault();
        
        const formData = {
            email: $('#email').val(),
            password: $('#password').val()
        };

        const submitBtn = $(this).find('button[type="submit"]');
        const originalText = submitBtn.html();
        submitBtn.html('<span class="loading"></span> Logging in...').prop('disabled', true);

        $.ajax({
            url: `${API_CONFIG.baseURL}/login`,
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(formData),
            success: function(response) {
                if (response.success) {
                    setAuthData(response.token, response.user);
                    showMessage('Login successful! Redirecting...', 'success');
                    
                    setTimeout(() => {
                        // Redirect based on user role
                        if (response.user.role === 'admin' || response.user.role === 'staff') {
                            window.location.href = 'dashboard.html';
                        } else {
                            window.location.href = 'index.html';
                        }
                    }, 1000);
                }
            },
            error: function(xhr) {
                let errorMsg = 'Login failed. Please check your credentials.';
                
                if (xhr.responseJSON && xhr.responseJSON.message) {
                    errorMsg = xhr.responseJSON.message;
                } else if (xhr.responseJSON && xhr.responseJSON.errors) {
                    errorMsg = Object.values(xhr.responseJSON.errors).flat().join('<br>');
                }
                
                showMessage(errorMsg, 'error');
            },
            complete: function() {
                submitBtn.html(originalText).prop('disabled', false);
            }
        });
    });

    // Signup form
    $('#signup-form').on('submit', function(e) {
        e.preventDefault();
        
        const formData = {
            name: $('#name').val(),
            email: $('#email').val(),
            phone: $('#phone').val() || null,
            password: $('#password').val(),
            password_confirmation: $('#password_confirmation').val(),
            role: 'customer'
        };

        // Validate passwords match
        if (formData.password !== formData.password_confirmation) {
            showMessage('Passwords do not match', 'error');
            return;
        }

        const submitBtn = $(this).find('button[type="submit"]');
        const originalText = submitBtn.html();
        submitBtn.html('<span class="loading"></span> Creating account...').prop('disabled', true);

        $.ajax({
            url: `${API_CONFIG.baseURL}/register`,
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(formData),
            success: function(response) {
                if (response.success) {
                    setAuthData(response.token, response.user);
                    showMessage('Account created successfully! Redirecting...', 'success');
                    
                    setTimeout(() => {
                        window.location.href = 'index.html';
                    }, 1000);
                }
            },
            error: function(xhr) {
                let errorMsg = 'Failed to create account. Please try again.';
                
                if (xhr.responseJSON && xhr.responseJSON.errors) {
                    const errors = xhr.responseJSON.errors;
                    errorMsg = Object.values(errors).flat().join('<br>');
                } else if (xhr.responseJSON && xhr.responseJSON.message) {
                    errorMsg = xhr.responseJSON.message;
                }
                
                showMessage(errorMsg, 'error');
            },
            complete: function() {
                submitBtn.html(originalText).prop('disabled', false);
            }
        });
    });

    // Forgot password form
    $('#forgot-password-form').on('submit', function(e) {
        e.preventDefault();
        
        const email = $('#email').val();
        const submitBtn = $(this).find('button[type="submit"]');
        const originalText = submitBtn.html();
        submitBtn.html('<span class="loading"></span> Sending...').prop('disabled', true);

        $.ajax({
            url: `${API_CONFIG.baseURL}/forgot-password`,
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ email: email }),
            success: function(response) {
                if (response.success) {
                    // Show reset token (in production, this would be sent via email)
                    const token = response.reset_token;
                    showMessage(`Reset token generated. Token: ${token}<br><small>In production, this would be sent to your email.</small>`, 'success');
                    
                    // Show reset password form
                    $('#request-reset-section').hide();
                    $('#reset-password-section').show();
                    $('#reset_email').val(email);
                    
                    // Store token in a variable for the reset form
                    window.resetToken = token;
                }
            },
            error: function(xhr) {
                let errorMsg = 'Failed to send reset token. Please try again.';
                
                if (xhr.responseJSON && xhr.responseJSON.errors) {
                    const errors = xhr.responseJSON.errors;
                    errorMsg = Object.values(errors).flat().join('<br>');
                } else if (xhr.responseJSON && xhr.responseJSON.message) {
                    errorMsg = xhr.responseJSON.message;
                }
                
                showMessage(errorMsg, 'error');
            },
            complete: function() {
                submitBtn.html(originalText).prop('disabled', false);
            }
        });
    });

    // Reset password form
    $('#reset-password-form').on('submit', function(e) {
        e.preventDefault();
        
        const formData = {
            email: $('#reset_email').val(),
            token: $('#token').val(),
            password: $('#new_password').val(),
            password_confirmation: $('#new_password_confirmation').val()
        };

        // Validate passwords match
        if (formData.password !== formData.password_confirmation) {
            showMessage('Passwords do not match', 'error', '#reset-message');
            return;
        }

        const submitBtn = $(this).find('button[type="submit"]');
        const originalText = submitBtn.html();
        submitBtn.html('<span class="loading"></span> Resetting...').prop('disabled', true);

        $.ajax({
            url: `${API_CONFIG.baseURL}/reset-password`,
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(formData),
            success: function(response) {
                if (response.success) {
                    showMessage('Password reset successfully! Redirecting to login...', 'success', '#reset-message');
                    
                    setTimeout(() => {
                        window.location.href = 'login.html';
                    }, 2000);
                }
            },
            error: function(xhr) {
                let errorMsg = 'Failed to reset password. Please check your token.';
                
                if (xhr.responseJSON && xhr.responseJSON.errors) {
                    const errors = xhr.responseJSON.errors;
                    errorMsg = Object.values(errors).flat().join('<br>');
                } else if (xhr.responseJSON && xhr.responseJSON.message) {
                    errorMsg = xhr.responseJSON.message;
                }
                
                showMessage(errorMsg, 'error', '#reset-message');
            },
            complete: function() {
                submitBtn.html(originalText).prop('disabled', false);
            }
        });
    });
});

function showMessage(message, type, targetId = '#form-message') {
    const messageDiv = $(targetId);
    messageDiv.removeClass('success error')
              .addClass(type)
              .html(message)
              .fadeIn();

    if (type === 'success') {
        setTimeout(() => {
            messageDiv.fadeOut();
        }, 5000);
    }
}

