const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
require("dotenv").config();
const pool = require("./db");

const app = express();
app.use(cors());
app.use(express.json());

// Helper function for audit logging
async function logEvent(eventType, voterId, details) {
  try {
    await pool.query(
      "INSERT INTO audit_log (event_type, voter_id, details) VALUES (?, ?, ?)",
      [eventType, voterId || null, details || null]
    );
  } catch (err) {
    console.error("Audit log error:", err);
  }
}

// 1. Voter Registration
app.post("/api/register", async (req, res) => {
  const { rollNumber, name, email } = req.body;
  if (!rollNumber || !name || !email) {
    return res.status(400).json({ error: "rollNumber, name, and email are required" });
  }
  try {
    const [existing] = await pool.query(
      "SELECT id FROM voters WHERE roll_number = ? OR email = ?",
      [rollNumber, email]
    );
    if (existing.length > 0) {
      return res.status(409).json({ error: "Voter already registered" });
    }
    const [result] = await pool.query(
      "INSERT INTO voters (roll_number, name, email) VALUES (?, ?, ?)",
      [rollNumber, name, email]
    );
    await logEvent("REGISTER", result.insertId, `${name} registered`);
    res.json({ voterId: result.insertId, message: "Registered successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. OTP Generation
app.post("/api/send-otp", async (req, res) => {
  const { email } = req.body;
  try {
    const [voters] = await pool.query("SELECT id FROM voters WHERE email = ?", [email]);
    if (voters.length === 0) return res.status(404).json({ error: "Voter not found" });
    const voterId = voters[0].id;

    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await pool.query(
      "INSERT INTO otp_requests (voter_id, otp_code, expires_at) VALUES (?, ?, ?)",
      [voterId, otp, expiresAt]
    );
    await logEvent("OTP_SENT", voterId, "OTP generated");

    console.log(`[DEMO] OTP for ${email}: ${otp}`);
    res.json({ message: "OTP sent", demoOtp: otp });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. OTP Verification
app.post("/api/verify-otp", async (req, res) => {
  const { email, otp } = req.body;
  try {
    const [voters] = await pool.query("SELECT id FROM voters WHERE email = ?", [email]);
    if (voters.length === 0) return res.status(404).json({ error: "Voter not found" });
    const voterId = voters[0].id;

    const [rows] = await pool.query(
      `SELECT * FROM otp_requests
       WHERE voter_id = ? AND otp_code = ? AND consumed = FALSE AND expires_at > NOW()
       ORDER BY id DESC LIMIT 1`,
      [voterId, otp]
    );
    if (rows.length === 0) {
      return res.status(401).json({ error: "Invalid or expired OTP" });
    }

    await pool.query("UPDATE otp_requests SET consumed = TRUE WHERE id = ?", [rows[0].id]);
    await pool.query("UPDATE voters SET is_verified = TRUE WHERE id = ?", [voterId]);
    await logEvent("OTP_VERIFIED", voterId, "Voter verified");

    res.json({ voterId, message: "OTP verified — you can now vote" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Candidate List
app.get("/api/candidates", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT id, name, party FROM candidates");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Vote Casting
app.post("/api/vote", async (req, res) => {
  const { email, candidateId } = req.body;
  try {
    const [voters] = await pool.query(
      "SELECT id, is_verified, has_voted FROM voters WHERE email = ?",
      [email]
    );
    if (voters.length === 0) return res.status(404).json({ error: "Voter not found" });
    const voter = voters[0];

    if (!voter.is_verified) return res.status(403).json({ error: "Voter not OTP-verified" });
    if (voter.has_voted) return res.status(409).json({ error: "Voter has already voted" });

    const voteHash = crypto
      .createHash("sha256")
      .update(`${voter.id}-${candidateId}-${Date.now()}`)
      .digest("hex");

    await pool.query(
      "INSERT INTO votes (voter_id, candidate_id, vote_hash) VALUES (?, ?, ?)",
      [voter.id, candidateId, voteHash]
    );
    await pool.query("UPDATE voters SET has_voted = TRUE WHERE id = ?", [voter.id]);
    await logEvent("VOTE_CAST", voter.id, "Vote cast (hashed)");

    res.json({ message: "Vote cast successfully", voteHash });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));