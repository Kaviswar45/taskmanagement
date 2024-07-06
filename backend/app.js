const express = require('express');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const cors = require('cors');
const bcrypt = require('bcrypt');
const cookieParser = require('cookie-parser');
const { createTokens, validateToken } = require('./JWT'); // Make sure the path and filename are correct
require('dotenv').config();

const app = express();
const PORT = 3000;

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'schedule_management',
    password: '9843045567',
    port: 5432,
});

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());



app.post('/register', async (req, res) => {
    const { username, email, password } = req.body;

    try {
        const checkQuery = 'SELECT * FROM Users WHERE username = $1';
        const checkResult = await pool.query(checkQuery, [username]);

        if (checkResult.rows.length > 0) {
            return res.status(400).json({
                status: 'error',
                message: 'Username already taken',
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const query = 'INSERT INTO Users (username, password, email) VALUES ($1, $2, $3) RETURNING *';
        const values = [username, hashedPassword, email];
        const result = await pool.query(query, values);

        res.status(201).json({
            status: 'success',
            message: 'Registration successful',
            redirectTo: '../html/login.html'
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            status: 'error',
            message: 'Internal Server Error',
        });
    }
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const query = 'SELECT * FROM Users WHERE username = $1';
        const values = [username];
        const result = await pool.query(query, values);

        if (result.rows.length === 0) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid username or password',
            });
        }

        const user = result.rows[0];
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid username or password',
            });
        }

        const accessToken = createTokens(user);
        res.cookie("access-token", accessToken, {
            maxAge: 60 * 60 * 24 * 30 * 1000, // 30 days
            httpOnly: true,
        });

        res.status(200).json({
            status: 'success',
            message: 'Login successful',
            username: user.username, // Include the username in the response
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            status: 'error',
            message: 'Internal Server Error',
        });
    }
});

app.get('/profile/:username', async (req, res) => {
    const { username } = req.params;

    try {
        const query = 'SELECT * FROM UserProfile WHERE username = $1';
        const values = [username];
        const result = await pool.query(query, values);

        if (result.rows.length === 0) {
            return res.status(200).json({ profileComplete: false });
        }

        res.status(200).json({ profileComplete: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            status: 'error',
            message: 'Internal Server Error',
        });
    }
});

app.post('/update-profile', async (req, res) => {
    const { username, first_name, last_name, date_of_birth, email } = req.body;

    if (!username || !first_name || !last_name || !date_of_birth || !email) {
        return res.status(400).json({
            status: 'error',
            message: 'Missing required fields',
        });
    }

    try {
        const query = `
            INSERT INTO UserProfile (username, first_name, last_name, date_of_birth, email)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (username) DO UPDATE
            SET first_name = $2, last_name = $3, date_of_birth = $4, email = $5, updated_at = CURRENT_TIMESTAMP
            RETURNING *;
        `;
        const values = [username, first_name, last_name, date_of_birth, email];
        const result = await pool.query(query, values);

        if (result.rows.length === 0) {
            return res.status(400).json({
                status: 'error',
                message: 'Failed to update profile',
            });
        }

        res.status(200).json({
            status: 'success',
            message: 'Profile updated successfully',
            profile: result.rows[0],
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            status: 'error',
            message: 'Internal Server Error',
        });
    }
});


app.post('/reset-password', async (req, res) => {
    const { username, newPassword } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        const query = 'UPDATE Users SET password = $1 WHERE username = $2 RETURNING *';
        const values = [hashedPassword, username];
        const result = await pool.query(query, values);

        if (result.rows.length === 0) {
            return res.status(400).json({
                status: 'error',
                message: 'Username not found',
            });
        }

        res.status(200).json({
            status: 'success',
            message: 'Password reset successful',
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            status: 'error',
            message: 'Internal Server Error',
        });
    }
});

// Get user details
app.get('/api/user-details', async (req, res) => {
    const { username } = req.query;

    try {
        const query = 'SELECT * FROM UserProfile WHERE username = $1';
        const result = await pool.query(query, [username]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'User details not found' });
        }

        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching user details:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Update user details
app.put('/api/update-user-details', async (req, res) => {
    const { username, email, first_name, last_name, date_of_birth } = req.body;

    try {
        const query = `
            INSERT INTO UserProfile (username, email, first_name, last_name, date_of_birth, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            ON CONFLICT (username) DO UPDATE
            SET email = $2, first_name = $3, last_name = $4, date_of_birth = $5, updated_at = CURRENT_TIMESTAMP
            RETURNING *;
        `;

        const values = [username, email, first_name, last_name, date_of_birth];
        const result = await pool.query(query, values);

        if (result.rows.length === 0) {
            return res.status(400).json({ message: 'Failed to update user details' });
        }

        res.status(200).json({ message: 'User details updated successfully', user: result.rows[0] });
    } catch (error) {
        console.error('Error updating user details:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});



// Task creation endpoint
app.post('/api/create-task', async (req, res) => {
    const { username, title, description, due_date, category, priority, recurrence } = req.body;

    try {
        const query = `
            INSERT INTO tasks (username, title, description, due_date, category, priority, recurrence)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *;
        `;
        const values = [username, title, description, due_date, category, priority, recurrence];
        const result = await pool.query(query, values);

        res.status(201).json({
            status: 'success',
            message: 'Task created successfully',
            task: result.rows[0],
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            status: 'error',
            message: 'Internal Server Error',
        });
    }
});

// Retrieve tasks endpoint

app.get('/api/tasks', async (req, res) => {
    const { username, category, priority } = req.query;

    let query = 'SELECT * FROM Tasks WHERE username = $1';
    const queryParams = [username];

    if (category && category !== 'all') {
        query += ' AND category = $2';
        queryParams.push(category);
    }

    if (priority && priority !== 'all') {
        query += ' AND priority = $3';
        queryParams.push(priority);
    }

    try {
        const result = await pool.query(query, queryParams);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching tasks:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


// Delete task endpoint
app.delete('/api/delete-task/:task_id', async (req, res) => {
    const { task_id } = req.params;

    try {
        const query = 'DELETE FROM tasks WHERE task_id = $1 RETURNING *';
        const values = [task_id];
        const result = await pool.query(query, values);

        if (result.rows.length === 0) {
            return res.status(404).json({
                status: 'error',
                message: 'Task not found',
            });
        }

        res.status(200).json({
            status: 'success',
            message: 'Task deleted successfully',
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            status: 'error',
            message: 'Internal Server Error',
        });
    }
});





app.get('/protected', validateToken, (req, res) => {
    res.json({
        status: 'success',
        message: 'This is a protected route',
    });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
