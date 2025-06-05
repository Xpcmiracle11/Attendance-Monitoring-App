import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import styles from "../assets/styles/Topbar.module.css";
import axios from "axios";
import io from "socket.io-client";
import userIcon from "../assets/images/user-image-icon.svg";
import burgerIcon from "../assets/images/burger-icon.svg";
import settingsIcon from "../assets/images/settings-icon.svg";
import logoutIcon from "../assets/images/logout-icon.svg";
import { Link } from "react-router-dom";
import Modal from "./Modal";
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";
const SOCKET_BASE_URL =
  import.meta.env.VITE_SOCKET_URL || "http://localhost:8080";

const socket = io(SOCKET_BASE_URL, {
  withCredentials: true,
});

const Topbar = ({ toggleSidebar, isSidebarOpen, toggleButtonRef }) => {
  const navigate = useNavigate();
  const [isBreakModalOpen, setIsBreakModalOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [selectedBreak, setSelectedBreak] = useState(null);
  const [isOnBreak, setIsOnBreak] = useState(false);
  const [remainingTime, setRemainingTime] = useState(null);
  const [breakDetails, setBreakDetails] = useState(null);
  const [breakLimits, setBreakLimits] = useState(null);
  const intervalRef = useRef(null);

  const handleLogout = async () => {
    try {
      const token =
        localStorage.getItem("token") || sessionStorage.getItem("token");

      if (token) {
        await axios.post(`${API_BASE_URL}/logout`, null, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      localStorage.removeItem("token");
      sessionStorage.removeItem("token");

      navigate("/");
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

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
      } catch (error) {}
    };

    fetchUser();

    socket.on("userUpdated", (updatedUser) => {
      setUser(updatedUser);
    });

    return () => {
      socket.off("userUpdated");
    };
  }, []);

  const toggleDropdown = (e) => {
    e.stopPropagation();
    setDropdownOpen((prev) => !prev);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        !event.target.closest(`.${styles["user-information-container"]}`)
      ) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const toggleLogoutModal = () => {
    setIsLogoutModalOpen(!isLogoutModalOpen);
  };
  const closeLogoutModal = () => {
    setIsLogoutModalOpen(false);
  };

  const toggleBreakModal = () => {
    setIsBreakModalOpen(!isBreakModalOpen);
  };
  const closeBreakModal = () => {
    setIsBreakModalOpen(false);
  };

  const handleBreakSelection = (breakType) => {
    setSelectedBreak(breakType);
  };

  const fetchBreakLimits = async () => {
    const token =
      localStorage.getItem("token") || sessionStorage.getItem("token");

    if (!token) return;

    try {
      const response = await axios.get(`${API_BASE_URL}/break-limits`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setBreakLimits(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching break limits:", error);
    }
  };

  useEffect(() => {
    fetchBreakLimits();
  }, []);

  const startBreak = async () => {
    if (!selectedBreak) return;

    try {
      const token =
        localStorage.getItem("token") || sessionStorage.getItem("token");

      if (!token) {
        return;
      }

      const response = await axios.post(
        `${API_BASE_URL}/break-start`,
        {
          breakType: selectedBreak,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        const durationInSeconds =
          selectedBreak === "Coffee Break" ? 15 * 60 : 60 * 60;
        setRemainingTime(durationInSeconds);
        setIsOnBreak(true);
        setBreakDetails({
          breakType: selectedBreak,
          startTime: new Date(),
          breakId: response.data.breakId,
        });

        intervalRef.current = setInterval(() => {
          setRemainingTime((prev) => {
            if (prev <= 0) {
              clearInterval(intervalRef.current);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);

        setIsBreakModalOpen(false);
      }
    } catch (error) {
      if (error.response?.data?.message) {
      } else {
        console.error("Error starting break:", error);
      }
    }
  };

  const endBreak = async () => {
    try {
      clearInterval(intervalRef.current);
      setRemainingTime(null);
      setIsOnBreak(false);
      const breakId = breakDetails?.breakId;

      if (!breakId) {
        console.error("Break ID is missing.");
        return;
      }

      const response = await axios.put(
        `${API_BASE_URL}/break-end`,
        { breakId },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );

      if (response.data.success) {
        setBreakDetails(null);
        fetchBreakLimits();
      }
    } catch (error) {
      console.error("Error ending break:", error);
    }
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(
      remainingSeconds
    ).padStart(2, "0")}`;
  };

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
      <div className={styles["topbar-user-container"]}>
        <div
          className={styles["user-information-container"]}
          onClick={toggleDropdown}
        >
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
          <div
            className={styles["dropdown-menu"]}
            ref={dropdownRef}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles["dropdown-user-information"]}>
              <p className={styles["dropdown-user-full-name"]}>
                {user
                  ? `${user.first_name} ${user.middle_initial} ${user.last_name}`
                  : ""}
              </p>
              <p className={styles["dropdown-user-phone-number"]}>
                +{user?.phone_number}
              </p>
              <p>
                <i className={styles["dropdown-user-email"]}>{user?.email}</i>
              </p>
            </div>
            <ul className={styles["dropdown-option-container"]}>
              <h1 className={styles["break-option-header"]}>Break Options</h1>
              {breakLimits &&
              breakLimits.coffeeBreakCount >= 2 &&
              breakLimits.lunchBreakCount >= 1 ? (
                <li
                  className={`${styles["dropdown-option"]} ${styles["break-option"]}`}
                >
                  <p className={styles["break-option-label"]}>
                    No Breaks Available
                  </p>
                </li>
              ) : (
                <li
                  className={`${styles["dropdown-option"]} ${styles["break-option"]}`}
                >
                  {!(breakLimits?.coffeeBreakCount >= 2) && (
                    <label
                      className={styles["break-option-label"]}
                      htmlFor="coffee"
                    >
                      <input
                        className={styles["break-input"]}
                        type="radio"
                        name="break_option"
                        id="coffee"
                        onChange={() => handleBreakSelection("Coffee Break")}
                      />
                      Coffee Break (15 mins)
                    </label>
                  )}
                  {!(breakLimits?.lunchBreakCount >= 1) && (
                    <label
                      className={styles["break-option-label"]}
                      htmlFor="lunch"
                    >
                      <input
                        className={styles["break-input"]}
                        type="radio"
                        name="break_option"
                        id="lunch"
                        onChange={() => handleBreakSelection("Lunch Break")}
                      />
                      Lunch Break (1 hr)
                    </label>
                  )}
                  <button
                    className={`${styles["break-submit-button"]} ${
                      !selectedBreak
                        ? styles["disable-break-submit-button"]
                        : styles["break-submit-button"]
                    }`}
                    disabled={!selectedBreak}
                    onClick={toggleBreakModal}
                  >
                    Take a Break
                  </button>
                </li>
              )}
              <li
                className={`${styles["dropdown-option"]} ${styles["dropdown-settings"]}`}
              >
                <Link to="/profile" className={styles["dropdown-link"]}>
                  <img
                    className={styles["dropdown-icon"]}
                    src={settingsIcon}
                    alt="Settings"
                  />
                  Profile
                </Link>
              </li>
              <li
                className={`${styles["dropdown-option"]} ${styles["dropdown-logout"]}`}
                onClick={toggleLogoutModal}
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
      {isLogoutModalOpen && (
        <Modal
          isOpen={isLogoutModalOpen}
          onClose={() => setIsLogoutModalOpen(false)}
        >
          <div
            className={`${styles["modal-container"]} ${styles["logout-modal-container"]}`}
          >
            <h1 className={styles["logout-modal-header"]}>
              Are you sure to log-out?
            </h1>
            <div className={styles["logout-modal-button-container"]}>
              <button
                className={styles["logout-modal-button"]}
                onClick={handleLogout}
              >
                Log-out
              </button>
              <button
                className={styles["cancel-logout-modal-button"]}
                onClick={closeLogoutModal}
              >
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}
      {isBreakModalOpen && (
        <Modal
          isOpen={isBreakModalOpen}
          onClose={() => setIsBreakModalOpen(false)}
        >
          <div
            className={`${styles["modal-container"]} ${styles["break-modal-container"]}`}
          >
            <h1 className={styles["break-modal-header"]}>
              Are you sure to take a break?
            </h1>
            <div className={styles["break-modal-button-container"]}>
              <button
                className={styles["break-modal-button"]}
                onClick={startBreak}
              >
                Confirm
              </button>
              <button
                className={styles["cancel-break-modal-button"]}
                onClick={closeBreakModal}
              >
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}
      {isOnBreak && (
        <Modal isOpen={true} onClose={() => {}}>
          <div
            className={`${styles["modal-container"]} ${styles["break-modal-container"]}`}
          >
            <h1 className={styles["break-modal-header"]}>
              On Break: {formatTime(remainingTime)}{" "}
              {remainingTime <= 0 && (
                <p
                  className={`${styles["break-modal-header"]} ${styles["overbreak-header"]}`}
                >
                  Overbreak
                </p>
              )}
            </h1>
            <button className={styles["break-modal-button"]} onClick={endBreak}>
              End Break
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Topbar;
