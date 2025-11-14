import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import Modal from "../../Modal";
import styles from "../../../assets/styles/OPSAllowance.module.css";
import crossIcon from "../../../assets/images/cross-icon.svg";
import editIcon from "../../../assets/images/edit-icon.svg";
import deleteIcon from "../../../assets/images/delete-icon.svg";
import editHoverIcon from "../../../assets/images/edit-hovered-icon.svg";
import deleteHoverIcon from "../../../assets/images/delete-hovered-icon.svg";
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
import Select from "react-select";
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

const OPSAllowance = () => {
  const [allowances, setAllowances] = useState([]);
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
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
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
  const [isEditHovered, setIsEditHovered] = useState(null);
  const [isDeleteHovered, setIsDeleteHovered] = useState(null);
  const [allowancesData, setAllowancesData] = useState({
    allowanceMatrixId: "",
    stripperLoading: "",
    stripperUnloading: "",
    crewAllowance: "",
    tollFee: "",
    transferFee: "",
    pullOutIncentive: "",
    transferIncentive: "",
    miscellaneous: "",
  });
  const [errors, setErrors] = useState({
    allowanceMatrixId: "",
    stripperLoading: "",
    stripperUnloading: "",
    crewAllowance: "",
    tollFee: "",
    transferFee: "",
    pullOutIncentive: "",
    transferIncentive: "",
    miscellaneous: "",
  });

  const isDarkMode =
    document.documentElement.getAttribute("data-theme") === "dark";

  const fetchAllowances = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/allowances`);
      if (response.data.success) {
        setAllowances(response.data.data);
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

  const tableColumn = [
    "ID",
    "Week",
    "Principal",
    "Waybill",
    "Customer Name",
    "RDD",
    "Driver",
    "Crews",
    "Truck Plate",
    "Truck Type",
    "Trip Type",
    "Source",
    "Destination",
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
      Waybill: item.waybill,
      "Customer Name": item.customer_name,
      RDD: item.rdd,
      Driver: item.driver,
      Crews: item.crews,
      "Truck Plate": item.truck_plate,
      "Truck Type": item.truck_type,
      "Trip Type": item.trip_type,
      Source: item.source,
      Destination: item.destination,
      "Date Allowance Requested": formatDate(item.date_allowance_requested),
      "Date Allowance Released": formatDate(item.date_allowance_released),
      Allowance: item.allowance,
      Shipping: item.shipping,
      Fuel: item.fuel,
      "Stripper Loading": item.stripper_loading,
      "Stripper Unloading": item.stripper_unloading,
      "Crew Allowance": item.crew_allowance,
      "Toll Fee": item.toll_fee,
      "Transfer Fee": item.transfer_fee,
      "Pullout Incentive": item.pullout_incentive,
      "Transfer Incentive": item.transfer_incentive,
      Miscellaneous: item.miscellaneous,
      Status: item.status,
    }));

    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Allowances");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
    });

    saveAs(blob, "allowances.xlsx");
  };

  const exportToPDF = (data) => {
    const doc = new jsPDF();
    doc.text("Allowances Report", 14, 10);

    const tableRows = data.map((item, index) => [
      index + 1,
      item.week || "",
      item.principal || "",
      item.waybill || "",
      item.customer_name || "",
      item.rdd || "",
      item.driver || "",
      item.crews || "",
      item.truck_plate || "",
      item.truck_type || "",
      item.trip_type || "",
      item.source || "",
      item.destination || "",
      formatDate(item.date_allowance_requested),
      formatDate(item.date_allowance_released),
      item.allowance || "",
      item.shipping || "",
      item.fuel || "",
      item.stripper_loading || "",
      item.stripper_unloading || "",
      item.crew_allowance || "",
      item.toll_fee || "",
      item.transfer_fee || "",
      item.pullout_incentive || "",
      item.transfer_incentive || "",
      item.miscellaneous || "",
      item.status || "",
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 20,
    });

    doc.save("allowances.pdf");
  };

  const exportToWord = (data) => {
    const columnKeyMap = {
      ID: null,
      Week: "week",
      Principal: "principal",
      Waybill: "waybill",
      Tripticket: "trip_ticket",
      "Customer Name": "customer_name",
      RDD: "rdd",
      Driver: "driver",
      Crews: "crews",
      "Truck Plate": "truck_plate",
      "Truck Type": "truck_type",
      "Trip Type": "trip_type",
      Source: "source",
      Destination: "destination",
      "Date Allowance Requested": "date_allowance_requested",
      "Date Allowance Released": "date_allowance_released",
      Allowance: "allowance",
      Shipping: "shipping",
      Fuel: "fuel",
      "Stripper Loading": "stripper_loading",
      "Stripper Unloading": "stripper_unloading",
      "Crew Allowance": "crew_allowance",
      "Toll Fee": "toll_fee",
      "Transfer Fee": "transfer_fee",
      "Pullout Incentive": "pullout_incentive",
      "Transfer Incentive": "transfer_incentive",
      Miscellaneous: "miscellaneous",
      Status: "status",
    };

    const tableRows = data.map((item, index) => {
      return new TableRow({
        children: tableColumn.map((column) => {
          let value;
          if (column === "ID") value = (index + 1).toString();
          else {
            const key = columnKeyMap[column];
            if (
              key === "date_allowance_requested" ||
              key === "date_allowance_released"
            ) {
              value = formatDate(item[key]);
            } else {
              value =
                item[key] !== undefined && item[key] !== null
                  ? item[key].toString()
                  : "";
            }
          }
          return new TableCell({
            children: [new Paragraph(value)],
          });
        }),
      });
    });

    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            new Paragraph("Allowances Report"),
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

  const toggleAddModal = () => {
    setIsAddModalOpen(!isAddModalOpen);
    setErrors({
      allowanceMatrixId: "",
      stripperLoading: "",
      stripperUnloading: "",
      crewAllowance: "",
      tollFee: "",
      transferFee: "",
      pullOutIncentive: "",
      transferIncentive: "",
      miscellaneous: "",
      apiError: "",
    });
  };

  const closeAddModal = () => {
    setIsAddModalOpen(false);
    setAllowancesData({
      allowanceMatrixId: "",
      stripperLoading: "",
      stripperUnloading: "",
      crewAllowance: "",
      tollFee: "",
      transferFee: "",
      pullOutIncentive: "",
      transferIncentive: "",
      miscellaneous: "",
    });
    setErrors({
      allowanceMatrixId: "",
      stripperLoading: "",
      stripperUnloading: "",
      crewAllowance: "",
      tollFee: "",
      transferFee: "",
      pullOutIncentive: "",
      transferIncentive: "",
      miscellaneous: "",
      apiError: "",
    });
  };

  const handleInputChange = (e, name, value) => {
    let inputName, inputValue;

    if (e && e.target) {
      inputName = e.target.name;
      inputValue = e.target.value;
    } else {
      inputName = name;
      inputValue = value;
    }

    if (e?.target?.type === "number" && inputValue !== "") {
      inputValue = Number(inputValue);
    }

    setAllowancesData((prevData) => ({
      ...prevData,
      [inputName]: inputValue,
    }));

    setErrors((prevErrors) => ({
      ...prevErrors,
      [inputName]: "",
    }));
  };

  const handleAddAllowance = async (e) => {
    e.preventDefault();

    setErrors({
      allowanceMatrixId: "",
      stripperLoading: "",
      stripperUnloading: "",
      crewAllowance: "",
      tollFee: "",
      transferFee: "",
      pullOutIncentive: "",
      transferIncentive: "",
      miscellaneous: "",
      apiError: "",
    });

    let hasError = false;
    if (!allowancesData.allowanceMatrixId) {
      setErrors((prev) => ({
        ...prev,
        allowanceMatrixId: "Allowance Matrix ID is required.",
      }));
      hasError = true;
    }

    if (hasError) return;

    try {
      const response = await axios.post(
        `${API_BASE_URL}/insert-allowance`,
        allowancesData
      );

      if (response.data.success) {
        setAllowances((prev) => [...prev, response.data.data]);
        fetchAllowances();
        closeAddModal();
      } else {
        setErrors((prev) => ({
          ...prev,
          apiError: response.data.message || "An error occurred.",
        }));
      }
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        apiError: error.response?.data?.message || "An error occurred.",
      }));
    }
  };

  const toggleEditModal = (allowance = null) => {
    setSelectedAllowance(allowance);
    setAllowancesData({
      allowanceMatrixId: allowance?.allowanceMatrixId || "",
      stripperLoading: allowance?.stripperLoading || "",
      stripperUnloading: allowance?.stripperUnloading || "",
      crewAllowance: allowance?.crewAllowance || "",
      tollFee: allowance?.tollFee || "",
      transferFee: allowance?.transferFee || "",
      pullOutIncentive: allowance?.pullOutIncentive || "",
      transferIncentive: allowance?.transferIncentive || "",
      miscellaneous: allowance?.miscellaneous || "",
    });
    setIsEditModalOpen(true);
    setErrors({
      allowanceMatrixId: "",
      stripperLoading: "",
      stripperUnloading: "",
      crewAllowance: "",
      tollFee: "",
      transferFee: "",
      pullOutIncentive: "",
      transferIncentive: "",
      miscellaneous: "",
      apiError: "",
    });
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedAllowance(null);
    setAllowancesData({
      allowanceMatrixId: "",
      stripperLoading: "",
      stripperUnloading: "",
      crewAllowance: "",
      tollFee: "",
      transferFee: "",
      pullOutIncentive: "",
      transferIncentive: "",
      miscellaneous: "",
    });
    setErrors({
      allowanceMatrixId: "",
      stripperLoading: "",
      stripperUnloading: "",
      crewAllowance: "",
      tollFee: "",
      transferFee: "",
      pullOutIncentive: "",
      transferIncentive: "",
      miscellaneous: "",
      apiError: "",
    });
  };

  const handleEditAllowance = async (e) => {
    e.preventDefault();
    setErrors({
      allowanceMatrixId: "",
      stripperLoading: "",
      stripperUnloading: "",
      crewAllowance: "",
      tollFee: "",
      transferFee: "",
      pullOutIncentive: "",
      transferIncentive: "",
      miscellaneous: "",
      apiError: "",
    });

    if (!selectedAllowance?.id) {
      setErrors((prev) => ({
        ...prev,
        apiError: "Invalid allowance selected.",
      }));
      return;
    }

    let hasError = false;
    if (!allowancesData.allowanceMatrixId) {
      setErrors((prev) => ({
        ...prev,
        allowanceMatrixId: "Allowance Matrix ID is required.",
      }));
      hasError = true;
    }

    if (hasError) return;

    try {
      const response = await axios.put(
        `${API_BASE_URL}/update-allowance/${selectedAllowance.id}`,
        allowancesData
      );

      if (response.data.success) {
        setAllowances((prev) =>
          prev.map((allowance) =>
            allowance.id === selectedAllowance.id
              ? response.data.data
              : allowance
          )
        );
        fetchAllowances();
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
        apiError: error.response?.data?.message || "An error occurred.",
      }));
    }
  };

  const toggleDeleteModal = (allowance = null) => {
    setSelectedAllowance(allowance);
    setIsDeleteModalOpen(!isDeleteModalOpen);
  };

  const closeDeleteModal = () => {
    setSelectedAllowance(null);
    setIsDeleteModalOpen(false);
  };

  const handleDeleteAllowance = async () => {
    if (!selectedAllowance) return;

    try {
      const response = await axios.delete(
        `${API_BASE_URL}/delete-allowance/${selectedAllowance.id}`
      );

      if (response.data.success) {
        setAllowances((prevAllowances) =>
          prevAllowances.filter(
            (allowance) => allowance.id !== selectedAllowance.id
          )
        );
        fetchAllowances();
        toggleDeleteModal();
      }
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        apiError:
          error.response?.data?.message || "An error occurred while deleting.",
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

  return (
    <div className={styles["allowance-content"]}>
      <div className={styles["content-header-container"]}>
        <h1 className={styles["page-title"]}>Allowance</h1>
      </div>
      <div className={styles["content-body-container"]}>
        <div className={styles["add-allowance-button-container"]}>
          <button
            className={styles["add-allowance-button"]}
            onClick={toggleAddModal}
          >
            Add Allowance
          </button>
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
                          checked={tempSortOrder === "code-asc"}
                          onChange={() => setTempSortOrder("code-asc")}
                        />
                        A-Z
                      </label>
                      <label className={styles["sort-label"]} htmlFor="z-a">
                        <input
                          className={styles["sort-input"]}
                          id="z-a"
                          type="radio"
                          name="sort"
                          checked={tempSortOrder === "code-desc"}
                          onChange={() => setTempSortOrder("code-desc")}
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
                <th className={styles.th}>Source</th>
                <th className={styles.th}>Destination</th>
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
                <th className={styles.th}>Status</th>
                <th className={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody className={styles.tbody}>
              {paginatedAllowances.map((item, index) => (
                <tr className={styles.btr} key={index}>
                  <td className={styles.td}>{item.week}</td>
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
                  <td className={styles.td}>{item.source}</td>
                  <td className={styles.td}>{item.destination}</td>
                  <td className={styles.td}>
                    {formatDate(item.date_allowance_requested)}
                  </td>
                  <td className={styles.td}>
                    {formatDate(item.date_allowance_released)}
                  </td>
                  <td className={styles.td}>{item.allowance}</td>
                  <td className={styles.td}>{item.shipping}</td>
                  <td className={styles.td}>{item.fuel}</td>
                  <td className={styles.td}>{item.stripper_loading}</td>
                  <td className={styles.td}>{item.stripper_unloading}</td>
                  <td className={styles.td}>{item.crew_allowance}</td>
                  <td className={styles.td}>{item.toll_fee}</td>
                  <td className={styles.td}>{item.transfer_fee}</td>
                  <td className={styles.td}>{item.pullout_incentive}</td>
                  <td className={styles.td}>{item.transfer_incentive}</td>
                  <td className={styles.td}>{item.miscellaneous}</td>
                  <td className={styles.td}>{item.status}</td>
                  <td className={styles.td}>
                    <div className={styles["action-container"]}>
                      <button
                        className={styles["edit-button"]}
                        onMouseEnter={() => setIsEditHovered(index)}
                        onMouseLeave={() => setIsEditHovered(null)}
                        onClick={() => toggleEditModal(item)}
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
                      <button
                        className={styles["delete-button"]}
                        onMouseEnter={() => setIsDeleteHovered(index)}
                        onMouseLeave={() => setIsDeleteHovered(null)}
                        onClick={() => toggleDeleteModal(item)}
                      >
                        <img
                          className={styles["delete-icon"]}
                          src={
                            isDeleteHovered === index
                              ? deleteHoverIcon
                              : deleteIcon
                          }
                          alt="Delete"
                        />
                        <p>Delete</p>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {paginatedAllowances.length === 0 && (
                <tr className={styles.btr}>
                  <td
                    colSpan="27"
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
      {isAddModalOpen && (
        <Modal isOpen={isAddModalOpen} onClose={toggleAddModal}>
          <div
            className={`${styles["modal-container"]} ${styles["add-modal-container"]}`}
          >
            <div className={styles["modal-header-container"]}>
              <h3 className={styles["modal-title"]}>Add Allowance</h3>
              <button
                className={styles["close-modal-button"]}
                onClick={closeAddModal}
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
              onSubmit={handleAddAllowance}
            >
              <label className={styles.label} htmlFor="principal">
                Principal
                <Select
                  className={`${styles.input} ${
                    errors.principal ? styles["error-input"] : ""
                  }`}
                  styles={{
                    control: (base, state) => ({
                      ...base,
                      borderColor: state.isFocused
                        ? "var(--text-secondary)"
                        : "var(--borders)",
                      boxShadow: state.isFocused
                        ? "0 0 4px rgba(109, 118, 126, 0.8)"
                        : state.isHovered
                        ? "0 0 4px rgba(109, 118, 126, 0.8)"
                        : "none",
                      backgroundColor: isDarkMode
                        ? "var(--cards)"
                        : "var(--background)",
                      color: "var(--text-primary)",
                      "&:hover": {
                        borderColor: "var(--text-secondary)",
                        boxShadow: "0 0 4px rgba(109, 118, 126, 0.8)",
                      },
                      transition: "all 0.3s ease-in-out",
                      cursor: "pointer",
                    }),
                    menu: (base) => ({
                      ...base,
                      backgroundColor: isDarkMode
                        ? "var(--cards)"
                        : "var(--background)",
                      color: "var(--text-primary)",
                      border: `1px solid var(--borders)`,
                    }),
                    option: (base, state) => ({
                      ...base,
                      backgroundColor: state.isSelected
                        ? isDarkMode
                          ? "#333333"
                          : "#e9ecef"
                        : state.isFocused
                        ? isDarkMode
                          ? "#2a2a2a"
                          : "#f8f9fa"
                        : base.backgroundColor,
                      color: "var(--text-primary)",
                      cursor: "pointer",
                      "&:hover": {
                        backgroundColor: isDarkMode ? "#2a2a2a" : "#f8f9fa",
                      },
                    }),
                    singleValue: (base) => ({
                      ...base,
                      color: "var(--text-primary)",
                    }),
                    placeholder: (base) => ({
                      ...base,
                      color: "var(--text-secondary)",
                    }),
                    input: (base) => ({
                      ...base,
                      color: "var(--text-primary)",
                    }),
                  }}
                  id="principal"
                  name="principal"
                  options={principalOptions}
                  value={
                    principalOptions.find(
                      (opt) => opt.value === allowancesData.principal
                    ) || null
                  }
                  onChange={(selected) =>
                    setAllowancesData((prev) => ({
                      ...prev,
                      principal: selected?.value || "",
                    }))
                  }
                  placeholder="Select Principal"
                />
                {errors.principal && (
                  <p className={styles["error-message"]}>{errors.principal}</p>
                )}
              </label>
              <label className={styles.label} htmlFor="code">
                Code
                <input
                  className={`${styles.input} ${
                    errors.code ? styles["error-input"] : ""
                  }`}
                  type="text"
                  id="code"
                  name="code"
                  value={allowancesData.code}
                  onChange={handleInputChange}
                />
                {errors.code && (
                  <p className={styles["error-message"]}>{errors.code}</p>
                )}
              </label>
              <label className={styles.label} htmlFor="trip_type">
                Trip Type
                <Select
                  className={`${styles.input} ${
                    errors.tripType ? styles["error-input"] : ""
                  }`}
                  styles={{
                    control: (base, state) => ({
                      ...base,
                      borderColor: state.isFocused
                        ? "var(--text-secondary)"
                        : "var(--borders)",
                      boxShadow: state.isFocused
                        ? "0 0 4px rgba(109, 118, 126, 0.8)"
                        : state.isHovered
                        ? "0 0 4px rgba(109, 118, 126, 0.8)"
                        : "none",
                      backgroundColor: isDarkMode
                        ? "var(--cards)"
                        : "var(--background)",
                      color: "var(--text-primary)",
                      "&:hover": {
                        borderColor: "var(--text-secondary)",
                        boxShadow: "0 0 4px rgba(109, 118, 126, 0.8)",
                      },
                      transition: "all 0.3s ease-in-out",
                      cursor: "pointer",
                    }),
                    menu: (base) => ({
                      ...base,
                      backgroundColor: isDarkMode
                        ? "var(--cards)"
                        : "var(--background)",
                      color: "var(--text-primary)",
                      border: `1px solid var(--borders)`,
                    }),
                    option: (base, state) => ({
                      ...base,
                      backgroundColor: state.isSelected
                        ? isDarkMode
                          ? "#333333"
                          : "#e9ecef"
                        : state.isFocused
                        ? isDarkMode
                          ? "#2a2a2a"
                          : "#f8f9fa"
                        : base.backgroundColor,
                      color: "var(--text-primary)",
                      cursor: "pointer",
                      "&:hover": {
                        backgroundColor: isDarkMode ? "#2a2a2a" : "#f8f9fa",
                      },
                    }),
                    singleValue: (base) => ({
                      ...base,
                      color: "var(--text-primary)",
                    }),
                    placeholder: (base) => ({
                      ...base,
                      color: "var(--text-secondary)",
                    }),
                    input: (base) => ({
                      ...base,
                      color: "var(--text-primary)",
                    }),
                  }}
                  id="trip_type"
                  name="tripType"
                  options={tripTypeOptions}
                  value={
                    tripTypeOptions.find(
                      (opt) => opt.value === allowancesData.tripType
                    ) || null
                  }
                  onChange={(selected) =>
                    setAllowancesData((prev) => ({
                      ...prev,
                      tripType: selected?.value || "",
                    }))
                  }
                  placeholder="Select Principal"
                />
                {errors.tripType && (
                  <p className={styles["error-message"]}>{errors.tripType}</p>
                )}
              </label>
              <label className={styles.label} htmlFor="source">
                Source
                <input
                  className={`${styles.input} ${
                    errors.source ? styles["error-input"] : ""
                  }`}
                  type="text"
                  id="source"
                  name="source"
                  value={allowancesData.source}
                  onChange={handleInputChange}
                />
                {errors.source && (
                  <p className={styles["error-message"]}>{errors.source}</p>
                )}
              </label>
              <label className={styles.label} htmlFor="destination">
                Destination
                <input
                  className={`${styles.input} ${
                    errors.destination ? styles["error-input"] : ""
                  }`}
                  type="text"
                  id="destination"
                  name="destination"
                  value={allowancesData.destination}
                  onChange={handleInputChange}
                />
                {errors.destination && (
                  <p className={styles["error-message"]}>
                    {errors.destination}
                  </p>
                )}
              </label>
              <label className={styles.label} htmlFor="fuel_10w">
                Fuel 10W
                <input
                  className={`${styles.input} ${
                    errors.fuel10w ? styles["error-input"] : ""
                  }`}
                  type="number"
                  id="fuel_10w"
                  name="fuel10w"
                  value={allowancesData.fuel10w}
                  onChange={handleInputChange}
                />
                {errors.fuel10w && (
                  <p className={styles["error-message"]}>{errors.fuel10w}</p>
                )}
              </label>
              <label className={styles.label} htmlFor="fuel_6wf">
                Fuel 6WF
                <input
                  className={`${styles.input} ${
                    errors.fuel6wf ? styles["error-input"] : ""
                  }`}
                  type="number"
                  id="fuel_6wf"
                  name="fuel6wf"
                  value={allowancesData.fuel6wf}
                  onChange={handleInputChange}
                />
                {errors.fuel6wf && (
                  <p className={styles["error-message"]}>{errors.fuel6wf}</p>
                )}
              </label>
              <label className={styles.label} htmlFor="fuel_6wc4wc">
                Fuel 6WF/4WC
                <input
                  className={`${styles.input} ${
                    errors.fuel6wc4w ? styles["error-input"] : ""
                  }`}
                  type="number"
                  id="fuel_6wc4wc"
                  name="fuel6wc4w"
                  value={allowancesData.fuel6wc4w}
                  onChange={handleInputChange}
                />
                {errors.fuel6wc4w && (
                  <p className={styles["error-message"]}>{errors.fuel6wc4w}</p>
                )}
              </label>
              <label className={styles.label} htmlFor="days_for_meals">
                Number of Days for Meals
                <input
                  className={`${styles.input} ${
                    errors.daysForMeals ? styles["error-input"] : ""
                  }`}
                  type="number"
                  id="days_for_meals"
                  name="daysForMeals"
                  value={allowancesData.daysForMeals}
                  onChange={handleInputChange}
                />
                {errors.daysForMeals && (
                  <p className={styles["error-message"]}>
                    {errors.daysForMeals}
                  </p>
                )}
              </label>
              <label className={styles.label} htmlFor="allowance_10w">
                Allowance 10W
                <input
                  className={`${styles.input} ${
                    errors.allowance10w ? styles["error-input"] : ""
                  }`}
                  type="number"
                  id="allowance_10w"
                  name="allowance10w"
                  value={allowancesData.allowance10w}
                  onChange={handleInputChange}
                />
                {errors.allowance10w && (
                  <p className={styles["error-message"]}>
                    {errors.allowance10w}
                  </p>
                )}
              </label>
              <label className={styles.label} htmlFor="allowance_6wf">
                Allowance 6WF
                <input
                  className={`${styles.input} ${
                    errors.allowance6wf ? styles["error-input"] : ""
                  }`}
                  type="number"
                  id="allowance_6wf"
                  name="allowance6wf"
                  value={allowancesData.allowance6wf}
                  onChange={handleInputChange}
                />
                {errors.allowance6wf && (
                  <p className={styles["error-message"]}>
                    {errors.allowance6wf}
                  </p>
                )}
              </label>
              <label className={styles.label} htmlFor="allowance_6wc4wc">
                Allowance 6WF/4WC
                <input
                  className={`${styles.input} ${
                    errors.allowance6wc4w ? styles["error-input"] : ""
                  }`}
                  type="number"
                  id="allowance_6wc4wc"
                  name="allowance6wc4w"
                  value={allowancesData.allowance6wc4w}
                  onChange={handleInputChange}
                />
                {errors.allowance6wc4w && (
                  <p className={styles["error-message"]}>
                    {errors.allowance6wc4w}
                  </p>
                )}
              </label>
              <label className={styles.label} htmlFor="shipping_10w">
                Shipping 10W
                <input
                  className={`${styles.input} ${
                    errors.shipping10w ? styles["error-input"] : ""
                  }`}
                  type="number"
                  id="shipping_10w"
                  name="shipping10w"
                  value={allowancesData.shipping10w}
                  onChange={handleInputChange}
                />
                {errors.shipping10w && (
                  <p className={styles["error-message"]}>
                    {errors.shipping10w}
                  </p>
                )}
              </label>
              <label className={styles.label} htmlFor="shipping_6wf">
                Shipping 6WF
                <input
                  className={`${styles.input} ${
                    errors.shipping6wf ? styles["error-input"] : ""
                  }`}
                  type="number"
                  id="shipping_6wf"
                  name="shipping6wf"
                  value={allowancesData.shipping6wf}
                  onChange={handleInputChange}
                />
                {errors.shipping6wf && (
                  <p className={styles["error-message"]}>
                    {errors.shipping6wf}
                  </p>
                )}
              </label>
              <label className={styles.label} htmlFor="shipping_6wc4wc">
                Shipping 6WF/4WC
                <input
                  className={`${styles.input} ${
                    errors.shipping6wc4w ? styles["error-input"] : ""
                  }`}
                  type="number"
                  id="shipping_6wc4wc"
                  name="shipping6wc4w"
                  value={allowancesData.shipping6wc4w}
                  onChange={handleInputChange}
                />
                {errors.shipping6wc4w && (
                  <p className={styles["error-message"]}>
                    {errors.shipping6wc4w}
                  </p>
                )}
              </label>
              {errors.apiError && (
                <p className={styles["error-message"]}>{errors.apiError}</p>
              )}
              <button className={styles["submit-button"]}>Submit</button>
            </form>
          </div>
        </Modal>
      )}
      {isEditModalOpen && selectedAllowance && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
        >
          <div className={styles["modal-container"]}>
            <div className={styles["modal-header-container"]}>
              <h3 className={styles["modal-title"]}>Edit Allowance</h3>
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
              onSubmit={handleEditAllowance}
            >
              <label className={styles.label} htmlFor="principal">
                Principal
                <Select
                  className={`${styles.input} ${
                    errors.principal ? styles["error-input"] : ""
                  }`}
                  styles={{
                    control: (base, state) => ({
                      ...base,
                      borderColor: state.isFocused
                        ? "var(--text-secondary)"
                        : "var(--borders)",
                      boxShadow: state.isFocused
                        ? "0 0 4px rgba(109, 118, 126, 0.8)"
                        : state.isHovered
                        ? "0 0 4px rgba(109, 118, 126, 0.8)"
                        : "none",
                      backgroundColor: isDarkMode
                        ? "var(--cards)"
                        : "var(--background)",
                      color: "var(--text-primary)",
                      "&:hover": {
                        borderColor: "var(--text-secondary)",
                        boxShadow: "0 0 4px rgba(109, 118, 126, 0.8)",
                      },
                      transition: "all 0.3s ease-in-out",
                      cursor: "pointer",
                    }),
                    menu: (base) => ({
                      ...base,
                      backgroundColor: isDarkMode
                        ? "var(--cards)"
                        : "var(--background)",
                      color: "var(--text-primary)",
                      border: `1px solid var(--borders)`,
                    }),
                    option: (base, state) => ({
                      ...base,
                      backgroundColor: state.isSelected
                        ? isDarkMode
                          ? "#333333"
                          : "#e9ecef"
                        : state.isFocused
                        ? isDarkMode
                          ? "#2a2a2a"
                          : "#f8f9fa"
                        : base.backgroundColor,
                      color: "var(--text-primary)",
                      cursor: "pointer",
                      "&:hover": {
                        backgroundColor: isDarkMode ? "#2a2a2a" : "#f8f9fa",
                      },
                    }),
                    singleValue: (base) => ({
                      ...base,
                      color: "var(--text-primary)",
                    }),
                    placeholder: (base) => ({
                      ...base,
                      color: "var(--text-secondary)",
                    }),
                    input: (base) => ({
                      ...base,
                      color: "var(--text-primary)",
                    }),
                  }}
                  id="principal"
                  name="principal"
                  options={principalOptions}
                  value={
                    principalOptions.find(
                      (opt) => opt.value === allowancesData.principal
                    ) || null
                  }
                  onChange={(selected) =>
                    setAllowancesData((prev) => ({
                      ...prev,
                      principal: selected?.value || "",
                    }))
                  }
                  placeholder="Select Principal"
                />
                {errors.principal && (
                  <p className={styles["error-message"]}>{errors.principal}</p>
                )}
              </label>
              <label className={styles.label} htmlFor="code">
                Code
                <input
                  className={`${styles.input} ${
                    errors.code ? styles["error-input"] : ""
                  }`}
                  type="text"
                  id="code"
                  name="code"
                  value={allowancesData.code}
                  onChange={handleInputChange}
                />
                {errors.code && (
                  <p className={styles["error-message"]}>{errors.code}</p>
                )}
              </label>
              <label className={styles.label} htmlFor="trip_type">
                Trip Type
                <Select
                  className={`${styles.input} ${
                    errors.tripType ? styles["error-input"] : ""
                  }`}
                  styles={{
                    control: (base, state) => ({
                      ...base,
                      borderColor: state.isFocused
                        ? "var(--text-secondary)"
                        : "var(--borders)",
                      boxShadow: state.isFocused
                        ? "0 0 4px rgba(109, 118, 126, 0.8)"
                        : state.isHovered
                        ? "0 0 4px rgba(109, 118, 126, 0.8)"
                        : "none",
                      backgroundColor: isDarkMode
                        ? "var(--cards)"
                        : "var(--background)",
                      color: "var(--text-primary)",
                      "&:hover": {
                        borderColor: "var(--text-secondary)",
                        boxShadow: "0 0 4px rgba(109, 118, 126, 0.8)",
                      },
                      transition: "all 0.3s ease-in-out",
                      cursor: "pointer",
                    }),
                    menu: (base) => ({
                      ...base,
                      backgroundColor: isDarkMode
                        ? "var(--cards)"
                        : "var(--background)",
                      color: "var(--text-primary)",
                      border: `1px solid var(--borders)`,
                    }),
                    option: (base, state) => ({
                      ...base,
                      backgroundColor: state.isSelected
                        ? isDarkMode
                          ? "#333333"
                          : "#e9ecef"
                        : state.isFocused
                        ? isDarkMode
                          ? "#2a2a2a"
                          : "#f8f9fa"
                        : base.backgroundColor,
                      color: "var(--text-primary)",
                      cursor: "pointer",
                      "&:hover": {
                        backgroundColor: isDarkMode ? "#2a2a2a" : "#f8f9fa",
                      },
                    }),
                    singleValue: (base) => ({
                      ...base,
                      color: "var(--text-primary)",
                    }),
                    placeholder: (base) => ({
                      ...base,
                      color: "var(--text-secondary)",
                    }),
                    input: (base) => ({
                      ...base,
                      color: "var(--text-primary)",
                    }),
                  }}
                  id="trip_type"
                  name="tripType"
                  options={tripTypeOptions}
                  value={
                    tripTypeOptions.find(
                      (opt) => opt.value === allowancesData.tripType
                    ) || null
                  }
                  onChange={(selected) =>
                    setAllowancesData((prev) => ({
                      ...prev,
                      tripType: selected?.value || "",
                    }))
                  }
                  placeholder="Select Principal"
                />
                {errors.tripType && (
                  <p className={styles["error-message"]}>{errors.tripType}</p>
                )}
              </label>
              <label className={styles.label} htmlFor="source">
                Source
                <input
                  className={`${styles.input} ${
                    errors.source ? styles["error-input"] : ""
                  }`}
                  type="text"
                  id="source"
                  name="source"
                  value={allowancesData.source}
                  onChange={handleInputChange}
                />
                {errors.source && (
                  <p className={styles["error-message"]}>{errors.source}</p>
                )}
              </label>
              <label className={styles.label} htmlFor="destination">
                Destination
                <input
                  className={`${styles.input} ${
                    errors.destination ? styles["error-input"] : ""
                  }`}
                  type="text"
                  id="destination"
                  name="destination"
                  value={allowancesData.destination}
                  onChange={handleInputChange}
                />
                {errors.destination && (
                  <p className={styles["error-message"]}>
                    {errors.destination}
                  </p>
                )}
              </label>
              <label className={styles.label} htmlFor="fuel_10w">
                Fuel 10W
                <input
                  className={`${styles.input} ${
                    errors.fuel10w ? styles["error-input"] : ""
                  }`}
                  type="number"
                  id="fuel_10w"
                  name="fuel10W"
                  value={allowancesData.fuel10w}
                  onChange={handleInputChange}
                />
                {errors.fuel10w && (
                  <p className={styles["error-message"]}>{errors.fuel10w}</p>
                )}
              </label>
              <label className={styles.label} htmlFor="fuel_6wf">
                Fuel 6WF
                <input
                  className={`${styles.input} ${
                    errors.fuel6wf ? styles["error-input"] : ""
                  }`}
                  type="number"
                  id="fuel_6wf"
                  name="fuel6wf"
                  value={allowancesData.fuel6wf}
                  onChange={handleInputChange}
                />
                {errors.fuel6wf && (
                  <p className={styles["error-message"]}>{errors.fuel6wf}</p>
                )}
              </label>
              <label className={styles.label} htmlFor="fuel_6wc4wc">
                Fuel 6WF/4WC
                <input
                  className={`${styles.input} ${
                    errors.fuel6wc4w ? styles["error-input"] : ""
                  }`}
                  type="number"
                  id="fuel_6wc4wc"
                  name="fuel6wc4w"
                  value={allowancesData.fuel6wc4w}
                  onChange={handleInputChange}
                />
                {errors.fuel6wc4w && (
                  <p className={styles["error-message"]}>{errors.fuel6wc4w}</p>
                )}
              </label>
              <label className={styles.label} htmlFor="days_for_meals">
                Number of Days for Meals
                <input
                  className={`${styles.input} ${
                    errors.daysForMeals ? styles["error-input"] : ""
                  }`}
                  type="number"
                  id="days_for_meals"
                  name="daysForMeals"
                  value={allowancesData.daysForMeals}
                  onChange={handleInputChange}
                />
                {errors.daysForMeals && (
                  <p className={styles["error-message"]}>
                    {errors.daysForMeals}
                  </p>
                )}
              </label>
              <label className={styles.label} htmlFor="allowance_10w">
                Allowance 10W
                <input
                  className={`${styles.input} ${
                    errors.allowance10w ? styles["error-input"] : ""
                  }`}
                  type="number"
                  id="allowance_10w"
                  name="allowance10W"
                  value={allowancesData.allowance10w}
                  onChange={handleInputChange}
                />
                {errors.allowance10w && (
                  <p className={styles["error-message"]}>
                    {errors.allowance10w}
                  </p>
                )}
              </label>
              <label className={styles.label} htmlFor="allowance_6wf">
                Allowance 6WF
                <input
                  className={`${styles.input} ${
                    errors.allowance6wf ? styles["error-input"] : ""
                  }`}
                  type="number"
                  id="allowance_6wf"
                  name="allowance6wf"
                  value={allowancesData.allowance6wf}
                  onChange={handleInputChange}
                />
                {errors.allowance6wf && (
                  <p className={styles["error-message"]}>
                    {errors.allowance6wf}
                  </p>
                )}
              </label>
              <label className={styles.label} htmlFor="allowance_6wc4wc">
                Allowance 6WF/4WC
                <input
                  className={`${styles.input} ${
                    errors.allowance6wc4w ? styles["error-input"] : ""
                  }`}
                  type="number"
                  id="allowance_6wc4wc"
                  name="allowance6wc4w"
                  value={allowancesData.allowance6wc4w}
                  onChange={handleInputChange}
                />
                {errors.allowance6wc4w && (
                  <p className={styles["error-message"]}>
                    {errors.allowance6wc4w}
                  </p>
                )}
              </label>
              <label className={styles.label} htmlFor="shipping_10w">
                Shipping 10W
                <input
                  className={`${styles.input} ${
                    errors.shipping10w ? styles["error-input"] : ""
                  }`}
                  type="number"
                  id="shipping_10w"
                  name="shipping10W"
                  value={allowancesData.shipping10w}
                  onChange={handleInputChange}
                />
                {errors.shipping10w && (
                  <p className={styles["error-message"]}>
                    {errors.shipping10w}
                  </p>
                )}
              </label>
              <label className={styles.label} htmlFor="shipping_6wf">
                Shipping 6WF
                <input
                  className={`${styles.input} ${
                    errors.shipping6wf ? styles["error-input"] : ""
                  }`}
                  type="number"
                  id="shipping_6wf"
                  name="shipping6wf"
                  value={allowancesData.shipping6wf}
                  onChange={handleInputChange}
                />
                {errors.shipping6wf && (
                  <p className={styles["error-message"]}>
                    {errors.shipping6wf}
                  </p>
                )}
              </label>
              <label className={styles.label} htmlFor="shipping_6wc4wc">
                Shipping 6WF/4WC
                <input
                  className={`${styles.input} ${
                    errors.shipping6wc4w ? styles["error-input"] : ""
                  }`}
                  type="number"
                  id="shipping_6wc4wc"
                  name="shipping6wc4w"
                  value={allowancesData.shipping6wc4w}
                  onChange={handleInputChange}
                />
                {errors.shipping6wc4w && (
                  <p className={styles["error-message"]}>
                    {errors.shipping6wc4w}
                  </p>
                )}
              </label>
              {errors.apiError && (
                <p className={styles["error-message"]}>{errors.apiError}</p>
              )}
              <button className={styles["submit-button"]}>Submit</button>
            </form>
          </div>
        </Modal>
      )}
      {isDeleteModalOpen && selectedAllowance && (
        <Modal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
        >
          <div
            className={`${styles["modal-container"]} ${styles["delete-modal-container"]}`}
          >
            <h1 className={styles["delete-modal-header"]}>
              Are you sure to delete this allowance?
            </h1>
            <div className={styles["delete-modal-button-container"]}>
              <button
                className={styles["delete-modal-button"]}
                onClick={handleDeleteAllowance}
              >
                Delete
              </button>
              <button
                className={styles["cancel-delete-modal-button"]}
                onClick={closeDeleteModal}
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

export default OPSAllowance;
