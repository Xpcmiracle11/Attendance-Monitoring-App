import React, { useState } from "react";
import Topbar from "../components/Topbar";
import Sidebar from "../components/Sidebar";
import styles from "../assets/styles/Dashboard.module.css";
const Dashboard = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };
  return (
    <div className={styles.dashboard}>
      <Topbar toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />
      <div className={styles["dashboard-container"]}>
        <Sidebar isSidebarOpen={isSidebarOpen} />
        <div className={styles["dashboard-content"]}>
          <h1 className={styles["page-title"]}>Dashboard</h1>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
