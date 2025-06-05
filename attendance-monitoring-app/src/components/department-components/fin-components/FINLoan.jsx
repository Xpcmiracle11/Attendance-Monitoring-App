import React from "react";
import styles from "../../../assets/styles/FINLoan.module.css";
const FINLoan = () => {
  return (
    <div className={styles["loan-content"]}>
      <div className={styles["content-header-container"]}>
        <h1 className={styles["page-title"]}>Loan</h1>
      </div>
      <div className={styles["content-body-container"]}></div>
    </div>
  );
};

export default FINLoan;
