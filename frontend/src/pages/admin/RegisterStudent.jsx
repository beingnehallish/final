import { useState, useEffect } from "react";

export default function RegisterStudent() {
  const [form, setForm] = useState({
    seatNumber: "",
    fullName: "",
    email: "",
    password: "",
    image: null,
  });

  const [loading, setLoading] = useState(false);

  // ----- MODAL STATE -----
  const [modalOpen, setModalOpen] = useState(false);
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState("");

  const handleChange = (e) => {
    const { name, type, value, files } = e.target;
    setForm({
      ...form,
      [name]: type === "file" ? files[0] : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    if (!form.image) {
      alert("Please select an image.");
      return;
    }

    setLoading(true);

    try {
      const fd = new FormData();
      fd.append("seatNumber", form.seatNumber);
      fd.append("fullName", form.fullName);
      fd.append("email", form.email);
      fd.append("password", form.password);
      fd.append("image", form.image);

      const res = await fetch("/api/admin/register-student", {
        method: "POST",
        body: fd,
      });

      const data = await res.json();
      alert(data.message);

      if (res.ok) {
        setForm({
          seatNumber: "",
          fullName: "",
          email: "",
          password: "",
          image: null,
        });
        e.target.reset();
      }
    } catch (err) {
      console.error(err);
      alert("Registration failed. Try again.");
    }
    setLoading(false);
  };

  // ------ FETCH STUDENTS WHEN MODAL OPENS ------
  const loadStudents = async () => {
    try {
      const res = await fetch("/api/admin/students");
      const data = await res.json();
      setStudents(data);
    } catch (err) {
      console.error("Failed to load students", err);
    }
  };

  const openModal = () => {
    loadStudents();
    setModalOpen(true);
  };

  return (
    <>
      <div className="top-buttons">
        <button className="view-btn" onClick={openModal}>
          👀 View Students
        </button>
      </div>

      <div className="register-student-container">
        <h2>Register New Student</h2>

        <form className="register-student-form" onSubmit={handleSubmit}>
          <label>Seat Number</label>
          <input
            type="text"
            name="seatNumber"
            value={form.seatNumber}
            onChange={handleChange}
            required
          />

          <label>Full Name</label>
          <input
            type="text"
            name="fullName"
            value={form.fullName}
            onChange={handleChange}
            required
          />

          <label>Email</label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            required
          />

          <label>Password</label>
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            required
          />

          <label>Upload Image</label>
          <input
            type="file"
            accept="image/*"
            name="image"
            onChange={handleChange}
            required
          />

          <button type="submit" disabled={loading}>
            {loading ? "Registering..." : "Register Student"}
          </button>
        </form>
      </div>

      {/* ---------- MODAL ---------- */}
      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
          >
            <h3>All Students</h3>

            <input
              type="text"
              className="search-box"
              placeholder="Search by name or seat number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <div className="student-list">
              {students
                .filter((s) =>
                  (s.fullName + s.seatNumber)
                    .toLowerCase()
                    .includes(search.toLowerCase())
                )
                .map((s, i) => (
                  <div key={i} className="student-item">
                    <strong>{s.fullName}</strong>
                    <span>Seat: {s.seatNumber}</span>
                    <p>{s.email}</p>
                  </div>
                ))}
            </div>

            <button className="close-btn" onClick={() => setModalOpen(false)}>
              Close
            </button>
          </div>
        </div>
      )}

      {/* ---------- CSS BELOW ---------- */}
      <style jsx>{`
        .top-buttons {
          width: 100%;
          text-align: right;
          padding: 15px 40px 0 0;
        }

        .view-btn {
          background: #1E90FF;
          color: white;
          padding: 10px 16px;
          border-radius: 10px;
          border: none;
          cursor: pointer;
          font-weight: 600;
          transition: 0.3s;
        }

        .view-btn:hover {
          background: #1570d6;
          transform: translateY(-2px);
        }

        .register-student-container {
          max-width: 480px;
          margin: 20px auto;
          background: #41618aff;
          padding: 30px;
          border-radius: 18px;
          color: #F5F7FA;
          box-shadow: 0 0 20px rgba(0,0,0,0.25);
          animation: fadeIn 0.6s ease-in-out;
        }

        h2 {
          text-align: center;
          margin-bottom: 25px;
          font-size: 26px;
          font-weight: 700;
          color: white;
        }

        .register-student-form {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        label {
          font-size: 14px;
          font-weight: 600;
          color: #d9e6ff;
          margin-bottom: -10px;
        }

        input {
          padding: 12px 14px;
          border-radius: 10px;
          background: #F5F7FA;
          border: 2px solid transparent;
          outline: none;
          font-size: 15px;
          transition: 0.25s ease;
        }

        input:focus {
          border-color: #1E90FF;
          box-shadow: 0 0 10px rgba(30,144,255,0.5);
        }

        button {
          margin-top: 15px;
          padding: 13px;
          font-size: 16px;
          font-weight: 700;
          background: #1E90FF;
          color: white;
          border: none;
          border-radius: 12px;
          cursor: pointer;
          transition: 0.3s ease;
        }

        button:hover {
          background: #1570d6;
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(21,112,214,0.4);
        }

        /* ---------- MODAL STYLING ---------- */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          height: 100vh;
          width: 100vw;
          background: rgba(247, 240, 240, 0.65);
          display: flex;
          justify-content: center;
          align-items: center;
          backdrop-filter: blur(3px);
          animation: fadeIn 0.3s ease;
        }

        .modal {
          background: #507eb9ff;
          width: 450px;
          max-height: 75vh;
          padding: 25px;
          border-radius: 15px;
          color: white;
          box-shadow: 0 0 25px rgba(0,0,0,0.3);
          animation: slideUp 0.4s ease;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .search-box {
          padding: 10px;
          margin-bottom: 12px;
          border-radius: 8px;
          border: none;
          outline: none;
        }

        .student-list {
          overflow-y: auto;
          max-height: 50vh;
          padding-right: 8px;
        }

        .student-item {
          padding: 12px;
          margin-bottom: 10px;
          background: #112840;
          border-radius: 10px;
          transition: 0.25s;
        }

        .student-item:hover {
          background: #1b3a5c;
        }

        .close-btn {
          margin-top: 15px;
          background: #d9534f;
          padding: 10px 12px;
          border-radius: 10px;
          border: none;
          color: white;
          cursor: pointer;
          font-weight: 600;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideUp {
          from { transform: translateY(30px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </>
  );
}
