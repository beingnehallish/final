import { useState, useEffect } from "react";
import "../../styles/RegisterStudent.css";

export default function RegisterStudent() {
  const [form, setForm] = useState({
    seatNumber: "",
    fullName: "",
    email: "",
    password: "",
    image: null,
  });

  const [loading, setLoading] = useState(false);

  // ---------- MODAL STATE ----------
  const [modalOpen, setModalOpen] = useState(false);
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState("");

  // ---------- INPUT HANDLER ----------
  const handleChange = (e) => {
    const { name, type, value, files } = e.target;
    setForm({
      ...form,
      [name]: type === "file" ? files[0] : value,
    });
  };

  // ---------- SUBMIT ----------
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

  // ---------- FETCH STUDENTS ----------
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
      {/* ---------- TOP ACTION ---------- */}
      <div className="top-buttons">
        <button className="view-btn" onClick={openModal}>
          👀 View Students
        </button>
      </div>

      {/* ---------- REGISTER CARD ---------- */}
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
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>All Students</h3>

            <input
              type="text"
              className="search-box"
              placeholder="Search by Student Name or USN"
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
    </>
  );
}
