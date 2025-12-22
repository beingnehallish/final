import { useEffect, useState } from "react";
import "../../styles/BlockedUsers.css";

export default function BlockedUsers() {
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchBlocked = async () => {
    try {
      setLoading(true);
      const res = await fetch("http://localhost:5000/api/blocked-users");
      const data = await res.json();
      setBlockedUsers(data);
    } catch (err) {
      console.error("Error fetching blocked users:", err);
      alert("Failed to fetch blocked users.");
    } finally {
      setLoading(false);
    }
  };

  const unblockUser = async (email) => {
    if (!window.confirm(`Are you sure you want to unblock ${email}?`)) return;

    try {
      const res = await fetch("http://localhost:5000/api/unblock-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Failed to unblock user.");
        return;
      }

      alert(`✅ ${email} has been unblocked.`);
      fetchBlocked();
    } catch (err) {
      console.error("Unblock error:", err);
      alert("Failed to unblock user.");
    }
  };

  useEffect(() => {
    fetchBlocked();
  }, []);

  return (
    <div className="blocked-users-container">
      <h1>🚫 Blocked Users</h1>

      {loading && <p className="empty-text">Loading blocked users...</p>}

      {!loading && blockedUsers.length === 0 && (
        <p className="empty-text">No blocked users 🎉</p>
      )}

      {!loading && blockedUsers.length > 0 && (
        <table className="blocked-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Reason</th>
              <th>Blocked At</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {blockedUsers.map((user, index) => (
              <tr key={index}>
                <td>{user.fullName || "Unknown"}</td>
                <td>{user.email}</td>
                <td>{user.blockedReason || "Not provided"}</td>
                <td>
                  {user.blockedAt
                    ? new Date(user.blockedAt).toLocaleString()
                    : "N/A"}
                </td>
                <td>
                  <button
                    className="unblock-btn"
                    onClick={() => unblockUser(user.email)}
                  >
                    Unblock
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
