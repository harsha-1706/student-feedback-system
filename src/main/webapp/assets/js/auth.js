document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const errorAlert = document.getElementById('errorAlert');

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            
            try {
                const data = await apiCall('/auth/login', 'POST', { username, password });
                
                // Save to localStorage
                localStorage.setItem('token', data.accessToken);
                localStorage.setItem('user', JSON.stringify({
                    id: data.id,
                    username: data.username,
                    name: data.name,
                    role: data.role
                }));
                
                // Redirect based on role
                if (data.role === 'admin') {
                    window.location.href = 'admin/dashboard.html';
                } else if (data.role === 'faculty') {
                    window.location.href = 'faculty/dashboard.html';
                } else if (data.role === 'student') {
                    window.location.href = 'student/dashboard.html';
                }
                
            } catch (error) {
                errorAlert.textContent = error.message;
                errorAlert.classList.remove('d-none');
                const btn = document.getElementById('loginBtn');
                if (btn) btn.classList.remove('btn-loading');
            }
        });
    }

    // Auto-redirect if already logged in
    const user = JSON.parse(localStorage.getItem('user'));
    if (user && window.location.pathname.endsWith('index.html')) {
        if (user.role === 'admin') window.location.href = 'admin/dashboard.html';
        else if (user.role === 'faculty') window.location.href = 'faculty/dashboard.html';
        else if (user.role === 'student') window.location.href = 'student/dashboard.html';
    }
});

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '../index.html'; // Assuming logout is called from a subdirectory
}
