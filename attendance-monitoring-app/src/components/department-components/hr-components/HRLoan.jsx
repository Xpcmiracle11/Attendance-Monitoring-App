import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import Modal from "../../Modal";
import styles from "../../../assets/styles/HRLoan.module.css";
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

const HRLoan = () => {
  const [loans, setLoans] = useState([]);
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
  const [selectedLoan, setSelectedLoan] = useState(null);
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
  const [loansData, setLoansData] = useState({
    userId: "",
    loanAmount: "",
    institution: "",
    loanType: "",
    paymentEvery: "",
    paymentDuration: "",
    status: "",
  });
  const [errors, setErrors] = useState({
    userId: "",
    loanAmount: "",
    institution: "",
    loanType: "",
    paymentEvery: "",
    paymentDuration: "",
    status: "",
    apiError: "",
  });

  const isDarkMode =
    document.documentElement.getAttribute("data-theme") === "dark";

  const fetchLoans = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/loans`);
      if (response.data.success) {
        setLoans(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching loans:", error);
    }
  };
  useEffect(() => {
    fetchLoans();
  }, []);

  const filteredLoans = loans
    .filter((loan) => {
      const loanName = (loan.full_name || "").toLowerCase();
      const matchesSearch = loanName.includes(search.toLowerCase());

      const loanDate = loan.created_at
        ? new Date(loan.created_at.split("T")[0])
        : new Date();
      const iswithinDateRange =
        (!appliedFromDate || loanDate >= new Date(appliedFromDate)) &&
        (!appliedToDate || loanDate <= new Date(appliedToDate));

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
        return b.full_name.localeCompare(a.full_name);
      return 0;
    });

  const totalPages = Math.ceil(filteredLoans.length / itemsPerPage);
  const paginatedLoans = filteredLoans.slice(
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
    "Employee Name",
    "Loan Amount",
    "Institution",
    "Loan Type",
    "Payment Duration",
    "Status",
    "Created At",
  ];
  const exportToExcel = (data) => {
    const formattedData = data.map((item, index) => ({
      ID: index + 1,
      "Employee Name": item.full_name || "",
      "Loan Amount": item.loan_amount || "",
      Institution: item.institution || "",
      "Loan Type": item.loan_type || "",
      "Payment Duration": item.payment_duration || "",
      Status: item.status || "",
      "Created At": formatDate(item.created_at),
    }));

    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Loans");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
    });

    saveAs(blob, "loans.xlsx");
  };

  const exportToPDF = (data) => {
    const doc = new jsPDF();

    doc.text("Loans Report", 14, 10);

    const tableRows = data.map((item, index) => [
      index + 1,
      item.full_name || "",
      item.loan_amount || "",
      item.institution || "",
      item.loan_type || "",
      item.payment_duration || "",
      item.status || "",
      formatDate(item.created_at),
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 20,
    });

    doc.save("loans.pdf");
  };

  const exportToWord = (data) => {
    const columnKeyMap = {
      ID: "id",
      "Employee Name": "full_name",
      "Loan Amount": "loan_amount",
      Institution: "institution",
      "Loan Type": "loan_type",
      "Payment Duration": "payment_duration",
      Status: "status",
      "Created At": "created_at",
    };

    const tableRows = data.map((item, index) => {
      return new TableRow({
        children: tableColumn.map((column) => {
          const key = columnKeyMap[column];
          let value =
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
      saveAs(blob, "loans.docx");
    });
  };

  const handleExport = () => {
    if (!exportFileType) {
      setExportError("Please select an export format.");
      return;
    }

    const filteredData = loans.filter((loan) => {
      const loanDate = loan.created_at
        ? new Date(loan.created_at.split("T")[0])
        : new Date();
      return (
        (!exportFromDate || loanDate >= new Date(exportFromDate)) &&
        (!exportToDate || loanDate <= new Date(exportToDate))
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
      userId: "",
      loanAmount: "",
      institution: "",
      loanType: "",
      paymentEvery: "",
      paymentDuration: "",
      status: "",
      apiError: "",
    });
  };

  const closeAddModal = () => {
    setIsAddModalOpen(false);
    setLoansData({
      userId: "",
      loanAmount: "",
      institution: "",
      loanType: "",
      paymentEvery: "",
      paymentDuration: "",
      status: "",
    });
    setErrors({
      userId: "",
      loanAmount: "",
      institution: "",
      loanType: "",
      paymentEvery: "",
      paymentDuration: "",
      status: "",
      apiError: "",
    });
  };

  const handleInputChange = (eventOrValue, name, value) => {
    if (eventOrValue && eventOrValue.target) {
      const { name, value } = eventOrValue.target;
      setLoansData((prevData) => ({
        ...prevData,
        [name]: value,
      }));
      setErrors((prevErrors) => ({
        ...prevErrors,
        [name]: "",
      }));
    } else {
      setLoansData((prevData) => ({
        ...prevData,
        [name]: value,
      }));
      setErrors((prevErrors) => ({
        ...prevErrors,
        [name]: "",
      }));
    }
  };

  const handleAddLoan = async (e) => {
    e.preventDefault();
    setErrors({
      userId: "",
      loanAmount: "",
      institution: "",
      loanType: "",
      paymentEvery: "",
      paymentDuration: "",
      status: "",
      apiError: "",
    });

    let hasError = false;

    if (!loansData.userId.trim()) {
      setErrors((prev) => ({
        ...prev,
        userId: "Employee name is required.",
      }));
      hasError = true;
    }

    if (!loansData.loanAmount.trim()) {
      setErrors((prev) => ({
        ...prev,
        loanAmount: "Loan amount is required.",
      }));
      hasError = true;
    }

    if (!loansData.institution.trim()) {
      setErrors((prev) => ({
        ...prev,
        institution: "Institution is required.",
      }));
      hasError = true;
    }

    if (!loansData.loanType.trim()) {
      setErrors((prev) => ({
        ...prev,
        loanType: "Loan type is required",
      }));
      hasError = true;
    }

    if (!loansData.paymentEvery.trim()) {
      setErrors((prev) => ({
        ...prev,
        paymentEvery: "Payment every is required",
      }));
      hasError = true;
    }

    if (!loansData.paymentDuration.trim()) {
      setErrors((prev) => ({
        ...prev,
        paymentDuration: "Payment duration is required.",
      }));
      hasError = true;
    }

    if (hasError) return;

    try {
      const response = await axios.post(`${API_BASE_URL}/insert-loan`, {
        user_id: loansData.userId,
        loan_amount: loansData.loanAmount,
        institution: loansData.institution,
        loan_type: loansData.loanType,
        payment_every: loansData.paymentEvery,
        payment_duration: loansData.paymentDuration,
      });
      if (response.data.success) {
        setLoans((prevLoans) => [
          ...prevLoans,
          {
            user_id: loansData.userId,
            loan_amount: loansData.loanAmount,
            institution: loansData.institution,
            loan_type: loansData.loanType,
            payment_every: loansData.paymentEvery,
            payment_duration: loansData.paymentDuration,
          },
        ]);
        fetchLoans();
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
        apiError: error.response?.data?.message || "Something went wrong.",
      }));
    }
  };

  const toggleEditModal = (loan = null) => {
    setSelectedLoan(loan);
    setLoansData({
      userId: loan?.user_id ? String(loan.user_id) : "",
      loanAmount: loan?.loan_amount || "",
      institution: loan?.institution || "",
      loanType: loan?.loan_type || "",
      paymentEvery: loan?.payment_every || "",
      paymentDuration: loan?.payment_duration || "",
    });
    setIsEditModalOpen(true);
    setErrors({
      userId: "",
      loanAmount: "",
      institution: "",
      loanType: "",
      paymentEvery: "",
      paymentDuration: "",
      status: "",
      apiError: "",
    });
  };
  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedLoan(null);
    setLoansData({
      userId: "",
      loanAmount: "",
      institution: "",
      loanType: "",
      paymentEvery: "",
      paymentDuration: "",
      status: "",
    });
    setErrors({
      userId: "",
      loanAmount: "",
      institution: "",
      loanType: "",
      paymentEvery: "",
      paymentDuration: "",
      status: "",
      apiError: "",
    });
  };

  const handleEditLoan = async (e) => {
    e.preventDefault();

    setErrors({
      userId: "",
      loanAmount: "",
      institution: "",
      loanType: "",
      paymentEvery: "",
      paymentDuration: "",
      status: "",
      apiError: "",
    });

    if (!selectedLoan || !selectedLoan.id) {
      setErrors((prev) => ({
        ...prev,
        apiError: "Invalid loan selected.",
      }));
      return;
    }

    let hasError = false;

    if (!loansData.userId.trim()) {
      setErrors((prev) => ({
        ...prev,
        userId: "Employee name is required.",
      }));
      hasError = true;
    }

    if (!loansData.loanAmount.trim()) {
      setErrors((prev) => ({
        ...prev,
        loanAmount: "Loan amount is required.",
      }));
      hasError = true;
    }

    if (!loansData.institution.trim()) {
      setErrors((prev) => ({
        ...prev,
        institution: "Institution is required.",
      }));
      hasError = true;
    }

    if (!loansData.loanType.trim()) {
      setErrors((prev) => ({
        ...prev,
        loanType: "Loan type is required",
      }));
      hasError = true;
    }

    if (!loansData.paymentEvery.trim()) {
      setErrors((prev) => ({
        ...prev,
        paymentEvery: "Payment every is required",
      }));
      hasError = true;
    }

    if (!loansData.paymentDuration.trim()) {
      setErrors((prev) => ({
        ...prev,
        paymentDuration: "Payment duration is required.",
      }));
      hasError = true;
    }

    if (hasError) return;

    try {
      const response = await axios.put(
        `${API_BASE_URL}/update-loan/${selectedLoan.id}`,
        {
          user_id: loansData.userId,
          loan_amount: loansData.loanAmount,
          institution: loansData.institution,
          loan_type: loansData.loanType,
          payment_every: loansData.paymentEvery,
          payment_duration: loansData.paymentDuration,
        }
      );
      if (response.data.success) {
        setLoans((prevLoans) =>
          prevLoans.map((loan) =>
            loan.id === selectedLoan.id
              ? {
                  ...loan,
                  user_id: loansData.userId,
                  loan_amount: loansData.loanAmount,
                  institution: loansData.institution,
                  loan_type: loansData.loanType,
                  payment_every: loansData.paymentEvery,
                  payment_duration: loansData.paymentDuration,
                }
              : loan
          )
        );
        fetchLoans();
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
        apiError: error.response?.data?.message || "Something went wrong.",
      }));
    }
  };

  const toggleDeleteModal = (loan = null) => {
    setSelectedLoan(loan);
    setIsDeleteModalOpen(!isDeleteModalOpen);
  };

  const closeDeleteModal = () => {
    setSelectedLoan(null);
    setIsDeleteModalOpen(false);
  };

  const handleDeleteLoan = async () => {
    if (!selectedLoan) return;

    try {
      const response = await axios.delete(
        `${API_BASE_URL}/delete-loan/${selectedLoan.id}`
      );

      if (response.data.success) {
        setLoans((prevLoans) =>
          prevLoans.filter((loan) => loan.id !== selectedLoan.id)
        );
        fetchLoans();
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

  const [employeeOptions, setEmployeeOptions] = useState([]);

  useEffect(() => {
    axios
      .get(`${API_BASE_URL}/users`)
      .then((response) => {
        if (response.data.success && Array.isArray(response.data.data)) {
          const options = response.data.data.map((user) => ({
            value: String(user.id),
            label: user.full_name,
          }));
          setEmployeeOptions(options);
        } else {
          console.error("Invalid data format:", response.data);
        }
      })
      .catch((error) => {
        console.error("Error fetching users:", error);
      });
  }, [loans]);

  const institutionOptions = [
    {
      value: "SSS",
      label: "SSS",
    },
    { value: "PAG-IBIG", label: "PAG-IBIG" },
  ];

  const durationOptions = [
    {
      value: "1 Year",
      label: "1 Year",
    },
    {
      value: "2 Years",
      label: "2 Years",
    },
    {
      value: "3 Year",
      label: "3 Year",
    },
  ];

  const loanTypeOptions = [
    {
      value: "Calamity Loan",
      label: "Calamity Loan",
    },
    {
      value: "CONSO Loan",
      label: "CONSO Loan",
    },
    {
      value: "Educational Assistance Loan",
      label: "Educational Assistance Loan",
    },
    {
      value: "Housing Loan",
      label: "Housing Loan",
    },
    {
      value: "Multi-purpose Loan",
      label: "Multi-purpose Loan",
    },
  ];

  const paymentEveryOptions = [
    {
      value: "Payroll Period 1",
      label: "Payroll Period 1",
    },
    {
      value: "Payroll Period 2",
      label: "Payroll Period 2",
    },
  ];

  return (
    <div className={styles["loan-content"]}>
      <div className={styles["content-header-container"]}>
        <h1 className={styles["page-title"]}>Loan</h1>
      </div>
      <div className={styles["content-body-container"]}>
        <div className={styles["add-loan-button-container"]}>
          <button
            className={styles["add-loan-button"]}
            onClick={toggleAddModal}
          >
            Add Loan
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
                <th className={styles.th}>Amount</th>
                <th className={styles.th}>Balance</th>
                <th className={styles.th}>Institution</th>
                <th className={styles.th}>Loan Type</th>
                <th className={styles.th}>Payment Every</th>
                <th className={styles.th}>Duration</th>
                <th className={styles.th}>Status</th>
                <th className={styles.th}>Action</th>
              </tr>
            </thead>
            <tbody className={styles.tbody}>
              {paginatedLoans.map((loan, index) => (
                <tr className={styles.btr} key={index}>
                  <td className={styles.td}>
                    {index + 1}. {loan.full_name}
                  </td>
                  <td className={styles.td}>{loan.loan_amount}</td>
                  <td className={styles.td}>{loan.loan_balance}</td>
                  <td className={styles.td}>{loan.institution}</td>
                  <td className={styles.td}>{loan.loan_type}</td>
                  <td className={styles.td}>{loan.payment_every}</td>
                  <td className={styles.td}>{loan.payment_duration}</td>
                  <td className={styles.td}>{loan.status}</td>
                  <td className={styles.td}>
                    <div className={styles["action-container"]}>
                      <button
                        className={styles["edit-button"]}
                        onMouseEnter={() => setIsEditHovered(index)}
                        onMouseLeave={() => setIsEditHovered(null)}
                        onClick={() => toggleEditModal(loan)}
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
                        onClick={() => toggleDeleteModal(loan)}
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
              {paginatedLoans.length === 0 && (
                <tr className={styles.btr}>
                  <td
                    colSpan="8"
                    className={`${styles.td} ${styles["search-response"]}`}
                  >
                    No loans found.
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
          <div className={styles["modal-container"]}>
            <div className={styles["modal-header-container"]}>
              <h3 className={styles["modal-title"]}>Add Loan</h3>
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
              onSubmit={handleAddLoan}
            >
              <label className={styles.label} htmlFor="user_id">
                Employee Name
                <Select
                  className={`${styles.input} ${
                    errors.userId ? styles["error-input"] : ""
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
                  options={employeeOptions}
                  placeholder="Select Employee"
                  name="userId"
                  id="user_id"
                  value={employeeOptions.find(
                    (option) => option.value === loans.userId
                  )}
                  onChange={(selectedOption) =>
                    handleInputChange(null, "userId", selectedOption.value)
                  }
                />
                {errors.userId && (
                  <p className={styles["error-message"]}>{errors.userId}</p>
                )}
              </label>
              <label className={styles.label} htmlFor="loan_amount">
                Loan Amount
                <input
                  className={`${styles.input} ${
                    errors.loanAmount ? styles["error-input"] : ""
                  }`}
                  type="number"
                  id="loan_amount"
                  name="loanAmount"
                  value={loansData.loanAmount}
                  onChange={handleInputChange}
                />
                {errors.loanAmount && (
                  <p className={styles["error-message"]}>{errors.loanAmount}</p>
                )}
              </label>
              <label className={styles.label} htmlFor="institution">
                Institution
                <Select
                  className={`${styles.input} ${
                    errors.institution ? styles["error-input"] : ""
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
                  options={institutionOptions}
                  placeholder="Select Institution"
                  name="institution"
                  id="instittution"
                  value={institutionOptions.find(
                    (option) => option.value === loansData.institution
                  )}
                  onChange={(selectedOption) =>
                    handleInputChange(null, "institution", selectedOption.value)
                  }
                />
                {errors.institution && (
                  <p className={styles["error-message"]}>
                    {errors.institution}
                  </p>
                )}
              </label>
              <label className={styles.label} htmlFor="loan_type">
                Loan Type
                <Select
                  className={`${styles.input} ${
                    errors.loanType ? styles["error-input"] : ""
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
                  options={loanTypeOptions}
                  placeholder="Select Loan Type"
                  name="loanType"
                  id="loan_type"
                  value={loanTypeOptions.find(
                    (option) => option.value === loansData.loanType
                  )}
                  onChange={(selectedOption) =>
                    handleInputChange(null, "loanType", selectedOption.value)
                  }
                />
                {errors.loanType && (
                  <p className={styles["error-message"]}>{errors.loanType}</p>
                )}
              </label>
              <label className={styles.label} htmlFor="payment_every">
                Payment Every
                <Select
                  className={`${styles.input} ${
                    errors.paymentEvery ? styles["error-input"] : ""
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
                  options={paymentEveryOptions}
                  placeholder="Select Payment Options"
                  name="paymentEvery"
                  id="payment_every"
                  value={paymentEveryOptions.find(
                    (option) => option.value === loansData.paymentEvery
                  )}
                  onChange={(selectedOption) =>
                    handleInputChange(
                      null,
                      "paymentEvery",
                      selectedOption.value
                    )
                  }
                />
                {errors.paymentEvery && (
                  <p className={styles["error-message"]}>
                    {errors.paymentEvery}
                  </p>
                )}
              </label>
              <label className={styles.label} htmlFor="payment_duration">
                Payment Duration
                <Select
                  className={`${styles.input} ${
                    errors.paymentDuration ? styles["error-input"] : ""
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
                  options={durationOptions}
                  placeholder="Select Duration"
                  name="paymentDuration"
                  id="payment_duration"
                  value={durationOptions.find(
                    (option) => option.value === loansData.paymentDuration
                  )}
                  onChange={(selectedOption) =>
                    handleInputChange(
                      null,
                      "paymentDuration",
                      selectedOption.value
                    )
                  }
                />
                {errors.paymentDuration && (
                  <p className={styles["error-message"]}>
                    {errors.paymentDuration}
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
      {isEditModalOpen && selectedLoan && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
        >
          <div className={styles["modal-container"]}>
            <div className={styles["modal-header-container"]}>
              <h3 className={styles["modal-title"]}>Edit Loan</h3>
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
              onSubmit={handleEditLoan}
            >
              <label className={styles.label} htmlFor="user_id">
                Employee Name
                <Select
                  className={`${styles.input} ${
                    errors.userId ? styles["error-input"] : ""
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
                  options={employeeOptions}
                  placeholder="Select Employee"
                  name="userId"
                  id="user_id"
                  value={employeeOptions.find(
                    (option) => option.value === String(loansData.userId)
                  )}
                  onChange={(selectedOption) =>
                    handleInputChange(null, "userId", selectedOption.value)
                  }
                />
                {errors.userId && (
                  <p className={styles["error-message"]}>{errors.userId}</p>
                )}
              </label>
              <label className={styles.label} htmlFor="loan_amount">
                Loan Amount
                <input
                  className={`${styles.input} ${
                    errors.loanAmount ? styles["error-input"] : ""
                  }`}
                  type="number"
                  id="loan_amount"
                  name="loanAmount"
                  value={loansData.loanAmount}
                  onChange={handleInputChange}
                />
                {errors.loanAmount && (
                  <p className={styles["error-message"]}>{errors.loanAmount}</p>
                )}
              </label>
              <label className={styles.label} htmlFor="institution">
                Institution
                <Select
                  className={`${styles.input} ${
                    errors.institution ? styles["error-input"] : ""
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
                  options={institutionOptions}
                  placeholder="Select Institution"
                  name="institution"
                  id="instittution"
                  value={institutionOptions.find(
                    (option) => option.value === loansData.institution
                  )}
                  onChange={(selectedOption) =>
                    handleInputChange(null, "institution", selectedOption.value)
                  }
                />
                {errors.institution && (
                  <p className={styles["error-message"]}>
                    {errors.institution}
                  </p>
                )}
              </label>
              <label className={styles.label} htmlFor="loan_type">
                Loan Type
                <Select
                  className={`${styles.input} ${
                    errors.loanType ? styles["error-input"] : ""
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
                  options={loanTypeOptions}
                  placeholder="Select Loan Type"
                  name="loanType"
                  id="loan_type"
                  value={loanTypeOptions.find(
                    (option) => option.value === loansData.loanType
                  )}
                  onChange={(selectedOption) =>
                    handleInputChange(null, "loanType", selectedOption.value)
                  }
                />
                {errors.loanType && (
                  <p className={styles["error-message"]}>{errors.loanType}</p>
                )}
              </label>
              <label className={styles.label} htmlFor="payment_every">
                Payment Every
                <Select
                  className={`${styles.input} ${
                    errors.paymentEvery ? styles["error-input"] : ""
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
                  options={paymentEveryOptions}
                  placeholder="Select Payment Options"
                  name="paymentEvery"
                  id="payment_every"
                  value={paymentEveryOptions.find(
                    (option) => option.value === loansData.paymentEvery
                  )}
                  onChange={(selectedOption) =>
                    handleInputChange(
                      null,
                      "paymentEvery",
                      selectedOption.value
                    )
                  }
                />
                {errors.paymentEvery && (
                  <p className={styles["error-message"]}>
                    {errors.paymentEvery}
                  </p>
                )}
              </label>
              <label className={styles.label} htmlFor="payment_duration">
                Payment Duration
                <Select
                  className={`${styles.input} ${
                    errors.paymentDuration ? styles["error-input"] : ""
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
                  options={durationOptions}
                  placeholder="Select Duration"
                  name="paymentDuration"
                  id="payment_duration"
                  value={durationOptions.find(
                    (option) => option.value === loansData.paymentDuration
                  )}
                  onChange={(selectedOption) =>
                    handleInputChange(
                      null,
                      "paymentDuration",
                      selectedOption.value
                    )
                  }
                />
                {errors.paymentDuration && (
                  <p className={styles["error-message"]}>
                    {errors.paymentDuration}
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
      {isDeleteModalOpen && selectedLoan && (
        <Modal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
        >
          <div
            className={`${styles["modal-container"]} ${styles["delete-modal-container"]}`}
          >
            <h1 className={styles["delete-modal-header"]}>
              Are you sure to delete this loan?
            </h1>
            <div className={styles["delete-modal-button-container"]}>
              <button
                className={styles["delete-modal-button"]}
                onClick={handleDeleteLoan}
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

export default HRLoan;
