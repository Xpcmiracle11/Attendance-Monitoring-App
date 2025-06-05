import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import Topbar from "../components/Topbar";
import Sidebar from "../components/Sidebar";
import styles from "../assets/styles/Dispatch.module.css";
import OPSDispatch from "../components/department-components/ops-components/OPSDispatch";
import OPSDRiverDispatch from "../components/department-components/ops-components/OPSDriverDispatch";
const Dispatch = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [userDepartment, setUserDepartment] = useState(null);
  const [userRole, setUserRole] = useState(null);
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

        const response = await axios.get("http://localhost:8080/api/user", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.data.success) {
          setUserDepartment(response.data.user.department_name);
          setUserRole(response.data.user.role);
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
    <div className={styles.dispatch}>
      <Topbar
        toggleSidebar={toggleSidebar}
        isSidebarOpen={isSidebarOpen}
        toggleButtonRef={toggleButtonRef}
      />
      <div className={styles["dispatch-container"]}>
        <div className={styles["sidebar-container"]} ref={sidebarRef}>
          <Sidebar
            isSidebarOpen={isSidebarOpen}
            toggleSidebar={toggleSidebar}
          />
        </div>
        {userDepartment === "Operations" && userRole !== "Driver" ? (
          <OPSDispatch />
        ) : userDepartment === "Operations" && userRole === "Driver" ? (
          <OPSDRiverDispatch />
        ) : (
          ""
        )}
      </div>
    </div>
  );
};

export default Dispatch;
