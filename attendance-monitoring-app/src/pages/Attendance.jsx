import React, { useState } from "react";
import Topbar from "../components/Topbar";
import Sidebar from "../components/Sidebar";
import styles from "../assets/styles/Attendance.module.css";
const Attendance = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };
  return (
    <div className={styles.attendance}>
      <Topbar toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />
      <div className={styles["attendance-container"]}>
        <Sidebar isSidebarOpen={isSidebarOpen} />
        <div className={styles["attendance-content"]}>
          <h1 className={styles["page-title"]}>Attendance</h1>
        </div>
      </div>
    </div>
  );
};

export default Attendance;
