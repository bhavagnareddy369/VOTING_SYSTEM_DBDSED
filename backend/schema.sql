-- Online Voting System with OTP Verification — Schema
-- Run this once against the voting_system database before starting the backend.

CREATE TABLE IF NOT EXISTS voters (
  id INT AUTO_INCREMENT PRIMARY KEY,
  roll_number VARCHAR(30) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  is_verified BOOLEAN DEFAULT FALSE,
  has_voted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS otp_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  voter_id INT NOT NULL,
  otp_code VARCHAR(6) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  consumed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (voter_id) REFERENCES voters(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS candidates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  party VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS votes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  voter_id INT NOT NULL UNIQUE,          -- UNIQUE enforces one vote per voter at the DB level
  candidate_id INT NOT NULL,
  vote_hash VARCHAR(64) NOT NULL,         -- SHA-256 hash, so the choice itself is never stored in plain text
  cast_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (voter_id) REFERENCES voters(id) ON DELETE CASCADE,
  FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS audit_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  event_type VARCHAR(50) NOT NULL,        -- REGISTER, OTP_SENT, OTP_VERIFIED, VOTE_CAST, RESULT_VIEWED
  voter_id INT,
  details VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed candidates so the demo has something to vote on immediately
INSERT INTO candidates (name, party) VALUES
  ('Aditi Rao', 'Progress Panel'),
  ('Kabir Shah', 'Unity Front'),
  ('Meera Iyer', 'Student Voice');
