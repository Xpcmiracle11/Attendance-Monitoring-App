import React from "react";
import styles from "../assets/styles/Loading.module.css";
const Loading = () => {
  return (
    <div className={styles["loader-container"]}>
      <div className={styles.loader}>
        <span></span>
        <span></span>
        <span></span>
        <span></span>
        <span></span>
        <span></span>
      </div>
    </div>
  );
};

export default Loading;
