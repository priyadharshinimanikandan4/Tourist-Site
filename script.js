// server.js
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bcrypt = require('bcrypt'); // Import the bcrypt library

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
// The 'password' column is now a TEXT field for storing the hash
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

    // Hash the password before storing it
    bcrypt.hash(password, 10, (err, hash) => { // The '10' is the salt rounds
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Password hashing failed.' });
        }

        // Insert user with the hashed password into the database
        db.run(`INSERT INTO users (email, password) VALUES (?, ?)`, [email, hash], function(err) {
            if (err) {
                // This handles a unique constraint violation (email already exists)
                if (err.message.includes('UNIQUE constraint failed')) {
                    return res.status(409).json({ error: 'Email already exists.' });
                }
                console.error(err);
                return res.status(500).json({ error: 'An error occurred during signup.' });
            }
            res.status(201).json({ message: 'User created successfully.', userId: this.lastID });
        });
    });
});

// Endpoint for user login
app.post('/login', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
    }

    // Find the user by email
    db.get(`SELECT * FROM users WHERE email = ?`, [email], (err, row) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'An error occurred.' });
        }
        if (!row) {
            // No user found with that email
            return res.status(401).json({ error: 'Invalid email or password.' });
        }

        // Compare the submitted password with the stored hash
        bcrypt.compare(password, row.password, (err, isMatch) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: 'Authentication failed.' });
            }
            if (isMatch) {
                // Passwords match!
                res.status(200).json({ message: 'Login successful!', user: { id: row.id, email: row.email } });
            } else {
                // Passwords don't match
                res.status(401).json({ error: 'Invalid email or password.' });
            }
        });
    });
});

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});