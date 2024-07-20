document.getElementById('loginForm').addEventListener('submit', async function(event) {
    event.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch('https://task-management-backend-6ezu.onrender.com/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
        });

        if (!response.ok) {
            throw new Error('Login failed');
        }

        const result = await response.json();

        localStorage.setItem('token', result.token);

        window.location.href = './home/home.html';
    } catch (error) {
        console.error('Error:', error);
        alert('Login failed');
    }
});
