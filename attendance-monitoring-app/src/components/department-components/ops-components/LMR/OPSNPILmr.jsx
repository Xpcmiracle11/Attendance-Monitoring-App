import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import Modal from "../../../Modal";
import styles from "../../../../assets/styles/OPSNPILmr.module.css";
import crossIcon from "../../../../assets/images/cross-icon.svg";
import editIcon from "../../../../assets/images/edit-icon.svg";
import editHoverIcon from "../../../../assets/images/edit-hovered-icon.svg";
import deleteIcon from "../../../../assets/images/delete-icon.svg";
import deleteHoverIcon from "../../../../assets/images/delete-hovered-icon.svg";
import checkIcon from "../../../../assets/images/check-icon.svg";
import checkHoverIcon from "../../../../assets/images/check-hovered-icon.svg";
import filterIcon from "../../../../assets/images/filter-icon.svg";
import sortIcon from "../../../../assets/images/sort-icon.svg";
import exportIcon from "../../../../assets/images/export-icon.svg";
import pdfIcon from "../../../../assets/images/pdf-icon.svg";
import wordIcon from "../../../../assets/images/word-icon.svg";
import excelIcon from "../../../../assets/images/excel-icon.svg";
import pdfActiveIcon from "../../../../assets/images/pdf-active-icon.svg";
import wordActiveIcon from "../../../../assets/images/word-active-icon.svg";
import excelActiveIcon from "../../../../assets/images/excel-active-icon.svg";
import Select from "react-select";
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
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

const OPSLmr = () => {
  const [lmrs, setLmrs] = useState([]);
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
  const [isCheckModalOpen, setIsCheckModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedLmr, setSelectedLmr] = useState(null);
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);
  const [exportFromDate, setExportFromDate] = useState("");
  const [exportToDate, setExportToDate] = useState("");
  const [exportFileType, setExportFileType] = useState("");
  const [exportError, setExportError] = useState("");
  const filterRef = useRef(null);
  const sortRef = useRef(null);
  const exportRef = useRef(null);
  const [isCheckHovered, setIsCheckHovered] = useState(null);
  const [isEditHovered, setIsEditHovered] = useState(null);
  const [isDeleteHovered, setIsDeleteHovered] = useState(null);
  const [lmrsData, setLmrsData] = useState({
    driverId: "",
    crewId: "",
    truckId: "",
    allowanceMatrixId: "",
  });

  const [errors, setErrors] = useState({
    driverId: "",
    crewId: "",
    truckId: "",
    allowanceMatrixId: "",
    apiError: "",
  });

  const isDarkMode =
    document.documentElement.getAttribute("data-theme") === "dark";

  const fetchLmrs = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/lmrs`);
      if (response.data.success) {
        setLmrs(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching lmr:", error);
    }
  };
  useEffect(() => {
    fetchLmrs();
  }, []);

  const filteredLmrs = lmrs
    .filter((lmr) => {
      const waybill = (lmr.dmr_waybill || "").toLowerCase();
      const matchesSearch = waybill.includes(search.toLowerCase());

      const lmrDate = lmr.created_at
        ? new Date(lmr.created_at.split("T")[0])
        : new Date();
      const iswithinDateRange =
        (!appliedFromDate || lmrDate >= new Date(appliedFromDate)) &&
        (!appliedToDate || lmrDate <= new Date(appliedToDate));

      return matchesSearch && iswithinDateRange;
    })
    .sort((a, b) => {
      if (sortOrder === "date-asc")
        return new Date(a.created_at) - new Date(b.created_at);
      if (sortOrder === "date-desc")
        return new Date(b.created_at) - new Date(a.created_at);
      if (sortOrder === "dmr_waybill-asc")
        return a.dmr_waybill.localeCompare(b.dmr_waybill);
      if (sortOrder === "dmr_waybill-desc")
        return b.dmr_waybill.localeCompare(a.dmr_waybill);
      return 0;
    });

  const totalPages = Math.ceil(filteredLmrs.length / itemsPerPage);
  const paginatedLmrs = filteredLmrs.slice(
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

    if (dateString.includes("T") && !dateString.endsWith("T00:00:00.000Z")) {
      const date = new Date(dateString);
      return date.toLocaleString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } else {
      const isoDate = dateString.substring(0, 10);
      const [year, month, day] = isoDate.split("-");
      const monthNames = [
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
      return `${monthNames[parseInt(month, 10) - 1]} ${parseInt(
        day,
        10
      )}, ${year}`;
    }
  };

  const tableColumn = [
    "ID",
    "Week",
    "Waybill",
    "Category",
    "Site",
    "Customer Number",
    "Customer Name",
    "Invoice",
    "CDN",
    "Quantity",
    "Amount",
    "PO Number",
    "FO Number",
    "Seal Number",
    "Transaction Date",
    "Truck Gate In",
    "Dispatch Date and Time",
    "RDD",
    "Driver Name",
    "Crews",
    "Plate Number",
    "Truck Type",
    "TSM Truck Type",
    "Source and Destination",
    "Second Leg FO",
    "Status",
  ];

  const exportToExcel = (data) => {
    const formattedData = data.map((item, index) => ({
      ID: index + 1,
      Week: item.dmr_week,
      Waybill: item.dmr_waybill,
      Category: item.dmr_category,
      Site: item.site_code,
      "Customer Number": item.dmr_customer_number,
      "Customer Name": item.dmr_customer_name,
      Invoice: item.dmr_invoice,
      CDN: item.dmr_cdn,
      Quantity: item.dmr_quantity,
      Amount: item.dmr_amount,
      "PO Number": item.dmr_po_number,
      "FO Number": item.dmr_fo_number,
      "Seal Number": item.dmr_seal_number,
      "Transaction Date": formatDate(item.dmr_transaction_date),
      "Truck Gate In": formatDate(item.dmr_truck_gate_in),
      "Dispatch Date and Time": formatDate(item.dmr_dispatch_date_and_time),
      RDD: formatDate(item.dmr_rdd),
      "Driver Name": item.driver_name,
      Crews: item.crew_names,
      "Plate Number": item.plate_number,
      "Truck Type": item.truck_type,
      "TSM Truck Type": item.dmr_tsm_trucktype,
      "Source and Destination": item.route_name,
      "Second Leg FO": item.dmr_second_leg_fo,
      Status: item.status,
    }));

    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "lmrs");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
    });

    saveAs(blob, "lmrs.xlsx");
  };

  const exportToPDF = (data) => {
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });
    doc.text("lmr Report", 14, 10);

    const tableRows = data.map((item, index) => [
      index + 1,
      item.dmr_week || "",
      item.dmr_waybill || "",
      item.dmr_category || "",
      item.site_code || "",
      item.dmr_customer_number || "",
      item.dmr_customer_name || "",
      item.dmr_invoice || "",
      item.dmr_cdn || "",
      item.dmr_quantity || "",
      item.dmr_amount || "",
      item.dmr_po_number || "",
      item.dmr_fo_number || "",
      item.dmr_seal_number || "",
      formatDate(item.dmr_transaction_date),
      formatDate(item.dmr_truck_gate_in),
      formatDate(item.dmr_dispatch_date_and_time),
      formatDate(item.dmr_rdd),
      item.driver_name || "",
      item.crew_names || "",
      item.plate_number || "",
      item.truck_type || "",
      item.dmr_tsm_trucktype || "",
      item.route_name || "",
      item.dmr_second_leg_fo || "",
      item.status || "",
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 20,
      styles: { fontSize: 7, cellPadding: 2 },
    });

    doc.save("lmrs.pdf");
  };

  const exportToWord = (data) => {
    const tableRows = data.map((item, index) => {
      const cells = tableColumn.map((column) => {
        const keyMap = {
          ID: index + 1,
          Week: item.dmr_week,
          Waybill: item.dmr_waybill,
          Category: item.dmr_category,
          Site: item.site_code,
          "Customer Number": item.dmr_customer_number,
          "Customer Name": item.dmr_customer_name,
          Invoice: item.dmr_invoice,
          CDN: item.dmr_cdn,
          Quantity: item.dmr_quantity,
          Amount: item.dmr_amount,
          "PO Number": item.dmr_po_number,
          "FO Number": item.dmr_fo_number,
          "Seal Number": item.dmr_seal_number,
          "Transaction Date": formatDate(item.dmr_transaction_date),
          "Truck Gate In": formatDate(item.dmr_truck_gate_in),
          "Dispatch Date and Time": formatDate(item.dmr_dispatch_date_and_time),
          RDD: formatDate(item.dmr_rdd),
          "Driver Name": item.driver_name,
          Crews: item.crew_names,
          "Plate Number": item.plate_number,
          "Truck Type": item.truck_type,
          "TSM Truck Type": item.dmr_tsm_trucktype,
          "Source and Destination ": item.route_name,
          "Second Leg FO ": item.dmr_second_leg_fo,
          Status: item.status,
        };
        return new TableCell({
          children: [
            new Paragraph(keyMap[column] ? keyMap[column].toString() : ""),
          ],
        });
      });

      return new TableRow({ children: cells });
    });

    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            new Paragraph({
              text: "LMR Report",
              heading: HeadingLevel.HEADING_1,
            }),
            new Table({ rows: tableRows }),
          ],
        },
      ],
    });

    Packer.toBlob(doc).then((blob) => {
      saveAs(blob, "lmrs.docx");
    });
  };

  const handleExport = () => {
    if (!exportFileType) {
      setExportError("Please select an export format.");
      return;
    }

    const filteredData = lmrs.filter((lmrs) => {
      const lmrsDate = lmrs.created_at
        ? new Date(lmrs.created_at.split("T")[0])
        : new Date();
      return (
        (!exportFromDate || lmrsDate >= new Date(exportFromDate)) &&
        (!exportToDate || lmrsDate <= new Date(exportToDate))
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

  const handleInputChange = (e, name, value) => {
    if (e && e.target) {
      const { name, value } = e.target;
      setLmrsData((prevData) => ({
        ...prevData,
        [name]: value,
      }));
      setErrors((prevErrors) => ({
        ...prevErrors,
        [name]: "",
      }));
    } else {
      setLmrsData((prevData) => ({
        ...prevData,
        [name]: value,
      }));
      setErrors((prevErrors) => ({
        ...prevErrors,
        [name]: "",
      }));
    }
  };

  const toggleEditModal = (lmr = null) => {
    setSelectedLmr(lmr);
    setLmrsData({
      driverId: lmr?.driver_id?.toString() || "",
      crewId: lmr?.crew_ids ? lmr.crew_ids.split(",") : [],
      truckId: lmr?.truck_id?.toString() || "",
      allowanceMatrixId: lmr?.allowance_matrix_id?.toString() || "",
    });
    setIsEditModalOpen(true);
    setErrors({
      driverId: "",
      crewId: "",
      truckId: "",
      allowanceMatrixId: "",
      apiError: "",
    });
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedLmr(null);
    setLmrsData({
      driverId: "",
      crewId: "",
      truckId: "",
      allowanceMatrixId: "",
    });
    setErrors({
      driverId: "",
      crewId: "",
      truckId: "",
      allowanceMatrixId: "",
      apiError: "",
    });
  };

  const handleEditLmr = async (e) => {
    e.preventDefault();

    if (!selectedLmr?.dmr_waybill) return;

    try {
      const response = await axios.put(
        `${API_BASE_URL}/update-lmr/${selectedLmr.dmr_waybill}`,
        {
          driver_id: lmrsData.driverId,
          crew_id: lmrsData.crewId,
          truck_id: lmrsData.truckId,
          allowance_matrix_id: lmrsData.allowanceMatrixId,
        }
      );

      if (response.data.success) {
        fetchLmrs();
        closeEditModal();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const toggleDeleteModal = (lmr = null) => {
    setSelectedLmr(lmr);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setSelectedLmr(null);
    setIsDeleteModalOpen(false);
  };

  const handleDeleteLmr = async () => {
    if (!selectedLmr?.dmr_waybill) return;

    try {
      const response = await axios.delete(
        `${API_BASE_URL}/delete-lmr/${selectedLmr.dmr_waybill}`
      );

      if (response.data.success) {
        fetchLmrs();
        closeDeleteModal();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const toggleCheckModal = (lmr = null) => {
    setSelectedLmr(lmr);
    setIsCheckModalOpen(true);
  };

  const closeCheckModal = () => {
    setSelectedLmr(null);
    setIsCheckModalOpen(false);
  };

  const handleCheckLmr = async () => {
    if (!selectedLmr?.dmr_waybill) return;

    try {
      const response = await axios.post(
        `${API_BASE_URL}/approve-lmr/${selectedLmr.dmr_waybill}`
      );

      if (response.data.success) {
        fetchLmrs();
        closeCheckModal();
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

  const [driverOptions, setDriverOptions] = useState([]);

  useEffect(() => {
    axios
      .get(`${API_BASE_URL}/users`)
      .then((response) => {
        if (response.data.success && Array.isArray(response.data.data)) {
          const users = response.data.data;

          const filteredUsers = users.filter((user) => {
            const isDriver =
              user.department_name === "Operations" && user.role === "Driver";

            const isAssigned = lmrs.some((lmr) => lmr.driver_id === user.id);
            const isCurrentDriver =
              selectedLmr && selectedLmr.driver_id === user.id;

            return isDriver && (!isAssigned || isCurrentDriver);
          });

          if (
            selectedLmr &&
            selectedLmr.driver_id &&
            !filteredUsers.some((u) => u.id === selectedLmr.driver_id)
          ) {
            const currentDriver = users.find(
              (u) => u.id === selectedLmr.driver_id
            );
            if (currentDriver) filteredUsers.push(currentDriver);
          }

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
  }, [lmrs, selectedLmr]);

  const [crewOptions, setCrewOptions] = useState([]);

  useEffect(() => {
    axios
      .get(`${API_BASE_URL}/users`)
      .then((response) => {
        if (response.data.success && Array.isArray(response.data.data)) {
          const users = response.data.data;

          const filteredUsers = users.filter((user) => {
            const isCrew =
              user.department_name === "Operations" && user.role === "Crew";

            const assignedCrewIds = lmrs.flatMap((lmr) => lmr.crew_id || []);

            const isAssigned = assignedCrewIds.includes(user.id);

            const isCurrentCrew = selectedLmr?.crew_id?.includes(user.id);

            return isCrew && (!isAssigned || isCurrentCrew);
          });

          if (selectedLmr?.crew_id) {
            const currentCrew = users.filter((u) =>
              selectedLmr.crew_id.includes(u.id)
            );
            currentCrew.forEach((crewMember) => {
              if (!filteredUsers.some((u) => u.id === crewMember.id)) {
                filteredUsers.push(crewMember);
              }
            });
          }

          const options = filteredUsers.map((user) => ({
            value: String(user.id),
            label: user.full_name,
          }));

          setCrewOptions(options);
        } else {
          console.error("Invalid data format:", response.data);
        }
      })
      .catch((error) => {
        console.error("Error fetching crew members:", error);
      });
  }, [lmrs, selectedLmr]);

  const [plateNumberOptions, setPlateNumberOptions] = useState([]);

  useEffect(() => {
    axios
      .get(`${API_BASE_URL}/trucks`)
      .then((response) => {
        if (response.data.success && Array.isArray(response.data.data)) {
          const trucks = response.data.data;

          const filteredTrucks = trucks.filter((truck) => {
            const isAssigned = lmrs.some((lmr) => lmr.truck_id === truck.id);
            const isCurrentTruck =
              selectedLmr && selectedLmr.truck_id === truck.id;

            return !isAssigned || isCurrentTruck;
          });

          if (
            selectedLmr &&
            selectedLmr.truck_id &&
            !filteredTrucks.some((t) => t.id === selectedLmr.truck_id)
          ) {
            const currentTruck = trucks.find(
              (t) => t.id === selectedLmr.truck_id
            );
            if (currentTruck) filteredTrucks.push(currentTruck);
          }

          const options = filteredTrucks.map((truck) => ({
            value: String(truck.id),
            label: `${truck.plate_number} - ${truck.truck_type}`,
          }));

          setPlateNumberOptions(options);
        } else {
          console.error("Invalid data format:", response.data);
        }
      })
      .catch((error) => {
        console.error("Error fetching trucks:", error);
      });
  }, [lmrs, selectedLmr]);

  const [allowanceMatrixOptions, setAllowanceMatrixOptions] = useState([]);

  useEffect(() => {
    axios
      .get(`${API_BASE_URL}/matrixes`)
      .then((response) => {
        if (response.data.success && Array.isArray(response.data.data)) {
          const options = response.data.data.map((matrix) => ({
            value: String(matrix.id),
            label: `${matrix.source} - ${matrix.destination}`,
          }));

          setAllowanceMatrixOptions(options);
        } else {
          console.error("Invalid data format:", response.data);
        }
      })
      .catch((error) => {
        console.error("Error fetching departments:", error);
      });
  }, []);

  return (
    <div className={styles["lmr-content"]}>
      <div className={styles["content-header-container"]}>
        <h1 className={styles["page-title"]}>LMR</h1>
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
                          checked={tempSortOrder === "dmr_waybill-asc"}
                          onChange={() => setTempSortOrder("dmr_waybill-asc")}
                        />
                        A-Z
                      </label>
                      <label className={styles["sort-label"]} htmlFor="z-a">
                        <input
                          className={styles["sort-input"]}
                          id="z-a"
                          type="radio"
                          name="sort"
                          checked={tempSortOrder === "dmr_waybill-desc"}
                          onChange={() => setTempSortOrder("dmr_waybill-desc")}
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
                <th className={styles.th}>Waybill</th>
                <th className={styles.th}>Category</th>
                <th className={styles.th}>Site</th>
                <th className={styles.th}>Customer ID</th>
                <th className={styles.th}>Customer Name</th>
                <th className={styles.th}>Invoice</th>
                <th className={styles.th}>CDN</th>
                <th className={styles.th}>Quantity</th>
                <th className={styles.th}>Amount</th>
                <th className={styles.th}>PO Number</th>
                <th className={styles.th}>FO Number</th>
                <th className={styles.th}>Seal Number</th>
                <th className={styles.th}>Transaction Date</th>
                <th className={styles.th}>Truck Gate In</th>
                <th className={styles.th}>Dispatch Date & Time</th>
                <th className={styles.th}>RDD</th>
                <th className={styles.th}>Driver Name</th>
                <th className={styles.th}>Crews</th>
                <th className={styles.th}>Plate Number</th>
                <th className={styles.th}>Truck Type</th>
                <th className={styles.th}>TSM Truck Type</th>
                <th className={styles.th}>Source and Destination</th>
                <th className={styles.th}>Second Leg FO</th>
                <th className={styles.th}>Status</th>
                <th className={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody className={styles.tbody}>
              {(() => {
                const renderedWaybills = new Set();

                return paginatedLmrs.map((lmr, index) => {
                  const showButtons = !renderedWaybills.has(lmr.dmr_waybill);
                  renderedWaybills.add(lmr.dmr_waybill);
                  return (
                    <tr className={styles.btr} key={lmr.dmr_waybill + index}>
                      <td className={styles.td}>
                        <span
                          className={
                            lmr.status === "Pending"
                              ? styles["status-pin-pending"]
                              : lmr.status === "Requested"
                              ? styles["status-pin-requested"]
                              : lmr.status === "Approved"
                              ? styles["status-pin-approved"]
                              : lmr.status === "Declined"
                              ? styles["status-pin-declined"]
                              : ""
                          }
                        ></span>
                        {lmr.dmr_week}
                      </td>
                      <td className={styles.td}>{lmr.dmr_waybill}</td>
                      <td className={styles.td}>{lmr.dmr_category}</td>
                      <td className={styles.td}>{lmr.site_code}</td>
                      <td className={styles.td}>{lmr.dmr_customer_number}</td>
                      <td className={styles.td}>{lmr.dmr_customer_name}</td>
                      <td className={styles.td}>{lmr.dmr_invoice}</td>
                      <td className={styles.td}>{lmr.dmr_cdn}</td>
                      <td className={styles.td}>{lmr.dmr_quantity}</td>
                      <td className={styles.td}>{lmr.dmr_amount}</td>
                      <td className={styles.td}>{lmr.dmr_po_number}</td>
                      <td className={styles.td}>{lmr.dmr_fo_number}</td>
                      <td className={styles.td}>{lmr.dmr_seal_number}</td>
                      <td className={styles.td}>
                        {formatDate(lmr.dmr_transaction_date)}
                      </td>
                      <td className={styles.td}>
                        {formatDate(lmr.dmr_truck_gate_in)}
                      </td>
                      <td className={styles.td}>
                        {formatDate(lmr.dmr_dispatch_date_and_time)}
                      </td>
                      <td className={styles.td}>{formatDate(lmr.dmr_rdd)}</td>
                      <td className={styles.td}>{lmr.driver_name}</td>
                      <td className={styles.td}>{lmr.crew_names}</td>
                      <td className={styles.td}>{lmr.plate_number}</td>
                      <td className={styles.td}>{lmr.truck_type}</td>
                      <td className={styles.td}>{lmr.dmr_tsm_trucktype}</td>
                      <td className={styles.td}>{lmr.route_name}</td>
                      <td className={styles.td}>{lmr.dmr_second_leg_fo}</td>
                      <td className={styles.td}>{lmr.status}</td>
                      <td className={styles.td}>
                        <div className={styles["action-container"]}>
                          {showButtons &&
                            lmr.status !== "Requested" &&
                            lmr.driver_id &&
                            lmr.truck_id && (
                              <button
                                className={styles["check-button"]}
                                onMouseEnter={() => setIsCheckHovered(index)}
                                onMouseLeave={() => setIsCheckHovered(null)}
                                onClick={() => toggleCheckModal(lmr)}
                              >
                                <img
                                  className={styles["check-icon"]}
                                  src={
                                    isCheckHovered === index
                                      ? checkHoverIcon
                                      : checkIcon
                                  }
                                  alt="Check"
                                />
                                <p>Approve</p>
                              </button>
                            )}
                          {showButtons && (
                            <button
                              className={styles["edit-button"]}
                              onMouseEnter={() => setIsEditHovered(index)}
                              onMouseLeave={() => setIsEditHovered(null)}
                              onClick={() => toggleEditModal(lmr)}
                            >
                              <img
                                className={styles["edit-icon"]}
                                src={
                                  isEditHovered === index
                                    ? editHoverIcon
                                    : editIcon
                                }
                                alt="Edit"
                              />
                              <p>Edit</p>
                            </button>
                          )}
                          {showButtons && (
                            <button
                              className={styles["delete-button"]}
                              onMouseEnter={() => setIsDeleteHovered(index)}
                              onMouseLeave={() => setIsDeleteHovered(null)}
                              onClick={() => toggleDeleteModal(lmr)}
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
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                });
              })()}

              {paginatedLmrs.length === 0 && (
                <tr className={styles.btr}>
                  <td
                    colSpan="26"
                    className={`${styles.td} ${styles["search-response"]}`}
                  >
                    No LMRs found.
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
      {isEditModalOpen && selectedLmr && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
        >
          <div className={styles["modal-container"]}>
            <div className={styles["modal-header-container"]}>
              <h3 className={styles["modal-title"]}>Edit lmr</h3>
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
              onSubmit={handleEditLmr}
            >
              <label className={styles.label} htmlFor="driver_id">
                Driver
                <Select
                  className={`${styles.input} ${
                    errors.driverId ? styles["error-input"] : ""
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
                  id="driver_id"
                  name="driverId"
                  options={driverOptions}
                  value={
                    driverOptions.find(
                      (opt) => opt.value === lmrsData.driverId
                    ) || null
                  }
                  onChange={(selected) =>
                    setLmrsData((prev) => ({
                      ...prev,
                      driverId: selected?.value || "",
                    }))
                  }
                  classNamePrefix="react-select"
                  placeholder="Select Driver"
                />
                {errors.driverId && (
                  <p className={styles["error-message"]}>{errors.driverId}</p>
                )}
              </label>
              <label className={styles.label} htmlFor="crew_id">
                Crew Members
                <Select
                  className={`${styles.input} ${
                    errors.crew_id ? styles["error-input"] : ""
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
                  isMulti
                  id="crew_id"
                  name="crewId"
                  options={crewOptions}
                  value={crewOptions.filter((opt) =>
                    lmrsData.crewId?.includes(opt.value)
                  )}
                  onChange={(selected) => {
                    const values = selected
                      ? selected.map((opt) => opt.value)
                      : [];
                    setLmrsData((prev) => ({ ...prev, crewId: values }));
                  }}
                  classNamePrefix="react-select"
                  placeholder="Select Crew Members"
                />
                {errors.crewId && (
                  <p className={styles["error-message"]}>{errors.crewId}</p>
                )}
              </label>
              <label className={styles.label} htmlFor="truck_id">
                Truck (Plate Number)
                <Select
                  className={`${styles.input} ${
                    errors.truckId ? styles["error-input"] : ""
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
                  id="truck_id"
                  name="truckId"
                  options={plateNumberOptions}
                  value={
                    plateNumberOptions.find(
                      (opt) => opt.value === lmrsData.truckId
                    ) || null
                  }
                  onChange={(selected) =>
                    setLmrsData((prev) => ({
                      ...prev,
                      truckId: selected?.value || "",
                    }))
                  }
                  classNamePrefix="react-select"
                  placeholder="Select Truck"
                />
                {errors.truckId && (
                  <p className={styles["error-message"]}>{errors.truckId}</p>
                )}
              </label>
              <label className={styles.label} htmlFor="allowance_matrix_id">
                Source and Destination
                <Select
                  className={`${styles.input} ${
                    errors.allowanceMatrixId ? styles["error-input"] : ""
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
                      color: state.isSelected
                        ? "var(--text-primary)"
                        : base.color,
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
                  id="allowance_matrix_id"
                  name="allowanceMatrixId"
                  options={allowanceMatrixOptions}
                  value={allowanceMatrixOptions.find(
                    (opt) => opt.value === lmrsData.allowanceMatrixId
                  )}
                  onChange={(selected) =>
                    setLmrsData((prev) => ({
                      ...prev,
                      allowanceMatrixId: selected?.value || "",
                    }))
                  }
                  placeholder="Select Source and Destination"
                />
                {errors.allowanceMatrixId && (
                  <p className={styles["error-message"]}>
                    {errors.allowanceMatrixId}
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
      {isDeleteModalOpen && selectedLmr && (
        <Modal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
        >
          <div
            className={`${styles["modal-container"]} ${styles["delete-modal-container"]}`}
          >
            <h1 className={styles["delete-modal-header"]}>
              Are you sure to delete this LMR?
            </h1>
            <div className={styles["delete-modal-button-container"]}>
              <button
                className={styles["delete-modal-button"]}
                onClick={handleDeleteLmr}
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
      {isCheckModalOpen && selectedLmr && (
        <Modal
          isOpen={isCheckModalOpen}
          onClose={() => setIsCheckModalOpen(false)}
        >
          <div
            className={`${styles["modal-container"]} ${styles["check-modal-container"]}`}
          >
            <h1 className={styles["check-modal-header"]}>
              Request allowance for this waybill?
            </h1>
            <div className={styles["check-modal-button-container"]}>
              <button
                className={styles["check-modal-button"]}
                onClick={handleCheckLmr}
              >
                Approve
              </button>
              <button
                className={styles["cancel-check-modal-button"]}
                onClick={closeCheckModal}
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

export default OPSLmr;
