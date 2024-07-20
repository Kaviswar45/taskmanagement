document.getElementById('resetPasswordForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const newPassword = document.getElementById('newPassword').value;

    try {
        const response = await fetch('https://task-management-backend-6ezu.onrender.com/reset-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, email, newPassword }),
        });

        const data = await response.json();

        if (data.status === 'success') {
            alert('Password reset successful');
            window.location.href = './index.html';
        } else {
            alert(data.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred while resetting your password. Please try again later.');
    }
});
