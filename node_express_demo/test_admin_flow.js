// Using native fetch in Node 24

async function runTests() {
    try {
        console.log("1. Logging in as Admin...");
        const loginRes = await fetch('http://localhost:4000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'admin', password: 'admin123' })
        });
        const loginData = await loginRes.json();
        if (!loginRes.ok) throw new Error("Login failed: " + JSON.stringify(loginData));
        const token = loginData.accessToken;
        console.log("   Success! Token received.");

        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };

        console.log("2. Creating Faculty User...");
        const facRes = await fetch('http://localhost:4000/api/users', {
            method: 'POST', headers,
            body: JSON.stringify({ username: 'fac1', password: 'password', role: 'faculty', name: 'Dr. Faculty' })
        });
        const facData = await facRes.json();
        console.log("   " + JSON.stringify(facData));
        const facId = facData.id || 2; // Rough guess if it fails due to existing

        console.log("3. Creating Student User...");
        const stuRes = await fetch('http://localhost:4000/api/users', {
            method: 'POST', headers,
            body: JSON.stringify({ username: 'stu1', password: 'password', role: 'student', name: 'John Student' })
        });
        const stuData = await stuRes.json();
        console.log("   " + JSON.stringify(stuData));
        const stuId = stuData.id || 3;

        console.log("4. Creating Course...");
        const crsRes = await fetch('http://localhost:4000/api/courses', {
            method: 'POST', headers,
            body: JSON.stringify({ course_code: 'CS101', course_name: 'Intro to CS' })
        });
        const crsData = await crsRes.json();
        console.log("   " + JSON.stringify(crsData));
        const crsId = crsData.id || 1;

        console.log("5. Assigning Faculty...");
        const afRes = await fetch('http://localhost:4000/api/assignments/faculty', {
            method: 'POST', headers,
            body: JSON.stringify({ faculty_id: facId, course_id: crsId })
        });
        console.log("   " + JSON.stringify(await afRes.json()));

        console.log("6. Enrolling Student...");
        const asRes = await fetch('http://localhost:4000/api/assignments/student', {
            method: 'POST', headers,
            body: JSON.stringify({ student_id: stuId, course_id: crsId })
        });
        console.log("   " + JSON.stringify(await asRes.json()));

        console.log("7. Checking Stats...");
        const statsRes = await fetch('http://localhost:4000/api/feedback/stats', {
            method: 'GET', headers
        });
        console.log("   " + JSON.stringify(await statsRes.json()));

        console.log("Tests complete!");
    } catch (e) {
        console.error("Test Error:", e);
    }
}

runTests();
