import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import styles from "../assets/styles/Topbar.module.css";
import axios from "axios";
import io from "socket.io-client";
import userIcon from "../assets/images/user-image-icon.svg";
import burgerIcon from "../assets/images/burger-icon.svg";
import settingsIcon from "../assets/images/settings-icon.svg";
import logoutIcon from "../assets/images/logout-icon.svg";

const socket = io("http://localhost:8080");

const Topbar = ({ toggleSidebar, isSidebarOpen, toggleButtonRef }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const handleLogout = () => {
    localStorage.removeItem("token");
    sessionStorage.removeItem("token");
    navigate("/");
  };

  useEffect(() => {
    const fetchUser = async () => {
      const token =
        localStorage.getItem("token") || sessionStorage.getItem("token");
      if (!token) return;

      try {
        const response = await axios.get("http://localhost:8080/api/user", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.data.success) {
          setUser(response.data.user);
        }
      } catch (error) {
        console.log("Error fetching user:", error);
      }
    };

    fetchUser();

    socket.on("userUpdated", (updatedUser) => {
      setUser(updatedUser);
    });

    return () => {
      socket.off("userUpdated");
    };
  }, []);

  const toggleDropdown = () => {
    setDropdownOpen((prev) => !prev);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className={styles.topbar}>
      <button
        className={styles["sidebar-toggle-button"]}
        ref={toggleButtonRef}
        onClick={toggleSidebar}
      >
        <img
          className={`${styles["sidebar-toggle-icon"]} ${
            isSidebarOpen ? styles["sidebar-toggled"] : ""
          }`}
          src={burgerIcon}
          alt="Toggle"
        />
      </button>

      <div
        className={styles["topbar-user-container"]}
        ref={dropdownRef}
        onClick={toggleDropdown}
      >
        <div className={styles["user-information-container"]}>
          <img
            className={styles["user-icon"]}
            src={user?.image_file_path ? user.image_file_path : userIcon}
            alt="User"
          />
          <div className={styles["user-description-container"]}>
            <h1 className={styles["user-name"]}>
              {user ? user.first_name : "Loading..."}
            </h1>
            <p className={styles["user-department-role"]}>
              {user ? `${user.department_name} ${user.role}` : "Loading..."}
            </p>
          </div>
        </div>

        {dropdownOpen && (
          <div className={styles["dropdown-menu"]}>
            <div className={styles["dropdown-user-information"]}>
              <p className={styles["dropdown-user-full-name"]}>
                {user
                  ? `${user.first_name} ${user.middle_initial} ${user.last_name}`
                  : ""}
              </p>
              <p className={styles["dropdown-user-phone-number"]}>
                {user?.phone_number}
              </p>
              <p>
                <i className={styles["dropdown-user-email"]}>{user?.email}</i>
              </p>
            </div>

            <ul className={styles["dropdown-option-container"]}>
              <li className={styles["dropdown-option"]}>
                <img
                  className={styles["dropdown-icon"]}
                  src={settingsIcon}
                  alt="Settings"
                />
                Settings
              </li>
              <li
                className={`${styles["dropdown-option"]} ${styles["dropdown-logout"]}`}
                onClick={handleLogout}
              >
                <img
                  className={styles["dropdown-icon"]}
                  src={logoutIcon}
                  alt="Logout"
                />
                Logout
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default Topbar;
