# Online Voting System — Full Stack (React + Node/Express + MySQL)

This is a working full-stack app: React frontend, Express backend, MySQL database,
all wired together. Verified end-to-end before packaging — register → OTP → vote →
live results all work against a real database.

## What's inside
```
voting-system/
├── backend/
│   ├── schema.sql       ← run this first to create tables + seed candidates
│   ├── server.js        ← Express API (7 routes)
│   ├── db.js            ← MySQL connection pool
│   ├── .env              ← DB credentials (edit if yours differ)
│   └── package.json
└── frontend/
    ├── src/
    │   ├── App.jsx        ← full UI: register → OTP → vote → live dashboard
    │   ├── api.js         ← talks to the backend
    │   └── index.css
    ├── .env               ← points frontend at the backend URL
    └── package.json
```

## Setup — run this before the review

### 1. Make sure MySQL is running locally
If you already have MySQL/MariaDB installed and running, skip to step 2.

Otherwise install it:
```bash
# Windows: install MySQL from mysql.com, or use XAMPP/WAMP
# Mac:     brew install mysql && brew services start mysql
# Linux:   sudo apt install mariadb-server && sudo service mariadb start
```

### 2. Create the database and load the schema
```bash
mysql -u root -p -e "CREATE DATABASE voting_system;"
mysql -u root -p voting_system < backend/schema.sql
```
This creates 5 tables (`voters`, `otp_requests`, `candidates`, `votes`, `audit_log`)
and seeds 3 candidates so the demo has something to vote on immediately.

### 3. Set your DB credentials
Two options — pick whichever is faster:

**Option A — use the packaged demo user (matches `backend/.env` as shipped):**
```bash
mysql -u root -p -e "
CREATE USER IF NOT EXISTS 'voting_user'@'localhost' IDENTIFIED BY 'votingpass123';
GRANT ALL PRIVILEGES ON voting_system.* TO 'voting_user'@'localhost';
FLUSH PRIVILEGES;"
```
Nothing else to change — `backend/.env` already points at this user.

**Option B — just use your own root account:**
Open `backend/.env` and edit:
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_root_password
DB_NAME=voting_system
PORT=5000
```

### 4. Install dependencies and start the backend
```bash
cd backend
npm install
node server.js
```
You should see: `Backend running on http://localhost:5000`

Leave this terminal running. Open a **new terminal** for the frontend.

### 5. Install dependencies and start the frontend
```bash
cd frontend
npm install
npm run dev
```
Open the URL it prints (usually `http://localhost:5173`).

## Demo flow for the review
1. Register with any roll number, name, and email
2. The OTP is shown directly on screen in an orange "Demo mode" banner —
   **be upfront about this if asked**: no real SMS/email gateway is wired up,
   so the OTP is displayed in-app instead of being texted. The OTP generation,
   expiry, and verification logic itself is fully real and working.
3. Enter the OTP → you're verified → pick a candidate → cast your vote
4. Watch the **Live Turnout** and **Results** panels on the right update
   immediately — this is pulling straight from MySQL, refreshing every 4 seconds
5. Click **"Show audit log"** to show every event (register, OTP sent, OTP
   verified, vote cast) being logged with timestamps — this is your answer if
   asked about auditability

## If something doesn't connect
- "Backend unreachable" badge → the backend isn't running, or MySQL isn't running.
  Check the backend terminal for errors — usually a wrong DB password in `.env`.
- CORS errors in browser console → make sure `frontend/.env`'s `VITE_API_URL`
  matches wherever the backend is actually running (default: `http://localhost:5000`).
- "Voter already registered" → someone already used that roll number/email —
  either delete rows from the `voters` table or just use a new email.

## To reset the demo data between practice runs
```bash
mysql -u root -p voting_system -e "DELETE FROM votes; DELETE FROM otp_requests; DELETE FROM audit_log; DELETE FROM voters;"
```
