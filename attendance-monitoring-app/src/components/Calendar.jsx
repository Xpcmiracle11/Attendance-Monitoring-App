import React from "react";
import styles from "../assets/styles/Calendar.module.css";

const CustomCalendar = ({ dateAttended }) => {
  const attendedDates = dateAttended
    ? dateAttended.split(",").map((entry) => {
        const [date, hours] = entry.trim().split("|");
        const formattedDate = new Date(date).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });
        return { date: formattedDate, hours };
      })
    : [];

  return (
    <div className={styles["calendar-container"]}>
      {attendedDates.length > 0 ? (
        <ul className={styles["attended-list"]}>
          {attendedDates.map((item, idx) => (
            <li key={idx} className={styles.present}>
              <p className={styles.date}>{item.date}</p>
              <p className={styles.time}>Time: {item.hours}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p>No attendance records found.</p>
      )}
    </div>
  );
};

export default CustomCalendar;
