document.getElementById('loginForm').addEventListener('submit', async function(event) {
    event.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch('http://localhost:3000/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
        });

        const result = await response.json();
        if (response.ok) {
            alert('Login successful!');
            localStorage.setItem('username', result.username); // Store the username in localStorage

            // Check if the user has completed their profile
            const profileResponse = await fetch(`http://localhost:3000/profile/${result.username}`);
            const profileResult = await profileResponse.json();
            if (profileResponse.ok && profileResult.profileComplete) {
                window.location.href = '../home/index.html'; // Redirect to home page if profile is complete
            } else {
                window.location.href = '../html/completeProfile.html'; // Redirect to profile completion page
            }
        } else {
            alert('Login failed: ' + result.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Login failed');
    }
});
