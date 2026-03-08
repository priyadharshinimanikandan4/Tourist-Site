// server.js
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');

const app = express();
const port = 3000;

// Enable CORS and JSON body parsing
app.use(cors());
app.use(express.json());

// Connect to or create a new database file
const db = new sqlite3.Database('users.db', (err) => {
    if (err) {
        console.error(err.message);
    }
    console.log('Connected to the SQLite database.');
});

// Create the users table if it doesn't exist
db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    password TEXT
)`);

// Endpoint for user signup
app.post('/signup', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
    }

    // Insert user into the database
    db.run(`INSERT INTO users (email, password) VALUES (?, ?)`, [email, password], function(err) {
        if (err) {
            return res.status(409).json({ error: 'Email already exists.' });
        }
        res.status(201).json({ message: 'User created successfully.', userId: this.lastID });
    });
});

// Endpoint for user login
app.post('/login', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
    }

    // Find user by email and check password
    db.get(`SELECT * FROM users WHERE email = ?`, [email], (err, row) => {
        if (err) {
            return res.status(500).json({ error: 'An error occurred.' });
        }
        if (!row || row.password !== password) {
            return res.status(401).json({ error: 'Invalid email or password.' });
        }
        res.status(200).json({ message: 'Login successful!', user: { id: row.id, email: row.email } });
    });
});

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});