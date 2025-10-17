import React, { useState, useRef, useEffect } from "react";
import Topbar from "../components/Topbar";
import Sidebar from "../components/Sidebar";
import HRAdminAttendance from "../components/department-components/hr-components/HRAdminAttendance";
import styles from "../assets/styles/Attendance.module.css";

const AdminAttendance = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };
  const sidebarRef = useRef(null);
  const toggleButtonRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target) &&
        toggleButtonRef.current &&
        !toggleButtonRef.current.contains(event.target) &&
        isSidebarOpen
      ) {
        setIsSidebarOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isSidebarOpen]);

  return (
    <div className={styles.attendance}>
      <Topbar
        toggleSidebar={toggleSidebar}
        isSidebarOpen={isSidebarOpen}
        toggleButtonRef={toggleButtonRef}
      />
      <div className={styles["attendance-container"]} ref={sidebarRef}>
        <Sidebar isSidebarOpen={isSidebarOpen} />
      </div>
      <HRAdminAttendance />
    </div>
  );
};

export default AdminAttendance;
