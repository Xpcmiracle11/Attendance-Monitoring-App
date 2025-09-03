import React, { useEffect, useRef, useState } from "react";
import Topbar from "../components/Topbar";
import Sidebar from "../components/Sidebar";
import OPSDispatch from "../components/department-components/ops-components/OPSDispatch";
import styles from "../assets/styles/Dispatch.module.css";

const Dispatch = () => {
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
        <OPSDispatch />
      </div>
    </div>
  );
};

export default Dispatch;
