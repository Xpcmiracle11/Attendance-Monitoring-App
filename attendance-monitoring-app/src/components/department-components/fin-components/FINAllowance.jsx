import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import Modal from "../../Modal";
import styles from "../../../assets/styles/FINAllowance.module.css";
import crossIcon from "../../../assets/images/cross-icon.svg";
import declinedIcon from "../../../assets/images/declined-icon.svg";
import declinedHoverIcon from "../../../assets/images/declined-hovered-icon.svg";
import approvedIcon from "../../../assets/images/check-icon.svg";
import approvedHoverIcon from "../../../assets/images/check-hovered-icon.svg";
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
import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableRow,
  TableCell,
  HeadingLevel,
} from "docx";
import Select from "react-select";
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

const FINAllowance = () => {
  const [allowances, setAllowances] = useState([]);
  const [search, setSearch] = useState("");
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const [tempFromDate, setTempFromDate] = useState("");
  const [tempToDate, setTempToDate] = useState("");
  const [sortOrder, setSortOrder] = useState("");
  const [tempSortOrder, setTempSortOrder] = useState("");
  const [appliedFromDate, setAppliedFromDate] = useState("");
  const [appliedToDate, setAppliedToDate] = useState("");
  const [isApprovedModalOpen, setIsApprovedModalOpen] = useState(false);
  const [isDeclinedModalOpen, setIsDeclinedModalOpen] = useState(false);
  const [selectedAllowance, setSelectedAllowance] = useState(null);
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);
  const [exportFromDate, setExportFromDate] = useState("");
  const [exportToDate, setExportToDate] = useState("");
  const [exportFileType, setExportFileType] = useState("");
  const [exportError, setExportError] = useState("");
  const filterRef = useRef(null);
  const sortRef = useRef(null);
  const exportRef = useRef(null);
  const [isApprovedHovered, setIsApprovedHovered] = useState(null);
  const [isDeclinedHovered, setIsDeclinedHovered] = useState(null);

  const [errors, setErrors] = useState({
    apiError: "",
  });

  const isDarkMode =
    document.documentElement.getAttribute("data-theme") === "dark";

  const fetchAllowances = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/allowances`);

      if (response.data.success) {
        const allowedStatuses = [
          "Requested",
          "Approved",
          "Declined",
          "Completed",
        ];

        const filteredData = response.data.data.filter((item) =>
          allowedStatuses.includes(item.status)
        );

        setAllowances(filteredData);
      }
    } catch (error) {
      console.error("Error fetching allowance:", error);
    }
  };

  useEffect(() => {
    fetchAllowances();
  }, []);

  const filteredAllowances = allowances
    .filter((allowance) => {
      const waybill = (allowance.waybill || "").toLowerCase();
      const matchesSearch = waybill.includes(search.toLowerCase());

      const allowanceDate = allowance.created_at
        ? new Date(allowance.created_at.split("T")[0])
        : new Date();
      const iswithinDateRange =
        (!appliedFromDate || allowanceDate >= new Date(appliedFromDate)) &&
        (!appliedToDate || allowanceDate <= new Date(appliedToDate));

      return matchesSearch && iswithinDateRange;
    })
    .sort((a, b) => {
      if (sortOrder === "date-asc")
        return new Date(a.created_at) - new Date(b.created_at);
      if (sortOrder === "date-desc")
        return new Date(b.created_at) - new Date(a.created_at);
      if (sortOrder === "waybill-asc")
        return a.waybill.localeCompare(b.waybill);
      if (sortOrder === "waybill-desc")
        return b.waybill.localeCompare(a.waybill);
      return 0;
    });

  const totalPages = Math.ceil(filteredAllowances.length / itemsPerPage);
  const paginatedAllowances = filteredAllowances.slice(
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

  const formatMoney = (value) => {
    if (value === null || value === undefined) return "₱0.00";
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 2,
    }).format(value);
  };

  const tableColumn = [
    "ID",
    "Week",
    "Principal",
    "Waybill / Trip Ticket",
    "Customer Name",
    "RDD",
    "Driver",
    "Crews",
    "Truck Plate",
    "Truck Type",
    "Trip Type",
    "Site",
    "Source - Destination",
    "Date Allowance Requested",
    "Date Allowance Released",
    "Allowance",
    "Shipping",
    "Fuel",
    "Stripper Loading",
    "Stripper Unloading",
    "Crew Allowance",
    "Toll Fee",
    "Transfer Fee",
    "Pullout Incentive",
    "Transfer Incentive",
    "Miscellaneous",
    "Status",
  ];

  const exportToExcel = (data) => {
    const formattedData = data.map((item, index) => ({
      ID: index + 1,
      Week: item.week,
      Principal: item.principal,
      "Waybill / Trip Ticket":
        item.trip_type === "ETMR" ? item.trip_ticket : item.waybill,
      "Customer Name": item.customer_name,
      RDD: formatDate(item.rdd),
      Driver: item.driver,
      Crews: item.crews,
      "Truck Plate": item.truck_plate,
      "Truck Type": item.truck_type,
      "Trip Type": item.trip_type,
      Site: item.site_code,
      "Source - Destination": `${item.source} - ${item.first_destination} - ${item.second_destination}`,
      "Date Allowance Requested": formatDate(item.date_allowance_requested),
      "Date Allowance Released": formatDate(item.date_allowance_released),
      Allowance: item.allowance,
      Shipping: item.shipping,
      Fuel: item.fuel_amount,
      "Stripper Loading": item.stripper_loading,
      "Stripper Unloading": item.stripper_unloading,
      "Crew Allowance": item.crew_allowance,
      Toll: item.toll_fee,
      "Transfer Fee": item.transfer_fee,
      "Pullout Incentive": item.pullout_incentive,
      "Transfer Incentive": item.transfer_incentive,
      Miscellaneous: item.miscellaneous,
      Total: item.total_amount,
      Status: item.status,
    }));

    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Allowances");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    saveAs(
      new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }),
      "allowances.xlsx"
    );
  };

  const exportToPDF = (data) => {
    const doc = new jsPDF();
    doc.text("Allowances Report", 14, 10);

    const tableRows = data.map((item, index) => [
      index + 1,
      item.week,
      item.principal,
      item.trip_type === "ETMR" ? item.trip_ticket : item.waybill,
      item.customer_name,
      formatDate(item.rdd),
      item.driver,
      item.crews,
      item.truck_plate,
      item.truck_type,
      item.trip_type,
      item.site_code,
      `${item.source} - ${item.first_destination} - ${item.second_destination}`,
      formatDate(item.date_allowance_requested),
      formatDate(item.date_allowance_released),
      item.allowance,
      item.shipping,
      item.fuel_amount,
      item.stripper_loading,
      item.stripper_unloading,
      item.crew_allowance,
      item.toll_fee,
      item.transfer_fee,
      item.pullout_incentive,
      item.transfer_incentive,
      item.miscellaneous,
      item.total_amount,
      item.status,
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 20,
    });

    doc.save("allowances.pdf");
  };

  const exportToWord = (data) => {
    const tableRows = data.map(
      (item, index) =>
        new TableRow({
          children: tableColumn.map((col) => {
            let value = "";

            switch (col) {
              case "ID":
                value = index + 1;
                break;
              case "Waybill / Trip Ticket":
                value =
                  item.trip_type === "ETMR" ? item.trip_ticket : item.waybill;
                break;
              case "RDD":
                value = formatDate(item.rdd);
                break;
              case "Site":
                value = item.site_code;
                break;
              case "Source - Destination":
                value = `${item.source} - ${item.destination} - ${item.second_destination}`;
                break;
              case "Date Allowance Requested":
                value = formatDate(item.date_allowance_requested);
                break;
              case "Date Allowance Released":
                value = formatDate(item.date_allowance_released);
                break;
              case "Allowance":
                value = item.allowance;
                break;
              case "Shipping":
                value = item.shipping;
                break;
              case "Fuel":
                value = item.fuel_amount;
                break;
              case "Total":
                value = item.total_amount;
                break;
              default:
                value =
                  item[col.replace(/ /g, "_").toLowerCase()] ?? item[col] ?? "";
            }

            return new TableCell({
              children: [new Paragraph(String(value ?? ""))],
            });
          }),
        })
    );

    const doc = new Document({
      sections: [
        {
          children: [
            new Paragraph({
              text: "Allowances Report",
              heading: HeadingLevel.HEADING_1,
            }),
            new Table({ rows: tableRows }),
          ],
        },
      ],
    });

    Packer.toBlob(doc).then((blob) => {
      saveAs(blob, "allowances.docx");
    });
  };

  const handleExport = () => {
    if (!exportFileType) {
      setExportError("Please select an export format.");
      return;
    }

    const filteredData = allowances.filter((allowances) => {
      const allowancesDate = allowances.created_at
        ? new Date(allowances.created_at.split("T")[0])
        : new Date();
      return (
        (!exportFromDate || allowancesDate >= new Date(exportFromDate)) &&
        (!exportToDate || allowancesDate <= new Date(exportToDate))
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

  const toggleApprovedModal = (item = null) => {
    setSelectedAllowance(item);
    setIsApprovedModalOpen(true);
  };

  const closeApprovedModal = () => {
    setSelectedAllowance(null);
    setIsApprovedModalOpen(false);
  };

  const handleApprovedAllowance = async () => {
    if (!selectedAllowance?.waybill) return;

    try {
      const response = await axios.post(
        `${API_BASE_URL}/approve-allowances/${selectedAllowance.waybill}`
      );

      if (response.data.success) {
        fetchAllowances();
        closeApprovedModal();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const toggleDeclinedModal = (item = null) => {
    setSelectedAllowance(item);
    setIsDeclinedModalOpen(true);
  };

  const closeDeclinedModal = () => {
    setSelectedAllowance(null);
    setIsDeclinedModalOpen(false);
  };

  const handleDeclinedAllowance = async () => {
    if (!selectedAllowance?.waybill) return;

    try {
      const response = await axios.post(
        `${API_BASE_URL}/decline-allowances/${selectedAllowance.waybill}`
      );

      if (response.data.success) {
        fetchAllowances();
        closeApprovedModal();
      }
    } catch (err) {
      console.error(err);
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

  return (
    <div className={styles["allowance-content"]}>
      <div className={styles["content-header-container"]}>
        <h1 className={styles["page-title"]}>Allowance</h1>
      </div>
      <div className={styles["content-body-container"]}>
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
                          checked={tempSortOrder === "waybill-asc"}
                          onChange={() => setTempSortOrder("waybill-asc")}
                        />
                        A-Z
                      </label>
                      <label className={styles["sort-label"]} htmlFor="z-a">
                        <input
                          className={styles["sort-input"]}
                          id="z-a"
                          type="radio"
                          name="sort"
                          checked={tempSortOrder === "waybill-desc"}
                          onChange={() => setTempSortOrder("waybill-desc")}
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
                <th className={styles.th}>Week</th>
                <th className={styles.th}>Principal</th>
                <th className={styles.th}>Waybill / Trip Ticket</th>
                <th className={styles.th}>Customer Name</th>
                <th className={styles.th}>RDD</th>
                <th className={styles.th}>Driver</th>
                <th className={styles.th}>Crews</th>
                <th className={styles.th}>Truck Plate</th>
                <th className={styles.th}>Truck Type</th>
                <th className={styles.th}>Trip Type</th>
                <th className={styles.th}>Site</th>
                <th className={styles.th}>Source - Destination</th>
                <th className={styles.th}>Date Allowance Requested</th>
                <th className={styles.th}>Date Allowance Released</th>
                <th className={styles.th}>Allowance</th>
                <th className={styles.th}>Shipping</th>
                <th className={styles.th}>Fuel</th>
                <th className={styles.th}>Stripper Loading</th>
                <th className={styles.th}>Stripper Unloading</th>
                <th className={styles.th}>Crew Allowance</th>
                <th className={styles.th}>Toll Fee</th>
                <th className={styles.th}>Transfer Fee</th>
                <th className={styles.th}>Pullout Incentive</th>
                <th className={styles.th}>Transfer Incentive</th>
                <th className={styles.th}>Miscellaneous</th>
                <th className={styles.th}>Total</th>
                <th className={styles.th}>Status</th>
                <th className={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody className={styles.tbody}>
              {(() => {
                const renderedWaybills = new Set();
                return paginatedAllowances.map((item, index) => {
                  const waybillKey =
                    item.trip_type === "ETMR" ? item.trip_ticket : item.waybill;
                  const showActions = !renderedWaybills.has(waybillKey);
                  renderedWaybills.add(waybillKey);
                  return (
                    <tr className={styles.btr} key={waybillKey + index}>
                      <td className={styles.td}>
                        <span
                          className={
                            item.status === "Pending"
                              ? styles["status-pin-pending"]
                              : item.status === "Reviewed"
                              ? styles["status-pin-reviewed"]
                              : item.status === "Requested"
                              ? styles["status-pin-requested"]
                              : item.status === "Approved"
                              ? styles["status-pin-approved"]
                              : item.status === "Declined"
                              ? styles["status-pin-declined"]
                              : item.status === "Completed"
                              ? styles["status-pin-completed"]
                              : ""
                          }
                        ></span>
                        {item.week}
                      </td>

                      <td className={styles.td}>{item.principal}</td>
                      <td className={styles.td}>
                        {item.trip_type === "ETMR"
                          ? item.trip_ticket
                          : item.waybill}
                      </td>
                      <td className={styles.td}>{item.customer_name}</td>
                      <td className={styles.td}>{formatDate(item.rdd)}</td>
                      <td className={styles.td}>{item.driver}</td>
                      <td className={styles.td}>{item.crews}</td>
                      <td className={styles.td}>{item.truck_plate}</td>
                      <td className={styles.td}>{item.truck_type}</td>
                      <td className={styles.td}>{item.trip_type}</td>
                      <td className={styles.td}>{item.site_code}</td>
                      <td className={styles.td}>
                        {item.source} - {item.first_destination} -{" "}
                        {item.second_destination}
                      </td>
                      <td className={styles.td}>
                        {formatDate(item.date_allowance_requested)}
                      </td>
                      <td className={styles.td}>
                        {formatDate(item.date_allowance_released)}
                      </td>
                      <td className={styles.td}>
                        {formatMoney(item.allowance)}
                      </td>
                      <td className={styles.td}>
                        {formatMoney(item.shipping)}
                      </td>
                      <td className={styles.td}>
                        {formatMoney(item.fuel_amount)}
                      </td>
                      <td className={styles.td}>
                        {formatMoney(item.stripper_loading)}
                      </td>
                      <td className={styles.td}>
                        {formatMoney(item.stripper_unloading)}
                      </td>
                      <td className={styles.td}>
                        {formatMoney(item.crew_allowance)}
                      </td>
                      <td className={styles.td}>
                        {formatMoney(item.toll_fee)}
                      </td>
                      <td className={styles.td}>
                        {formatMoney(item.transfer_fee)}
                      </td>
                      <td className={styles.td}>
                        {formatMoney(item.pullout_incentive)}
                      </td>
                      <td className={styles.td}>
                        {formatMoney(item.transfer_incentive)}
                      </td>
                      <td className={styles.td}>
                        {formatMoney(item.miscellaneous)}
                      </td>
                      <td className={styles.td}>
                        {formatMoney(item.total_amount)}
                      </td>
                      <td className={styles.td}>{item.status}</td>
                      <td className={styles.td}>
                        {showActions && item.status === "Requested" && (
                          <div className={styles["action-container"]}>
                            <button
                              className={styles["approved-button"]}
                              onMouseEnter={() => setIsApprovedHovered(index)}
                              onMouseLeave={() => setIsApprovedHovered(null)}
                              onClick={() => toggleApprovedModal(item)}
                            >
                              <img
                                className={styles["approved-icon"]}
                                src={
                                  isApprovedHovered === index
                                    ? approvedHoverIcon
                                    : approvedIcon
                                }
                                alt="Approved"
                              />
                              <p>Approved</p>
                            </button>
                            <button
                              className={styles["declined-button"]}
                              onMouseEnter={() => setIsDeclinedHovered(index)}
                              onMouseLeave={() => setIsDeclinedHovered(null)}
                              onClick={() => toggleDeclinedModal(item)}
                            >
                              <img
                                className={styles["declined-icon"]}
                                src={
                                  isDeclinedHovered === index
                                    ? declinedHoverIcon
                                    : declinedIcon
                                }
                                alt="Declined"
                              />
                              <p>Declined</p>
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                });
              })()}
              {paginatedAllowances.length === 0 && (
                <tr className={styles.btr}>
                  <td
                    colSpan="28"
                    className={`${styles.td} ${styles["search-response"]}`}
                  >
                    No allowances found.
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
      {isApprovedModalOpen && selectedAllowance && (
        <Modal
          isOpen={isApprovedModalOpen}
          onClose={() => setIsCheckModalOpen(false)}
        >
          <div
            className={`${styles["modal-container"]} ${styles["confirmation-modal-container"]}`}
          >
            <h1 className={styles["confirmation-modal-header"]}>
              Approve allowance for this waybill?
            </h1>
            <div className={styles["confirmation-modal-button-container"]}>
              <button
                className={styles["confirmation-modal-button"]}
                onClick={handleApprovedAllowance}
              >
                Approve
              </button>
              <button
                className={styles["cancel-confirmation-modal-button"]}
                onClick={closeApprovedModal}
              >
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}
      {isDeclinedModalOpen && selectedAllowance && (
        <Modal
          isOpen={isDeclinedModalOpen}
          onClose={() => setIsCheckModalOpen(false)}
        >
          <div
            className={`${styles["modal-container"]} ${styles["confirmation-modal-container"]}`}
          >
            <h1 className={styles["confirmation-modal-header"]}>
              Decline allowance for this waybill?
            </h1>
            <div className={styles["confirmation-modal-button-container"]}>
              <button
                className={styles["confirmation-modal-button"]}
                onClick={handleDeclinedAllowance}
              >
                Decline
              </button>
              <button
                className={styles["cancel-confirmation-modal-button"]}
                onClick={closeDeclinedModal}
              >
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default FINAllowance;
