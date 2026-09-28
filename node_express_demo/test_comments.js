async function testComments() {
    try {
        console.log("1. Logging in as Admin...");
        const loginRes = await fetch('http://localhost:4000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'admin', password: 'admin123' })
        });
        const loginData = await loginRes.json();
        const adminToken = loginData.accessToken;
        
        console.log("2. Verifying the /comments endpoint...");
        const commentsRes = await fetch('http://localhost:4000/api/feedback/comments', {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        const commentsData = await commentsRes.json();
        
        console.log("Returned comments array length:", commentsData.length);
        if (commentsData.length > 0) {
            console.log("Sample comment object:", JSON.stringify(commentsData[0], null, 2));
            if (commentsData[0].student_id || commentsData[0].student_name) {
                console.error("FAIL: Identity leaked!");
            } else {
                console.log("PASS: Student identity remains hidden.");
            }
        }
        
    } catch (e) {
        console.error("Test Error:", e);
    }
}
testComments();
