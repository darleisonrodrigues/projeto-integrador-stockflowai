async function testToggle() {
    try {
        const uniqueEmailAdmin = `admin${Date.now()}@example.com`;

        // 1. Register as Admin (Auto-Admin enabled)
        console.log('Registering new admin...');
        const regRes = await fetch('http://localhost:3000/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'Admin Temp', email: uniqueEmailAdmin, password: 'password123' })
        });
        const regData = await regRes.json();
        if (!regRes.ok) throw new Error(JSON.stringify(regData));
        const token = regData.token;
        console.log('Registered and Logged in.');

        // 2. Create a dummy user to toggle
        console.log('Creating dummy user...');
        const uniqueEmailUser = `user${Date.now()}@example.com`;
        const userRes = await fetch('http://localhost:3000/users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                name: 'Test User',
                email: uniqueEmailUser,
                password: 'password123',
                role: 'EMPLOYEE'
            })
        });
        const userData = await userRes.json();
        if (!userRes.ok) throw new Error(JSON.stringify(userData));
        const userId = userData.id;
        console.log(`User created: ${userId}`);

        // 3. Toggle Active Status
        console.log('Toggling active status to false...');
        const toggleRes = await fetch(`http://localhost:3000/users/${userId}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ active: false })
        });
        const toggleData = await toggleRes.json();
        console.log('Status:', toggleRes.status);
        console.log('Response:', toggleData);

        if (!toggleRes.ok) {
            console.error("FAILED TO TOGGLE");
        }

    } catch (e) {
        console.error(e);
    }
}
testToggle();
