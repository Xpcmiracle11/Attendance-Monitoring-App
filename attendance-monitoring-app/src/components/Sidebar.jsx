import React from "react";
import { Link, useLocation } from "react-router-dom";
import styles from "../assets/styles/Sidebar.module.css";
import dashboardIcon from "../assets/images/dashboard-icon.svg";
import departmentsIcon from "../assets/images/departments-icon.svg";
import usersIcon from "../assets/images/users-icon.svg";
import attendanceIcon from "../assets/images/attendance-icon.svg";
import dashboardActiveIcon from "../assets/images/dashboard-active-icon.svg";
import departmentsActiveIcon from "../assets/images/departments-active-icon.svg";
import usersActiveIcon from "../assets/images/users-active-icon.svg";
import trucksIcon from "../assets/images/trucks-icon.svg";
import trucksActiveIcon from "../assets/images/trucks-active-icon.svg";
import attendanceActiveIcon from "../assets/images/attendance-active-icon.svg";
import links from "../assets/links.json";

const icons = {
  dashboard: dashboardIcon,
  departments: departmentsIcon,
  users: usersIcon,
  trucks: trucksIcon,
  attendance: attendanceIcon,
};

const activeIcons = {
  dashboard: dashboardActiveIcon,
  departments: departmentsActiveIcon,
  users: usersActiveIcon,
  trucks: trucksActiveIcon,
  attendance: attendanceActiveIcon,
};
const Sidebar = ({ isSidebarOpen }) => {
  const location = useLocation();

  return (
    <div
      className={`${styles.sidebar} ${
        isSidebarOpen ? styles.open : styles.closed
      }`}
    >
      <div className={styles["navigation-container"]}>
        <div className={styles["label-container"]}>
          <h1 className={styles["label-title"]}>EHD</h1>
          <h3 className={styles["label-sub-title"]}>Logistics</h3>
        </div>
        <ul className={styles["navigation-option-container"]}>
          {links.map((link, index) => {
            const isActive = location.pathname === link.path;
            return (
              <li
                key={index}
                className={`${styles["navigation-option"]} ${
                  isActive ? styles.active : ""
                }`}
              >
                <Link to={link.path} className={styles["navigation-link"]}>
                  <img
                    className={styles["navigation-icon"]}
                    src={isActive ? activeIcons[link.icon] : icons[link.icon]}
                    alt={link.name}
                  />
                  {link.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

export default Sidebar;
