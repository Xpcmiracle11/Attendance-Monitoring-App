import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import Modal from "../../Modal";
import styles from "../../../assets/styles/HRAdminAttendance.module.css";
import crossIcon from "../../../assets/images/cross-icon.svg";
import editIcon from "../../../assets/images/edit-icon.svg";
import editHoverIcon from "../../../assets/images/edit-hovered-icon.svg";
import filterIcon from "../../../assets/images/filter-icon.svg";
import sortIcon from "../../../assets/images/sort-icon.svg";
import exportIcon from "../../../assets/images/export-icon.svg";
import pdfIcon from "../../../assets/images/pdf-icon.svg";
import wordIcon from "../../../assets/images/word-icon.svg";
import excelIcon from "../../../assets/images/excel-icon.svg";
import pdfActiveIcon from "../../../assets/images/pdf-active-icon.svg";
import wordActiveIcon from "../../../assets/images/word-active-icon.svg";
import excelActiveIcon from "../../../assets/images/excel-active-icon.svg";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Document, Packer, Paragraph, Table, TableRow, TableCell } from "docx";
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

const HRAdminAttendance = () => {
  const [attendances, setAttendances] = useState([]);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [search, setSearch] = useState("");
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [tempFromDate, setTempFromDate] = useState("");
  const [tempToDate, setTempToDate] = useState("");
  const [sortOrder, setSortOrder] = useState("");
  const [tempSortOrder, setTempSortOrder] = useState("");
  const [appliedFromDate, setAppliedFromDate] = useState("");
  const [appliedToDate, setAppliedToDate] = useState("");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedAttendance, setSelectedAttendance] = useState(null);
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);
  const [exportFromDate, setExportFromDate] = useState("");
  const [exportToDate, setExportToDate] = useState("");
  const [exportFileType, setExportFileType] = useState("");
  const [exportError, setExportError] = useState("");
  const filterRef = useRef(null);
  const sortRef = useRef(null);
  const exportRef = useRef(null);
  const [isEditHovered, setIsEditHovered] = useState(null);
  const [attendanceData, setAttendanceData] = useState({
    clockIn: "",
    clockOut: "",
  });
  const [errors, setErrors] = useState({
    clockIn: "",
    clockOut: "",
    apiError: "",
  });

  const fetchAttendances = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/attendances`);

      if (response.data.success) {
        const adminAttendances = response.data.data.filter(
          (user) =>
            user.role === "Admin" ||
            user.role === "Corporate" ||
            user.role === "Manager"
        );
        setAttendances(adminAttendances);
      }
    } catch (error) {
      console.error("Error fetching admin attendances:", error);
    }
  };

  useEffect(() => {
    fetchAttendances();
  }, []);

  const filteredAttendances = attendances
    .filter((attendance) => {
      const attendanceName = (attendance.full_name || "").toLowerCase();
      const matchesSearch = attendanceName.includes(search.toLowerCase());

      const attendanceDate = attendance.clock_in
        ? new Date(attendance.clock_in.split("T")[0])
        : new Date();
      const iswithinDateRange =
        (!appliedFromDate || attendanceDate >= new Date(appliedFromDate)) &&
        (!appliedToDate || attendanceDate <= new Date(appliedToDate));

      return matchesSearch && iswithinDateRange;
    })
    .sort((a, b) => {
      if (sortOrder === "date-asc")
        return new Date(a.created_at) - new Date(b.created_at);
      if (sortOrder === "date-desc")
        return new Date(b.created_at) - new Date(a.created_at);
      if (sortOrder === "full_name-asc")
        return a.full_name.localeCompare(b.full_name);
      if (sortOrder === "full_name-desc")
        return b.full_name.localeCompare(a.name);
      return 0;
    });

  const totalPages = Math.ceil(filteredAttendances.length / itemsPerPage);
  const paginatedAttendances = filteredAttendances.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const applyFilters = (e) => {
    e.preventDefault();
    setAppliedFromDate(tempFromDate);
    setAppliedToDate(tempToDate);
    setFilterDropdownOpen(false);
  };

  const getPageNumbers = () => {
    if (totalPages <= 3)
      return Array.from({ length: totalPages }, (_, i) => i + 1);

    let start = Math.max(1, currentPage - 1);
    let end = Math.min(totalPages, start + 2);

    if (currentPage === totalPages) {
      start = totalPages - 2;
      end = totalPages;
    }

    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  const handleSearchChange = (e) => setSearch(e.target.value);
  const handlePageChange = (pageNumber) => setCurrentPage(pageNumber);
  const toggleFilterDropdown = () => setFilterDropdownOpen(!filterDropdownOpen);

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const options = { year: "numeric", month: "long", day: "numeric" };
    return date.toLocaleDateString("en-US", options);
  };

  const tableColumn = [
    "ID",
    "Name",
    "Clock In",
    "Clock Out",
    "Number of Hours",
    "Rate Per Hour",
    "Salary",
    "Created At",
  ];

  const exportToExcel = (data) => {
    const filteredData = data.map((item, index) => ({
      ID: index + 1,
      Name: item.full_name || "",
      "Clock In": item.clock_in_formatted || "",
      "Clock Out": item.clock_out_formatted || "",
      "Number of Hours":
        item.duration && !item.duration.startsWith("-")
          ? item.duration
          : "00:00" || "",
      "Rate Per Hour": item.rate || "",
      Salary: Number(item.salary) > 0 ? item.salary : "00.00" || "",
      "Created At": formatDate(item.created_at),
    }));

    const worksheet = XLSX.utils.json_to_sheet(filteredData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Attendances");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
    });

    saveAs(blob, "attendances.xlsx");
  };

  const exportToPDF = (data) => {
    const doc = new jsPDF();

    doc.text("Attendances Report", 14, 10);

    const tableRows = data.map((item) => [
      item.id || "",
      item.full_name || "",
      item.clock_in_formatted || "",
      item.clock_out_formatted || "",
      item.duration && !item.duration.startsWith("-")
        ? item.duration
        : "00:00" || "",
      item.rate || "",
      Number(item.salary) > 0 ? item.salary : "00.00" || "",
      formatDate(item.created_at),
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 20,
    });

    doc.save("attendances.pdf");
  };

  const exportToWord = (data) => {
    const columnKeyMap = {
      ID: "id",
      Name: "full_name",
      "Clock In": "clock_in_formatted",
      "Clock Out": "clock_out_formatted",
      "Number of Hours": "duration",
      "Rate Per Hour": "rate",
      Salary: "salary",
      "Created At": "created_at",
    };
    const tableRows = [
      new TableRow({
        children: tableColumn.map(
          (column) =>
            new TableCell({
              children: [new Paragraph({ text: column, bold: true })],
            })
        ),
      }),
      ...data.map((item) => {
        return new TableRow({
          children: tableColumn.map((column) => {
            const key = columnKeyMap[column];
            let value = item[key];

            if (column === "Number of Hours") {
              value = value && !value.startsWith("-") ? value : "00:00";
            } else if (column === "Salary") {
              value = Number(value) > 0 ? value : "00.00";
            } else if (column === "Created At") {
              value = formatDate(item[key]);
            } else {
              value = value != null ? value.toString() : "";
            }

            return new TableCell({
              children: [new Paragraph(value)],
            });
          }),
        });
      }),
    ];

    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            new Paragraph("Attendances Report"),
            new Table({ rows: tableRows }),
          ],
        },
      ],
    });

    Packer.toBlob(doc).then((blob) => {
      saveAs(blob, "attendances.docx");
    });
  };

  const handleExport = () => {
    if (!exportFileType) {
      setExportError("Please select an export format.");
      return;
    }

    const filteredData = attendances.filter((attendance) => {
      const attendanceDate = attendance.clock_in
        ? new Date(attendance.clock_in.split("T")[0])
        : new Date();
      return (
        (!exportFromDate || attendanceDate >= new Date(exportFromDate)) &&
        (!exportToDate || attendanceDate <= new Date(exportToDate))
      );
    });

    if (filteredData.length === 0) {
      setExportError(
        "No data available found within the specified date range."
      );
      return;
    }

    const dataWithId = filteredData.map((item, index) => ({
      ...item,
      id: index + 1,
    }));

    if (exportFileType === "excel") {
      exportToExcel(dataWithId);
    } else if (exportFileType === "pdf") {
      exportToPDF(dataWithId);
    } else if (exportFileType === "word") {
      exportToWord(dataWithId);
    }

    setExportFromDate("");
    setExportToDate("");
    setExportFileType("");
  };

  const handleFileTypeSelect = (type) => {
    setExportFileType(type);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setAttendanceData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
    setErrors((prevErrors) => ({
      ...prevErrors,
      [name]: "",
    }));
  };
  const toggleEditModal = (attendance = null) => {
    setSelectedAttendance(attendance);
    setAttendanceData({
      clockIn: attendance?.clock_in || "",
      clockOut: attendance?.clock_out || "",
    });
    setIsEditModalOpen(true);
    setErrors({
      clockIn: "",
      clockOut: "",
      apiError: "",
    });
  };
  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedAttendance(null);
    setAttendanceData({
      clockIn: "",
      clockOut: "",
    });
    setErrors({
      clockIn: "",
      clockOut: "",
      apiError: "",
    });
  };

  const handleEditAttendance = async (e) => {
    e.preventDefault();
    setErrors({
      clockIn: "",
      clockOut: "",
      apiError: "",
    });

    if (!selectedAttendance || !selectedAttendance.attendance_id) {
      setErrors((prev) => ({
        ...prev,
        apiError: "Invalid attendance selected.",
      }));
      console.error("Invalid attendance selected:", selectedAttendance);
      return;
    }

    try {
      const response = await axios.put(
        `${API_BASE_URL}/update-attendance/${selectedAttendance.attendance_id}`,
        {
          clock_in: attendanceData.clockIn,
          clock_out: attendanceData.clockOut,
        }
      );

      if (response.data.success) {
        setAttendances((prevAttendances) =>
          prevAttendances.map((attend) =>
            attend.attendance_id === selectedAttendance.attendance_id
              ? {
                  ...attend,
                  clock_in: attendanceData.clockIn,
                  clock_out: attendanceData.clockOut,
                }
              : attend
          )
        );
        fetchAttendances();
        closeEditModal();
      } else {
        setErrors((prev) => ({
          ...prev,
          apiError: response.data.message || "An error occurred.",
        }));
      }
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        apiError:
          error.response?.data?.message || "Failed to update attendance.",
      }));
    }
  };

  const toggleSortDropdown = () => {
    setSortDropdownOpen((prev) => !prev);
    setFilterDropdownOpen(false);
    setExportDropdownOpen(false);
  };

  const toggleExportDropdown = () => {
    setExportDropdownOpen((prev) => !prev);
    setFilterDropdownOpen(false);
    setSortDropdownOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setFilterDropdownOpen(false);
      }
      if (sortRef.current && !sortRef.current.contains(event.target)) {
        setSortDropdownOpen(false);
      }
      if (exportRef.current && !exportRef.current.contains(event.target)) {
        setExportDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);

    return () => clearInterval(intervalId);
  }, []);

  const formatDateTime = (date) => {
    const days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    const day = days[date.getDay()];
    const month = months[date.getMonth()];
    const dayOfMonth = date.getDate();
    const year = date.getFullYear();
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const seconds = date.getSeconds().toString().padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";

    hours = hours % 12;
    hours = hours ? hours : 12;

    return {
      day: day,
      dateTime: `${month} ${dayOfMonth}, ${year} - ${hours}:${minutes}:${seconds} ${ampm}`,
    };
  };

  const { day, dateTime } = formatDateTime(currentDateTime);

  return (
    <div className={styles["attendances-content"]}>
      <div className={styles["content-header-container"]}>
        <h1 className={styles["page-title"]}>Attendance</h1>
      </div>
      <div className={styles["content-body-container"]}>
        <div className={styles["date-time-container"]}>
          <h1 className={styles.day}>{day}</h1>
          <h1 className={styles["date-time"]}>{dateTime}</h1>
        </div>
        <div className={styles["filter-container"]} ref={filterRef}>
          <input
            className={styles.search}
            type="text"
            value={search}
            onChange={handleSearchChange}
            placeholder="Search here..."
          />
          <div className={styles["filter-sort-export-container"]}>
            <div
              className={`${styles["dropdown-container"]} ${styles["dropdown-filter-container"]}`}
            >
              <button
                className={styles["filter-button"]}
                onClick={toggleFilterDropdown}
              >
                <img
                  className={styles["filter-icon"]}
                  src={filterIcon}
                  alt="Filter"
                />
                <p className={styles["filter-button-label"]}>Filter</p>
              </button>
              {filterDropdownOpen && (
                <div className={styles["filter-dropdown-menu"]}>
                  <div className={styles["filter-dropdown-header"]}>
                    <h3 className={styles["filter-dropdown-label"]}>Filter</h3>
                  </div>
                  <form
                    className={styles["filter-dropdown-body"]}
                    onSubmit={applyFilters}
                  >
                    <div className={styles["filter-input-container"]}>
                      <div className={styles["filter-input-header-container"]}>
                        <h3 className={styles["filter-input-header"]}>
                          Date Range
                        </h3>
                        <h3
                          className={styles["filter-reset-header"]}
                          onClick={() => {
                            setTempFromDate("");
                            setTempToDate("");
                          }}
                        >
                          Reset
                        </h3>
                      </div>
                      <div className={styles["filter-date-range-container"]}>
                        <label
                          className={styles["filter-label"]}
                          htmlFor="from"
                        >
                          From:
                          <input
                            className={styles["filter-input"]}
                            id="from"
                            type="date"
                            value={tempFromDate}
                            onChange={(e) => setTempFromDate(e.target.value)}
                          />
                        </label>
                        <label className={styles["filter-label"]} htmlFor="to">
                          To:
                          <input
                            className={styles["filter-input"]}
                            id="to"
                            type="date"
                            value={tempToDate}
                            onChange={(e) => setTempToDate(e.target.value)}
                          />
                        </label>
                      </div>
                    </div>
                    <div className={styles["filter-button-container"]}>
                      <button
                        className={styles["filter-reset-button"]}
                        type="submit"
                        onClick={() => {
                          setTempFromDate("");
                          setTempToDate("");
                        }}
                      >
                        Reset
                      </button>
                      <button
                        className={styles["filter-apply-button"]}
                        type="submit"
                      >
                        Apply
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
            <div className={styles["dropdown-container"]} ref={sortRef}>
              <button
                className={styles["sort-button"]}
                onClick={toggleSortDropdown}
              >
                <img
                  className={styles["filter-icon"]}
                  src={sortIcon}
                  alt="Sort"
                />
                <p className={styles["filter-button-label"]}>Sort</p>
              </button>
              {sortDropdownOpen && (
                <div className={styles["sort-dropdown-menu"]}>
                  <div className={styles["sort-dropdown-header"]}>
                    <h3 className={styles["sort-dropdown-label"]}>Sort By</h3>
                  </div>
                  <form className={styles["sort-dropdown-body"]}>
                    <div className={styles["sort-input-container"]}>
                      <h3 className={styles["sort-input-header"]}>Date</h3>
                      <label
                        className={styles["sort-label"]}
                        htmlFor="ascending"
                      >
                        <input
                          className={styles["sort-input"]}
                          id="ascending"
                          type="radio"
                          name="sort"
                          checked={tempSortOrder === "date-asc"}
                          onChange={() => setTempSortOrder("date-asc")}
                        />
                        Ascending
                      </label>
                      <label
                        className={styles["sort-label"]}
                        htmlFor="descending"
                      >
                        <input
                          className={styles["sort-input"]}
                          id="descending"
                          type="radio"
                          name="sort"
                          checked={tempSortOrder === "date-desc"}
                          onChange={() => setTempSortOrder("date-desc")}
                        />
                        Descending
                      </label>
                    </div>
                    <div className={styles["sort-input-container"]}>
                      <h3 className={styles["sort-input-header"]}>Name</h3>
                      <label className={styles["sort-label"]} htmlFor="a-z">
                        <input
                          className={styles["sort-input"]}
                          id="a-z"
                          type="radio"
                          name="sort"
                          checked={tempSortOrder === "full_name-asc"}
                          onChange={() => setTempSortOrder("full_name-asc")}
                        />
                        A-Z
                      </label>
                      <label className={styles["sort-label"]} htmlFor="z-a">
                        <input
                          className={styles["sort-input"]}
                          id="z-a"
                          type="radio"
                          name="sort"
                          checked={tempSortOrder === "full_name-desc"}
                          onChange={() => setTempSortOrder("full_name-desc")}
                        />
                        Z-A
                      </label>
                    </div>
                    <div className={styles["filter-button-container"]}>
                      <button
                        className={styles["filter-reset-button"]}
                        type="button"
                        onClick={() => setTempSortOrder("")}
                      >
                        Reset
                      </button>
                      <button
                        className={styles["filter-apply-button"]}
                        type="button"
                        onClick={() => {
                          setSortOrder(tempSortOrder);
                          setSortDropdownOpen(false);
                        }}
                      >
                        Apply
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
            <div className={styles["dropdown-container"]} ref={exportRef}>
              <button
                className={styles["sort-button"]}
                onClick={toggleExportDropdown}
              >
                <img
                  className={styles["filter-icon"]}
                  src={exportIcon}
                  alt="Export"
                />
                <p className={styles["filter-button-label"]}>Export</p>
              </button>
              {exportDropdownOpen && (
                <div className={styles["export-dropdown-menu"]}>
                  <div className={styles["export-dropdown-header"]}>
                    <h3 className={styles["export-dropdown-label"]}>Export</h3>
                  </div>
                  <form className={styles["export-dropdown-body"]}>
                    <div className={styles["export-input-container"]}>
                      <div className={styles["export-input-header-container"]}>
                        <h3 className={styles["export-input-header"]}>
                          Date Range
                        </h3>
                        <h3
                          className={styles["export-reset-header"]}
                          onClick={() => {
                            setExportFromDate("");
                            setExportToDate("");
                          }}
                        >
                          Reset
                        </h3>
                      </div>
                      <div className={styles["export-date-range-container"]}>
                        <label
                          className={styles["export-label"]}
                          htmlFor="from"
                        >
                          From:
                          <input
                            className={styles["export-input"]}
                            id="from"
                            type="date"
                            value={exportFromDate}
                            onChange={(e) => setExportFromDate(e.target.value)}
                          />
                        </label>
                        <label className={styles["export-label"]} htmlFor="to">
                          To:
                          <input
                            className={styles["export-input"]}
                            id="to"
                            type="date"
                            value={exportToDate}
                            onChange={(e) => setExportToDate(e.target.value)}
                          />
                        </label>
                      </div>
                    </div>
                    <div className={styles["export-input-container"]}>
                      <div className={styles["export-input-header-container"]}>
                        <h3 className={styles["export-input-header"]}>
                          File Type
                        </h3>
                        <h3
                          className={styles["export-reset-header"]}
                          onClick={() => setExportFileType("")}
                        >
                          Reset
                        </h3>
                      </div>
                      <div className={styles["export-file-option-container"]}>
                        <button
                          className={`${styles["export-option-button"]} ${
                            exportFileType === "excel"
                              ? styles["selected-export-option"]
                              : ""
                          }`}
                          onClick={() => {
                            handleFileTypeSelect("excel");
                            setExportError("");
                          }}
                          type="button"
                        >
                          <img
                            className={styles["export-option-icon"]}
                            src={
                              exportFileType === "excel"
                                ? excelActiveIcon
                                : excelIcon
                            }
                            alt="Excel"
                          />
                        </button>
                        <button
                          className={`${styles["export-option-button"]} ${
                            exportFileType === "pdf"
                              ? styles["selected-export-option"]
                              : ""
                          }`}
                          onClick={() => {
                            handleFileTypeSelect("pdf");
                            setExportError("");
                          }}
                          type="button"
                        >
                          <img
                            className={styles["export-option-icon"]}
                            src={
                              exportFileType === "pdf" ? pdfActiveIcon : pdfIcon
                            }
                            alt="PDF"
                          />
                        </button>
                        <button
                          className={`${styles["export-option-button"]} ${
                            exportFileType === "word"
                              ? styles["selected-export-option"]
                              : ""
                          }`}
                          onClick={() => {
                            handleFileTypeSelect("word");
                            setExportError("");
                          }}
                          type="button"
                        >
                          <img
                            className={styles["export-option-icon"]}
                            src={
                              exportFileType === "word"
                                ? wordActiveIcon
                                : wordIcon
                            }
                            alt="Word"
                          />
                        </button>
                      </div>
                    </div>
                    {exportError && (
                      <p className={styles["export-error"]}>{exportError}</p>
                    )}
                    <div className={styles["export-button-container"]}>
                      <button
                        className={styles["export-reset-button"]}
                        type="button"
                        onClick={() => {
                          setExportFromDate("");
                          setExportToDate("");
                          setExportFileType("");
                        }}
                      >
                        Reset
                      </button>
                      <button
                        className={styles["export-apply-button"]}
                        onClick={handleExport}
                        type="button"
                      >
                        Export
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className={styles["table-container"]}>
          <table className={styles.table}>
            <thead className={styles.thead}>
              <tr className={styles.htr}>
                <th className={styles.th}>Name</th>
                <th className={styles.th}>Clock In</th>
                <th className={styles.th}>Clock Out</th>
                <th className={styles.th}>Number of Hours</th>
                <th className={styles.th}>Rate Per Hour</th>
                <th className={styles.th}>Salary</th>
                <th className={styles.th}>Status</th>
                <th className={styles.th}>Action</th>
              </tr>
            </thead>
            <tbody className={styles.tbody}>
              {paginatedAttendances.map((attendance, index) => (
                <tr className={styles.btr} key={index}>
                  <td className={styles.td}>
                    {index + 1}. {attendance.full_name}
                  </td>
                  <td className={styles.td}>{attendance.clock_in_formatted}</td>
                  <td className={styles.td}>
                    {attendance.clock_out_formatted}
                  </td>
                  <td className={styles.td}>
                    {attendance.duration && !attendance.duration.startsWith("-")
                      ? attendance.duration
                      : "00:00"}
                  </td>
                  <td className={styles.td}>{attendance.rate}</td>
                  <td className={styles.td}>
                    {Number(attendance.salary) > 0
                      ? attendance.salary
                      : "00.00"}
                  </td>
                  <td className={styles.td}>{attendance.status}</td>
                  <td className={styles.td}>
                    <div className={styles["action-container"]}>
                      <button
                        className={styles["edit-button"]}
                        onMouseEnter={() => setIsEditHovered(index)}
                        onMouseLeave={() => setIsEditHovered(null)}
                        onClick={() => toggleEditModal(attendance)}
                      >
                        <img
                          className={styles["edit-icon"]}
                          src={
                            isEditHovered === index ? editHoverIcon : editIcon
                          }
                          alt="Edit"
                        />
                        <p>Edit</p>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {paginatedAttendances.length === 0 && (
                <tr className={styles.btr}>
                  <td
                    colSpan="6"
                    className={`${styles.td} ${styles["search-response"]}`}
                  >
                    No attendance found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className={styles["pagination-container"]}>
          <div className={styles["pagination-button-container"]}>
            <button
              className={`${styles["pagination-prev-button"]} ${
                currentPage === 1 ? styles["pagination-prev-disabled"] : ""
              }`}
              disabled={currentPage === 1}
              onClick={() => handlePageChange(currentPage - 1)}
            >
              {"<"}
            </button>
            {totalPages <= 3 ? (
              getPageNumbers().map((page) => (
                <button
                  key={page}
                  className={
                    currentPage === page
                      ? styles["pagination-active-button"]
                      : styles["pagination-page-button"]
                  }
                  onClick={() => handlePageChange(page)}
                >
                  {page}
                </button>
              ))
            ) : (
              <>
                {currentPage > 2 && (
                  <>
                    <button
                      className={styles["pagination-page-button"]}
                      onClick={() => handlePageChange(1)}
                    >
                      1
                    </button>
                    {currentPage > 3 && (
                      <span className={styles["pagination-page-divider"]}>
                        --
                      </span>
                    )}
                  </>
                )}
                {getPageNumbers().map((page) => (
                  <button
                    key={page}
                    className={
                      currentPage === page
                        ? styles["pagination-active-button"]
                        : styles["pagination-page-button"]
                    }
                    onClick={() => handlePageChange(page)}
                  >
                    {page}
                  </button>
                ))}
                {currentPage < totalPages - 1 && (
                  <>
                    {currentPage < totalPages - 2 && (
                      <span className={styles["pagination-page-divider"]}>
                        --
                      </span>
                    )}
                    <button
                      className={styles["pagination-page-button"]}
                      onClick={() => handlePageChange(totalPages)}
                    >
                      {totalPages}
                    </button>
                  </>
                )}
              </>
            )}
            <button
              className={`${styles["pagination-next-button"]} ${
                currentPage === totalPages
                  ? styles["pagination-next-disabled"]
                  : ""
              }`}
              disabled={currentPage === totalPages}
              onClick={() => handlePageChange(currentPage + 1)}
            >
              {">"}
            </button>
          </div>
        </div>
      </div>
      {isEditModalOpen && selectedAttendance && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
        >
          <div className={styles["modal-container"]}>
            <div className={styles["modal-header-container"]}>
              <h3 className={styles["modal-title"]}>Edit Attendance</h3>
              <button
                className={styles["close-modal-button"]}
                onClick={closeEditModal}
              >
                <img
                  className={styles["close-modal-icon"]}
                  src={crossIcon}
                  alt="Close"
                />
              </button>
            </div>
            <form
              className={styles["modal-body-container"]}
              onSubmit={handleEditAttendance}
            >
              <label className={styles.label} htmlFor="clock_in">
                Clock In
                <input
                  className={`${styles.input}`}
                  type="datetime-local"
                  id="clock_in"
                  name="clockIn"
                  value={attendanceData.clockIn}
                  onChange={handleInputChange}
                />
              </label>
              <label className={styles.label} htmlFor="clock_out">
                Clock Out
                <input
                  className={`${styles.input}`}
                  type="datetime-local"
                  id="clock_out"
                  name="clockOut"
                  value={attendanceData.clockOut}
                  onChange={handleInputChange}
                />
              </label>
              {errors.apiError && (
                <p className={styles["error-message"]}>{errors.apiError}</p>
              )}
              <button className={styles["submit-button"]}>Submit</button>
            </form>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default HRAdminAttendance;
