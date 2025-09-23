import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import styles from "../assets/styles/Sidebar.module.css";
import axios from "axios";
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
import monitorIcon from "../assets/images/monitor-icon.svg";
import monitorActiveIcon from "../assets/images/monitor-active-icon.svg";
import deviceIcon from "../assets/images/device-icon.svg";
import deviceActiveIcon from "../assets/images/device-active-icon.svg";
import payrollIcon from "../assets/images/payroll-icon.svg";
import payrollActiveIcon from "../assets/images/payroll-active-icon.svg";
import dispatchIcon from "../assets/images/dispatch-icon.svg";
import dispatchActiveIcon from "../assets/images/dispatch-active-icon.svg";
import dmrIcon from "../assets/images/dmr-icon.svg";
import dmrActiveIcon from "../assets/images/dmr-active-icon.svg";
import holidayIcon from "../assets/images/holiday-icon.svg";
import holidayActiveIcon from "../assets/images/holiday-active-icon.svg";
import sunIcon from "../assets/images/sun-icon.svg";
import moonIcon from "../assets/images/moon-icon.svg";
import links from "../assets/links.json";
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

const icons = {
  dashboard: dashboardIcon,
  departments: departmentsIcon,
  users: usersIcon,
  trucks: trucksIcon,
  monitor: monitorIcon,
  attendance: attendanceIcon,
  device: deviceIcon,
  payroll: payrollIcon,
  dispatch: dispatchIcon,
  dmr: dmrIcon,
  holiday: holidayIcon,
};

const activeIcons = {
  dashboard: dashboardActiveIcon,
  departments: departmentsActiveIcon,
  users: usersActiveIcon,
  trucks: trucksActiveIcon,
  monitor: monitorActiveIcon,
  attendance: attendanceActiveIcon,
  device: deviceActiveIcon,
  payroll: payrollActiveIcon,
  dispatch: dispatchActiveIcon,
  dmr: dmrActiveIcon,
  holiday: holidayActiveIcon,
};

const Sidebar = ({ isSidebarOpen }) => {
  const location = useLocation();
  const [isChecked, setIsChecked] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      const token =
        localStorage.getItem("token") || sessionStorage.getItem("token");
      if (!token) return;
      try {
        const response = await axios.get(`${API_BASE_URL}/user`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.data.success) {
          setUser(response.data.user);
        }
      } catch (error) {
        console.error("Error fetching user:", error);
      }
    };
    fetchUser();
  }, []);

  const getFilteredLinks = () => {
    if (!user) return [];

    const allowedLinks = {
      "Human Resources": [
        "dashboard",
        "trucks",
        "users",
        "monitoring",
        "attendance",
        "payroll",
        "dmr",
        "holiday",
      ],
      Operations: ["dashboard", "trucks", "dispatch", "dmr"],
      "IT Department": ["dashboard", "departments", "device", "users"],
      Finance: ["dashboard", "payroll", "dmr"],
    };

    const defaultLinks = ["dashboard"];

    const departmentLinks = allowedLinks[user.department_name] || [];
    return links.filter((link) =>
      [...defaultLinks, ...departmentLinks].includes(link.name.toLowerCase())
    );
  };

  const filteredLinks = getFilteredLinks();

  const handleThemeToggle = (e) => {
    const isChecked = e.target.checked;
    document.documentElement.setAttribute(
      "data-theme",
      isChecked ? "dark" : "light"
    );
    localStorage.setItem("theme", isChecked ? "dark" : "light");
    setIsChecked(isChecked);
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "light";
    if (savedTheme === "dark") {
      document.documentElement.setAttribute("data-theme", "dark");
      setIsChecked(true);
    } else {
      document.documentElement.setAttribute("data-theme", "light");
      setIsChecked(false);
    }
  }, []);

  const [openMenu, setOpenMenu] = useState(null);

  const toggleMenu = (menuName) => {
    setOpenMenu((prev) => (prev === menuName ? null : menuName));
  };

  return (
    <div
      className={`${styles.sidebar} ${
        isSidebarOpen ? styles.open : styles.closed
      }`}
    >
      <div className={styles["navigation-container"]}>
        <div className={styles["label-links-container"]}>
          <div className={styles["label-container"]}>
            <h1 className={styles["label-title"]}>EHD</h1>
            <h3 className={styles["label-sub-title"]}>Logistics</h3>
          </div>
          <ul className={styles["navigation-menu"]}>
            {filteredLinks.map((link, index) => {
              const isChildActive = link.children?.some(
                (child) => location.pathname === child.path
              );

              const isActive = location.pathname === link.path || isChildActive;
              const isHovered = hoveredIndex === index;
              const iconSrc =
                isActive || isHovered
                  ? activeIcons[link.icon]
                  : icons[link.icon];
              const iconClass =
                isActive || isHovered
                  ? styles["active-icon"]
                  : styles["inactive-icon"];

              const isManager =
                user?.role === "Manager" &&
                (user?.department_name === "Human Resources" ||
                  user?.department_name === "Finance");
              if (link.name === "Payroll") {
                const isMenuOpen = openMenu === "Payroll" || isChildActive;

                if (isManager) {
                  return (
                    <li
                      key={index}
                      className={`${styles["navigation-option-dropdown"]} ${
                        isChildActive ? styles.active : ""
                      }`}
                      onMouseEnter={() => setHoveredIndex(index)}
                      onMouseLeave={() => setHoveredIndex(null)}
                    >
                      <div
                        className={`${styles["navigation-link"]} ${
                          isChildActive ? styles.active : ""
                        }`}
                        onClick={() => toggleMenu("Payroll")}
                      >
                        <img
                          className={`${styles["navigation-icon"]} ${iconClass}`}
                          src={iconSrc}
                          alt={link.name}
                        />
                        {link.name}
                        <span
                          className={`${styles.arrow} ${
                            isMenuOpen
                              ? styles["open-menu"]
                              : styles["closed-menu"]
                          }`}
                        >
                          &gt;
                        </span>
                      </div>
                      {isMenuOpen && (
                        <ul className={styles["submenu"]}>
                          {link.children
                            .filter(
                              (child) =>
                                child.name === "Current" ||
                                (child.name === "Archive" && isManager)
                            )
                            .map((child, childIndex) => {
                              const isChildItemActive =
                                location.pathname === child.path;
                              return (
                                <li
                                  key={childIndex}
                                  className={`${styles["submenu-item"]} ${
                                    isChildItemActive ? styles.active : ""
                                  }`}
                                >
                                  <Link
                                    to={child.path}
                                    className={`${
                                      styles["navigation-link-dropdown"]
                                    } ${
                                      isChildItemActive ? styles.active : ""
                                    }`}
                                  >
                                    {child.name}
                                  </Link>
                                </li>
                              );
                            })}
                        </ul>
                      )}
                    </li>
                  );
                } else {
                  const currentPayroll = link.children.find(
                    (child) => child.name === "Current"
                  );
                  const isCurrentActive =
                    location.pathname === currentPayroll?.path;

                  return (
                    <li
                      key={index}
                      className={`${styles["navigation-option"]} ${
                        isCurrentActive ? styles.active : ""
                      }`}
                      onMouseEnter={() => setHoveredIndex(index)}
                      onMouseLeave={() => setHoveredIndex(null)}
                    >
                      <Link
                        to={currentPayroll?.path || "#"}
                        className={styles["navigation-link"]}
                      >
                        <img
                          className={`${styles["navigation-icon"]} ${iconClass}`}
                          src={iconSrc}
                          alt="Payroll"
                        />
                        Payroll
                      </Link>
                    </li>
                  );
                }
              }
              if (link.name === "Attendance" && link.children?.length > 0) {
                const isMenuOpen = openMenu === "Attendance" || isChildActive;

                return (
                  <li
                    key={index}
                    className={`${styles["navigation-option-dropdown"]} ${
                      isChildActive ? styles.active : ""
                    }`}
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  >
                    <div
                      className={`${styles["navigation-link"]} ${
                        isChildActive ? styles.active : ""
                      }`}
                      onClick={() => toggleMenu("Attendance")}
                    >
                      <img
                        className={`${styles["navigation-icon"]} ${iconClass}`}
                        src={iconSrc}
                        alt={link.name}
                      />
                      {link.name}
                      <span
                        className={`${styles.arrow} ${
                          isMenuOpen
                            ? styles["open-menu"]
                            : styles["closed-menu"]
                        }`}
                      >
                        &gt;
                      </span>
                    </div>
                    {isMenuOpen && (
                      <ul className={styles["submenu"]}>
                        {link.children.map((child, childIndex) => {
                          const isChildItemActive =
                            location.pathname === child.path;
                          return (
                            <li
                              key={childIndex}
                              className={`${styles["submenu-item"]} ${
                                isChildItemActive ? styles.active : ""
                              }`}
                            >
                              <Link
                                to={child.path}
                                className={`${
                                  styles["navigation-link-dropdown"]
                                } ${isChildItemActive ? styles.active : ""}`}
                              >
                                {child.name}
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </li>
                );
              }
              return (
                <li
                  key={index}
                  className={`${styles["navigation-option"]} ${
                    isActive ? styles.active : ""
                  }`}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  <Link to={link.path} className={styles["navigation-link"]}>
                    <img
                      className={`${styles["navigation-icon"]} ${iconClass}`}
                      src={iconSrc}
                      alt={link.name}
                    />
                    {link.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
        <div className={styles["theme-container"]}>
          <label className={styles["toggle-switch"]}>
            <input
              type="checkbox"
              checked={isChecked}
              onChange={handleThemeToggle}
            />
            <div className={styles["toggle-switch-background"]}>
              <img
                src={sunIcon}
                alt="Sun"
                className={`${styles["theme-icon"]} ${styles["sun-icon"]}`}
              />
              <img
                src={moonIcon}
                alt="Moon"
                className={`${styles["theme-icon"]} ${styles["moon-icon"]}`}
              />
              <div className={styles["toggle-switch-handle"]}></div>
            </div>
          </label>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
