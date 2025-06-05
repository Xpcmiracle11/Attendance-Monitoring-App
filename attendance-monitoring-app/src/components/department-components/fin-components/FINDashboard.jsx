import React from "react";
import styles from "../../../assets/styles/FINDashboard.module.css";
const FINDashboard = () => {
  return (
    <div className={styles["dashboards-content"]}>
      <div className={styles["content-header-container"]}>
        <h1 className={styles["page-title"]}>Dashboard</h1>
      </div>
      <div className={styles["content-body-container"]}></div>
    </div>
  );
};

export default FINDashboard;
