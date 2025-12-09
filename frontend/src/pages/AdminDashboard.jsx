import { useState } from "react";
import "../styles/AdminDashboardUnique.css";
import ProfilePageAdmin from "./admin/ProfilePageAdmin";
import NewChallenge from "./admin/NewChallenge";
import ViewChallenges from "./admin/ViewChallenges";
import BlockedUsersPage from "./admin/BlockedUsersPage.jsx";
import RegisterStudent from "./admin/RegisterStudent.jsx";   // ⭐ NEW

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");

  const renderContent = () => {
    switch (activeTab) {
      case "new-challenge":
        return <NewChallenge />;
      case "adm-profile":
        return <ProfilePageAdmin />;
      case "view-challenges":
        return <ViewChallenges />;
      case "blocked-users":
        return <BlockedUsersPage />;
      case "register-student":                     // ⭐ NEW
        return <RegisterStudent />;
      default:
        return (
          <div className="adm-unique-welcome">
            <h1>Welcome, Admin!</h1>
            <p>Select an option from the sidebar to get started.</p>
          </div>
        );
    }
  };

  return (
    <div className="adm-unique-dashboard">
      <aside className="adm-unique-sidebar">
        <h2 className="adm-unique-sidebar-title">Admin Panel</h2>
        <ul className="adm-unique-sidebar-menu">

          <li
            className={activeTab === "new-challenge" ? "adm-unique-active" : ""}
            onClick={() => setActiveTab("new-challenge")}
          >
            ➕ New Challenge
          </li>

          <li
            className={activeTab === "view-challenges" ? "adm-unique-active" : ""}
            onClick={() => setActiveTab("view-challenges")}
          >
            📋 View Challenges
          </li>

          <li
            className={activeTab === "blocked-users" ? "adm-unique-active" : ""}
            onClick={() => setActiveTab("blocked-users")}
          >
            🚫 Blocked Users
          </li>

          <li
            className={activeTab === "register-student" ? "adm-unique-active" : ""}   // ⭐ NEW
            onClick={() => setActiveTab("register-student")}
          >
            🧑‍🎓 Register Student
          </li>

          <li
            className={activeTab === "adm-profile" ? "adm-unique-active" : ""}
            onClick={() => setActiveTab("adm-profile")}
          >
            👤 Profile Tab
          </li>

        </ul>
      </aside>

      <main className="adm-unique-main">{renderContent()}</main>
    </div>
  );
}
