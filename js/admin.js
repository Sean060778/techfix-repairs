// Ensure API_URL is defined (config.js sets it; fallback to localhost for dev)
if (typeof window.API_URL === 'undefined') {
    window.API_URL = 'http://127.0.0.1:8000/api';
}

// Axios Config
axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
axios.defaults.headers.common['Accept'] = 'application/json';

const token = localStorage.getItem('token');
if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
} else {
    window.location.href = '../login.html';
}

$(document).ready(function() {
    checkAdmin();

    $('#admin-logout').on('click', function(e) {
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
                    .finally(() => {
                        localStorage.removeItem('user');
                        localStorage.removeItem('token');
                        window.location.href = '../index.html';
                    });
            }
        });
    });

    // Dashboard Stats
    if ($('#total-cars').length) {
        loadDashboardStats();
    }

    // Devices Management
    if ($('#admin-cars-table').length) {
        loadAdminCars();

        $('#admin-car-search-form').on('submit', function(e) {
            e.preventDefault();
            const search = $('#admin-search-input').val();
            const status = $('#admin-status-filter').val();
            const device_type = $('#admin-transmission-filter').val();
            const operating_system = $('#admin-fuel-filter').val();
            
            loadAdminCars({ search, status, device_type, operating_system });
        });

        $('#add-car-form').on('submit', function(e) {
            e.preventDefault();
            
            const formData = new FormData();
            formData.append('make', $('#make').val());
            formData.append('model', $('#model').val());
            formData.append('serial_number', $('#serial_number').val());
            formData.append('device_type', $('#device_type').val());
            formData.append('operating_system', $('#operating_system').val());
            formData.append('description_of_issue', $('#description_of_issue').val());
            formData.append('status', $('#status').val());
            
            const imageFile = $('#image')[0].files[0];
            if (imageFile) {
                formData.append('image', imageFile);
            }

            const carId = $('#car_id').val();
            
            if (carId) {
                // Update
                // Laravel method spoofing for PUT with FormData
                formData.append('_method', 'PUT');
                
                axios.post(`${API_URL}/admin/devices/${carId}`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                })
                    .then(() => {
                        $('#carModal').modal('hide');
                        loadAdminCars();
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
                            title: "Device updated successfully"
                        });
                    })
                    .catch(err => {
                        Swal.fire({
                            icon: 'error',
                        title: 'Failed to update device',
                            text: err.response?.data?.message || 'An error occurred'
                        });
                    });
            } else {
                // Create
                axios.post(`${API_URL}/admin/devices`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                })
                    .then(() => {
                        $('#carModal').modal('hide');
                        loadAdminCars();
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
                            title: "Device created successfully"
                        });
                    })
                    .catch(err => {
                        Swal.fire({
                            icon: 'error',
                        title: 'Failed to create device',
                            text: err.response?.data?.message || 'An error occurred'
                        });
                    });
            }
        });
    }

    // Users Management
    if ($('#admin-users-table').length) {
        loadAdminUsers();

        $('#admin-user-search-form').on('submit', function(e) {
            e.preventDefault();
            const search = $('#admin-user-search-input').val();
            const role = $('#admin-role-filter').val();
            const is_verified = $('#admin-verified-filter').val();
            
            loadAdminUsers({ search, role, is_verified });
        });

        $('#user-form').on('submit', function(e) {
            e.preventDefault();
            const userId = $('#user_id').val();
            const formData = {
                username: $('#username').val(),
                full_name: $('#full_name').val(),
                email: $('#email').val(),
                password: $('#password').val(),
                role: $('#role').val(),
                is_verified: $('#is_verified').val()
            };

            // Remove password if empty (for updates)
            if (!formData.password) delete formData.password;

            if (userId) {
                // Update User
                axios.put(`${API_URL}/admin/users/${userId}`, formData)
                    .then(() => {
                        $('#userModal').modal('hide');
                        loadAdminUsers();
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
                            title: "User updated successfully"
                        });
                    })
                    .catch(err => {
                        Swal.fire({
                            icon: 'error',
                            title: 'Failed to update user',
                            text: err.response?.data?.message || 'An error occurred'
                        });
                    });
            } else {
                // Create User
                axios.post(`${API_URL}/admin/users`, formData)
                    .then(() => {
                        $('#userModal').modal('hide');
                        loadAdminUsers();
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
                            title: "User created successfully"
                        });
                    })
                    .catch(err => {
                        Swal.fire({
                            icon: 'error',
                            title: 'Failed to create user',
                            text: err.response?.data?.message || 'An error occurred'
                        });
                    });
            }
        });
    }

    // History Management
    if ($('#admin-history-table').length) {
        loadAdminHistory();

        $('#history-search-form').on('submit', function(e) {
            e.preventDefault();
            const search = $('#history-search-input').val();
            const status = $('#history-status-filter').val();
            const payment_status = $('#history-payment-filter').val();
            const date = $('#history-date-filter').val();
            loadAdminHistory({ search, status, payment_status, date });
        });
    }
});

function checkAdmin() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || user.role !== 'admin') {
        Swal.fire({
            icon: 'error',
            title: 'Access Denied',
            text: 'Admins only.',
            confirmButtonText: 'OK'
        }).then(() => {
            window.location.href = '../index.html';
        });
    }
}

function loadDashboardStats() {
    // Getting counts manually since we don't have a stats endpoint
    axios.get(`${API_URL}/devices?all=true`)
        .then(res => $('#total-cars').text(res.data.length))
        .catch(() => $('#total-cars').text('Error'));
    
    axios.get(`${API_URL}/admin/users`)
        .then(res => $('#total-users').text(res.data.length))
        .catch(() => $('#total-users').text('Error'));
        
    axios.get(`${API_URL}/bookings`) 
        .then(res => {
            const activeBookings = res.data.filter(b => 
                ['pending', 'confirmed'].includes(b.status)
            ).length;
            $('#total-rentals').text(activeBookings);
        })
        .catch(() => $('#total-rentals').text('Error')); 
}

const DEFAULT_DEVICE_IMAGE = '../images/default-device.svg';

function loadAdminCars(params = {}) {
    const tbody = $('#admin-cars-table tbody');
    const cardsContainer = $('#admin-cars-cards');
    // If we are re-searching, show spinner again
    if (params.search || params.status || params.device_type || params.operating_system) {
        tbody.html(`
            <tr>
                <td colspan="6" class="text-center">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                </td>
            </tr>
        `);
        cardsContainer.html(`
            <div class="text-center">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
            </div>
        `);
    }

    // If filters are applied, we need to append them.
    // Note: The backend uses `status` parameter. If `status` is present, it filters by it. 
    // If `all` is present (and no status), it shows all.
    // Let's construct the query properly.
    
    let finalUrl = `${API_URL}/devices`;
    let finalParams = new URLSearchParams();
    
    if (params.status) {
        finalParams.append('status', params.status);
    } else {
        finalParams.append('all', 'true');
    }

    if (params.search) finalParams.append('search', params.search);
    if (params.device_type) finalParams.append('device_type', params.device_type);
    if (params.operating_system) finalParams.append('operating_system', params.operating_system);

    if (finalParams.toString()) {
        finalUrl += `?${finalParams.toString()}`;
    }

    axios.get(finalUrl)
        .then(response => {
            const tbody = $('#admin-cars-table tbody');
            const cardsContainer = $('#admin-cars-cards');
            tbody.empty();
            cardsContainer.empty();
            
            if (response.data.length === 0) {
                tbody.append('<tr><td colspan="6" class="text-center">No devices found.</td></tr>');
                cardsContainer.html('<div class="text-center p-4"><p>No devices found.</p></div>');
                return;
            }

            // Sort devices: Available > In Service > Maintenance
            const statusOrder = { 'available': 1, 'in_service': 2, 'maintenance': 3 };
            response.data.sort((a, b) => {
                return (statusOrder[a.status] || 99) - (statusOrder[b.status] || 99);
            });

            response.data.forEach(device => {
                // Desktop Table Row
                tbody.append(`
                    <tr>
                        <td>${device.device_id}</td>
                        <td>
                            <img src="${device.image_url || DEFAULT_DEVICE_IMAGE}" alt="device" style="height: 30px; width: 50px; object-fit: cover;">
                            ${device.make} ${device.model}
                        </td>
                        <td>${device.serial_number || 'N/A'}</td>
                        <td>${device.status ? device.status.replace(/_/g, ' ') : 'N/A'}</td>
                        <td>${device.device_type || 'N/A'}</td>
                        <td>
                            <button class="btn btn-sm btn-info" onclick="editCar(${device.device_id})">Edit</button>
                            <button class="btn btn-sm btn-danger" onclick="deleteCar(${device.device_id})">Delete</button>
                        </td>
                    </tr>
                `);

                // Mobile Card View
                cardsContainer.append(`
                    <div class="card mb-3 shadow-sm">
                        <div class="card-body">
                            <div class="d-flex align-items-center mb-3">
                                <img src="${device.image_url || DEFAULT_DEVICE_IMAGE}" alt="device" class="me-3" style="height: 60px; width: 100px; object-fit: cover;">
                                <div>
                                    <h5 class="card-title mb-0">${device.make} ${device.model}</h5>
                                    <small class="text-muted">ID: ${device.device_id}</small>
                                </div>
                            </div>
                            <hr>
                            <div class="mb-2">
                                <strong>Serial Number:</strong> ${device.serial_number || 'N/A'}
                            </div>
                            <div class="mb-2">
                                <strong>Device Type:</strong> <span class="badge bg-info">${device.device_type || 'N/A'}</span>
                            </div>
                            <div class="mb-2">
                                <strong>Status:</strong> <span class="badge bg-secondary">${device.status ? device.status.replace(/_/g, ' ') : 'N/A'}</span>
                            </div>
                            <div class="d-grid gap-2 d-md-flex">
                                <button class="btn btn-sm btn-info flex-fill" onclick="editCar(${device.device_id})">Edit</button>
                                <button class="btn btn-sm btn-danger flex-fill" onclick="deleteCar(${device.device_id})">Delete</button>
                            </div>
                        </div>
                    </div>
                `);
            });
        });
}

function loadAdminUsers(params = {}) {
    const tbody = $('#admin-users-table tbody');
    const cardsContainer = $('#admin-users-cards');
    if (params.search || params.role || params.is_verified) {
        tbody.html(`
            <tr>
                <td colspan="6" class="text-center">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                </td>
            </tr>
        `);
        cardsContainer.html(`
            <div class="text-center">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
            </div>
        `);
    }

    let url = `${API_URL}/admin/users`;
    const queryParams = new URLSearchParams();

    if (params.search) queryParams.append('search', params.search);
    if (params.role) queryParams.append('role', params.role);
    if (params.is_verified) queryParams.append('is_verified', params.is_verified);

    if (queryParams.toString()) {
        url += `?${queryParams.toString()}`;
    }

    axios.get(url)
        .then(response => {
            let users = response.data;
            const tbody = $('#admin-users-table tbody');
            const cardsContainer = $('#admin-users-cards');
            tbody.empty();
            cardsContainer.empty();

            if (users.length === 0) {
                tbody.append('<tr><td colspan="6" class="text-center">No users found.</td></tr>');
                cardsContainer.html('<div class="text-center p-4"><p>No users found.</p></div>');
                return;
            }

            // Sort: Admin > Staff > Customer
            const roleOrder = { 'admin': 1, 'staff': 2, 'customer': 3 };
            users.sort((a, b) => {
                return (roleOrder[a.role] || 99) - (roleOrder[b.role] || 99);
            });

            users.forEach(user => {
                let deleteBtn = '';
                if (user.user_id != 6) {
                    deleteBtn = `<button class="btn btn-sm btn-danger" onclick="deleteUser(${user.user_id})">Delete</button>`;
                }

                // Desktop Table Row
                tbody.append(`
                    <tr>
                        <td>${user.user_id}</td>
                        <td>${user.username}</td>
                        <td>${user.email}</td>
                        <td>${user.role}</td>
                        <td>${user.is_verified ? 'Yes' : 'No'}</td>
                        <td>
                            <button class="btn btn-sm btn-info" onclick="editUser(${user.user_id})">Edit</button>
                            ${deleteBtn}
                        </td>
                    </tr>
                `);

                // Mobile Card View
                cardsContainer.append(`
                    <div class="card mb-3 shadow-sm">
                        <div class="card-body">
                            <h5 class="card-title">${user.username}</h5>
                            <hr>
                            <div class="mb-2">
                                <strong>ID:</strong> ${user.user_id}
                            </div>
                            <div class="mb-2">
                                <strong>Email:</strong> ${user.email}
                            </div>
                            <div class="mb-2">
                                <strong>Role:</strong> <span class="badge bg-primary">${user.role}</span>
                            </div>
                            <div class="mb-3">
                                <strong>Verified:</strong> ${user.is_verified ? '<span class="badge bg-success">Yes</span>' : '<span class="badge bg-danger">No</span>'}
                            </div>
                            <div class="d-grid gap-2 d-md-flex">
                                <button class="btn btn-sm btn-info flex-fill" onclick="editUser(${user.user_id})">Edit</button>
                                ${deleteBtn ? `<button class="btn btn-sm btn-danger flex-fill" onclick="deleteUser(${user.user_id})">Delete</button>` : ''}
                            </div>
                        </div>
                    </div>
                `);
            });
        });
}

// Global functions for onclick
window.editCar = function(id) {
    axios.get(`${API_URL}/devices/${id}`).then(res => {
        const device = res.data;
        $('#car_id').val(device.device_id);
        $('#make').val(device.make);
        $('#model').val(device.model);
        $('#serial_number').val(device.serial_number);
        $('#device_type').val(device.device_type);
        $('#operating_system').val(device.operating_system);
        $('#description_of_issue').val(device.description_of_issue);
        $('#status').val(device.status);
        
        if(device.image_url) {
            $('#current-image-preview').html(`<img src="${device.image_url}" style="max-height: 100px;">`);
        } else {
            $('#current-image-preview').html(`<img src="${DEFAULT_DEVICE_IMAGE}" style="max-height: 100px;">`);
        }
        
        $('#modalTitle').text('Edit Device');
        $('#carModal').modal('show');
    });
};

window.deleteCar = function(id) {
    Swal.fire({
        title: 'Are you sure?',
        text: "You won't be able to revert this!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
        if (result.isConfirmed) {
            axios.delete(`${API_URL}/admin/devices/${id}`)
                .then(() => {
                    loadAdminCars();
                    Swal.fire(
                        'Deleted!',
                        'The device has been deleted.',
                        'success'
                    );
                })
                .catch(err => {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error deleting device',
                        text: err.response?.data?.message || 'An error occurred'
                    });
                });
        }
    });
};

window.editUser = function(id) {
    axios.get(`${API_URL}/admin/users/${id}`).then(res => {
        const user = res.data;
        $('#user_id').val(user.user_id);
        $('#username').val(user.username);
        $('#full_name').val(user.full_name);
        $('#email').val(user.email);
        $('#password').val(''); // Clear password field
        $('#role').val(user.role);
        $('#is_verified').val(user.is_verified ? 1 : 0);
        
        $('.modal-title').text('Edit User');
        $('#userModal').modal('show');
    });
};

window.openAddUserModal = function() {
    $('#user_id').val('');
    $('#user-form')[0].reset();
    $('.modal-title').text('Add New User');
    $('#userModal').modal('show');
};

window.deleteUser = function(id) {
    Swal.fire({
        title: 'Are you sure?',
        text: "This will delete the user and all their data. You won't be able to revert this!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
        if (result.isConfirmed) {
            axios.delete(`${API_URL}/admin/users/${id}`)
                .then(() => {
                    loadAdminUsers();
                    Swal.fire(
                        'Deleted!',
                        'The user has been deleted.',
                        'success'
                    );
                })
                .catch(err => {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error deleting user',
                        text: err.response?.data?.message || 'An error occurred'
                    });
                });
        }
    });
};

// Clear modal when opening for add
function openAddCarModal() {
    $('#car_id').val('');
    $('#add-car-form')[0].reset();
    $('#current-image-preview').empty();
    $('#modalTitle').text('Add New Device');
    $('#carModal').modal('show');
}

function loadAdminHistory(params = {}) {
    const tbody = $('#admin-history-table tbody');
    const cardsContainer = $('#admin-history-cards');
    // Spinner is default in HTML or show if re-loading
    if (params.search || params.status || params.payment_status || params.date) {
        tbody.html(`
            <tr>
                <td colspan="9" class="text-center">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                </td>
            </tr>
        `);
        cardsContainer.html(`
            <div class="text-center">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
            </div>
        `);
    }

    let url = `${API_URL}/bookings`;
    const queryParams = new URLSearchParams();
    if (params.search) queryParams.append('search', params.search);
    if (params.status) queryParams.append('status', params.status);
    if (params.payment_status) queryParams.append('payment_status', params.payment_status);
    if (params.date) queryParams.append('date', params.date);
    
    if (queryParams.toString()) {
        url += `?${queryParams.toString()}`;
    }

    axios.get(url)
        .then(response => {
            const cardsContainer = $('#admin-history-cards');
            tbody.empty();
            cardsContainer.empty();
            
            // Show all bookings - backend handles filtering
            let filteredBookings = response.data || [];
            
            if (filteredBookings.length === 0) {
                tbody.append('<tr><td colspan="9" class="text-center">No history available.</td></tr>');
                cardsContainer.html('<div class="text-center p-4"><p>No history available.</p></div>');
                return;
            }

            filteredBookings.forEach(booking => {
                const statusClass = 
                    booking.status === 'completed' ? 'bg-success' : 
                    booking.status === 'cancelled' ? 'bg-danger' : 
                    booking.status === 'confirmed' ? 'bg-info' :
                    booking.status === 'pending' ? 'bg-warning' :
                    'bg-secondary';

                const paymentClass = booking.payment_status === 'paid' ? 'bg-success' : 'bg-warning';
                const staff = booking.staff || {};
                const device = booking.device || {};
                const user = booking.user || {};

                // Format date and time
                let dateTimeStr = 'N/A';
                if (booking.date) {
                    const date = new Date(booking.date);
                    const formattedDate = date.toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: '2-digit', 
                        day: '2-digit' 
                    });
                    dateTimeStr = formattedDate;
                    if (booking.time_slot) {
                        dateTimeStr += ` (${booking.time_slot})`;
                    }
                }

                // Desktop Table Row
                tbody.append(`
                    <tr>
                        <td>${booking.booking_id || booking.id}</td>
                        <td>${user.username || user.full_name || 'N/A'}</td>
                        <td>${device.make && device.model ? `${device.make} ${device.model}` : 'Deleted Device'}</td>
                        <td>${dateTimeStr}</td>
                        <td>${booking.service_type || 'N/A'}</td>
                        <td><span class="badge ${paymentClass}">${booking.payment_status || 'unpaid'}</span></td>
                        <td><span class="badge ${statusClass}">${booking.status}</span></td>
                        <td>${staff.full_name || staff.username || 'Not assigned'}</td>
                        <td>
                            <button class="btn btn-sm btn-info" onclick="viewBookingDetails(${booking.booking_id || booking.id})" title="View Details">
                                <i class="bi bi-eye"></i> View
                            </button>
                            ${booking.status !== 'cancelled' && booking.status !== 'completed' ? 
                                `<button class="btn btn-sm btn-warning" onclick="cancelBooking(${booking.booking_id || booking.id})">Cancel</button>` : 
                                ''
                            }
                        </td>
                    </tr>
                `);

                // Mobile Card View
                cardsContainer.append(`
                    <div class="card mb-3 shadow-sm">
                        <div class="card-body">
                            <h5 class="card-title">Booking #${booking.booking_id || booking.id}</h5>
                            <hr>
                            <div class="mb-2">
                                <strong>Customer:</strong> ${user.username || user.full_name || 'N/A'}
                            </div>
                            <div class="mb-2">
                                <strong>Device:</strong> ${device.make && device.model ? `${device.make} ${device.model}` : 'Deleted Device'}
                            </div>
                            <div class="mb-2">
                                <strong>Date & Time:</strong> ${dateTimeStr}
                            </div>
                            <div class="mb-2">
                                <strong>Service Type:</strong> ${booking.service_type || 'N/A'}
                            </div>
                            <div class="mb-2">
                                <strong>Payment Status:</strong> <span class="badge ${paymentClass}">${booking.payment_status || 'unpaid'}</span>
                            </div>
                            <div class="mb-2">
                                <strong>Status:</strong> <span class="badge ${statusClass}">${booking.status}</span>
                            </div>
                            <div class="mb-3">
                                <strong>Assigned Staff:</strong> ${staff.full_name || staff.username || 'Not assigned'}
                            </div>
                            <div class="d-grid gap-2">
                                <button class="btn btn-sm btn-info" onclick="viewBookingDetails(${booking.booking_id || booking.id})">View Details</button>
                                ${booking.status !== 'cancelled' && booking.status !== 'completed' ? 
                                    `<button class="btn btn-sm btn-warning" onclick="cancelBooking(${booking.booking_id || booking.id})">Cancel</button>` : 
                                    ''
                                }
                            </div>
                        </div>
                    </div>
                `);
            });
        })
        .catch(err => {
            console.error(err);
            $('#admin-history-table tbody').html('<tr><td colspan="9" class="text-center text-danger">Failed to load history.</td></tr>');
            $('#admin-history-cards').html('<div class="text-center p-4 text-danger"><p>Failed to load history.</p></div>');
        });
}

window.viewBookingDetails = function(id) {
    // Use my-bookings endpoint which allows admin/staff to view any booking
    axios.get(`${API_URL}/my-bookings/${id}`)
        .then(response => {
            const booking = response.data.repair || response.data.booking || response.data;
            const device = booking.device || {};
            const user = booking.user || {};
            const staff = booking.staff || {};
            
            let dateTimeStr = 'N/A';
            if (booking.date) {
                const date = new Date(booking.date);
                dateTimeStr = date.toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric',
                    weekday: 'long'
                });
                if (booking.time_slot) {
                    dateTimeStr += ` at ${booking.time_slot}`;
                }
            }

            const detailsHtml = `
                <div class="row">
                    <div class="col-md-6 mb-3">
                        <strong>Booking ID:</strong> ${booking.booking_id || booking.id}
                    </div>
                    <div class="col-md-6 mb-3">
                        <strong>Status:</strong> <span class="badge ${booking.status === 'completed' ? 'bg-success' : booking.status === 'cancelled' ? 'bg-danger' : booking.status === 'confirmed' ? 'bg-info' : 'bg-warning'}">${booking.status}</span>
                    </div>
                    <div class="col-md-6 mb-3">
                        <strong>Customer:</strong> ${user.full_name || user.username || 'N/A'}<br>
                        <small class="text-muted">${user.email || ''}</small>
                    </div>
                    <div class="col-md-6 mb-3">
                        <strong>Assigned Staff:</strong> ${staff.full_name || staff.username || 'Not assigned'}
                    </div>
                    <div class="col-md-6 mb-3">
                        <strong>Device:</strong> ${device.make && device.model ? `${device.make} ${device.model}` : 'N/A'}<br>
                        <small class="text-muted">Serial: ${device.serial_number || 'N/A'}</small>
                    </div>
                    <div class="col-md-6 mb-3">
                        <strong>Device Type:</strong> ${device.device_type || 'N/A'}<br>
                        <strong>OS:</strong> ${device.operating_system || 'N/A'}
                    </div>
                    <div class="col-12 mb-3">
                        <strong>Description of Issue:</strong><br>
                        <p class="text-muted">${device.description_of_issue || 'N/A'}</p>
                    </div>
                    <div class="col-md-6 mb-3">
                        <strong>Date & Time:</strong> ${dateTimeStr}
                    </div>
                    <div class="col-md-6 mb-3">
                        <strong>Service Type:</strong> ${booking.service_type || 'N/A'}
                    </div>
                    <div class="col-md-6 mb-3">
                        <strong>Payment Status:</strong> <span class="badge ${booking.payment_status === 'paid' ? 'bg-success' : 'bg-warning'}">${booking.payment_status || 'unpaid'}</span>
                    </div>
                    <div class="col-md-6 mb-3">
                        <strong>Payment Method:</strong> ${booking.payment_method || 'N/A'}
                    </div>
                    <div class="col-12 mb-3">
                        <strong>Created:</strong> ${booking.created_at ? new Date(booking.created_at).toLocaleString() : 'N/A'}<br>
                        <strong>Last Updated:</strong> ${booking.updated_at ? new Date(booking.updated_at).toLocaleString() : 'N/A'}
                    </div>
                </div>
            `;

            Swal.fire({
                title: 'Booking Details',
                html: detailsHtml,
                width: '800px',
                showCloseButton: true,
                showConfirmButton: true,
                confirmButtonText: 'Close'
            });
        })
        .catch(err => {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: err.response?.data?.message || 'Failed to load booking details'
            });
        });
};

window.cancelBooking = function(id) {
    Swal.fire({
        title: 'Are you sure?',
        text: "You want to cancel this booking? This action can be reversed by updating the status.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, cancel it!'
    }).then((result) => {
        if (result.isConfirmed) {
            axios.put(`${API_URL}/bookings/${id}`, { status: 'cancelled' })
                .then(() => {
                    loadAdminHistory();
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
                        title: "Booking cancelled successfully"
                    });
                })
                .catch(err => {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error cancelling booking',
                        text: err.response?.data?.message || 'An error occurred'
                    });
                });
        }
    });
};
