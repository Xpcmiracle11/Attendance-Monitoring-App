import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import styles from "../assets/styles/EmployeeProfileComponent.module.css";
import axios from "axios";
import io from "socket.io-client";
import userIcon from "../assets/images/user-image-icon.svg";
import "react-phone-input-2/lib/style.css";
import ReactCalendar from "./ReactCalendar";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";
const SOCKET_BASE_URL =
  import.meta.env.VITE_SOCKET_URL || "http://localhost:8080";

const socket = io(SOCKET_BASE_URL, {
  withCredentials: true,
});

const EmployeeProfileComponent = () => {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [payrolls, setPayrolls] = useState([]);
  const [attendance, setAttendance] = useState([]);

  const isDarkMode =
    document.documentElement.getAttribute("data-theme") === "dark";

  const fetchUser = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/employee/${id}`);
      if (response.data.success) {
        setUser(response.data.user);
      }
    } catch (error) {
      console.error("❌ Failed to fetch user:", error);
    }
  };

  useEffect(() => {
    fetchUser();

    socket.on("userUpdated", (updatedUser) => {
      if (updatedUser.id === parseInt(id)) {
        setUser(updatedUser);
      }
    });

    return () => {
      socket.off("userUpdated");
    };
  }, [id]);

  const fetchPayroll = async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/employee-payroll/${id}`
      );
      if (response.data.success) {
        setPayrolls(response.data.payroll);
      }
    } catch (error) {
      console.error("❌ Failed to fetch payroll:", error);
    }
  };

  useEffect(() => {
    fetchPayroll();
  }, [id]);

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        const res = await axios.get(
          `${API_BASE_URL}/employee-attendance/${id}`
        );
        const records = res.data.attendance || [];

        const formatted = records.map((record) => ({
          clock_in: record.clock_in,
          clock_out: record.clock_out,
        }));

        setAttendance(formatted);
      } catch (err) {
        console.error("❌ Error fetching attendance:", err);
      }
    };

    fetchAttendance();
  }, [id]);

  return (
    <div className={styles["profile-content"]}>
      <div className={styles["content-header-container"]}>
        <h1 className={styles["page-title"]}>Profile</h1>
      </div>
      <div className={styles["content-body-container"]}>
        <div className={styles["profile-card-container"]}>
          <div className={styles["profile-picture-container"]}>
            <img
              className={styles["user-icon"]}
              src={user?.image_file_path || userIcon}
              alt="User"
            />
            <div className={styles["user-name-department-details"]}>
              <h1 className={styles["user-name"]}>
                {user ? user.full_name : "Loading..."}
              </h1>
              <p className={styles["user-department-role"]}>
                {user ? `${user.department_name} ${user.role}` : "Loading..."}
              </p>
            </div>
          </div>
          <div className={styles["personal-information-container"]}>
            <div className={styles["personal-information-title-container"]}>
              <h1 className={styles["personal-information-label"]}>
                Personal Information
              </h1>
              <div className={styles["personal-details-container"]}>
                {[
                  { label: "First Name", value: user?.first_name },
                  { label: "Last Name", value: user?.last_name },
                  { label: "Gender", value: user?.gender },
                  {
                    label: "Date of Birth",
                    value: user?.birth_date
                      ? new Date(user.birth_date).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })
                      : null,
                  },
                  { label: "Email", value: user?.email },
                  {
                    label: "Phone Number",
                    value: user ? `+${user.phone_number}` : null,
                  },
                ].map((info, index) => (
                  <div
                    className={styles["personal-information-details-container"]}
                    key={index}
                  >
                    <p className={styles["personal-information-details-label"]}>
                      {info.label}
                    </p>
                    <h1
                      className={styles["personal-information-details-title"]}
                    >
                      {info.value || "Loading..."}
                    </h1>
                  </div>
                ))}
              </div>
            </div>
            <div className={styles["personal-information-title-container"]}>
              <h1 className={styles["personal-information-label"]}>
                Address Information
              </h1>
              <div className={styles["personal-details-container"]}>
                {[
                  { label: "Region", value: user?.region },
                  { label: "Province", value: user?.province },
                  { label: "Municipality", value: user?.municipality },
                  { label: "Barangay", value: user?.barangay },
                ].map((info, index) => (
                  <div
                    className={styles["personal-information-details-container"]}
                    key={index}
                  >
                    <p className={styles["personal-information-details-label"]}>
                      {info.label}
                    </p>
                    <h1
                      className={styles["personal-information-details-title"]}
                    >
                      {typeof info.value === "object"
                        ? info.value?.label || "Loading..."
                        : info.value || "Loading..."}
                    </h1>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className={styles["second-row-container"]}>
          <div
            className={`${styles["profile-card-container"]} ${styles["profile-card-second-row-container"]}`}
          >
            <ReactCalendar events={attendance} />
          </div>
          <div
            className={`${styles["profile-card-container"]} ${styles["profile-card-table-container"]}`}
          >
            <h1 className={styles["personal-information-label"]}>
              Payslip History
            </h1>
            <div className={styles["table-container"]}>
              <table className={styles.table}>
                <thead className={styles.thead}>
                  <tr className={styles.htr}>
                    <th className={styles.th}>Name</th>
                    <th className={styles.th}>Department</th>
                    <th className={styles.th}>Rate</th>
                    <th className={styles.th}>Hours</th>
                    <th className={styles.th}>Gross</th>
                    <th className={styles.th}>SSS Contribution</th>
                    <th className={styles.th}>SSS Loan</th>
                    <th className={styles.th}>PAGIBIG Contribution</th>
                    <th className={styles.th}>PAGIBIG Loan</th>
                    <th className={styles.th}>Philhealth Contribution</th>
                    <th className={styles.th}>Staffshop</th>
                    <th className={styles.th}>Cash Advance</th>
                    <th className={styles.th}>Total Deduction</th>
                    <th className={styles.th}>Net Pay</th>
                    <th className={styles.th}>Period</th>
                  </tr>
                </thead>
                <tbody className={styles.tbody}>
                  {payrolls && payrolls.length > 0 ? (
                    payrolls.map((payroll, index) => (
                      <tr
                        className={`${styles.btr} ${styles["personal-information-table-container"]}`}
                        key={index}
                      >
                        <td
                          className={`${styles.td} ${styles["full-name-td"]}`}
                        >
                          <span
                            className={`${styles.status} ${
                              payroll.status === "Pending"
                                ? styles["status-pending"]
                                : payroll.status === "Unpaid"
                                ? styles["status-unpaid"]
                                : payroll.status === "Paid"
                                ? styles["status-paid"]
                                : ""
                            }`}
                          ></span>
                          {payroll.full_name}
                        </td>
                        <td className={styles.td}>
                          {payroll.department_name} {payroll.role}
                        </td>
                        <td className={styles.td}>₱{payroll.basic_pay_rate}</td>
                        <td className={styles.td}>{payroll.basic_pay_days}</td>
                        <td className={styles.td}>₱{payroll.gross}</td>
                        <td className={styles.td}>
                          ₱{payroll.sss_contribution}
                        </td>
                        <td className={styles.td}>₱{payroll.sss_loan}</td>
                        <td className={styles.td}>
                          ₱{payroll.pagibig_contribution}
                        </td>
                        <td className={styles.td}>₱{payroll.pagibig_loan}</td>
                        <td className={styles.td}>
                          ₱{payroll.philhealth_contribution}
                        </td>
                        <td className={styles.td}>₱{payroll.staff_shops}</td>
                        <td className={styles.td}>₱{payroll.cash_advance}</td>
                        <td className={styles.td}>
                          ₱{payroll.total_deductions}
                        </td>
                        <td className={styles.td}>₱{payroll.net_pay}</td>
                        <td className={styles.td}>
                          {new Date(payroll.period_start).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            }
                          )}{" "}
                          -{" "}
                          {new Date(payroll.period_end).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            }
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className={styles.td} colSpan="15">
                        No payrolls available.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeProfileComponent;
