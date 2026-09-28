const jwt = require('jsonwebtoken');
require('dotenv').config();

async function runTest() {
    const secret = process.env.JWT_SECRET;
    
    // Generate tokens
    const adminToken = jwt.sign({ id: 1, role: 'admin' }, secret, { expiresIn: 86400 });
    const facultyToken = jwt.sign({ id: 2, role: 'faculty' }, secret, { expiresIn: 86400 });
    const studentToken = jwt.sign({ id: 3, role: 'student' }, secret, { expiresIn: 86400 });

    const API_URL = 'http://localhost:4000/api';

    async function testEndpoint(role, token, method, endpoint) {
        const res = await fetch(API_URL + endpoint, {
            method,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: method === 'POST' ? JSON.stringify({}) : undefined // dummy body for POST
        });
        const data = await res.json().catch(() => null);
        console.log(`[${role.toUpperCase()}] ${method} ${endpoint}`);
        console.log(` -> Status: ${res.status}`);
        console.log(` -> Result: ${data ? data.message || (Array.isArray(data) ? 'Data Array' : 'Data Object') : 'Empty'}`);
    }

    console.log("=== 1 & 2. Student Restrictions ===");
    await testEndpoint('student', studentToken, 'GET', '/users');
    await testEndpoint('student', studentToken, 'POST', '/users');
    await testEndpoint('student', studentToken, 'POST', '/courses');

    console.log("\n=== 3 & 4. Faculty Restrictions ===");
    await testEndpoint('faculty', facultyToken, 'GET', '/users');
    await testEndpoint('faculty', facultyToken, 'POST', '/users');
    await testEndpoint('faculty', facultyToken, 'POST', '/courses');

    console.log("\n=== 5. Student Access to Student Endpoints ===");
    await testEndpoint('student', studentToken, 'GET', '/feedback/pending');
    await testEndpoint('student', studentToken, 'POST', '/feedback/submit'); // Expect 400 Validation Error, NOT 403

    console.log("\n=== 6. Faculty Access to Faculty Endpoints ===");
    await testEndpoint('faculty', facultyToken, 'GET', '/feedback/stats');
    await testEndpoint('faculty', facultyToken, 'GET', '/feedback/comments');
    
    console.log("\n=== Checking if Student is blocked from Stats/Comments ===");
    await testEndpoint('student', studentToken, 'GET', '/feedback/stats');
    await testEndpoint('student', studentToken, 'GET', '/feedback/comments');

    console.log("\n=== 7. Admin Access to Admin Endpoints ===");
    await testEndpoint('admin', adminToken, 'GET', '/users');
    await testEndpoint('admin', adminToken, 'GET', '/feedback/stats');
}

runTest();
