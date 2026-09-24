const API_BASE_URL = 'http://localhost:4000/api';

function getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
}

async function apiCall(endpoint, method = 'GET', body = null) {
    const options = {
        method,
        headers: getAuthHeaders(),
    };
    if (body) {
        options.body = JSON.stringify(body);
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
        const data = await response.json().catch(() => ({}));
        
        if (!response.ok) {
            // Handle unauthorized globally
            if (response.status === 401 || response.status === 403) {
                if (endpoint !== '/auth/login') {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    window.location.href = '/frontend/index.html';
                }
            }
            throw new Error(data.message || 'Something went wrong');
        }
        return data;
    } catch (error) {
        throw error;
    }
}
