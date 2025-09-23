import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import Topbar from "../components/Topbar";
import Sidebar from "../components/Sidebar";
import styles from "../assets/styles/ArchivePayroll.module.css";
import FINArchivePayroll from "../components/department-components/fin-components/FINArchivePayroll";
import HRArchivePayroll from "../components/department-components/hr-components/HRArchivePayroll";
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";
const ArchivePayroll = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [userDepartment, setUserDepartment] = useState(null);

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  const sidebarRef = useRef(null);
  const toggleButtonRef = useRef(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token =
          localStorage.getItem("token") || sessionStorage.getItem("token");
        if (!token) return;

        const response = await axios.get(`${API_BASE_URL}/user`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.data.success) {
          setUserDepartment(response.data.user.department_name);
        }
      } catch (error) {
        console.error("Error fetching user data: ", error);
      }
    };
    fetchUser();
  }, []);

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
    <div className={styles.payroll}>
      <Topbar
        toggleSidebar={toggleSidebar}
        isSidebarOpen={isSidebarOpen}
        toggleButtonRef={toggleButtonRef}
      />
      <div className={styles["payroll-container"]}>
        <div className={styles["sidebar-container"]} ref={sidebarRef}>
          <Sidebar
            isSidebarOpen={isSidebarOpen}
            toggleSidebar={toggleSidebar}
          />
        </div>
        {userDepartment === "Finance" ? (
          <FINArchivePayroll />
        ) : userDepartment === "Human Resources" ? (
          <HRArchivePayroll />
        ) : (
          ""
        )}
      </div>
    </div>
  );
};

export default ArchivePayroll;
