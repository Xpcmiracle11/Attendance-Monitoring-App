import React from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import styles from "../assets/styles/ReactCalendar.module.css";

const ReactCalendar = ({ events = [] }) => {
  const eventDates = events
    .map((e) => {
      if (!e.clock_in) return null;
      const d = new Date(e.clock_in);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    })
    .filter(Boolean);

  const tileClassName = ({ date, view }) => {
    if (view === "month") {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const formatted = `${year}-${month}-${day}`;
      if (eventDates.includes(formatted)) {
        return styles.present;
      }
    }
    return null;
  };

  return (
    <div className={styles["calendar-container"]}>
      <Calendar
        tileClassName={tileClassName}
        selectRange={false}
        showNeighboringMonth={false}
      />
    </div>
  );
};

export default ReactCalendar;
