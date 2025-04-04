import React from "react";
import styles from "../assets/styles/Modal.module.css";
const Modal = ({ children, isOpen, onClose }) => {
  if (!isOpen) return null;
  return <div className={styles.modal}>{children}</div>;
};

export default Modal;
