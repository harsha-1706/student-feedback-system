const user = JSON.parse(localStorage.getItem('user'));
if (!user || user.role !== 'admin') {
    logout();
}

let userModal, courseModal, assignFacultyModal, enrollStudentModal, confirmModal;
let globalUsers = [];
let globalCourses = [];
let pendingConfirmAction = null;

document.addEventListener('DOMContentLoaded', () => {
    userModal = new bootstrap.Modal(document.getElementById('userModal'));
    courseModal = new bootstrap.Modal(document.getElementById('courseModal'));
    assignFacultyModal = new bootstrap.Modal(document.getElementById('assignFacultyModal'));
    enrollStudentModal = new bootstrap.Modal(document.getElementById('enrollStudentModal'));
    confirmModal = new bootstrap.Modal(document.getElementById('confirmModal'));

    document.getElementById('navDashboard').addEventListener('click', loadDashboardOverview);
    document.getElementById('navUsers').addEventListener('click', loadUsers);
    document.getElementById('navCourses').addEventListener('click', loadCourses);
    document.getElementById('navAssignments').addEventListener('click', loadAssignments);
    document.getElementById('navStats').addEventListener('click', loadStats);

    document.getElementById('userForm').addEventListener('submit', submitUser);
    document.getElementById('courseForm').addEventListener('submit', submitCourse);
    document.getElementById('assignFacultyForm').addEventListener('submit', submitFacultyAssignment);
    document.getElementById('enrollStudentForm').addEventListener('submit', submitStudentEnrollment);
    
    document.getElementById('confirmBtn').addEventListener('click', async () => {
        if (pendingConfirmAction) {
            const btn = document.getElementById('confirmBtn');
            btn.classList.add('btn-loading');
            await pendingConfirmAction();
            btn.classList.remove('btn-loading');
            confirmModal.hide();
        }
    });

    // Handle active state on nav links
    document.querySelectorAll('.nav-link').forEach(link => {
        if (link.id) {
            link.addEventListener('click', (e) => {
                document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
                e.target.classList.add('active');
            });
        }
    });

    loadDashboardOverview();
});

function showToast(message, type = 'success') {
    const toastEl = document.getElementById('liveToast');
    const toastBody = document.getElementById('toastMessage');
    toastEl.className = `toast align-items-center text-bg-${type} border-0`;
    toastBody.textContent = message;
    const toast = new bootstrap.Toast(toastEl);
    toast.show();
}

// DASHBOARD OVERVIEW
async function loadDashboardOverview() {
    document.getElementById('pageTitle').textContent = 'Dashboard Overview';
    const area = document.getElementById('contentArea');
    area.innerHTML = '<div class="text-center p-5"><div class="spinner-border text-primary" role="status"></div></div>';
    
    try {
        const users = await apiCall('/users');
        const courses = await apiCall('/courses');
        
        const totalFaculty = users.filter(u => u.role === 'faculty').length;
        const totalStudents = users.filter(u => u.role === 'student').length;
        const totalCourses = courses.length;
        const activeUsers = users.filter(u => u.is_active).length;

        area.innerHTML = `
            <div class="row g-4 mb-4">
                <div class="col-md-3">
                    <div class="card h-100 p-4 border-0" style="border-top: 4px solid var(--primary-color) !important;">
                        <h6 class="text-muted mb-2 text-uppercase small fw-bold">Total Students</h6>
                        <h2 class="m-0">${totalStudents}</h2>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card h-100 p-4 border-0" style="border-top: 4px solid #10b981 !important;">
                        <h6 class="text-muted mb-2 text-uppercase small fw-bold">Total Faculty</h6>
                        <h2 class="m-0">${totalFaculty}</h2>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card h-100 p-4 border-0" style="border-top: 4px solid #f59e0b !important;">
                        <h6 class="text-muted mb-2 text-uppercase small fw-bold">Total Courses</h6>
                        <h2 class="m-0">${totalCourses}</h2>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card h-100 p-4 border-0" style="border-top: 4px solid #8b5cf6 !important;">
                        <h6 class="text-muted mb-2 text-uppercase small fw-bold">Active Accounts</h6>
                        <h2 class="m-0">${activeUsers}</h2>
                    </div>
                </div>
            </div>
            <div class="card p-4 border-0">
                <h5 class="mb-3">Welcome, ${user.name}</h5>
                <p class="text-muted mb-0">Use the navigation menu to manage users, courses, assignments, and view system analytics.</p>
            </div>
        `;
    } catch (e) {
        area.innerHTML = `<div class="empty-state text-danger">${e.message}</div>`;
    }
}


// USERS
async function loadUsers() {
    document.getElementById('pageTitle').textContent = 'Manage Users';
    const area = document.getElementById('contentArea');
    area.innerHTML = '<div class="text-center p-5"><div class="spinner-border text-primary" role="status"></div></div>';
    
    try {
        globalUsers = await apiCall('/users');
        let html = `
            <div class="d-flex justify-content-between align-items-center mb-4">
                <p class="text-muted m-0">Directory of all students, faculty, and administrators.</p>
                <button class="btn btn-primary" onclick="userModal.show()">+ Add User</button>
            </div>
            <div class="table-wrapper">
            <table class="table table-hover">
                <thead><tr><th>Name</th><th>Username</th><th>Role</th><th>Status</th><th>Action</th></tr></thead>
                <tbody>
        `;
        globalUsers.forEach(u => {
            const roleBadge = `badge-${u.role}`;
            html += `
                <tr>
                    <td class="fw-medium">${u.name}</td>
                    <td class="text-muted">${u.username}</td>
                    <td><span class="badge ${roleBadge} text-capitalize">${u.role}</span></td>
                    <td>${u.is_active ? '<span class="badge badge-active">Active</span>' : '<span class="badge badge-inactive">Inactive</span>'}</td>
                    <td>
                        ${u.is_active ? `<button class="btn btn-sm btn-outline-danger py-1 px-2" onclick="deactivateUser(${u.id}, '${u.username}')">Deactivate</button>` : ''}
                    </td>
                </tr>
            `;
        });
        html += '</tbody></table></div>';
        area.innerHTML = html;
    } catch (e) {
        area.innerHTML = `<div class="empty-state text-danger">${e.message}</div>`;
    }
}

async function submitUser(e) {
    e.preventDefault();
    const alertBox = document.getElementById('userAlert');
    const btn = document.getElementById('saveUserBtn');
    
    const payload = {
        username: document.getElementById('u_username').value,
        name: document.getElementById('u_name').value,
        password: document.getElementById('u_password').value,
        role: document.getElementById('u_role').value
    };

    try {
        btn.classList.add('btn-loading');
        await apiCall('/users', 'POST', payload);
        userModal.hide();
        document.getElementById('userForm').reset();
        showToast('User created successfully.');
        loadUsers();
    } catch (err) {
        alertBox.className = 'alert alert-danger small';
        alertBox.textContent = err.message;
        alertBox.classList.remove('d-none');
    } finally {
        btn.classList.remove('btn-loading');
    }
}

function deactivateUser(id, username) {
    document.getElementById('confirmTitle').textContent = 'Deactivate User';
    document.getElementById('confirmMessage').textContent = `Are you sure you want to deactivate ${username}? They will no longer be able to log in.`;
    
    pendingConfirmAction = async () => {
        try {
            await apiCall(`/users/${id}/deactivate`, 'PUT');
            showToast('User deactivated successfully.', 'success');
            loadUsers();
        } catch (e) {
            showToast(e.message, 'danger');
        }
    };
    confirmModal.show();
}

// COURSES
async function loadCourses() {
    document.getElementById('pageTitle').textContent = 'Manage Courses';
    const area = document.getElementById('contentArea');
    area.innerHTML = '<div class="text-center p-5"><div class="spinner-border text-primary" role="status"></div></div>';
    
    try {
        globalCourses = await apiCall('/courses');
        let html = `
            <div class="d-flex justify-content-between align-items-center mb-4">
                <p class="text-muted m-0">Catalog of all available courses.</p>
                <button class="btn btn-primary" onclick="courseModal.show()">+ Add Course</button>
            </div>
            <div class="table-wrapper">
            <table class="table table-hover">
                <thead><tr><th>Course Code</th><th>Course Name</th><th>Action</th></tr></thead>
                <tbody>
        `;
        if (globalCourses.length === 0) {
            html += `<tr><td colspan="3" class="text-center text-muted p-4">No courses available.</td></tr>`;
        }
        globalCourses.forEach(c => {
            html += `
                <tr>
                    <td class="fw-medium">${c.course_code}</td>
                    <td>${c.course_name}</td>
                    <td>
                        <button class="btn btn-sm btn-outline-danger py-1 px-2" onclick="deleteCourse(${c.id}, '${c.course_code}')">Delete</button>
                    </td>
                </tr>
            `;
        });
        html += '</tbody></table></div>';
        area.innerHTML = html;
    } catch (e) {
        area.innerHTML = `<div class="empty-state text-danger">${e.message}</div>`;
    }
}

async function submitCourse(e) {
    e.preventDefault();
    const alertBox = document.getElementById('courseAlert');
    const btn = document.getElementById('saveCourseBtn');
    
    const payload = {
        course_code: document.getElementById('c_code').value,
        course_name: document.getElementById('c_name').value
    };

    try {
        btn.classList.add('btn-loading');
        await apiCall('/courses', 'POST', payload);
        courseModal.hide();
        document.getElementById('courseForm').reset();
        showToast('Course added successfully.');
        loadCourses();
    } catch (err) {
        alertBox.className = 'alert alert-danger small';
        alertBox.textContent = err.message;
        alertBox.classList.remove('d-none');
    } finally {
        btn.classList.remove('btn-loading');
    }
}

function deleteCourse(id, code) {
    document.getElementById('confirmTitle').textContent = 'Delete Course';
    document.getElementById('confirmMessage').textContent = `Are you sure you want to delete ${code}? This action will cascade and remove related assignments and feedback.`;
    
    pendingConfirmAction = async () => {
        try {
            await apiCall(`/courses/${id}`, 'DELETE');
            showToast('Course deleted successfully.', 'success');
            loadCourses();
        } catch (e) {
            showToast(e.message, 'danger');
        }
    };
    confirmModal.show();
}

// ASSIGNMENTS
async function loadAssignments() {
    document.getElementById('pageTitle').textContent = 'Assignments & Enrollments';
    const area = document.getElementById('contentArea');
    area.innerHTML = '<div class="text-center p-5"><div class="spinner-border text-primary" role="status"></div></div>';

    try {
        if (globalUsers.length === 0) globalUsers = await apiCall('/users');
        if (globalCourses.length === 0) globalCourses = await apiCall('/courses');

        const [facultyAssignments, studentEnrollments] = await Promise.all([
            apiCall('/assignments/faculty'),
            apiCall('/assignments/student')
        ]);

        let html = `
            <div class="row g-5">
                <div class="col-md-6">
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <h5 class="m-0">Faculty Assignments</h5>
                        <button class="btn btn-sm btn-primary" onclick="openAssignFacultyModal()">+ Assign Faculty</button>
                    </div>
                    <div class="table-wrapper">
                        <table class="table table-hover">
                            <thead><tr><th>Faculty</th><th>Course</th><th></th></tr></thead>
                            <tbody>
        `;
        if (facultyAssignments.length === 0) {
            html += `<tr><td colspan="3" class="text-center text-muted p-4">No assignments yet.</td></tr>`;
        }
        facultyAssignments.forEach(fa => {
            html += `<tr>
                <td class="fw-medium">${fa.faculty_name}</td>
                <td><span class="text-muted small">${fa.course_code}</span><br>${fa.course_name}</td>
                <td class="text-end"><button class="btn btn-sm text-danger border-0" onclick="removeFacultyAssignment(${fa.faculty_id}, ${fa.course_id})">Remove</button></td>
            </tr>`;
        });
        html += `</tbody></table></div></div>`;

        html += `
                <div class="col-md-6">
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <h5 class="m-0">Student Enrollments</h5>
                        <button class="btn btn-sm btn-primary" onclick="openEnrollStudentModal()">+ Enroll Student</button>
                    </div>
                    <div class="table-wrapper">
                        <table class="table table-hover">
                            <thead><tr><th>Student</th><th>Course</th><th></th></tr></thead>
                            <tbody>
        `;
        if (studentEnrollments.length === 0) {
            html += `<tr><td colspan="3" class="text-center text-muted p-4">No enrollments yet.</td></tr>`;
        }
        studentEnrollments.forEach(se => {
            html += `<tr>
                <td class="fw-medium">${se.student_name}</td>
                <td><span class="text-muted small">${se.course_code}</span><br>${se.course_name}</td>
                <td class="text-end"><button class="btn btn-sm text-danger border-0" onclick="removeStudentEnrollment(${se.student_id}, ${se.course_id})">Remove</button></td>
            </tr>`;
        });
        html += `</tbody></table></div></div></div>`;

        area.innerHTML = html;
    } catch (e) {
        area.innerHTML = `<div class="empty-state text-danger">${e.message}</div>`;
    }
}

function populateSelect(selectId, items, valueField, textField) {
    const sel = document.getElementById(selectId);
    sel.innerHTML = '<option value="">Select...</option>';
    items.forEach(i => {
        const opt = document.createElement('option');
        opt.value = i[valueField];
        opt.textContent = i[textField];
        sel.appendChild(opt);
    });
}

function openAssignFacultyModal() {
    populateSelect('af_faculty', globalUsers.filter(u => u.role === 'faculty' && u.is_active), 'id', 'name');
    populateSelect('af_course', globalCourses, 'id', 'course_name');
    assignFacultyModal.show();
}

function openEnrollStudentModal() {
    populateSelect('es_student', globalUsers.filter(u => u.role === 'student' && u.is_active), 'id', 'name');
    populateSelect('es_course', globalCourses, 'id', 'course_name');
    enrollStudentModal.show();
}

async function submitFacultyAssignment(e) {
    e.preventDefault();
    const btn = document.getElementById('assignFacultyBtn');
    const payload = {
        faculty_id: document.getElementById('af_faculty').value,
        course_id: document.getElementById('af_course').value
    };
    try {
        btn.classList.add('btn-loading');
        await apiCall('/assignments/faculty', 'POST', payload);
        assignFacultyModal.hide();
        showToast('Faculty assigned successfully.');
        loadAssignments();
    } catch (err) {
        document.getElementById('assignFacultyAlert').className = 'alert alert-danger small';
        document.getElementById('assignFacultyAlert').textContent = err.message;
        document.getElementById('assignFacultyAlert').classList.remove('d-none');
    } finally {
        btn.classList.remove('btn-loading');
    }
}

function removeFacultyAssignment(facultyId, courseId) {
    document.getElementById('confirmTitle').textContent = 'Remove Assignment';
    document.getElementById('confirmMessage').textContent = `Are you sure you want to remove this faculty assignment?`;
    
    pendingConfirmAction = async () => {
        try {
            await apiCall(`/assignments/faculty/${facultyId}/${courseId}`, 'DELETE');
            showToast('Assignment removed successfully.', 'success');
            loadAssignments();
        } catch (e) {
            showToast(e.message, 'danger');
        }
    };
    confirmModal.show();
}

async function submitStudentEnrollment(e) {
    e.preventDefault();
    const btn = document.getElementById('enrollStudentBtn');
    const payload = {
        student_id: document.getElementById('es_student').value,
        course_id: document.getElementById('es_course').value
    };
    try {
        btn.classList.add('btn-loading');
        await apiCall('/assignments/student', 'POST', payload);
        enrollStudentModal.hide();
        showToast('Student enrolled successfully.');
        loadAssignments();
    } catch (err) {
        document.getElementById('enrollStudentAlert').className = 'alert alert-danger small';
        document.getElementById('enrollStudentAlert').textContent = err.message;
        document.getElementById('enrollStudentAlert').classList.remove('d-none');
    } finally {
        btn.classList.remove('btn-loading');
    }
}

function removeStudentEnrollment(studentId, courseId) {
    document.getElementById('confirmTitle').textContent = 'Remove Enrollment';
    document.getElementById('confirmMessage').textContent = `Are you sure you want to remove this student enrollment?`;
    
    pendingConfirmAction = async () => {
        try {
            await apiCall(`/assignments/student/${studentId}/${courseId}`, 'DELETE');
            showToast('Enrollment removed successfully.', 'success');
            loadAssignments();
        } catch (e) {
            showToast(e.message, 'danger');
        }
    };
    confirmModal.show();
}

// STATS
let statsChartInstance = null;
async function loadStats() {
    document.getElementById('pageTitle').textContent = 'Global Feedback Statistics';
    const area = document.getElementById('contentArea');
    area.innerHTML = '<div class="text-center p-5"><div class="spinner-border text-primary" role="status"></div></div>';
    
    try {
        const stats = await apiCall('/feedback/stats');
        
        if (stats.length === 0) {
            area.innerHTML = `
                <div class="empty-state">
                    <i class="bi bi-bar-chart"></i>
                    <h5>No Statistics Available</h5>
                    <p>There are no feedback submissions to analyze yet.</p>
                </div>
            `;
            return;
        }

        let html = `
            <div class="card p-4 mb-4 border-0">
                <canvas id="adminStatsChart" width="400" height="120"></canvas>
            </div>
            <div class="table-wrapper">
                <table class="table table-hover">
                    <thead><tr><th>Course</th><th>Faculty</th><th>Responses</th><th>Teaching</th><th>Communication</th><th>Overall</th></tr></thead>
                    <tbody>
        `;
        
        const labels = [];
        const teachingData = [];
        const commData = [];
        const overallData = [];

        stats.forEach(s => {
            const label = `${s.course_code}`;
            labels.push(label);
            teachingData.push(parseFloat(s.avg_teaching).toFixed(2));
            commData.push(parseFloat(s.avg_communication).toFixed(2));
            overallData.push(parseFloat(s.avg_overall).toFixed(2));

            html += `<tr>
                <td><span class="text-muted small">${s.course_code}</span><br>${s.course_name}</td>
                <td class="fw-medium">${s.faculty_name}</td>
                <td><span class="badge bg-secondary rounded-pill">${s.total_responses}</span></td>
                <td class="text-primary-accent fw-bold">${parseFloat(s.avg_teaching).toFixed(2)}</td>
                <td class="text-success fw-bold">${parseFloat(s.avg_communication).toFixed(2)}</td>
                <td class="text-primary fw-bold">${parseFloat(s.avg_overall).toFixed(2)}</td>
            </tr>`;
        });
        html += '</tbody></table></div>';
        
        area.innerHTML = html;

        if (statsChartInstance) statsChartInstance.destroy();
        const ctx = document.getElementById('adminStatsChart').getContext('2d');
        statsChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    { label: 'Teaching', data: teachingData, backgroundColor: 'rgba(79, 70, 229, 0.8)', borderRadius: 4 },
                    { label: 'Communication', data: commData, backgroundColor: 'rgba(16, 185, 129, 0.8)', borderRadius: 4 },
                    { label: 'Overall', data: overallData, backgroundColor: 'rgba(139, 92, 246, 0.8)', borderRadius: 4 }
                ]
            },
            options: { 
                responsive: true,
                plugins: {
                    legend: { position: 'top' }
                },
                scales: { 
                    y: { beginAtZero: true, max: 5 }
                } 
            }
        });

    } catch (e) {
        area.innerHTML = `<div class="empty-state text-danger">${e.message}</div>`;
    }
}
