document.getElementById('registerForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const full_name = document.getElementById('full_name').value;
    const dob = document.getElementById('dob').value;

    try {
        const response = await fetch('https://task-management-backend-6ezu.onrender.com/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, email, password, full_name, dob })
        });

        const data = await response.json();

        if (data.status === 'success') {
            window.location.href = './index.html';
        } else {
            alert(data.message); // Show the error message if registration fails
        }
    } catch (err) {
        console.error('Error:', err);
        alert('An error occurred. Please try again.');
    }
});
