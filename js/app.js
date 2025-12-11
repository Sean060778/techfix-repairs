// Ensure API_URL is defined (config.js sets it; fallback to localhost for dev)
if (typeof window.API_URL === 'undefined') {
    window.API_URL = 'http://127.0.0.1:8000/api';
}
const DEFAULT_DEVICE_IMAGE = 'images/default-device.svg';

// Axios Config
axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
axios.defaults.headers.common['Accept'] = 'application/json';

// Add token to requests if available
const token = localStorage.getItem('token');
if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

$(document).ready(function() {
    checkAuth();

    // Toggle Password Visibility
    $(document).on('click', '#togglePassword', function() {
        const passwordInput = $('#password');
        const icon = $(this).find('i');
        
        if (passwordInput.attr('type') === 'password') {
            passwordInput.attr('type', 'text');
            icon.removeClass('bi-eye').addClass('bi-eye-slash');
        } else {
            passwordInput.attr('type', 'password');
            icon.removeClass('bi-eye-slash').addClass('bi-eye');
        }
    });

    // Login
    $('#login-form').on('submit', function(e) {
        e.preventDefault();
        const username = $('#username').val();
        const password = $('#password').val();

        axios.post(`${API_URL}/login`, { username, password })
            .then(response => {
                localStorage.setItem('user', JSON.stringify(response.data.user));
                localStorage.setItem('token', response.data.token);
                
                // Update axios default header immediately
                axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;

                if (response.data.user.role === 'admin') {
                    window.location.href = 'admin/index.html';
                } else if (response.data.user.role === 'staff') {
                    window.location.href = 'staff/index.html';
                } else {
                    window.location.href = 'home.html';
                }
            })
            .catch(error => {
                let msg = error.response?.data?.message || 'Login failed';
                
                // If account is not verified, redirect to verify page
                if (error.response?.status === 403 && (msg.includes('not verified') || msg.includes('verify'))) {
                    $('#login-alert').text('Account not verified. Redirecting to verification page...').removeClass('d-none').removeClass('alert-danger').addClass('alert-warning');
                    setTimeout(() => {
                        window.location.href = `verify.html?username=${encodeURIComponent(username)}`;
                    }, 1500);
                } else {
                    $('#login-alert').text(msg).removeClass('d-none');
                }
            });
    });

    // Register
    $('#register-form').on('submit', function(e) {
        e.preventDefault();
        const data = {
            full_name: $('#full_name').val(),
            username: $('#username').val(),
            email: $('#email').val(),
            password: $('#password').val()
        };

        axios.post(`${API_URL}/register`, data)
            .then(response => {
                Swal.fire({
                    icon: 'success',
                    title: 'Registration Successful!',
                    text: 'Please check your email for the verification code.',
                    confirmButtonText: 'OK'
                }).then(() => {
                    // Redirect to verify page with username
                    window.location.href = `verify.html?username=${data.username}`;
                });
            })
            .catch(error => {
                let msg = 'Registration failed';
                if(error.response?.data?.errors) {
                     msg = Object.values(error.response.data.errors).flat().join('\n');
                } else if (error.response?.data?.error) {
                     msg = error.response.data.error;
                } else if (error.response?.data?.message) {
                     msg = error.response.data.message;
                }
                $('#register-alert').text(msg).removeClass('d-none');
            });
    });

    // Verify OTP
    $('#verify-form').on('submit', function(e) {
        e.preventDefault();
        const username = $('#verify-username').val();
        const otp_code = $('#otp_code').val();

        if(!username) {
            $('#verify-alert').text('Username missing. Please register again or follow the link from login.').removeClass('d-none');
            return;
        }

        axios.post(`${API_URL}/verify-otp`, { username, otp_code })
            .then(response => {
                Swal.fire({
                    icon: 'success',
                    title: 'Verification Successful!',
                    text: 'You can now login.',
                    confirmButtonText: 'OK'
                }).then(() => {
                    window.location.href = 'login.html';
                });
            })
            .catch(error => {
                let msg = error.response?.data?.message || 'Verification failed';
                $('#verify-alert').text(msg).removeClass('d-none');
            });
    });

    // Resend OTP
    $('#resend-otp-btn').on('click', function(e) {
        e.preventDefault();
        const username = $('#verify-username').val();

        if(!username) {
            $('#verify-alert').text('Username missing. Please register again or follow the link from login.').removeClass('d-none');
            return;
        }

        const btn = $(this);
        const originalText = btn.html();
        btn.prop('disabled', true).html('<span class="spinner-border spinner-border-sm me-2"></span>Sending...');

        axios.post(`${API_URL}/resend-otp`, { username })
            .then(response => {
                $('#verify-alert').removeClass('alert-danger').addClass('alert-success').text(response.data.message).removeClass('d-none');
                btn.prop('disabled', false).html(originalText);
                
                // Clear the alert after 5 seconds
                setTimeout(() => {
                    $('#verify-alert').addClass('d-none');
                }, 5000);
            })
            .catch(error => {
                let msg = error.response?.data?.message || 'Failed to resend OTP';
                $('#verify-alert').removeClass('alert-success').addClass('alert-danger').text(msg).removeClass('d-none');
                btn.prop('disabled', false).html(originalText);
            });
    });

    // Forgot Password
    $('#forgot-password-form').on('submit', function(e) {
        e.preventDefault();
        const email = $('#forgot-email').val();
        $('#forgot-alert').addClass('d-none');

        axios.post(`${API_URL}/forgot-password`, { email })
            .then(response => {
                window.location.href = `reset-password.html?email=${email}&sent=true`;
            })
            .catch(error => {
                let msg = error.response?.data?.message || 'Failed to send reset code.';
                $('#forgot-alert').text(msg).removeClass('d-none');
            });
    });

    // Reset Password - Step 1: Verify OTP
    $('#verify-otp-form').on('submit', function(e) {
        e.preventDefault();
        const email = $('#reset-email').val();
        const otp = $('#otp_code').val();
        $('#reset-alert').addClass('d-none');

        axios.post(`${API_URL}/verify-reset-otp`, { email, otp_code: otp })
            .then(response => {
                $('#reset-alert').removeClass('alert-info alert-danger').addClass('alert-success').text(response.data.message).removeClass('d-none');
                $('#verify-otp-form').addClass('d-none');
                $('#reset-password-form').removeClass('d-none');
            })
            .catch(error => {
                let msg = error.response?.data?.message || 'Verification failed.';
                $('#reset-alert').removeClass('alert-info alert-success').addClass('alert-danger').text(msg).removeClass('d-none');
            });
    });

    // Reset Password - Step 2: Set New Password
    $('#reset-password-form').on('submit', function(e) {
        e.preventDefault();
        
        const newPassword = $('#new_password').val();
        const confirmPassword = $('#new_password_confirmation').val();

        if (newPassword !== confirmPassword) {
            $('#reset-alert').removeClass('alert-info alert-success').addClass('alert-danger').text('Passwords do not match.').removeClass('d-none');
            return;
        }

        const data = {
            email: $('#reset-email').val(),
            otp_code: $('#otp_code').val(),
            new_password: newPassword,
            new_password_confirmation: confirmPassword
        };
        
        $('#reset-alert').addClass('d-none');

        axios.post(`${API_URL}/reset-password`, data)
            .then(response => {
                alert(response.data.message);
                window.location.href = 'login.html';
            })
            .catch(error => {
                let msg = error.response?.data?.message || 'Reset failed.';
                if (error.response?.data?.errors) {
                    msg = Object.values(error.response.data.errors).flat().join('\n');
                }
                $('#reset-alert').removeClass('alert-info alert-success').addClass('alert-danger').text(msg).removeClass('d-none');
            });
    });

    // Logout
    $('#auth-logout').on('click', function(e) {
        e.preventDefault();
        
        Swal.fire({
            title: 'Are you sure?',
            text: "You will be logged out of your account.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, logout!'
        }).then((result) => {
            if (result.isConfirmed) {
                axios.post(`${API_URL}/logout`)
                    .then(() => {
                        finalizeLogout();
                    })
                    .catch(() => {
                        // Even if server fails, logout locally
                        finalizeLogout();
                    });
            }
        });
    });

    // Load Featured Devices (Index)
    if ($('#featured-cars').length) {
        loadDevices(true);
    }

    // Load Popular Devices (Index)
    if ($('#popular-cars').length) {
        loadPopularDevices();
    }

    // Load All Devices (Devices page)
    if ($('#cars-list').length) {
        loadDevices(false, { status: 'all' });

        // Handle Search Form
        $('#car-search-form').on('submit', function(e) {
            e.preventDefault();
            const search = $('#search-input').val();
            const status = $('#status-filter').val();
            const device_type = $('#transmission-filter').val();
            const operating_system = $('#fuel-filter').val();
            
            loadDevices(false, { search, status, device_type, operating_system });
        });
    }

    // Booking Modal
    $('#bookingModal').on('show.bs.modal', function (event) {
        const button = $(event.relatedTarget);
        
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user) {
            event.preventDefault(); 
            $(this).modal('hide');
            alert('Please login to book a repair slot.');
            window.location.href = 'login.html';
            return;
        }

        const deviceId = button.data('device-id');
        const deviceName = button.data('device-name');

        const modal = $(this);
        modal.find('#modal-car-name').text(deviceName);
        modal.find('#booking-car-id').val(deviceId);
        modal.find('#total-price').text('0.00');

        // Date/time slot min date = today + 1
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        const offset = tomorrow.getTimezoneOffset();
        const adjustedDate = new Date(tomorrow.getTime() - (offset*60*1000));
        const minDate = adjustedDate.toISOString().split('T')[0]; 
        
        modal.find('#pickup-date').attr('min', minDate).val('');
        modal.find('#return-date').val('');
    });

    // Simple estimate placeholder (flat fee not handled in new booking schema)
    $('#pickup-date, #return-date').on('change', () => {
        $('#total-price').text('0.00');
    });

    // Submit Booking (only for modal booking form on index.html, not book.html)
    // Check if this is the modal booking form by checking for bookingModal and specific fields
    if ($('#bookingModal').length > 0 && $('#booking-car-id').length > 0) {
        $('#booking-form').on('submit', function(e) {
            e.preventDefault();
            const user = JSON.parse(localStorage.getItem('user'));
            if (!user) {
                alert('Please login to book a repair slot.');
                window.location.href = 'login.html';
                return;
            }

            const data = {
                user_id: user.user_id,
                device_id: $('#booking-car-id').val(),
                date: $('#pickup-date').val(),
                time_slot: $('#return-date').val() || 'AM',
            };

            axios.post(`${API_URL}/bookings`, data)
                .then(response => {
                    const Toast = Swal.mixin({
                        toast: true,
                        position: "top-end",
                        showConfirmButton: false,
                        timer: 3000,
                        timerProgressBar: true,
                        didOpen: (toast) => {
                            toast.onmouseenter = Swal.stopTimer;
                            toast.onmouseleave = Swal.resumeTimer;
                        }
                    });
                    Toast.fire({
                        icon: "success",
                        title: "Booking successful!"
                    });
                    $('#bookingModal').modal('hide');
                    $('#booking-form')[0].reset();
                })
                .catch(error => {
                    if (error.response?.status === 401) {
                         alert('Session expired. Please login again.');
                         finalizeLogout();
                         return;
                    }
                    alert('Booking failed: ' + (error.response?.data?.message || error.message));
                });
        });
    }
});

function checkAuth() {
    const user = JSON.parse(localStorage.getItem('user'));
    const token = localStorage.getItem('token');
    
    if (user && token) {
        $('#auth-login, #auth-register').addClass('d-none');
        $('#auth-logout').removeClass('d-none');
        $('#nav-profile').removeClass('d-none');
        $('#nav-my-bookings').removeClass('d-none');
        $('#nav-my-devices').removeClass('d-none');
    } else {
        $('#auth-login, #auth-register').removeClass('d-none');
        $('#auth-logout').addClass('d-none');
        $('#nav-profile').addClass('d-none');
        $('#nav-my-bookings').addClass('d-none');
        $('#nav-my-devices').addClass('d-none');
    }
}

function finalizeLogout() {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    checkAuth();
    window.location.href = 'index.html';
}

function loadDevices(featured = false, params = {}) {
    let url = `${API_URL}/devices`;
    const queryParams = new URLSearchParams();

    if (params.search) queryParams.append('search', params.search);
    if (params.status) {
        if (params.status === 'all') {
            queryParams.append('all', 'true');
        } else {
            queryParams.append('status', params.status);
        }
    }
    if (params.device_type) queryParams.append('device_type', params.device_type);
    if (params.operating_system) queryParams.append('operating_system', params.operating_system);

    // Append params to URL if they exist
    if (queryParams.toString()) {
        url += `?${queryParams.toString()}`;
    }

    axios.get(url)
        .then(response => {
            const devices = response.data;
            let display = featured ? devices.slice(0, 3) : devices;

            // Sort devices by status: Available > In Service > Maintenance
            // This sort applies to the displayed cars (either all or filtered)
            if (!featured) {
                const statusOrder = { 'available': 1, 'in_service': 2, 'maintenance': 3 };
                displayCars.sort((a, b) => {
                    return (statusOrder[a.status] || 99) - (statusOrder[b.status] || 99);
                });
            }

            if (display.length === 0) {
                if (featured) {
                    $('#featured-cars').html('<div class="col-12 text-center"><p>No devices found matching criteria.</p></div>');
                    $('#featured-cars-carousel .carousel-inner').html('<div class="carousel-item active"><div class="text-center p-4"><p>No devices found matching criteria.</p></div></div>');
                } else {
                    $('#cars-list').html('<div class="col-12 text-center"><p>No devices found matching criteria.</p></div>');
                }
                return;
            }

            if (featured) {
                // Featured cars - populate both grid and carousel
                const gridContainer = $('#featured-cars');
                const carouselContainer = $('#featured-cars-carousel .carousel-inner');
                gridContainer.empty();
                carouselContainer.empty();

                display.forEach((car, index) => {
                    const isAvailable = car.status === 'available';
                    const bookBtnDisabled = isAvailable ? '' : 'disabled';
                    const bookBtnText = isAvailable ? 'Book Service' : car.status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                    const btnClass = isAvailable ? 'btn-primary' : 'btn-secondary';
                    const isActive = index === 0 ? 'active' : '';

                    // Desktop Grid View
                    const carHtml = `
                        <div class="col-md-4 mb-4">
                            <div class="card h-100 shadow-sm">
                                <img src="${car.image_url || DEFAULT_DEVICE_IMAGE}" class="card-img-top" alt="${car.make} ${car.model}" style="object-fit: cover; height: 200px;">
                                <div class="card-body d-flex flex-column">
                                    <h5 class="card-title">${car.make} ${car.model}</h5>
                                    <p class="card-text">
                                        <span class="badge bg-secondary">${car.category}</span>
                                        <span class="badge bg-info text-dark">${car.transmission}</span>
                                        <span class="badge ${isAvailable ? 'bg-success' : 'bg-danger'}">${car.status.replace(/_/g, ' ')}</span>
                                    </p>
                                    <p class="card-text mt-auto">
                                        <strong>₱${car.daily_rate} base fee</strong>
                                    </p>
                                    <div class="d-flex gap-2 mt-2">
                                        <button class="btn btn-outline-primary flex-grow-1" 
                                            onclick="showCarDetails(${car.device_id})">
                                            Details
                                        </button>
                                        <button class="btn ${btnClass} flex-grow-1" 
                                            data-bs-toggle="modal" 
                                            data-bs-target="#bookingModal"
                                            data-device-id="${car.device_id}"
                                            data-device-name="${car.make} ${car.model}"
                                            ${bookBtnDisabled}>
                                            ${bookBtnText}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                    gridContainer.append(carHtml);

                    // Mobile Carousel View
                    const carouselHtml = `
                        <div class="carousel-item ${isActive}">
                            <div class="px-3">
                                <div class="card shadow-sm">
                                <img src="${car.image_url || DEFAULT_DEVICE_IMAGE}" class="card-img-top" alt="${car.make} ${car.model}" style="object-fit: cover; height: 250px;">
                                    <div class="card-body">
                                        <h5 class="card-title">${car.make} ${car.model}</h5>
                                        <p class="card-text">
                                            <span class="badge bg-secondary">${car.category}</span>
                                            <span class="badge bg-info text-dark">${car.transmission}</span>
                                            <span class="badge ${isAvailable ? 'bg-success' : 'bg-danger'}">${car.status.replace(/_/g, ' ')}</span>
                                        </p>
                                        <p class="card-text">
                                            <strong>₱${car.daily_rate} base fee</strong>
                                        </p>
                                        <div class="d-flex gap-2">
                                            <button class="btn btn-outline-primary flex-grow-1" 
                                                onclick="showCarDetails(${car.device_id})">
                                                Details
                                            </button>
                                            <button class="btn ${btnClass} flex-grow-1" 
                                                data-bs-toggle="modal" 
                                                data-bs-target="#bookingModal"
                                                data-device-id="${car.device_id}"
                                                data-device-name="${car.make} ${car.model}"
                                                ${bookBtnDisabled}>
                                                ${bookBtnText}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                    carouselContainer.append(carouselHtml);
                });
            } else {
                // Regular devices list - just populate the grid
                const container = $('#cars-list');
                container.empty();

                display.forEach(car => {
                    const isAvailable = car.status === 'available';
                    const bookBtnDisabled = isAvailable ? '' : 'disabled';
                    const bookBtnText = isAvailable ? 'Book Service' : car.status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                    const btnClass = isAvailable ? 'btn-primary' : 'btn-secondary';

                    const carHtml = `
                        <div class="col-md-4 mb-4">
                            <div class="card h-100 shadow-sm">
                                <img src="${car.image_url || DEFAULT_DEVICE_IMAGE}" class="card-img-top" alt="${car.make} ${car.model}" style="object-fit: cover; height: 200px;">
                                <div class="card-body d-flex flex-column">
                                    <h5 class="card-title">${car.make} ${car.model}</h5>
                                    <p class="card-text">
                                        <span class="badge bg-secondary">${car.category}</span>
                                        <span class="badge bg-info text-dark">${car.transmission}</span>
                                        <span class="badge ${isAvailable ? 'bg-success' : 'bg-danger'}">${car.status.replace(/_/g, ' ')}</span>
                                    </p>
                                    <p class="card-text mt-auto">
                                        <strong>₱${car.daily_rate} base fee</strong>
                                    </p>
                                    <div class="d-flex gap-2 mt-2">
                                        <button class="btn btn-outline-primary flex-grow-1" 
                                            onclick="showCarDetails(${car.device_id})">
                                            Details
                                        </button>
                                        <button class="btn ${btnClass} flex-grow-1" 
                                            data-bs-toggle="modal" 
                                            data-bs-target="#bookingModal"
                                            data-device-id="${car.device_id}"
                                            data-device-name="${car.make} ${car.model}"
                                            ${bookBtnDisabled}>
                                            ${bookBtnText}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                    container.append(carHtml);
                });
            }
        })
        .catch(error => {
            console.error(error);
            if (featured) {
                $('#featured-cars').html('<div class="col-12 text-center text-danger"><p>Failed to load devices. Is the backend running?</p></div>');
                $('#featured-cars-carousel .carousel-inner').html('<div class="carousel-item active"><div class="text-center p-4 text-danger"><p>Failed to load devices. Is the backend running?</p></div></div>');
            } else {
                $('#cars-list').html('<div class="col-12 text-center text-danger"><p>Failed to load devices. Is the backend running?</p></div>');
            }
        });
}

function loadPopularDevices() {
    axios.get(`${API_URL}/devices/popular?limit=3`)
        .then(response => {
            const cars = response.data;
            const gridContainer = $('#popular-cars');
            const carouselContainer = $('#popular-cars-carousel .carousel-inner');
            
            gridContainer.empty();
            carouselContainer.empty();

            if (cars.length === 0) {
                gridContainer.html('<div class="col-12 text-center"><p>No popular devices found.</p></div>');
                carouselContainer.html('<div class="carousel-item active"><div class="text-center p-4"><p>No popular devices found.</p></div></div>');
                return;
            }

            cars.forEach((car, index) => {
                const isAvailable = car.status === 'available';
                const bookBtnDisabled = isAvailable ? '' : 'disabled';
                const bookBtnText = isAvailable ? 'Book Service' : car.status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                const btnClass = isAvailable ? 'btn-primary' : 'btn-secondary';
                const rentalCount = car.rental_count || 0;
                const isActive = index === 0 ? 'active' : '';

                // Desktop Grid View
                const carHtml = `
                    <div class="col-md-4 mb-4">
                        <div class="card h-100 shadow-sm">
                            <div class="position-relative">
                                <img src="${car.image_url || DEFAULT_DEVICE_IMAGE}" class="card-img-top" alt="${car.make} ${car.model}" style="object-fit: cover; height: 200px;">
                                ${rentalCount > 0 ? `<span class="badge bg-warning position-absolute top-0 end-0 m-2">${rentalCount} Bookings</span>` : ''}
                            </div>
                            <div class="card-body d-flex flex-column">
                                <h5 class="card-title">${car.make} ${car.model}</h5>
                                <p class="card-text">
                                    <span class="badge bg-secondary">${car.category}</span>
                                    <span class="badge bg-info text-dark">${car.transmission}</span>
                                    <span class="badge ${isAvailable ? 'bg-success' : 'bg-danger'}">${car.status.replace(/_/g, ' ')}</span>
                                </p>
                                <p class="card-text mt-auto">
                                    <strong>₱${car.daily_rate} base fee</strong>
                                </p>
                                <div class="d-flex gap-2 mt-2">
                                    <button class="btn btn-outline-primary flex-grow-1" 
                                        onclick="showCarDetails(${car.device_id})">
                                        Details
                                    </button>
                                    <button class="btn ${btnClass} flex-grow-1" 
                                        data-bs-toggle="modal" 
                                        data-bs-target="#bookingModal"
                                    data-device-id="${car.device_id}"
                                    data-device-name="${car.make} ${car.model}"
                                        ${bookBtnDisabled}>
                                        ${bookBtnText}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
                gridContainer.append(carHtml);

                // Mobile Carousel View
                const carouselHtml = `
                    <div class="carousel-item ${isActive}">
                        <div class="px-3">
                            <div class="card shadow-sm">
                                <div class="position-relative">
                                    <img src="${car.image_url || DEFAULT_DEVICE_IMAGE}" class="card-img-top" alt="${car.make} ${car.model}" style="object-fit: cover; height: 250px;">
                                    ${rentalCount > 0 ? `<span class="badge bg-warning position-absolute top-0 end-0 m-2">${rentalCount} Bookings</span>` : ''}
                                </div>
                                <div class="card-body">
                                    <h5 class="card-title">${car.make} ${car.model}</h5>
                                    <p class="card-text">
                                        <span class="badge bg-secondary">${car.category}</span>
                                        <span class="badge bg-info text-dark">${car.transmission}</span>
                                        <span class="badge ${isAvailable ? 'bg-success' : 'bg-danger'}">${car.status.replace(/_/g, ' ')}</span>
                                    </p>
                                    <p class="card-text">
                                        <strong>₱${car.daily_rate} base fee</strong>
                                    </p>
                                    <div class="d-flex gap-2">
                                        <button class="btn btn-outline-primary flex-grow-1" 
                                        onclick="showCarDetails(${car.device_id})">
                                            Details
                                        </button>
                                        <button class="btn ${btnClass} flex-grow-1" 
                                            data-bs-toggle="modal" 
                                            data-bs-target="#bookingModal"
                                    data-device-id="${car.device_id}"
                                    data-device-name="${car.make} ${car.model}"
                                            ${bookBtnDisabled}>
                                            ${bookBtnText}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
                carouselContainer.append(carouselHtml);
            });
        })
        .catch(error => {
            console.error(error);
            $('#popular-cars').html('<div class="col-12 text-center text-danger"><p>Failed to load popular devices.</p></div>');
            $('#popular-cars-carousel .carousel-inner').html('<div class="carousel-item active"><div class="text-center p-4 text-danger"><p>Failed to load popular devices.</p></div></div>');
        });
}

// Global function to be accessible from onclick
window.showCarDetails = function(id) {
    axios.get(`${API_URL}/devices/${id}`)
        .then(response => {
            const car = response.data;
            
            // Populate Modal
            $('#details-car-name').text(`${car.make} ${car.model}`);
            $('#details-car-image').attr('src', car.image_url || DEFAULT_DEVICE_IMAGE);
            $('#details-make-model').text(`${car.make} ${car.model}`);
            $('#details-category').text(car.category);
            $('#details-year').text(car.year);
            $('#details-transmission').text(car.transmission);
            $('#details-fuel').text(car.fuel_type);
            $('#details-seats').text(car.seat_capacity);
            $('#details-rate').text(car.daily_rate);
            
            const statusBadge = car.status === 'available' 
                ? '<span class="badge bg-success">Accepting Repairs</span>' 
                : `<span class="badge bg-secondary">${car.status.replace(/_/g, ' ')}</span>`;
            $('#details-status').html(statusBadge);

            // Show Modal
            $('#carDetailsModal').modal('show');
        })
        .catch(error => {
            alert('Failed to load device details');
            console.error(error);
        });
}
