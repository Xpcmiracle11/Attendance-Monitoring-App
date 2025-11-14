import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import Modal from "../../Modal";
import styles from "../../../assets/styles/FINMatrix.module.css";
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

const FINMatrix = () => {
  const [matrixes, setMatrixes] = useState([]);
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
  const [selectedMatrix, setSelectedMatrix] = useState(null);
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
  const [matrixesData, setMatrixesData] = useState({
    principal: "",
    code: "",
    tripType: "",
    source: "",
    destination: "",
    fuel10w: "",
    fuel6wf: "",
    fuel6wc4w: "",
    daysForMeals: "",
    allowance10w: "",
    allowance6wf: "",
    allowance6wc4w: "",
    shipping10w: "",
    shipping6wf: "",
    shipping6wc4w: "",
  });
  const [errors, setErrors] = useState({
    principal: "",
    code: "",
    tripType: "",
    source: "",
    destination: "",
    fuel10w: "",
    fuel6wf: "",
    fuel6wc4w: "",
    daysForMeals: "",
    allowance10w: "",
    allowance6wf: "",
    allowance6wc4w: "",
    shipping10w: "",
    shipping6wf: "",
    shipping6wc4w: "",
  });

  const isDarkMode =
    document.documentElement.getAttribute("data-theme") === "dark";

  const fetchMatrixes = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/matrixes`);
      if (response.data.success) {
        setMatrixes(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching matrix:", error);
    }
  };
  useEffect(() => {
    fetchMatrixes();
  }, []);

  const filteredMatrixes = matrixes
    .filter((matrix) => {
      const code = (matrix.code || "").toLowerCase();
      const matchesSearch = code.includes(search.toLowerCase());

      const matrixDate = matrix.created_at
        ? new Date(matrix.created_at.split("T")[0])
        : new Date();
      const iswithinDateRange =
        (!appliedFromDate || matrixDate >= new Date(appliedFromDate)) &&
        (!appliedToDate || matrixDate <= new Date(appliedToDate));

      return matchesSearch && iswithinDateRange;
    })
    .sort((a, b) => {
      if (sortOrder === "date-asc")
        return new Date(a.created_at) - new Date(b.created_at);
      if (sortOrder === "date-desc")
        return new Date(b.created_at) - new Date(a.created_at);
      if (sortOrder === "code-asc") return a.code.localeCompare(b.code);
      if (sortOrder === "code-desc") return b.code.localeCompare(a.code);
      return 0;
    });

  const totalPages = Math.ceil(filteredMatrixes.length / itemsPerPage);
  const paginatedMatrixes = filteredMatrixes.slice(
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
    "Principal",
    "Code",
    "Trip Type",
    "Source",
    "Destination",
    "Fuel 10W",
    "Fuel 6WF",
    "Fuel 6WC4W",
    "Days For Meals",
    "Allowance 10W",
    "Allowance 6WF",
    "Allowance 6WC4W",
    "Shipping 10W",
    "Shipping 6WF",
    "Shipping 6WC4W",
  ];

  const exportToExcel = (data) => {
    const formattedData = data.map((item, index) => ({
      ID: index + 1,
      Principal: item.principal,
      Code: item.code,
      "Trip Type": item.trip_type,
      Source: item.source,
      Destination: item.destination,
      "Fuel 10W": item.fuel_10w,
      "Fuel 6WF": item.fuel_6wf,
      "Fuel 6WC4W": item.fuel_6wc4w,
      "Days For Meals": item.days_for_meals,
      "Allowance 10W": item.allowance_10w,
      "Allowance 6WF": item.allowance_6wf,
      "Allowance 6WC4W": item.allowance_6wc4w,
      "Shipping 10W": item.shipping_10w,
      "Shipping 6WF": item.shipping_6wf,
      "Shipping 6WC4W": item.shipping_6wc4w,
    }));

    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Matrixes");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
    });

    saveAs(blob, "matrixes.xlsx");
  };

  const exportToPDF = (data) => {
    const doc = new jsPDF();

    doc.text("Matrixes Report", 14, 10);

    const tableRows = data.map((item, index) => [
      index + 1,
      item.principal || "",
      item.code || "",
      item.trip_type || "",
      item.source || "",
      item.destination || "",
      item.fuel_10w || "",
      item.fuel_6wf || "",
      item.fuel_6wc4w || "",
      item.days_for_meals || "",
      item.allowance_10w || "",
      item.allowance_6wf || "",
      item.allowance_6wc4w || "",
      item.shipping_10w || "",
      item.shipping_6wf || "",
      item.shipping_6wc4w || "",
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 20,
    });

    doc.save("matrixes.pdf");
  };

  const exportToWord = (data) => {
    const columnKeyMap = {
      ID: null,
      Principal: "principal",
      Code: "code",
      "Trip Type": "trip_type",
      Source: "source",
      Destination: "destination",
      "Fuel 10W": "fuel_10w",
      "Fuel 6WF": "fuel_6wf",
      "Fuel 6WC4W": "fuel_6wc4w",
      "Days For Meals": "days_for_meals",
      "Allowance 10W": "allowance_10w",
      "Allowance 6WF": "allowance_6wf",
      "Allowance 6WC4W": "allowance_6wc4w",
      "Shipping 10W": "shipping_10w",
      "Shipping 6WF": "shipping_6wf",
      "Shipping 6WC4W": "shipping_6wc4w",
    };

    const tableRows = data.map((item, index) => {
      return new TableRow({
        children: tableColumn.map((column) => {
          let value;
          if (column === "ID") value = (index + 1).toString();
          else {
            const key = columnKeyMap[column];
            value = item[key] ? item[key].toString() : "";
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
            new Paragraph("Exported Data"),
            new Table({ rows: tableRows }),
          ],
        },
      ],
    });

    Packer.toBlob(doc).then((blob) => {
      saveAs(blob, "matrixes.docx");
    });
  };

  const handleExport = () => {
    if (!exportFileType) {
      setExportError("Please select an export format.");
      return;
    }

    const filteredData = matrixes.filter((matrixes) => {
      const matrixesDate = matrixes.created_at
        ? new Date(matrixes.created_at.split("T")[0])
        : new Date();
      return (
        (!exportFromDate || matrixesDate >= new Date(exportFromDate)) &&
        (!exportToDate || matrixesDate <= new Date(exportToDate))
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
      principal: "",
      code: "",
      tripType: "",
      source: "",
      destination: "",
      fuel10w: "",
      fuel6wf: "",
      fuel6wc4w: "",
      daysForMeals: "",
      allowance10w: "",
      allowance6wf: "",
      allowance6wc4w: "",
      shipping10w: "",
      shipping6wf: "",
      shipping6wc4w: "",
      apiError: "",
    });
  };

  const closeAddModal = () => {
    setIsAddModalOpen(false);
    setMatrixesData({
      principal: "",
      code: "",
      tripType: "",
      source: "",
      destination: "",
      fuel10w: "",
      fuel6wf: "",
      fuel6wc4w: "",
      daysForMeals: "",
      allowance10w: "",
      allowance6wf: "",
      allowance6wc4w: "",
      shipping10w: "",
      shipping6wf: "",
      shipping6wc4w: "",
    });
    setErrors({
      principal: "",
      code: "",
      tripType: "",
      source: "",
      destination: "",
      fuel10w: "",
      fuel6wf: "",
      fuel6wc4w: "",
      daysForMeals: "",
      allowance10w: "",
      allowance6wf: "",
      allowance6wc4w: "",
      shipping10w: "",
      shipping6wf: "",
      shipping6wc4w: "",
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

    setMatrixesData((prevData) => ({
      ...prevData,
      [inputName]: inputValue,
    }));

    setErrors((prevErrors) => ({
      ...prevErrors,
      [inputName]: "",
    }));
  };

  const handleAddMatrix = async (e) => {
    e.preventDefault();

    setErrors({
      principal: "",
      code: "",
      tripType: "",
      source: "",
      destination: "",
      fuel10w: "",
      fuel6wf: "",
      fuel6wc4w: "",
      daysForMeals: "",
      allowance10w: "",
      allowance6wf: "",
      allowance6wc4w: "",
      shipping10w: "",
      shipping6wf: "",
      shipping6wc4w: "",
      apiError: "",
    });

    let hasError = false;

    if (!matrixesData.principal.trim()) {
      setErrors((prev) => ({ ...prev, principal: "Principal is required." }));
      hasError = true;
    }

    if (!matrixesData.code.trim()) {
      setErrors((prev) => ({ ...prev, code: "Code is required." }));
      hasError = true;
    }

    if (hasError) return;

    try {
      const response = await axios.post(`${API_BASE_URL}/insert-matrix`, {
        principal: matrixesData.principal,
        code: matrixesData.code,
        trip_type: matrixesData.tripType,
        source: matrixesData.source,
        destination: matrixesData.destination,
        fuel_10w: matrixesData.fuel10w,
        fuel_6wf: matrixesData.fuel6wf,
        fuel_6wc4w: matrixesData.fuel6wc4w,
        days_for_meals: matrixesData.daysForMeals,
        allowance_10w: matrixesData.allowance10w,
        allowance_6wf: matrixesData.allowance6wf,
        allowance_6wc4w: matrixesData.allowance6wc4w,
        shipping_10w: matrixesData.shipping10w,
        shipping_6wf: matrixesData.shipping6wf,
        shipping_6wc4w: matrixesData.shipping6wc4w,
      });

      if (response.data.success) {
        setMatrixes((prevMatrixes) => [
          ...prevMatrixes,
          {
            principal: matrixesData.principal,
            code: matrixesData.code,
            trip_type: matrixesData.tripType,
            source: matrixesData.source,
            destination: matrixesData.destination,
            fuel_10w: matrixesData.fuel10w,
            fuel_6wf: matrixesData.fuel6wf,
            fuel_6wc4w: matrixesData.fuel6wc4w,
            days_for_meals: matrixesData.daysForMeals,
            allowance_10w: matrixesData.allowance10w,
            allowance_6wf: matrixesData.allowance6wf,
            allowance_6wc4w: matrixesData.allowance6wc4w,
            shipping_10w: matrixesData.shipping10w,
            shipping_6wf: matrixesData.shipping6wf,
            shipping_6wc4w: matrixesData.shipping6wc4w,
          },
        ]);
        fetchMatrixes();
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

  const toggleEditModal = (matrix = null) => {
    setSelectedMatrix(matrix);
    setMatrixesData({
      principal: matrix?.principal || "",
      code: matrix?.code || "",
      tripType: matrix?.trip_type || "",
      source: matrix?.source || "",
      destination: matrix?.destination || "",
      fuel10w: matrix?.fuel_10w || "",
      fuel6wf: matrix?.fuel_6wf || "",
      fuel6wc4w: matrix?.fuel_6wc4w || "",
      daysForMeals: matrix?.days_for_meals || "",
      allowance10w: matrix?.allowance_10w || "",
      allowance6wf: matrix?.allowance_6wf || "",
      allowance6wc4w: matrix?.allowance_6wc4w || "",
      shipping10w: matrix?.shipping_10w || "",
      shipping6wf: matrix?.shipping_6wf || "",
      shipping6wc4w: matrix?.shipping_6wc4w || "",
    });
    setIsEditModalOpen(true);
    setErrors({
      principal: "",
      code: "",
      tripType: "",
      source: "",
      destination: "",
      fuel10w: "",
      fuel6wf: "",
      fuel6wc4w: "",
      daysForMeals: "",
      allowance10w: "",
      allowance6wf: "",
      allowance6wc4w: "",
      shipping10w: "",
      shipping6wf: "",
      shipping6wc4w: "",
      apiError: "",
    });
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedMatrix(null);
    setMatrixesData({
      principal: "",
      code: "",
      tripType: "",
      source: "",
      destination: "",
      fuel10w: "",
      fuel6wf: "",
      fuel6wc4w: "",
      daysForMeals: "",
      allowance10w: "",
      allowance6wf: "",
      allowance6wc4w: "",
      shipping10w: "",
      shipping6wf: "",
      shipping6wc4w: "",
    });
    setErrors({
      principal: "",
      code: "",
      tripType: "",
      source: "",
      destination: "",
      fuel10w: "",
      fuel6wf: "",
      fuel6wc4w: "",
      daysForMeals: "",
      allowance10w: "",
      allowance6wf: "",
      allowance6wc4w: "",
      shipping10w: "",
      shipping6wf: "",
      shipping6wc4w: "",
      apiError: "",
    });
  };

  const handleEditMatrix = async (e) => {
    e.preventDefault();
    setErrors({
      principal: "",
      code: "",
      tripType: "",
      source: "",
      destination: "",
      fuel10w: "",
      fuel6wf: "",
      fuel6wc4w: "",
      daysForMeals: "",
      allowance10w: "",
      allowance6wf: "",
      allowance6wc4w: "",
      shipping10w: "",
      shipping6wf: "",
      shipping6wc4w: "",
      apiError: "",
    });

    if (!selectedMatrix || !selectedMatrix.id) {
      setErrors((prev) => ({ ...prev, apiError: "Invalid matrix selected." }));
      return;
    }

    let hasError = false;

    if (!matrixesData.principal.trim()) {
      setErrors((prev) => ({ ...prev, principal: "Principal is required." }));
      hasError = true;
    }

    if (!matrixesData.code.trim()) {
      setErrors((prev) => ({ ...prev, code: "Code is required." }));
      hasError = true;
    }

    if (hasError) return;

    try {
      const response = await axios.put(
        `${API_BASE_URL}/update-matrix/${selectedMatrix.id}`,
        {
          principal: matrixesData.principal,
          code: matrixesData.code,
          trip_type: matrixesData.tripType,
          source: matrixesData.source,
          destination: matrixesData.destination,
          fuel_10w: matrixesData.fuel10w,
          fuel_6wf: matrixesData.fuel6wf,
          fuel_6wc4w: matrixesData.fuel6wc4w,
          days_for_meals: matrixesData.daysForMeals,
          allowance_10w: matrixesData.allowance10w,
          allowance_6wf: matrixesData.allowance6wf,
          allowance_6wc4w: matrixesData.allowance6wc4w,
          shipping_10w: matrixesData.shipping10w,
          shipping_6wf: matrixesData.shipping6wf,
          shipping_6wc4w: matrixesData.shipping6wc4w,
        }
      );

      if (response.data.success) {
        setMatrixes((prevMatrixes) =>
          prevMatrixes.map((matrix) =>
            matrix.id === selectedMatrix.id
              ? {
                  ...matrix,
                  principal: matrixesData.principal,
                  code: matrixesData.code,
                  trip_type: matrixesData.tripType,
                  source: matrixesData.source,
                  destination: matrixesData.destination,
                  fuel_10w: matrixesData.fuel10w,
                  fuel_6wf: matrixesData.fuel6wf,
                  fuel_6wc4w: matrixesData.fuel6wc4w,
                  days_for_meals: matrixesData.daysForMeals,
                  allowance_10w: matrixesData.allowance10w,
                  allowance_6wf: matrixesData.allowance6wf,
                  allowance_6wc4w: matrixesData.allowance6wc4w,
                  shipping_10w: matrixesData.shipping10w,
                  shipping_6wf: matrixesData.shipping6wf,
                  shipping_6wc4w: matrixesData.shipping6wc4w,
                }
              : matrix
          )
        );
        fetchMatrixes();
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

  const toggleDeleteModal = (matrix = null) => {
    setSelectedMatrix(matrix);
    setIsDeleteModalOpen(!isDeleteModalOpen);
  };

  const closeDeleteModal = () => {
    setSelectedMatrix(null);
    setIsDeleteModalOpen(false);
  };

  const handleDeleteMatrix = async () => {
    if (!selectedMatrix) return;

    try {
      const response = await axios.delete(
        `${API_BASE_URL}/delete-matrix/${selectedMatrix.id}`
      );

      if (response.data.success) {
        setMatrixes((prevMatrixes) =>
          prevMatrixes.filter((matrix) => matrix.id !== selectedMatrix.id)
        );
        fetchMatrixes();
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

  const principalOptions = [
    { value: "NPI", label: "NPI" },
    { value: "UL", label: "UL" },
    { value: "PANA", label: "PANA" },
    { value: "TDI", label: "TDI" },
    { value: "AP", label: "AP" },
  ];

  const tripTypeOptions = [
    { value: "DMR", label: "DMR" },
    { value: "LMR", label: "LMR" },
    { value: "ETMR", label: "ETMR" },
  ];

  return (
    <div className={styles["matrix-content"]}>
      <div className={styles["content-header-container"]}>
        <h1 className={styles["page-title"]}>Matrix</h1>
      </div>
      <div className={styles["content-body-container"]}>
        <div className={styles["add-matrix-button-container"]}>
          <button
            className={styles["add-matrix-button"]}
            onClick={toggleAddModal}
          >
            Add Matrix
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
                <th className={styles.th}>Code</th>
                <th className={styles.th}>Principal</th>
                <th className={styles.th}>Trip Type</th>
                <th className={styles.th}>Source</th>
                <th className={styles.th}>Destination</th>
                <th className={styles.th}>Fuel 10W</th>
                <th className={styles.th}>Fuel 6WF</th>
                <th className={styles.th}>Fuel 6WC/4WC</th>
                <th className={styles.th}>Number of Days for Meals</th>
                <th className={styles.th}>Allowance 10w</th>
                <th className={styles.th}>Allowance 6WF</th>
                <th className={styles.th}>Allowance 6WC/4WC</th>
                <th className={styles.th}>Shipping 10W</th>
                <th className={styles.th}>Shipping 6WF</th>
                <th className={styles.th}>Shipping 6WC/4WC</th>
                <th className={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody className={styles.tbody}>
              {paginatedMatrixes.map((matrix, index) => (
                <tr className={styles.btr} key={index}>
                  <td className={styles.td}>{matrix.code}</td>
                  <td className={styles.td}>{matrix.principal}</td>
                  <td className={styles.td}>{matrix.trip_type}</td>
                  <td className={styles.td}>{matrix.source}</td>
                  <td className={styles.td}>{matrix.destination}</td>
                  <td className={styles.td}>{matrix.fuel_10w}</td>
                  <td className={styles.td}>{matrix.fuel_6wf}</td>
                  <td className={styles.td}>{matrix.fuel_6wc4w}</td>
                  <td className={styles.td}>{matrix.days_for_meals}</td>
                  <td className={styles.td}>{matrix.allowance_10w}</td>
                  <td className={styles.td}>{matrix.allowance_6wf}</td>
                  <td className={styles.td}>{matrix.allowance_6wc4w}</td>
                  <td className={styles.td}>{matrix.shipping_10w}</td>
                  <td className={styles.td}>{matrix.shipping_6wf}</td>
                  <td className={styles.td}>{matrix.shipping_6wc4w}</td>
                  <td className={styles.td}>
                    <div className={styles["action-container"]}>
                      <button
                        className={styles["edit-button"]}
                        onMouseEnter={() => setIsEditHovered(index)}
                        onMouseLeave={() => setIsEditHovered(null)}
                        onClick={() => toggleEditModal(matrix)}
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
                        onClick={() => toggleDeleteModal(matrix)}
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
              {paginatedMatrixes.length === 0 && (
                <tr className={styles.btr}>
                  <td
                    colSpan="16"
                    className={`${styles.td} ${styles["search-response"]}`}
                  >
                    No matrixes found.
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
              <h3 className={styles["modal-title"]}>Add Matrix</h3>
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
              onSubmit={handleAddMatrix}
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
                      (opt) => opt.value === matrixesData.principal
                    ) || null
                  }
                  onChange={(selected) =>
                    setMatrixesData((prev) => ({
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
                  value={matrixesData.code}
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
                      (opt) => opt.value === matrixesData.tripType
                    ) || null
                  }
                  onChange={(selected) =>
                    setMatrixesData((prev) => ({
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
                  value={matrixesData.source}
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
                  value={matrixesData.destination}
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
                  value={matrixesData.fuel10w}
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
                  value={matrixesData.fuel6wf}
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
                  value={matrixesData.fuel6wc4w}
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
                  value={matrixesData.daysForMeals}
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
                  value={matrixesData.allowance10w}
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
                  value={matrixesData.allowance6wf}
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
                  value={matrixesData.allowance6wc4w}
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
                  value={matrixesData.shipping10w}
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
                  value={matrixesData.shipping6wf}
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
                  value={matrixesData.shipping6wc4w}
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
      {isEditModalOpen && selectedMatrix && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
        >
          <div className={styles["modal-container"]}>
            <div className={styles["modal-header-container"]}>
              <h3 className={styles["modal-title"]}>Edit Matrix</h3>
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
              onSubmit={handleEditMatrix}
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
                      (opt) => opt.value === matrixesData.principal
                    ) || null
                  }
                  onChange={(selected) =>
                    setMatrixesData((prev) => ({
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
                  value={matrixesData.code}
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
                      (opt) => opt.value === matrixesData.tripType
                    ) || null
                  }
                  onChange={(selected) =>
                    setMatrixesData((prev) => ({
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
                  value={matrixesData.source}
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
                  value={matrixesData.destination}
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
                  value={matrixesData.fuel10w}
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
                  value={matrixesData.fuel6wf}
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
                  value={matrixesData.fuel6wc4w}
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
                  value={matrixesData.daysForMeals}
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
                  value={matrixesData.allowance10w}
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
                  value={matrixesData.allowance6wf}
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
                  value={matrixesData.allowance6wc4w}
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
                  value={matrixesData.shipping10w}
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
                  value={matrixesData.shipping6wf}
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
                  value={matrixesData.shipping6wc4w}
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
      {isDeleteModalOpen && selectedMatrix && (
        <Modal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
        >
          <div
            className={`${styles["modal-container"]} ${styles["delete-modal-container"]}`}
          >
            <h1 className={styles["delete-modal-header"]}>
              Are you sure to delete this matrix?
            </h1>
            <div className={styles["delete-modal-button-container"]}>
              <button
                className={styles["delete-modal-button"]}
                onClick={handleDeleteMatrix}
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

export default FINMatrix;
