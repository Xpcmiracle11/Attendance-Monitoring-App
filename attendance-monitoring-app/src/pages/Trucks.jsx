import React, { useState } from "react";
import Topbar from "../components/Topbar";
import Sidebar from "../components/Sidebar";
import styles from "../assets/styles/Trucks.module.css";
const Trucks = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };
  return (
    <div className={styles.trucks}>
      <Topbar toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />
      <div className={styles["trucks-container"]}>
        <Sidebar isSidebarOpen={isSidebarOpen} />
        <div className={styles["trucks-content"]}>
          <h1 className={styles["page-title"]}>Trucks</h1>
        </div>
      </div>
    </div>
  );
};

export default Trucks;
