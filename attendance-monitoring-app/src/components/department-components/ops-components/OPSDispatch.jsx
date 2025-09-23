import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import Modal from "../../Modal";
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
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Document, Packer, Paragraph, Table, TableRow, TableCell } from "docx";
import Select from "react-select";
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
    userId: "",
    crewId: "",
    truckId: "",
    loadedDate: "",
  });
  const [errors, setErrors] = useState({
    userId: "",
    crewId: "",
    truckId: "",
    loadedDate: "",
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
      console.error("Error fetching dispatch:", error);
    }
  };
  useEffect(() => {
    fetchDispatches();
  }, []);

  const filteredDispatches = dispatches
    .filter((dispatch) => {
      const driverName = (dispatch.full_name || "").toLowerCase();
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
      if (sortOrder === "full_name-asc")
        return a.full_name.localeCompare(b.full_name);
      if (sortOrder === "full_name-desc")
        return b.full_name.localeCompare(a.full_name);
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
    "Driver Name",
    "Crew Name",
    "Truck Plate",
    "Truck Type",
    "Loaded Date",
    "Empty Date",
    "Created At",
  ];

  const exportToExcel = (data) => {
    const formattedData = data.map((item, index) => ({
      ID: index + 1,
      "Driver Name": item.full_name,
      "Crew Name": item.crew_name,
      "Truck Plate": item.plate_number,
      "Truck Type": item.truck_type,
      "Loaded Date": formatDate(item.loaded_date),
      "Empty Date": formatDate(item.empty_date),
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
      item.full_name || "",
      item.crew_name || "",
      item.plate_number || "",
      item.truck_type || "",
      formatDate(item.loaded_date),
      formatDate(item.empty_date),
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
      "Driver Name": "full_name",
      "Crew Name": "crew_name",
      "Truck Plate": "plate_number",
      "Truck Type": "truck_type",
      "Loaded Date": "loaded_date",
      "Empty Date": "empty_date",
      "Created At": "created_at",
    };

    const tableRows = data.map((item, index) => {
      return new TableRow({
        children: tableColumn.map((column) => {
          const key = columnKeyMap[column];

          let value = "";
          if (column === "ID") {
            value = (index + 1).toString();
          } else if (
            column === "Created At" ||
            column === "Loaded Date" ||
            column === "Empty Date"
          ) {
            value = item[key] ? formatDate(item[key]) : "";
          } else {
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
      saveAs(blob, "dispatches.docx");
    });
  };

  const handleExport = () => {
    if (!exportFileType) {
      setExportError("Please select an export format.");
      return;
    }

    const filteredData = dispatches.filter((dispatches) => {
      const dispatchesDate = dispatches.created_at
        ? new Date(dispatches.created_at.split("T")[0])
        : new Date();
      return (
        (!exportFromDate || dispatchesDate >= new Date(exportFromDate)) &&
        (!exportToDate || dispatchesDate <= new Date(exportToDate))
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
          const users = response.data.data;

          const filteredUsers = users.filter((user) => {
            const isDriver =
              user.department_name === "Operations" && user.role === "Driver";
            const isAssigned = dispatches.some(
              (dispatch) => dispatch.user_id === user.id
            );
            const isCurrentDriver =
              selectedDispatch && selectedDispatch.user_id === user.id;

            return isDriver && (!isAssigned || isCurrentDriver);
          });

          if (
            selectedDispatch &&
            selectedDispatch.user_id &&
            !filteredUsers.some((u) => u.id === selectedDispatch.user_id)
          ) {
            const currentDriver = users.find(
              (u) => u.id === selectedDispatch.user_id
            );
            if (currentDriver) {
              filteredUsers.push(currentDriver);
            }
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
  }, [dispatches, selectedDispatch]);

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

            const assignedCrewIds = dispatches.flatMap(
              (dispatch) => dispatch.crew_id || []
            );

            const isAssigned = assignedCrewIds.includes(user.id);

            const isCurrentCrew = selectedDispatch?.crew_id?.includes(user.id);

            return isCrew && (!isAssigned || isCurrentCrew);
          });

          if (selectedDispatch?.crew_id) {
            const currentCrew = users.filter((u) =>
              selectedDispatch.crew_id.includes(u.id)
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
  }, [dispatches, selectedDispatch]);

  const [plateNumberOptions, setPlateNumberOptions] = useState([]);

  useEffect(() => {
    axios
      .get(`${API_BASE_URL}/trucks`)
      .then((response) => {
        if (response.data.success && Array.isArray(response.data.data)) {
          const trucks = response.data.data;

          const filteredTrucks = trucks.filter((truck) => {
            const isAssigned = dispatches.some(
              (dispatch) => dispatch.truck_id === truck.id
            );
            const isCurrentTruck =
              selectedDispatch && selectedDispatch.truck_id === truck.id;

            return !isAssigned || isCurrentTruck;
          });

          if (
            selectedDispatch &&
            selectedDispatch.truck_id &&
            !filteredTrucks.some((t) => t.id === selectedDispatch.truck_id)
          ) {
            const currentTruck = trucks.find(
              (t) => t.id === selectedDispatch.truck_id
            );
            if (currentTruck) {
              filteredTrucks.push(currentTruck);
            }
          }

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
  }, [dispatches, selectedDispatch]);

  const toggleAddModal = () => {
    setIsAddModalOpen(!isAddModalOpen);
    setErrors({
      userId: "",
      crewId: "",
      truckId: "",
      loadedDate: "",
      apiError: "",
    });
  };

  const closeAddModal = () => {
    setIsAddModalOpen(false);
    setDispatchesData({
      userId: "",
      crewId: "",
      truckId: "",
      loadedDate: "",
    });
    setErrors({
      userId: "",
      crewId: "",
      truckId: "",
      loadedDate: "",
      apiError: "",
    });
  };

  const handleInputChange = (e, name, value) => {
    if (e && e.target) {
      const { name, value } = e.target;
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
      userId: "",
      crewId: "",
      truckId: "",
      loadedDate: "",
      apiError: "",
    });

    let hasError = false;

    if (!dispatchesData.userId) {
      setErrors((prev) => ({
        ...prev,
        userId: "Driver name is required.",
      }));
      hasError = true;
    }
    if (!dispatchesData.crewId || dispatchesData.crewId.length === 0) {
      setErrors((prev) => ({
        ...prev,
        crewId: "At least one crew member is required.",
      }));
      hasError = true;
    }
    if (!dispatchesData.truckId) {
      setErrors((prev) => ({
        ...prev,
        truckId: "Truck is required.",
      }));
      hasError = true;
    }
    if (!dispatchesData.loadedDate) {
      setErrors((prev) => ({
        ...prev,
        loadedDate: "Loaded date is required.",
      }));
      hasError = true;
    }
    if (hasError) return;

    try {
      const response = await axios.post(`${API_BASE_URL}/insert-dispatch`, {
        user_id: dispatchesData.userId,
        crew_id: dispatchesData.crewId,
        truck_id: dispatchesData.truckId,
        loaded_date: dispatchesData.loadedDate,
      });

      if (response.data.success) {
        setDispatches((prevDispatches) => [
          ...prevDispatches,
          {
            user_id: dispatchesData.userId,
            crew_id: dispatchesData.crewId,
            truck_id: dispatchesData.truckId,
            loaded_date: dispatchesData.loadedDate,
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
        apiError: error.response?.data?.message || "Failed to add dispatch.",
      }));
    }
  };

  const toggleEditModal = (dispatch = null) => {
    setSelectedDispatch(dispatch);
    setDispatchesData({
      userId: dispatch?.user_id || "",
      crewId: dispatch?.crew_id || [],
      truckId: dispatch?.truck_id || "",
      loadedDate: dispatch?.loaded_date || "",
    });
    setIsEditModalOpen(true);
    setErrors({
      userId: "",
      crewId: "",
      truckId: "",
      loadedDate: "",
      apiError: "",
    });
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedDispatch(null);
    setDispatchesData({
      userId: "",
      crewId: "",
      truckId: "",
      loadedDate: "",
    });
    setErrors({
      userId: "",
      crewId: "",
      truckId: "",
      loadedDate: "",
      apiError: "",
    });
  };

  const handleEditDispatch = async (e) => {
    e.preventDefault();
    setErrors({
      userId: "",
      crewId: "",
      truckId: "",
      loadedDate: "",
      apiError: "",
    });

    if (!selectedDispatch || !selectedDispatch.id) {
      setErrors((prev) => ({
        ...prev,
        apiError: "Invalid dispatch selected.",
      }));
      return;
    }

    let hasError = false;

    if (!dispatchesData.userId) {
      setErrors((prev) => ({
        ...prev,
        userId: "Driver name is required.",
      }));
      hasError = true;
    }
    if (!dispatchesData.crewId || dispatchesData.crewId.length === 0) {
      setErrors((prev) => ({
        ...prev,
        crewId: "At least one crew member is required.",
      }));
      hasError = true;
    }
    if (!dispatchesData.truckId) {
      setErrors((prev) => ({
        ...prev,
        truckId: "Truck is required.",
      }));
      hasError = true;
    }
    if (!dispatchesData.loadedDate) {
      setErrors((prev) => ({
        ...prev,
        loadedDate: "Loaded date is required.",
      }));
      hasError = true;
    }
    if (hasError) return;

    try {
      const response = await axios.put(
        `${API_BASE_URL}/update-dispatch/${selectedDispatch.id}`,
        {
          user_id: dispatchesData.userId,
          crew_id: dispatchesData.crewId,
          truck_id: dispatchesData.truckId,
          loaded_date: dispatchesData.loadedDate,
        }
      );

      if (response.data.success) {
        setDispatches((prevDispatches) =>
          prevDispatches.map((dispatch) =>
            dispatch.id === selectedDispatch.id
              ? {
                  ...dispatch,
                  user_id: dispatchesData.userId,
                  crew_id: dispatchesData.crewId,
                  truck_id: dispatchesData.truckId,
                  loaded_date: dispatchesData.loadedDate,
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
        apiError: error.response?.data?.message || "Failed to update dispatch.",
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
                          checked={tempSortOrder === "ip_address-asc"}
                          onChange={() => setTempSortOrder("ip_address-asc")}
                        />
                        A-Z
                      </label>
                      <label className={styles["sort-label"]} htmlFor="z-a">
                        <input
                          className={styles["sort-input"]}
                          id="z-a"
                          type="radio"
                          name="sort"
                          checked={tempSortOrder === "ip_address-desc"}
                          onChange={() => setTempSortOrder("ip_address-desc")}
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
                <th className={styles.th}>Driver Name</th>
                <th className={styles.th}>Crew</th>
                <th className={styles.th}>Truck Plate</th>
                <th className={styles.th}>Truck Type</th>
                <th className={styles.th}>Loaded Date</th>
                <th className={styles.th}>Empty Date</th>
                <th className={styles.th}>Status</th>
                <th className={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody className={styles.tbody}>
              {paginatedDispatches.map((dispatch, index) => (
                <tr className={styles.btr} key={index}>
                  <td className={styles.td}>
                    {index + 1}. {dispatch.full_name}
                  </td>
                  <td className={styles.td}>{dispatch.crew_name}</td>
                  <td className={styles.td}>{dispatch.plate_number}</td>
                  <td className={styles.td}>{dispatch.truck_type}</td>
                  <td className={styles.td}>
                    {formatDate(dispatch.loaded_date)}
                  </td>
                  <td className={styles.td}>
                    {formatDate(dispatch.empty_date)}
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
              <label className={styles.label} htmlFor="user_id">
                Driver
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
                  options={driverOptions}
                  placeholder="Select Driver"
                  name="userId"
                  id="user_id"
                  value={driverOptions.find(
                    (option) => option.value === String(dispatchesData.userId)
                  )}
                  onChange={(selectedOption) =>
                    handleInputChange(null, "userId", selectedOption.value)
                  }
                />
                {errors.userId && (
                  <p className={styles["error-message"]}>{errors.userId}</p>
                )}
              </label>
              <label className={styles.label} htmlFor="crew_id">
                Crew
                <Select
                  isMulti
                  className={`${styles.input} ${
                    errors.crewId ? styles["error-input"] : ""
                  }`}
                  styles={{
                    control: (base, state) => ({
                      ...base,
                      borderColor: state.isFocused
                        ? "var(--text-secondary)"
                        : "var(--borders)",
                      boxShadow: state.isFocused
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
                    multiValue: (base) => ({
                      ...base,
                      backgroundColor: isDarkMode ? "#2a2a2a" : "#f1f1f1",
                      borderRadius: "8px",
                      padding: "2px 4px",
                    }),
                    multiValueLabel: (base) => ({
                      ...base,
                      color: "var(--text-primary)",
                    }),
                    multiValueRemove: (base) => ({
                      ...base,
                      cursor: "pointer",
                      ":hover": {
                        backgroundColor: "red",
                        color: "white",
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
                  options={crewOptions}
                  placeholder="Select Crew"
                  name="crewId"
                  id="crew_id"
                  value={crewOptions.filter((option) =>
                    dispatchesData.crewId?.includes(option.value)
                  )}
                  onChange={(selectedOptions) =>
                    handleInputChange(
                      null,
                      "crewId",
                      selectedOptions
                        ? selectedOptions.map((opt) => opt.value)
                        : []
                    )
                  }
                />
                {errors.crewId && (
                  <p className={styles["error-message"]}>{errors.crewId}</p>
                )}
              </label>

              <label className={styles.label} htmlFor="truck_id">
                Truck
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
                  options={plateNumberOptions}
                  placeholder="Select Truck"
                  name="truckId"
                  id="truck_id"
                  value={plateNumberOptions.find(
                    (option) => option.value === String(dispatchesData.truckId)
                  )}
                  onChange={(selectedOption) =>
                    handleInputChange(null, "truckId", selectedOption.value)
                  }
                />
                {errors.truckId && (
                  <p className={styles["error-message"]}>{errors.truckId}</p>
                )}
              </label>
              <label className={styles.label} htmlFor="loaded_date">
                Loaded Date
                <input
                  className={`${styles.input} ${
                    errors.loadedDate ? styles["error-input"] : ""
                  }`}
                  type="date"
                  id="loaded_date"
                  name="loadedDate"
                  value={dispatchesData.loadedDate}
                  onChange={handleInputChange}
                />
                {errors.loadedDate && (
                  <p className={styles["error-message"]}>{errors.loadedDate}</p>
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
              <label className={styles.label} htmlFor="user_id">
                Driver
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
                  options={driverOptions}
                  placeholder="Select Driver"
                  name="userId"
                  id="user_id"
                  value={driverOptions.find(
                    (option) => option.value === String(dispatchesData.userId)
                  )}
                  onChange={(selectedOption) =>
                    setDispatchesData((prev) => ({
                      ...prev,
                      userId: selectedOption.value,
                    }))
                  }
                />
                {errors.userId && (
                  <p className={styles["error-message"]}>{errors.userId}</p>
                )}
              </label>
              <label className={styles.label} htmlFor="crew_id">
                Crew
                <Select
                  isMulti
                  className={`${styles.input} ${
                    errors.crewId ? styles["error-input"] : ""
                  }`}
                  styles={{
                    control: (base, state) => ({
                      ...base,
                      borderColor: state.isFocused
                        ? "var(--text-secondary)"
                        : "var(--borders)",
                      boxShadow: state.isFocused
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
                  options={crewOptions}
                  placeholder="Select Crew"
                  name="crewId"
                  id="crew_id"
                  value={crewOptions.filter((option) =>
                    dispatchesData.crewId?.map(String).includes(option.value)
                  )}
                  onChange={(selectedOptions) =>
                    setDispatchesData((prev) => ({
                      ...prev,
                      crewId: selectedOptions.map((option) =>
                        String(option.value)
                      ),
                    }))
                  }
                />
                {errors.crewId && (
                  <p className={styles["error-message"]}>{errors.crewId}</p>
                )}
              </label>
              <label className={styles.label} htmlFor="truck_id">
                Truck
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
                  options={plateNumberOptions}
                  placeholder="Select Truck"
                  name="truckId"
                  id="truck_id"
                  value={plateNumberOptions.find(
                    (option) => option.value === String(dispatchesData.truckId)
                  )}
                  onChange={(selectedOption) =>
                    setDispatchesData((prev) => ({
                      ...prev,
                      truckId: selectedOption.value,
                    }))
                  }
                />
                {errors.truckId && (
                  <p className={styles["error-message"]}>{errors.truckId}</p>
                )}
              </label>
              <label className={styles.label} htmlFor="loaded_date">
                Loaded Date
                <input
                  className={`${styles.input} ${
                    errors.loadedDate ? styles["error-input"] : ""
                  }`}
                  type="date"
                  id="loaded_date"
                  name="loadedDate"
                  value={dispatchesData.loadedDate}
                  onChange={handleInputChange}
                />
                {errors.loadedDate && (
                  <p className={styles["error-message"]}>{errors.loadedDate}</p>
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
