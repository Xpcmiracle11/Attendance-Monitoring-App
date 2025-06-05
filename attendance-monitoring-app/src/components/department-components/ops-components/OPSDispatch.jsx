import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import Modal from "../../Modal";
import Map from "../../Map";
import styles from "../../../assets/styles/OPSDispatch.module.css";
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
import Select from "react-select";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Document, Packer, Paragraph, Table, TableRow, TableCell } from "docx";
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

const OPSDispatch = () => {
  const [dispatches, setDispatches] = useState([]);
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
  const [selectedDispatch, setSelectedDispatch] = useState(null);
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
  const [dispatchesData, setDispatchesData] = useState({
    trucker: "",
    driver: "",
    plateNumber: "",
    cargoType: "",
    boundFrom: "",
    boundTo: "",
  });
  const [errors, setErrors] = useState({
    trucker: "",
    driver: "",
    plateNumber: "",
    cargoType: "",
    boundFrom: "",
    boundTo: "",
    apiError: "",
  });

  const isDarkMode =
    document.documentElement.getAttribute("data-theme") === "dark";

  const fetchDispatches = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/dispatches`);
      if (response.data.success) {
        setDispatches(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching dispatches:", error);
    }
  };
  useEffect(() => {
    fetchDispatches();
  }, []);

  const filteredDispatches = dispatches
    .filter((dispatch) => {
      const driverName = (dispatch.driver_name || "").toLowerCase();
      const matchesSearch = driverName.includes(search.toLowerCase());

      const dispatchDate = dispatch.created_at
        ? new Date(dispatch.created_at.split("T")[0])
        : new Date();
      const iswithinDateRange =
        (!appliedFromDate || dispatchDate >= new Date(appliedFromDate)) &&
        (!appliedToDate || dispatchDate <= new Date(appliedToDate));

      return matchesSearch && iswithinDateRange;
    })
    .sort((a, b) => {
      if (sortOrder === "date-asc")
        return new Date(a.created_at) - new Date(b.created_at);
      if (sortOrder === "date-desc")
        return new Date(b.created_at) - new Date(a.created_at);
      if (sortOrder === "driver_name-asc")
        return a.driver_name.localeCompare(b.driver_name);
      if (sortOrder === "driver_name-desc")
        return b.driver_name.localeCompare(a.driver_name);
      return 0;
    });

  const totalPages = Math.ceil(filteredDispatches.length / itemsPerPage);
  const paginatedDispatches = filteredDispatches.slice(
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
    "Trucker",
    "Driver",
    "Plate Number",
    "Cargo Type",
    "Bound From",
    "Bound To",
    "Created At",
  ];

  const exportToExcel = (data) => {
    const formattedData = data.map((item, index) => ({
      ID: index + 1,
      Trucker: item.trucker,
      Driver: item.driver_name,
      "Plate Number": item.plate_number,
      "Cargo Type": item.cargo_type,
      "Bound From": item.bound_from,
      "Bound To": item.bound_to,
      "Created At": formatDate(item.created_at),
    }));

    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Dispatches");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
    });

    saveAs(blob, "dispatches.xlsx");
  };

  const exportToPDF = (data) => {
    const doc = new jsPDF();

    doc.text("Dispatches Report", 14, 10);

    const tableRows = data.map((item, index) => [
      index + 1,
      item.trucker || "",
      item.driver_name || "",
      item.plate_number || "",
      item.cargo_type || "",
      item.bound_from || "",
      item.bound_to || "",
      formatDate(item.created_at),
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 20,
    });

    doc.save("dispatches.pdf");
  };

  const exportToWord = (data) => {
    const columnKeyMap = {
      ID: "id",
      Trucker: "trucker",
      Driver: "driver_name",
      "Plate Number": "plate_number",
      "Cargo Type": "cargo_type",
      "Bound From": "bound_from",
      "Bound To": "bound_to",
      "Created At": "created_at",
    };

    const tableRows = data.map((item, index) => {
      return new TableRow({
        children: tableColumn.map((column) => {
          const key = columnKeyMap[column];
          const value =
            column === "ID"
              ? (index + 1).toString()
              : column === "Created At"
              ? formatDate(item[key])
              : item[key]
              ? item[key].toString()
              : "";
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
            new Paragraph("Exported Data"),
            new Table({ rows: tableRows }),
          ],
        },
      ],
    });

    Packer.toBlob(doc).then((blob) => {
      saveAs(blob, "dispatches.docx");
    });
  };

  const handleExport = () => {
    if (!exportFileType) {
      setExportError("Please select an export format.");
      return;
    }

    const filteredData = dispatches.filter((dispatch) => {
      const dispatchDate = dispatch.created_at
        ? new Date(dispatch.created_at.split("T")[0])
        : new Date();
      return (
        (!exportFromDate || dispatchDate >= new Date(exportFromDate)) &&
        (!exportToDate || dispatchDate <= new Date(exportToDate))
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

  const [driverOptions, setDriverOptions] = useState([]);
  useEffect(() => {
    axios
      .get(`${API_BASE_URL}/users`)
      .then((response) => {
        if (response.data.success && Array.isArray(response.data.data)) {
          const filteredUsers = response.data.data.filter(
            (user) =>
              user.department_name === "Operations" &&
              user.role === "Driver" &&
              !dispatches.some((dispatch) => dispatch.driver_id === user.id)
          );
          const options = filteredUsers.map((user) => ({
            value: String(user.id),
            label: user.full_name,
          }));
          setDriverOptions(options);
        } else {
          console.error("Invalid data format:", response.data);
        }
      })
      .catch((error) => {
        console.error("Error fetching drivers:", error);
      });
  }, [dispatches]);

  const [plateNumberOptions, setPlateNumberOptions] = useState([]);

  useEffect(() => {
    axios
      .get(`${API_BASE_URL}/trucks`)
      .then((response) => {
        if (response.data.success && Array.isArray(response.data.data)) {
          const filteredTrucks = response.data.data.filter(
            (truck) =>
              !dispatches.some(
                (dispatch) => dispatch.plate_number_id === truck.id
              )
          );
          const options = filteredTrucks.map((truck) => ({
            value: String(truck.id),
            label: truck.plate_number,
          }));
          setPlateNumberOptions(options);
        } else {
          console.error("Invalid data format:", response.data);
        }
      })
      .catch((error) => {
        console.error("Error fetching trucks:", error);
      });
  }, [dispatches]);

  const cargoTypeOptions = [
    {
      value: "Nestle",
      label: "Nestle",
    },
    {
      value: "Nestle Empty",
      label: "Nestle Empty",
    },
    {
      value: "Panasonic",
      label: "Panasonic",
    },
    {
      value: "Panasonic Empty",
      label: "Panasonic Empty",
    },
    {
      value: "Unilab",
      label: "Unilab",
    },
    {
      value: "Unilab Empty",
      label: "Unilab Empty",
    },
    {
      value: "With Backload",
      label: "With Backload",
    },
  ];
  const toggleAddModal = () => {
    setIsAddModalOpen(!isAddModalOpen);
    setErrors({
      trucker: "",
      driver: "",
      cargoType: "",
      boundFrom: "",
      boundTo: "",
      plateNumber: "",
      apiError: "",
    });
  };

  const closeAddModal = () => {
    setIsAddModalOpen(false);
    setDispatchesData({
      trucker: "",
      driver: "",
      plateNumber: "",
      cargoType: "",
      boundFrom: "",
      boundTo: "",
    });
    setErrors({
      trucker: "",
      driver: "",
      plateNumber: "",
      cargoType: "",
      boundFrom: "",
      boundTo: "",
      apiError: "",
    });
  };

  const handleInputChange = (eventOrValue, name, value) => {
    if (eventOrValue && eventOrValue.target) {
      const { name, value } = eventOrValue.target;
      setDispatchesData((prevData) => ({
        ...prevData,
        [name]: value,
      }));
      setErrors((prevErrors) => ({
        ...prevErrors,
        [name]: "",
      }));
    } else {
      setDispatchesData((prevData) => ({
        ...prevData,
        [name]: value,
      }));
      setErrors((prevErrors) => ({
        ...prevErrors,
        [name]: "",
      }));
    }
  };

  const handleAddDispatch = async (e) => {
    e.preventDefault();

    setErrors({
      trucker: "",
      driver: "",
      plateNumber: "",
      cargoType: "",
      boundFrom: "",
      boundTo: "",
      apiError: "",
    });

    let hasError = false;

    if (!dispatchesData.trucker.trim()) {
      setErrors((prev) => ({
        ...prev,
        trucker: "Trucker name is required.",
      }));
      hasError = true;
    }
    if (!dispatchesData.driver.trim()) {
      setErrors((prev) => ({
        ...prev,
        driver: "Driver is required.",
      }));
      hasError = true;
    }
    if (!dispatchesData.plateNumber.trim()) {
      setErrors((prev) => ({
        ...prev,
        plateNumber: "Plate Number is required.",
      }));
      hasError = true;
    }
    if (!dispatchesData.cargoType.trim()) {
      setErrors((prev) => ({
        ...prev,
        cargoType: "Cargo type is required.",
      }));
      hasError = true;
    }
    if (!dispatchesData.boundFrom.trim()) {
      setErrors((prev) => ({
        ...prev,
        boundFrom: "Plate Number is required.",
      }));
      hasError = true;
    }
    if (!dispatchesData.boundTo.trim()) {
      setErrors((prev) => ({
        ...prev,
        boundTo: "Bound to is required.",
      }));
      hasError = true;
    }

    if (hasError) return;

    try {
      const response = await axios.post(`${API_BASE_URL}/insert-dispatch`, {
        trucker: dispatchesData.trucker,
        driver_id: dispatchesData.driver,
        plate_number_id: dispatchesData.plateNumber,
        cargo_type: dispatchesData.cargoType,
        bound_from: dispatchesData.boundFrom,
        bound_to: dispatchesData.boundTo,
      });
      if (response.data.success) {
        setDispatches((prevDispatches) => [
          ...prevDispatches,
          {
            trucker: dispatchesData.trucker,
            driver_id: dispatchesData.driver,
            plate_number_id: dispatchesData.plateNumber,
            cargo_type: dispatchesData.cargoType,
            bound_from: dispatchesData.boundFrom,
            bound_to: dispatchesData.boundTo,
          },
        ]);
        fetchDispatches();
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
        apiError: error.response?.data?.message === "Failed to add attendance.",
      }));
    }
  };

  const toggleEditModal = (dispatch = null) => {
    setSelectedDispatch(dispatch);
    setDispatchesData({
      trucker: dispatch?.trucker || "",
      driver: dispatch?.driver_id ? String(dispatch.driver_id) : "",
      plateNumber: dispatch?.plate_number_id || "",
      cargoType: dispatch?.cargo_type || "",
      boundFrom: dispatch?.bound_from || "",
      boundTo: dispatch?.bound_to || "",
    });
    setIsEditModalOpen(true);
    setErrors({
      trucker: "",
      driver: "",
      plateNumber: "",
      cargoType: "",
      boundFrom: "",
      boundTo: "",
      apiError: "",
    });
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedDispatch(null);
    setDispatchesData({
      trucker: "",
      driver: "",
      plateNumber: "",
      cargoType: "",
      boundFrom: "",
      boundTo: "",
    });
    setErrors({
      trucker: "",
      driver: "",
      plateNumber: "",
      cargoType: "",
      boundFrom: "",
      boundTo: "",
    });
  };

  const handleEditDispatch = async (e) => {
    e.preventDefault();

    setErrors({
      trucker: "",
      driver: "",
      plateNumber: "",
      cargoType: "",
      boundFrom: "",
      boundTo: "",
    });

    if (!selectedDispatch || !selectedDispatch.id) {
      setErrors((prev) => ({
        ...prev,
        apiError: "Invalid dispatch selected.",
      }));
      return;
    }

    let hasError = false;

    if (!dispatchesData.trucker.trim()) {
      setErrors((prev) => ({
        ...prev,
        trucker: "Trucker name is required.",
      }));
      hasError = true;
    }
    if (!dispatchesData.driver.trim()) {
      setErrors((prev) => ({
        ...prev,
        driver: "Driver is required.",
      }));
      hasError = true;
    }
    if (!dispatchesData.plateNumber) {
      setErrors((prev) => ({
        ...prev,
        plateNumber: "Plate Number is required.",
      }));
      hasError = true;
    }
    if (!dispatchesData.cargoType.trim()) {
      setErrors((prev) => ({
        ...prev,
        cargoType: "Cargo type is required.",
      }));
      hasError = true;
    }
    if (!dispatchesData.boundFrom.trim()) {
      setErrors((prev) => ({
        ...prev,
        boundFrom: "Plate Number is required.",
      }));
      hasError = true;
    }
    if (!dispatchesData.boundTo.trim()) {
      setErrors((prev) => ({
        ...prev,
        boundTo: "Bound to is required.",
      }));
      hasError = true;
    }

    if (hasError) return;

    try {
      const response = await axios.put(
        `${API_BASE_URL}/update-dispatch/${selectedDispatch.id}`,
        {
          trucker: dispatchesData.trucker,
          driver_id: dispatchesData.driver,
          plate_number_id: dispatchesData.plateNumber,
          cargo_type: dispatchesData.cargoType,
          bound_from: dispatchesData.boundFrom,
          bound_to: dispatchesData.boundTo,
        }
      );
      if (response.data.success) {
        setDispatches((prevDispatches) =>
          prevDispatches.map((dispatch) =>
            dispatch.id === selectedDispatch.id
              ? {
                  ...dispatch,
                  trucker: dispatchesData.trucker,
                  driver_id: dispatchesData.driver,
                  plate_number_id: dispatchesData.plateNumber,
                  cargo_type: dispatchesData.cargoType,
                  bound_from: dispatchesData.boundFrom,
                  bound_to: dispatchesData.boundTo,
                }
              : dispatch
          )
        );
        fetchDispatches();
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
          error.response?.data?.message === "Failed to update dispatch.",
      }));
    }
  };

  const toggleDeleteModal = (dispatch = null) => {
    setSelectedDispatch(dispatch);
    setIsDeleteModalOpen(!isDeleteModalOpen);
  };

  const closeDeleteModal = () => {
    setSelectedDispatch(null);
    setIsDeleteModalOpen(false);
  };

  const handleDeleteDispatch = async () => {
    if (!selectedDispatch) return;

    try {
      const response = await axios.delete(
        `${API_BASE_URL}/delete-dispatch/${selectedDispatch.id}`
      );

      if (response.data.success) {
        setDispatches((prevDispatches) =>
          prevDispatches.filter(
            (dispatch) => dispatch.id !== selectedDispatch.id
          )
        );
        fetchDispatches();
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
    <div className={styles["dispatch-content"]}>
      <div className={styles["content-header-container"]}>
        <h1 className={styles["page-title"]}>Dispatch</h1>
      </div>
      <div className={styles["content-body-container"]}>
        <div className={styles["add-dispatch-button-container"]}>
          <button
            className={styles["add-dispatch-button"]}
            onClick={toggleAddModal}
          >
            Add Dispatch
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
                          checked={tempSortOrder === "driver_name-asc"}
                          onChange={() => setTempSortOrder("driver_name-asc")}
                        />
                        A-Z
                      </label>
                      <label className={styles["sort-label"]} htmlFor="z-a">
                        <input
                          className={styles["sort-input"]}
                          id="z-a"
                          type="radio"
                          name="sort"
                          checked={tempSortOrder === "driver_name-desc"}
                          onChange={() => setTempSortOrder("driver_name-desc")}
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
                <th className={styles.th}>Driver</th>
                <th className={styles.th}>Trucker</th>
                <th className={styles.th}>Plate Number</th>
                <th className={styles.th}>Cargo Type</th>
                <th className={styles.th}>Bound From</th>
                <th className={styles.th}>Bound To</th>
                <th className={styles.th}>Date</th>
                <th className={styles.th}>Status</th>
                <th className={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody className={styles.tbody}>
              {paginatedDispatches.map((dispatch, index) => (
                <tr className={styles.btr} key={index}>
                  <td className={styles.td}>
                    {index + 1}. {dispatch.driver_name}
                  </td>
                  <td className={styles.td}>{dispatch.trucker}</td>
                  <td className={styles.td}>{dispatch.plate_number}</td>
                  <td className={styles.td}>{dispatch.cargo_type}</td>
                  <td className={styles.td}>{dispatch.bound_from}</td>
                  <td className={styles.td}>{dispatch.bound_to}</td>
                  <td className={styles.td}>
                    {new Date(dispatch.created_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </td>
                  <td className={styles.td}>{dispatch.status}</td>
                  <td className={styles.td}>
                    <div className={styles["action-container"]}>
                      <button
                        className={styles["edit-button"]}
                        onMouseEnter={() => setIsEditHovered(index)}
                        onMouseLeave={() => setIsEditHovered(null)}
                        onClick={() => toggleEditModal(dispatch)}
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
                        onClick={() => toggleDeleteModal(dispatch)}
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
              {paginatedDispatches.length === 0 && (
                <tr className={styles.btr}>
                  <td
                    colSpan="8"
                    className={`${styles.td} ${styles["search-response"]}`}
                  >
                    No dispatches found.
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
              <h3 className={styles["modal-title"]}>Add Dispatch</h3>
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
              onSubmit={handleAddDispatch}
            >
              <label className={styles.label} htmlFor="trucker">
                Trucker
                <input
                  className={`${styles.input} ${
                    errors.trucker ? styles["error-input"] : ""
                  }`}
                  type="text"
                  id="trucker"
                  name="trucker"
                  value={dispatchesData.trucker}
                  onChange={handleInputChange}
                />
                {errors.trucker && (
                  <p className={styles["error-message"]}>{errors.trucker}</p>
                )}
              </label>
              <label className={styles.label} htmlFor="driver">
                Driver
                <Select
                  className={`${styles.input} ${
                    errors.driver ? styles["error-input"] : ""
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
                      color: isDarkMode
                        ? "var(--text-primary)"
                        : "var(--text-primary)",
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
                      color: isDarkMode
                        ? "var(--text-primary)"
                        : "var(--text-primary)",
                      border: `1px solid ${
                        isDarkMode ? "var(--borders)" : "var(--borders)"
                      }`,
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
                      color: state.isSelected
                        ? isDarkMode
                          ? "var(--text-primary)"
                          : "var(--text-primary)"
                        : base.color,
                      cursor: "pointer",
                      "&:hover": {
                        backgroundColor: isDarkMode ? "#2a2a2a" : "#f8f9fa",
                      },
                    }),
                    singleValue: (base) => ({
                      ...base,
                      color: isDarkMode
                        ? "var(--text-primary)"
                        : "var(--text-primary)",
                    }),
                    placeholder: (base) => ({
                      ...base,
                      color: isDarkMode
                        ? "var(--text-secondary)"
                        : "var(--text-secondary)",
                    }),
                    input: (base) => ({
                      ...base,
                      color: isDarkMode
                        ? "var(--text-primary)"
                        : "var(--text-primary)",
                    }),
                  }}
                  options={driverOptions}
                  placeholder="Select Driver"
                  name="driver"
                  id="driver"
                  value={driverOptions.find(
                    (option) => option.value === dispatchesData.driver
                  )}
                  onChange={(selectedOption) =>
                    handleInputChange(null, "driver", selectedOption.value)
                  }
                />
                {errors.driver && (
                  <p className={styles["error-message"]}>{errors.driver}</p>
                )}
              </label>
              <label className={styles.label} htmlFor="plate_number">
                Plate Number
                <Select
                  className={`${styles.input} ${
                    errors.plateNumber ? styles["error-input"] : ""
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
                      color: isDarkMode
                        ? "var(--text-primary)"
                        : "var(--text-primary)",
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
                      color: isDarkMode
                        ? "var(--text-primary)"
                        : "var(--text-primary)",
                      border: `1px solid ${
                        isDarkMode ? "var(--borders)" : "var(--borders)"
                      }`,
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
                      color: state.isSelected
                        ? isDarkMode
                          ? "var(--text-primary)"
                          : "var(--text-primary)"
                        : base.color,
                      cursor: "pointer",
                      "&:hover": {
                        backgroundColor: isDarkMode ? "#2a2a2a" : "#f8f9fa",
                      },
                    }),
                    singleValue: (base) => ({
                      ...base,
                      color: isDarkMode
                        ? "var(--text-primary)"
                        : "var(--text-primary)",
                    }),
                    placeholder: (base) => ({
                      ...base,
                      color: isDarkMode
                        ? "var(--text-secondary)"
                        : "var(--text-secondary)",
                    }),
                  }}
                  options={plateNumberOptions}
                  placeholder="Select Plate Number"
                  name="plateNumber"
                  id="plate_number"
                  value={plateNumberOptions.find(
                    (option) => option.value === dispatchesData.plateNumber
                  )}
                  onChange={(selectedOption) =>
                    handleInputChange(null, "plateNumber", selectedOption.value)
                  }
                />
                {errors.plateNumber && (
                  <p className={styles["error-message"]}>
                    {errors.plateNumber}
                  </p>
                )}
              </label>
              <label className={styles.label} htmlFor="cargo_type">
                Cargo Type
                <Select
                  className={`${styles.input} ${
                    errors.cargoType ? styles["error-input"] : ""
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
                      color: isDarkMode
                        ? "var(--text-primary)"
                        : "var(--text-primary)",
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
                      color: isDarkMode
                        ? "var(--text-primary)"
                        : "var(--text-primary)",
                      border: `1px solid ${
                        isDarkMode ? "var(--borders)" : "var(--borders)"
                      }`,
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
                      color: state.isSelected
                        ? isDarkMode
                          ? "var(--text-primary)"
                          : "var(--text-primary)"
                        : base.color,
                      cursor: "pointer",
                      "&:hover": {
                        backgroundColor: isDarkMode ? "#2a2a2a" : "#f8f9fa",
                      },
                    }),
                    singleValue: (base) => ({
                      ...base,
                      color: isDarkMode
                        ? "var(--text-primary)"
                        : "var(--text-primary)",
                    }),
                    placeholder: (base) => ({
                      ...base,
                      color: isDarkMode
                        ? "var(--text-secondary)"
                        : "var(--text-secondary)",
                    }),
                  }}
                  options={cargoTypeOptions}
                  placeholder="Select Cargo Type"
                  name="cargoType"
                  id="cargo_type"
                  value={cargoTypeOptions.find(
                    (option) => option.value === dispatchesData.cargoType
                  )}
                  onChange={(selectedOption) =>
                    handleInputChange(null, "cargoType", selectedOption.value)
                  }
                />
                {errors.cargoType && (
                  <p className={styles["error-message"]}>{errors.cargoType}</p>
                )}
              </label>
              <label className={styles.label} htmlFor="bound_from">
                Bound From
                <input
                  className={`${styles.input} ${
                    errors.boundFrom ? styles["error-input"] : ""
                  }`}
                  type="text"
                  id="bound_from"
                  name="boundFrom"
                  value={dispatchesData.boundFrom}
                  onChange={handleInputChange}
                />
                {errors.boundFrom && (
                  <p className={styles["error-message"]}>{errors.boundFrom}</p>
                )}
              </label>
              <label className={styles.label} htmlFor="bound_to">
                Bound To
                <input
                  className={`${styles.input} ${
                    errors.boundTo ? styles["error-input"] : ""
                  }`}
                  type="text"
                  id="bound_to"
                  name="boundTo"
                  value={dispatchesData.boundTo}
                  onChange={handleInputChange}
                />
                {errors.boundTo && (
                  <p className={styles["error-message"]}>{errors.boundTo}</p>
                )}
              </label>
              {/* <div>
                <Map />
              </div> */}
              {errors.apiError && (
                <p className={styles["error-message"]}>{errors.apiError}</p>
              )}
              <button className={styles["submit-button"]}>Submit</button>
            </form>
          </div>
        </Modal>
      )}
      {isEditModalOpen && selectedDispatch && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
        >
          <div className={styles["modal-container"]}>
            <div className={styles["modal-header-container"]}>
              <h3 className={styles["modal-title"]}>Edit Dispatch</h3>
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
              onSubmit={handleEditDispatch}
            >
              <label className={styles.label} htmlFor="trucker">
                Trucker
                <input
                  className={`${styles.input} ${
                    errors.trucker ? styles["error-input"] : ""
                  }`}
                  type="text"
                  id="trucker"
                  name="trucker"
                  value={dispatchesData.trucker}
                  onChange={handleInputChange}
                />
                {errors.trucker && (
                  <p className={styles["error-message"]}>{errors.trucker}</p>
                )}
              </label>
              <label className={styles.label} htmlFor="description">
                Driver
                <Select
                  className={`${styles.input} ${
                    errors.driver ? styles["error-input"] : ""
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
                      color: isDarkMode
                        ? "var(--text-primary)"
                        : "var(--text-primary)",
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
                      color: isDarkMode
                        ? "var(--text-primary)"
                        : "var(--text-primary)",
                      border: `1px solid ${
                        isDarkMode ? "var(--borders)" : "var(--borders)"
                      }`,
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
                      color: state.isSelected
                        ? isDarkMode
                          ? "var(--text-primary)"
                          : "var(--text-primary)"
                        : base.color,
                      cursor: "pointer",
                      "&:hover": {
                        backgroundColor: isDarkMode ? "#2a2a2a" : "#f8f9fa",
                      },
                    }),
                    singleValue: (base) => ({
                      ...base,
                      color: isDarkMode
                        ? "var(--text-primary)"
                        : "var(--text-primary)",
                    }),
                    placeholder: (base) => ({
                      ...base,
                      color: isDarkMode
                        ? "var(--text-secondary)"
                        : "var(--text-secondary)",
                    }),
                  }}
                  options={driverOptions}
                  placeholder="Select Driver"
                  name="driver"
                  id="driver"
                  value={driverOptions.find(
                    (option) => option.value === String(dispatchesData.driver)
                  )}
                  onChange={(selectedOption) =>
                    handleInputChange(null, "driver", selectedOption.value)
                  }
                />
                {errors.driver && (
                  <p className={styles["error-message"]}>{errors.driver}</p>
                )}
              </label>
              <label className={styles.label} htmlFor="plate_number">
                Plate Number
                <Select
                  className={`${styles.input} ${
                    errors.plateNumber ? styles["error-input"] : ""
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
                      color: isDarkMode
                        ? "var(--text-primary)"
                        : "var(--text-primary)",
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
                      color: isDarkMode
                        ? "var(--text-primary)"
                        : "var(--text-primary)",
                      border: `1px solid ${
                        isDarkMode ? "var(--borders)" : "var(--borders)"
                      }`,
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
                      color: state.isSelected
                        ? isDarkMode
                          ? "var(--text-primary)"
                          : "var(--text-primary)"
                        : base.color,
                      cursor: "pointer",
                      "&:hover": {
                        backgroundColor: isDarkMode ? "#2a2a2a" : "#f8f9fa",
                      },
                    }),
                    singleValue: (base) => ({
                      ...base,
                      color: isDarkMode
                        ? "var(--text-primary)"
                        : "var(--text-primary)",
                    }),
                    placeholder: (base) => ({
                      ...base,
                      color: isDarkMode
                        ? "var(--text-secondary)"
                        : "var(--text-secondary)",
                    }),
                  }}
                  options={plateNumberOptions}
                  placeholder="Select Plate Number"
                  name="plateNumber"
                  id="plate_number"
                  value={plateNumberOptions.find(
                    (option) =>
                      option.value === String(dispatchesData.plateNumber)
                  )}
                  onChange={(selectedOption) =>
                    handleInputChange(null, "plateNumber", selectedOption.value)
                  }
                />
                {errors.plateNumber && (
                  <p className={styles["error-message"]}>
                    {errors.plateNumber}
                  </p>
                )}
              </label>
              <label className={styles.label} htmlFor="cargo_type">
                Cargo Type
                <Select
                  className={`${styles.input} ${
                    errors.cargoType ? styles["error-input"] : ""
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
                      color: isDarkMode
                        ? "var(--text-primary)"
                        : "var(--text-primary)",
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
                      color: isDarkMode
                        ? "var(--text-primary)"
                        : "var(--text-primary)",
                      border: `1px solid ${
                        isDarkMode ? "var(--borders)" : "var(--borders)"
                      }`,
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
                      color: state.isSelected
                        ? isDarkMode
                          ? "var(--text-primary)"
                          : "var(--text-primary)"
                        : base.color,
                      cursor: "pointer",
                      "&:hover": {
                        backgroundColor: isDarkMode ? "#2a2a2a" : "#f8f9fa",
                      },
                    }),
                    singleValue: (base) => ({
                      ...base,
                      color: isDarkMode
                        ? "var(--text-primary)"
                        : "var(--text-primary)",
                    }),
                    placeholder: (base) => ({
                      ...base,
                      color: isDarkMode
                        ? "var(--text-secondary)"
                        : "var(--text-secondary)",
                    }),
                  }}
                  options={cargoTypeOptions}
                  placeholder="Select Cargo Type"
                  name="cargoType"
                  id="cargo_type"
                  value={cargoTypeOptions.find(
                    (option) => option.value === dispatchesData.cargoType
                  )}
                  onChange={(selectedOption) =>
                    handleInputChange(null, "cargoType", selectedOption.value)
                  }
                />
                {errors.cargoType && (
                  <p className={styles["error-message"]}>{errors.cargoType}</p>
                )}
              </label>
              <label className={styles.label} htmlFor="bound_from">
                Bound From
                <input
                  className={`${styles.input} ${
                    errors.boundFrom ? styles["error-input"] : ""
                  }`}
                  type="text"
                  id="bound_from"
                  name="boundFrom"
                  value={dispatchesData.boundFrom}
                  onChange={handleInputChange}
                />
                {errors.boundFrom && (
                  <p className={styles["error-message"]}>{errors.boundFrom}</p>
                )}
              </label>
              <label className={styles.label} htmlFor="bound_to">
                Bound To
                <input
                  className={`${styles.input} ${
                    errors.boundTo ? styles["error-input"] : ""
                  }`}
                  type="text"
                  id="bound_to"
                  name="boundTo"
                  value={dispatchesData.boundTo}
                  onChange={handleInputChange}
                />
                {errors.boundTo && (
                  <p className={styles["error-message"]}>{errors.boundTo}</p>
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
      {isDeleteModalOpen && selectedDispatch && (
        <Modal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
        >
          <div
            className={`${styles["modal-container"]} ${styles["delete-modal-container"]}`}
          >
            <h1 className={styles["delete-modal-header"]}>
              Are you sure to delete this dispatch?
            </h1>
            <div className={styles["delete-modal-button-container"]}>
              <button
                className={styles["delete-modal-button"]}
                onClick={handleDeleteDispatch}
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

export default OPSDispatch;
