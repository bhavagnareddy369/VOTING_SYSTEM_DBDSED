import React, { useEffect, useState } from "react";

const API_BASE = "http://localhost:5000/api";

const theme = {
  burgundy: "#5A1F2B",
  wine: "#7A3040",
  cream: "#F8F3EA",
  gold: "#C9A96E",
  charcoal: "#242124",
  white: "#FFFFFF",
  cardBorder: "rgba(90, 31, 43, 0.12)",
  textMuted: "#6B6064",
};

const CATEGORIES = [
  { id: "college", label: "🎓 College / Council", accent: "#C45B6E" },
  { id: "sports", label: "🏆 Sports League", accent: "#C9A96E" },
  { id: "clubs", label: "🎨 Cultural & Clubs", accent: "#7B4B70" },
  { id: "events", label: "🎤 Events & Contests", accent: "#B85B43" },
  { id: "organizations", label: "🏢 Enterprise & Orgs", accent: "#5C7A68" },
];

export default function App() {
  const [role, setRole] = useState("voter");
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [rollNumber, setRollNumber] = useState("");
  const [name, setName] = useState("");
  const [otp, setOtp] = useState("");
  const [demoOtp, setDemoOtp] = useState("");
  const [voterId, setVoterId] = useState(null);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("college");
  const [voteReceipt, setVoteReceipt] = useState("");
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load candidates directly from MySQL on load
  useEffect(() => {
    fetchCandidates();
  }, []);

  const fetchCandidates = async () => {
    try {
      const res = await fetch(`${API_BASE}/candidates`);
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        setCandidates(data);
      }
    } catch (err) {
      console.error("Error fetching candidates:", err);
    }
  };

  // Step 1: Register Voter & Send OTP via Backend
  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // 1. Register voter
      let regRes = await fetch(`${API_BASE}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rollNumber, name, email }),
      });

      // If already registered, ignore 409 conflict and proceed to request OTP
      if (!regRes.ok && regRes.status !== 409) {
        const errData = await regRes.json();
        alert(errData.error || "Registration failed");
        setLoading(false);
        return;
      }

      // 2. Request OTP from backend (This prints to VS Code Terminal and inserts into MySQL)
      const otpRes = await fetch(`${API_BASE}/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const otpData = await otpRes.json();
      if (otpRes.ok) {
        setDemoOtp(otpData.demoOtp);
        setStep(2);
      } else {
        alert(otpData.error || "Failed to generate OTP");
      }
    } catch (err) {
      alert("Backend connection failed. Make sure 'node server.js' is running.");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Call Backend to Verify OTP in MySQL
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });
      const data = await res.json();
      if (res.ok) {
        setVoterId(data.voterId);
        setStep(3);
      } else {
        alert(data.error || "Invalid OTP code!");
      }
    } catch (err) {
      alert("Backend verification failed.");
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Call Backend to Cast Encrypted Vote
  const handleCastVote = async () => {
    if (!selectedCandidate) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, candidateId: selectedCandidate }),
      });
      const data = await res.json();
      if (res.ok) {
        setVoteReceipt(data.voteHash);
        setStep(4);
        fetchCandidates();
      } else {
        alert(data.error || "Failed to cast vote");
      }
    } catch (err) {
      alert("Failed to submit vote to backend.");
    } finally {
      setLoading(false);
    }
  };

  const totalVotes = candidates.reduce((acc, c) => acc + (c.votes || 0), 0);

  return (
    <div style={styles.page}>
      <header style={styles.navbar}>
        <div style={styles.brand}>
          <div style={styles.brandIcon}>🗳️</div>
          <div>
            <h1 style={styles.brandTitle}>AuraVote</h1>
            <p style={styles.brandSub}>Secure · Encrypted · Real-Time Platform</p>
          </div>
        </div>

        <div style={styles.roleToggleContainer}>
          <button
            onClick={() => setRole("voter")}
            style={{
              ...styles.roleBtn,
              background: role === "voter" ? theme.burgundy : "transparent",
              color: role === "voter" ? theme.cream : theme.charcoal,
            }}
          >
            👤 Voter Portal
          </button>
          <button
            onClick={() => setRole("admin")}
            style={{
              ...styles.roleBtn,
              background: role === "admin" ? theme.burgundy : "transparent",
              color: role === "admin" ? theme.cream : theme.charcoal,
            }}
          >
            🛡️ Admin Control
          </button>
        </div>
      </header>

      <div style={styles.categoryBar}>
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            style={{
              ...styles.categoryPill,
              borderColor: selectedCategory === cat.id ? cat.accent : "transparent",
              background: selectedCategory === cat.id ? cat.accent : "rgba(90, 31, 43, 0.05)",
              color: selectedCategory === cat.id ? theme.white : theme.charcoal,
            }}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <main style={styles.mainContainer}>
        {role === "voter" ? (
          <div style={styles.voterLayout}>
            <div style={styles.mainCard}>
              <div style={styles.cardHeader}>
                <span style={styles.badge}>Election Portal</span>
                <h2 style={styles.cardTitle}>Student Council Election 2026</h2>
              </div>

              {step === 1 && (
                <form onSubmit={handleRegister} style={styles.formStack}>
                  <h3 style={styles.stepTitle}>Step 1: Voter Identity Check</h3>
                  <label style={styles.label}>Roll Number / Student ID</label>
                  <input
                    style={styles.input}
                    placeholder="e.g. 21CS084"
                    value={rollNumber}
                    onChange={(e) => setRollNumber(e.target.value)}
                    required
                  />
                  <label style={styles.label}>Full Name</label>
                  <input
                    style={styles.input}
                    placeholder="e.g. Alex Morgan"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                  <label style={styles.label}>Email Address</label>
                  <input
                    style={styles.input}
                    type="email"
                    placeholder="alex@university.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  <button type="submit" disabled={loading} style={styles.primaryBtn}>
                    {loading ? "Connecting to Database..." : "Send Verification Code →"}
                  </button>
                </form>
              )}

              {step === 2 && (
                <form onSubmit={handleVerifyOtp} style={styles.formStack}>
                  <h3 style={styles.stepTitle}>Step 2: OTP Verification</h3>
                  <div style={styles.demoBanner}>
                    🔑 DEMO OTP SENT: <strong>{demoOtp}</strong> (Check VS Code Terminal too!)
                  </div>
                  <label style={styles.label}>Enter 6-Digit Code</label>
                  <input
                    style={styles.input}
                    placeholder="Enter code"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    required
                  />
                  <button type="submit" disabled={loading} style={styles.primaryBtn}>
                    {loading ? "Verifying..." : "Verify OTP & Proceed"}
                  </button>
                </form>
              )}

              {step === 3 && (
                <div style={styles.formStack}>
                  <h3 style={styles.stepTitle}>Step 3: Choose Candidate</h3>
                  <p style={styles.mutedText}>Select your preferred candidate:</p>
                  <div style={styles.candidateList}>
                    {candidates.map((c) => (
                      <div
                        key={c.id}
                        onClick={() => setSelectedCandidate(c.id)}
                        style={{
                          ...styles.candidateCard,
                          borderColor: selectedCandidate === c.id ? theme.burgundy : theme.cardBorder,
                          background: selectedCandidate === c.id ? "#F3ECE0" : theme.white,
                        }}
                      >
                        <div style={styles.candidateHeader}>
                          <strong>{c.name}</strong>
                          <span style={styles.partyTag}>{c.party}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button onClick={handleCastVote} disabled={loading} style={styles.primaryBtn}>
                    {loading ? "Encrypting Ballot..." : "Cast Encrypted Vote 🔒"}
                  </button>
                </div>
              )}

              {step === 4 && (
                <div style={styles.successBox}>
                  <div style={styles.successIcon}>🎉</div>
                  <h3 style={styles.stepTitle}>Ballot Successfully Cast!</h3>
                  <p style={styles.mutedText}>
                    Your vote has been cryptographically hashed and stored in MySQL.
                  </p>
                  <div style={styles.receiptCard}>
                    <span style={styles.receiptLabel}>Transaction Receipt Hash</span>
                    <code style={styles.receiptCode}>{voteReceipt}</code>
                  </div>
                </div>
              )}
            </div>

            <div style={styles.sideCard}>
              <h3 style={styles.sideTitle}>Candidate Manifesto</h3>
              {candidates.map((c) => (
                <div key={c.id} style={styles.miniCard}>
                  <strong style={{ color: theme.burgundy }}>{c.name}</strong>
                  <p style={styles.miniBio}>{c.party}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={styles.adminDashboard}>
            <div style={styles.statsGrid}>
              <div style={styles.statCard}>
                <span style={styles.statLabel}>Total Votes Cast</span>
                <span style={styles.statNum}>{totalVotes}</span>
              </div>
            </div>

            <div style={styles.adminSection}>
              <h3 style={styles.cardTitle}>Election Results (MySQL Dynamic Query)</h3>
              <div style={styles.resultsList}>
                {candidates.map((c) => (
                  <div key={c.id} style={styles.resultRow}>
                    <div style={styles.resultMeta}>
                      <strong>{c.name} ({c.party})</strong>
                      <span>{c.votes || 0} votes</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", backgroundColor: theme.cream, color: theme.charcoal, fontFamily: "'Inter', system-ui, sans-serif", padding: "24px 40px" },
  navbar: { display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "20px", borderBottom: `1px solid ${theme.cardBorder}` },
  brand: { display: "flex", alignItems: "center", gap: "12px" },
  brandIcon: { fontSize: "32px" },
  brandTitle: { margin: 0, fontSize: "24px", color: theme.burgundy, fontWeight: "700" },
  brandSub: { margin: 0, fontSize: "12px", color: theme.textMuted },
  roleToggleContainer: { display: "flex", background: "rgba(90, 31, 43, 0.08)", padding: "4px", borderRadius: "10px" },
  roleBtn: { padding: "8px 16px", border: "none", borderRadius: "8px", fontWeight: "600", cursor: "pointer", fontSize: "13px" },
  categoryBar: { display: "flex", gap: "10px", marginTop: "20px", overflowX: "auto", paddingBottom: "10px" },
  categoryPill: { padding: "8px 16px", borderRadius: "20px", border: "1px solid", fontWeight: "600", fontSize: "13px", cursor: "pointer" },
  mainContainer: { marginTop: "24px" },
  voterLayout: { display: "grid", gridTemplateColumns: "2fr 1fr", gap: "24px" },
  mainCard: { background: theme.white, border: `1px solid ${theme.cardBorder}`, borderRadius: "16px", padding: "28px" },
  cardHeader: { marginBottom: "20px" },
  badge: { fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: theme.gold, background: theme.burgundy, padding: "4px 10px", borderRadius: "6px" },
  cardTitle: { margin: "8px 0 0 0", fontSize: "22px", color: theme.burgundy },
  formStack: { display: "flex", flexDirection: "column", gap: "12px" },
  stepTitle: { fontSize: "16px", color: theme.burgundy, margin: 0 },
  label: { fontSize: "12px", fontWeight: "600", color: theme.textMuted },
  input: { padding: "12px", borderRadius: "8px", border: `1px solid ${theme.cardBorder}`, fontSize: "14px", background: theme.cream },
  primaryBtn: { marginTop: "12px", padding: "14px", background: theme.burgundy, color: theme.gold, border: "none", borderRadius: "8px", fontWeight: "700", cursor: "pointer", fontSize: "15px" },
  demoBanner: { background: "#FAF0D7", color: "#85581A", padding: "10px 14px", borderRadius: "8px", fontSize: "13px" },
  candidateList: { display: "flex", flexDirection: "column", gap: "10px" },
  candidateCard: { padding: "14px", border: "2px solid", borderRadius: "10px", cursor: "pointer" },
  candidateHeader: { display: "flex", justifyContent: "space-between" },
  partyTag: { fontSize: "12px", color: theme.wine, fontWeight: "600" },
  successBox: { textAlign: "center", padding: "20px" },
  successIcon: { fontSize: "48px" },
  receiptCard: { marginTop: "16px", background: theme.cream, padding: "12px", borderRadius: "8px", border: `1px solid ${theme.cardBorder}` },
  receiptLabel: { display: "block", fontSize: "11px", color: theme.textMuted },
  receiptCode: { fontSize: "16px", fontWeight: "700", color: theme.burgundy },
  sideCard: { background: theme.white, border: `1px solid ${theme.cardBorder}`, borderRadius: "16px", padding: "20px" },
  sideTitle: { margin: "0 0 16px 0", fontSize: "16px", color: theme.burgundy },
  miniCard: { padding: "12px", background: theme.cream, borderRadius: "8px", marginBottom: "10px" },
  miniBio: { margin: "4px 0 0 0", fontSize: "12px", color: theme.textMuted },
  adminDashboard: { display: "flex", flexDirection: "column", gap: "20px" },
  statsGrid: { display: "grid", gridTemplateColumns: "1fr", gap: "16px" },
  statCard: { background: theme.white, padding: "20px", borderRadius: "12px", border: `1px solid ${theme.cardBorder}` },
  statLabel: { fontSize: "12px", color: theme.textMuted },
  statNum: { fontSize: "28px", fontWeight: "700", color: theme.burgundy },
  adminSection: { background: theme.white, padding: "24px", borderRadius: "16px", border: `1px solid ${theme.cardBorder}` },
  resultsList: { marginTop: "16px", display: "flex", flexDirection: "column", gap: "12px" },
  resultRow: { display: "flex", flexDirection: "column", gap: "6px" },
  resultMeta: { display: "flex", justifyContent: "space-between", fontSize: "14px" },
};