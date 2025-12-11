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
    checkStaff();

    $('#staff-logout').on('click', function(e) {
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
    if ($('#pending-rentals').length) {
        loadDashboardStats();
    }

    // Rentals Management
    if ($('#staff-rentals-table').length) {
        loadStaffRentals();

        $('#staff-rental-search-form').on('submit', function(e) {
            e.preventDefault();
            const search = $('#staff-rental-search-input').val();
            const status = $('#staff-rental-status-filter').val();
            loadStaffRentals({ search, status });
        });
    }

    // Cars Management (Reuse most logic from admin but restricted if needed)
    if ($('#staff-cars-table').length) {
        loadStaffCars();

        $('#staff-car-search-form').on('submit', function(e) {
            e.preventDefault();
            const search = $('#staff-search-input').val();
            const status = $('#staff-status-filter').val();
            const device_type = $('#staff-device-type-filter').val();
            const operating_system = $('#staff-os-filter').val();
            
            loadStaffCars({ search, status, device_type, operating_system });
        });

        $('#add-car-form').on('submit', function(e) {
            e.preventDefault();
            
            const formData = new FormData();
            formData.append('make', $('#make').val());
            formData.append('model', $('#model').val());
            formData.append('serial_number', $('#serial_number').val());
            formData.append('description_of_issue', $('#description_of_issue').val());
            formData.append('device_type', $('#device_type').val());
            formData.append('operating_system', $('#operating_system').val());
            formData.append('status', $('#status').val());
            
            const userId = $('#user_id').val();
            if (userId && userId.trim() !== '') {
                formData.append('user_id', userId);
            }
            
            const imageFile = $('#image')[0].files[0];
            if (imageFile) {
                formData.append('image', imageFile);
            }

            const deviceId = $('#car_id').val();
            
            if (deviceId) {
                // Update
                axios.put(`${API_URL}/staff/devices/${deviceId}`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                })
                    .then(() => {
                        $('#carModal').modal('hide');
                        loadStaffCars();
                        Swal.fire({
                            icon: 'success',
                            title: 'Success',
                            text: 'Device updated successfully',
                            timer: 2000,
                            showConfirmButton: false
                        });
                    })
                    .catch(err => {
                        Swal.fire({
                            icon: 'error',
                            title: 'Error',
                            text: err.response?.data?.message || 'Failed to update device'
                        });
                    });
            } else {
                // Create
                axios.post(`${API_URL}/staff/devices`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                })
                    .then(() => {
                        $('#carModal').modal('hide');
                        loadStaffCars();
                        Swal.fire({
                            icon: 'success',
                            title: 'Success',
                            text: 'Device created successfully',
                            timer: 2000,
                            showConfirmButton: false
                        });
                    })
                    .catch(err => {
                        Swal.fire({
                            icon: 'error',
                            title: 'Error',
                            text: err.response?.data?.message || 'Failed to create device'
                        });
                    });
            }
        });
    }
});

function checkStaff() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || (user.role !== 'staff' && user.role !== 'admin')) {
        alert('Access Denied. Staff only.');
        window.location.href = '../index.html';
    }
}

function loadDashboardStats() {
    axios.get(`${API_URL}/devices`)
        .then(res => $('#available-cars').text(res.data.length))
        .catch(() => $('#available-cars').text('Error'));
    
    axios.get(`${API_URL}/rentals`)
        .then(res => {
            const pending = res.data.filter(r => r.rental_status === 'pending').length;
            $('#pending-rentals').text(pending);
        })
        .catch(() => $('#pending-rentals').text('Error'));
}

function loadStaffCars(params = {}) {
    // Spinner is handled by HTML default state or we can explicitly show it if needed for re-searches
    const tbody = $('#staff-cars-table tbody');
    const cardsContainer = $('#staff-cars-cards');
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

    let url = `${API_URL}/devices`;
    const queryParams = new URLSearchParams();

    // Default to all=true if no status filter is applied, similar to admin
    if (params.status) {
        queryParams.append('status', params.status);
    } else {
        queryParams.append('all', 'true');
    }

    if (params.search) queryParams.append('search', params.search);
    if (params.device_type) queryParams.append('device_type', params.device_type);
    if (params.operating_system) queryParams.append('operating_system', params.operating_system);

    if (queryParams.toString()) {
        url += `?${queryParams.toString()}`;
    }

    axios.get(url)
        .then(response => {
            const tbody = $('#staff-cars-table tbody');
            const cardsContainer = $('#staff-cars-cards');
            tbody.empty();
            cardsContainer.empty();
            const DEFAULT_DEVICE_IMAGE = '../images/default-device.svg';
            
            if (response.data.length === 0) {
                tbody.html('<tr><td colspan="6" class="text-center">No devices found.</td></tr>');
                cardsContainer.html('<div class="text-center p-4"><p>No devices found.</p></div>');
                return;
            }

            // Sort devices: Available > In Service > Maintenance
            const statusOrder = { 'available': 1, 'in_service': 2, 'maintenance': 3 };
            response.data.sort((a, b) => {
                return (statusOrder[a.status] || 99) - (statusOrder[b.status] || 99);
            });

            response.data.forEach(device => {
                const statusBadge = device.status === 'available' ? 'success' : 
                                   device.status === 'in_service' ? 'warning' : 'secondary';
                
                // Desktop Table Row
                tbody.append(`
                    <tr>
                        <td>${device.device_id}</td>
                        <td>
                            <img src="${device.image_url || DEFAULT_DEVICE_IMAGE}" alt="device" style="height: 30px; width: 50px; object-fit: cover;" onerror="this.src='${DEFAULT_DEVICE_IMAGE}'">
                            ${device.make} ${device.model}
                        </td>
                        <td>${device.serial_number || 'N/A'}</td>
                        <td><span class="badge bg-${statusBadge}">${device.status.replace(/_/g, ' ')}</span></td>
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
                                <img src="${device.image_url || DEFAULT_DEVICE_IMAGE}" alt="device" class="me-3" style="height: 60px; width: 100px; object-fit: cover;" onerror="this.src='${DEFAULT_DEVICE_IMAGE}'">
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
                                <strong>Type:</strong> ${device.device_type || 'N/A'}
                            </div>
                            <div class="mb-2">
                                <strong>Status:</strong> <span class="badge bg-${statusBadge}">${device.status.replace(/_/g, ' ')}</span>
                            </div>
                            ${device.description_of_issue ? `<div class="mb-3"><strong>Issue:</strong> ${device.description_of_issue}</div>` : ''}
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

function loadStaffRentals(params = {}) {
    const tbody = $('#staff-rentals-table tbody');
    const cardsContainer = $('#staff-rentals-cards');
    // Show spinner on reload
    if (params.search || params.status) {
        tbody.html(`
            <tr>
                <td colspan="8" class="text-center">
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
    
    let url = `${API_URL}/rentals`;
    const queryParams = new URLSearchParams();
    if (params.search) queryParams.append('search', params.search);
    if (params.status) queryParams.append('status', params.status);
    
    if (queryParams.toString()) {
        url += `?${queryParams.toString()}`;
    }

    axios.get(url)
        .then(response => {
            if (response.data.length === 0) {
                tbody.html('<tr><td colspan="8" class="text-center">No repair tickets found.</td></tr>');
                cardsContainer.html('<div class="text-center p-4"><p>No repair tickets found.</p></div>');
                return;
            }
            
            // Booking workflow: pending -> confirmed -> completed/cancelled
            const statusOrder = {
                'pending': 1,
                'confirmed': 2,
                'completed': 3,
                'cancelled': 4
            };

            response.data.sort((a, b) => {
                return (statusOrder[a.rental_status] || 99) - (statusOrder[b.rental_status] || 99);
            });

            tbody.empty(); // Clear spinner
            cardsContainer.empty();
            response.data.forEach(rental => {
                const user = rental.user ? rental.user.username : 'Unknown';
                const car = rental.car ? `${rental.car.make} ${rental.car.model}` : 'Unknown device';
                const statusColor = getStatusColor(rental.status || rental.rental_status);
                const statusLabel = (rental.status || rental.rental_status).replace(/_/g, ' ');
                
                // State Machine for Staff
                let actions = '';
                if (rental.status === 'pending' || rental.rental_status === 'pending') {
                    actions = `
                        <button class="btn btn-sm btn-success mb-2" onclick="updateRentalStatus(${rental.booking_id || rental.rental_id}, 'confirmed')">Confirm</button>
                        <button class="btn btn-sm btn-danger" onclick="updateRentalStatus(${rental.booking_id || rental.rental_id}, 'cancelled')">Cancel</button>
                    `;
                } else if (rental.status === 'confirmed' || rental.rental_status === 'confirmed') {
                    actions = `
                        <button class="btn btn-sm btn-success" onclick="updateRentalStatus(${rental.booking_id || rental.rental_id}, 'completed')">Mark Completed</button>
                        <button class="btn btn-sm btn-danger" onclick="updateRentalStatus(${rental.booking_id || rental.rental_id}, 'cancelled')">Cancel</button>
                    `;
                }

                const actionButton = actions ? `
                    <button class="btn btn-sm btn-primary dropdown-toggle" type="button" data-bs-toggle="dropdown">
                        Action
                    </button>
                    <ul class="dropdown-menu">
                        ${rental.status === 'pending' || rental.rental_status === 'pending' ? `
                            <li><a class="dropdown-item" href="#" onclick="updateRentalStatus(${rental.booking_id || rental.rental_id}, 'confirmed')">Confirm</a></li>
                            <li><a class="dropdown-item" href="#" onclick="updateRentalStatus(${rental.booking_id || rental.rental_id}, 'cancelled')">Cancel</a></li>
                        ` : ''}
                        ${rental.status === 'confirmed' || rental.rental_status === 'confirmed' ? `
                            <li><a class="dropdown-item" href="#" onclick="updateRentalStatus(${rental.booking_id || rental.rental_id}, 'completed')">Complete</a></li>
                            <li><a class="dropdown-item" href="#" onclick="updateRentalStatus(${rental.booking_id || rental.rental_id}, 'cancelled')">Cancel</a></li>
                        ` : ''}
                    </ul>
                ` : '<span class="text-muted">No actions</span>';

                // Desktop Table Row
                tbody.append(`
                    <tr>
                        <td>${rental.rental_id}</td>
                        <td>${user}</td>
                        <td>${car}</td>
                        <td>${new Date(rental.date || rental.pickup_date).toLocaleDateString()}</td>
                        <td>${rental.time_slot || 'N/A'}</td>
                        <td>${rental.service_type || 'N/A'}</td>
                        <td><span class="badge bg-${statusColor}">${statusLabel}</span></td>
                        <td>
                            ${actionButton}
                        </td>
                    </tr>
                `);

                // Mobile Card View
                cardsContainer.append(`
                    <div class="card mb-3 shadow-sm">
                        <div class="card-body">
                            <h5 class="card-title">Ticket #${rental.rental_id}</h5>
                            <hr>
                            <div class="mb-2">
                                <strong>User:</strong> ${user}
                            </div>
                            <div class="mb-2">
                                <strong>Device:</strong> ${car}
                            </div>
                            <div class="mb-2">
                                <strong>Drop-off:</strong> ${new Date(rental.date || rental.pickup_date).toLocaleDateString()}
                            </div>
                            <div class="mb-2">
                                <strong>Time Slot:</strong> ${rental.time_slot || 'N/A'}
                            </div>
                            <div class="mb-3">
                                <strong>Status:</strong> <span class="badge bg-${statusColor}">${statusLabel}</span>
                            </div>
                            ${actions ? `<div class="d-grid gap-2">${actions}</div>` : '<p class="text-muted mb-0">No actions available</p>'}
                        </div>
                    </div>
                `);
            });
        });
}

function getStatusColor(status) {
    switch(status) {
        case 'pending': return 'warning';
        case 'confirmed': return 'info';
        case 'completed': return 'success';
        case 'cancelled': return 'danger';
        default: return 'secondary';
    }
}

window.updateRentalStatus = function(id, status) {
    const label = status.replace(/_/g, ' ');
    if(confirm(`Are you sure you want to set this ticket to "${label}"?`)) {
        axios.put(`${API_URL}/staff/rentals/${id}`, { rental_status: status })
            .then(() => {
                loadStaffRentals();
                alert('Status updated');
            })
            .catch(err => alert('Failed to update status'));
    }
}

// Reuse Edit Car Logic
window.editCar = function(id) {
    axios.get(`${API_URL}/devices/${id}`).then(res => {
        const device = res.data;
        const DEFAULT_DEVICE_IMAGE = '../images/default-device.svg';

        $('#car_id').val(device.device_id);
        $('#make').val(device.make);
        $('#model').val(device.model);
        $('#serial_number').val(device.serial_number);
        $('#description_of_issue').val(device.description_of_issue);
        $('#device_type').val(device.device_type);
        $('#operating_system').val(device.operating_system);
        $('#status').val(device.status);
        $('#user_id').val(device.user_id || '');
        
        if(device.image_url) {
            $('#current-image-preview').html(`<img src="${device.image_url}" style="max-height: 100px;" class="img-thumbnail">`);
        } else {
            $('#current-image-preview').html(`<img src="${DEFAULT_DEVICE_IMAGE}" style="max-height: 100px;" class="img-thumbnail">`);
        }
        
        $('#modalTitle').text('Edit Device');
        $('#carModal').modal('show');
    });
};

function openAddCarModal() {
    $('#car_id').val('');
    $('#add-car-form')[0].reset();
    $('#current-image-preview').empty();
    $('#modalTitle').text('Add New Device');
    $('#carModal').modal('show');
}

window.deleteCar = function(id) {
    if(confirm('Are you sure you want to delete this car? This action cannot be undone.')) {
        axios.delete(`${API_URL}/staff/devices/${id}`)
            .then(() => {
                loadStaffCars();
                alert('Car deleted successfully');
            })
            .catch(err => alert('Error deleting car: ' + (err.response?.data?.message || err.message)));
    }
};

