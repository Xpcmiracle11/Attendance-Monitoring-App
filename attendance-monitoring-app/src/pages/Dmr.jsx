import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import Topbar from "../components/Topbar";
import Sidebar from "../components/Sidebar";
import styles from "../assets/styles/Dmr.module.css";
import HRDmr from "../components/department-components/hr-components/HRDmr.jsx";
import OPSDmr from "../components/department-components/ops-components/OPSDmr";
import FINDmr from "../components/department-components/fin-components/FINDmr";
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";
const Dmr = () => {
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
    <div className={styles.dmr}>
      <Topbar
        toggleSidebar={toggleSidebar}
        isSidebarOpen={isSidebarOpen}
        toggleButtonRef={toggleButtonRef}
      />
      <div className={styles["dmr-container"]}>
        <div className={styles["sidebar-container"]} ref={sidebarRef}>
          <Sidebar
            isSidebarOpen={isSidebarOpen}
            toggleSidebar={toggleSidebar}
          />
        </div>
        {userDepartment === "Human Resources" ? (
          <HRDmr />
        ) : userDepartment === "Operations" ? (
          <OPSDmr />
        ) : userDepartment === "Finance" ? (
          <FINDmr />
        ) : (
          ""
        )}
      </div>
    </div>
  );
};

export default Dmr;
