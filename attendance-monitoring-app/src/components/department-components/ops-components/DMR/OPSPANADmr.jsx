import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import Modal from "../../../Modal";
import styles from "../../../../assets/styles/OPSPANADmr.module.css";
import crossIcon from "../../../../assets/images/cross-icon.svg";
import editIcon from "../../../../assets/images/edit-icon.svg";
import deleteIcon from "../../../../assets/images/delete-icon.svg";
import editHoverIcon from "../../../../assets/images/edit-hovered-icon.svg";
import deleteHoverIcon from "../../../../assets/images/delete-hovered-icon.svg";
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
import { Document, Packer, Paragraph, Table, TableRow, TableCell } from "docx";
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

const OPSPANADmr = () => {
  const [dmrs, setDmrs] = useState([]);
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
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedDmr, setSelectedDmr] = useState(null);
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
  const [dmrsData, setDmrsData] = useState({
    week: "",
    waybill: "",
    category: "",
    siteId: "",
    customerId: "",
    drNumber: "",
    poNumber: "",
    model: "",
    quantity: "",
    amount: "",
    cbm: "",
    transactionDate: "",
    truckGateIn: "",
    dispatchDateAndTime: "",
    driverId: "",
    crewId: "",
    truckId: "",
    tsmTrucktype: "",
    allowanceMatrixId: "",
  });

  const [errors, setErrors] = useState({
    week: "",
    waybill: "",
    category: "",
    siteId: "",
    customerId: "",
    drNumber: "",
    poNumber: "",
    model: "",
    quantity: "",
    amount: "",
    cbm: "",
    transactionDate: "",
    truckGateIn: "",
    dispatchDateAndTime: "",
    driverId: "",
    crewId: "",
    truckId: "",
    tsmTrucktype: "",
    allowanceMatrixId: "",
    apiError: "",
  });

  const isDarkMode =
    document.documentElement.getAttribute("data-theme") === "dark";

  const fetchDmrs = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/pana-dmrs`);
      if (response.data.success) {
        setDmrs(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching dmr:", error);
    }
  };
  useEffect(() => {
    fetchDmrs();
  }, []);

  const filteredDmrs = dmrs
    .filter((dmr) => {
      const waybill = (dmr.waybill || "").toLowerCase();
      const matchesSearch = waybill.includes(search.toLowerCase());

      const dmrDate = dmr.created_at
        ? new Date(dmr.created_at.split("T")[0])
        : new Date();
      const iswithinDateRange =
        (!appliedFromDate || dmrDate >= new Date(appliedFromDate)) &&
        (!appliedToDate || dmrDate <= new Date(appliedToDate));

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

  const totalPages = Math.ceil(filteredDmrs.length / itemsPerPage);
  const paginatedDmrs = filteredDmrs.slice(
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
    "DR Number",
    "PO Number",
    "Model",
    "Quantity",
    "Amount",
    "CBM",
    "Transaction Date",
    "Truck Gate In",
    "Dispatch Date and Time",
    "Driver Name",
    "Crews",
    "Plate Number",
    "Truck Type",
    "TSM Truck Type",
    "Source - Destination",
  ];

  const exportToExcel = (data) => {
    const formattedData = data.map((item, index) => ({
      ID: index + 1,
      Week: item.week,
      Waybill: item.waybill,
      Category: item.category,
      Site: item.site_name,
      "Customer Number": item.customer_number,
      "Customer Name": item.customer_name,
      "DR Number": item.do_number,
      "PO Number": item.po_number,
      Model: item.model,
      Quantity: item.quantity,
      Amount: item.amount,
      CBM: item.cbm,
      "Transaction Date": formatDate(item.transaction_date),
      "Truck Gate In": formatDate(item.truck_gate_in),
      "Dispatch Date and Time": formatDate(item.dispatch_date_and_time),
      "Driver Name": item.driver_name,
      Crews: item.crew_names,
      "Plate Number": item.plate_number,
      "Truck Type": item.truck_type,
      "TSM Truck Type": item.tsm_trucktype,
      "Source - Destination": item.route_name,
    }));

    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "DMRs");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
    });

    saveAs(blob, "dmrs.xlsx");
  };

  const exportToPDF = (data) => {
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });
    doc.text("DMR Report", 14, 10);

    const tableRows = data.map((item, index) => [
      index + 1,
      item.week || "",
      item.waybill || "",
      item.category || "",
      item.site_name || "",
      item.customer_number || "",
      item.customer_name || "",
      item.dr_number || "",
      item.po_number || "",
      item.model || "",
      item.quantity || "",
      item.amount || "",
      item.cbm || "",
      formatDate(item.transaction_date),
      formatDate(item.truck_gate_in),
      formatDate(item.dispatch_date_and_time),
      item.driver_name || "",
      item.crew_names || "",
      item.plate_number || "",
      item.truck_type || "",
      item.tsm_trucktype || "",
      item.route_name || "",
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 20,
      styles: { fontSize: 7, cellPadding: 2 },
    });

    doc.save("dmrs.pdf");
  };

  const exportToWord = (data) => {
    const tableRows = data.map((item, index) => {
      const cells = tableColumn.map((column) => {
        const keyMap = {
          ID: index + 1,
          Week: item.week,
          Waybill: item.waybill,
          Category: item.category,
          Site: item.site_name,
          "Customer Number": item.customer_number,
          "Customer Name": item.customer_name,
          "DR Number": item.dr_number,
          "PO Number": item.po_number,
          Model: item.model,
          Quantity: item.quantity,
          Amount: item.amount,
          CBM: item.cbm,
          "Transaction Date": formatDate(item.transaction_date),
          "Truck Gate In": formatDate(item.truck_gate_in),
          "Dispatch Date and Time": formatDate(item.dispatch_date_and_time),
          "Driver Name": item.driver_name,
          Crews: item.crew_names,
          "Plate Number": item.plate_number,
          "Truck Type": item.truck_type,
          "TSM Truck Type": item.tsm_trucktype,
          "Source - Destination": item.route_name,
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
              text: "DMR Report",
              heading: HeadingLevel.HEADING_1,
            }),
            new Table({ rows: tableRows }),
          ],
        },
      ],
    });

    Packer.toBlob(doc).then((blob) => {
      saveAs(blob, "dmrs.docx");
    });
  };

  const handleExport = () => {
    if (!exportFileType) {
      setExportError("Please select an export format.");
      return;
    }

    const filteredData = dmrs.filter((dmrs) => {
      const dmrsDate = dmrs.created_at
        ? new Date(dmrs.created_at.split("T")[0])
        : new Date();
      return (
        (!exportFromDate || dmrsDate >= new Date(exportFromDate)) &&
        (!exportToDate || dmrsDate <= new Date(exportToDate))
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
      week: "",
      waybill: "",
      category: "",
      siteId: "",
      customerId: "",
      drNumber: "",
      poNumber: "",
      model: "",
      quantity: "",
      amount: "",
      cbm: "",
      transactionDate: "",
      truckGateIn: "",
      dispatchDateAndTime: "",
      driverId: "",
      crewId: "",
      truckId: "",
      tsmTrucktype: "",
      allowanceMatrixId: "",
      apiError: "",
    });
  };

  const closeAddModal = () => {
    setIsAddModalOpen(false);
    setSelectedDmr(null);
    setDmrsData({
      week: "",
      category: "",
      siteId: "",
      transactionDate: "",
      truckGateIn: "",
      dispatchDateAndTime: "",
      driverId: "",
      crewId: [],
      truckId: "",
    });
    setCustomers([
      {
        customerId: "",
        invoices: [
          {
            dr_number: "",
            po_number: "",
            model: "",
            quantity: "",
            amount: "",
            cbm: "",
            tsmTrucktype: "",
            allowanceMatrixId: null,
          },
        ],
      },
    ]);

    setErrors({
      week: "",
      waybill: "",
      category: "",
      siteId: "",
      customerId: "",
      drNumber: "",
      poNumber: "",
      model: "",
      quantity: "",
      amount: "",
      cbm: "",
      transactionDate: "",
      truckGateIn: "",
      dispatchDateAndTime: "",
      driverId: "",
      crewId: "",
      truckId: "",
      tsmTrucktype: "",
      allowanceMatrixId: "",
      apiError: "",
    });
  };

  const handleInputChange = (e, name, value) => {
    if (e && e.target) {
      const { name, value } = e.target;
      setDmrsData((prevData) => ({
        ...prevData,
        [name]: value,
      }));
      setErrors((prevErrors) => ({
        ...prevErrors,
        [name]: "",
      }));
    } else {
      setDmrsData((prevData) => ({
        ...prevData,
        [name]: value,
      }));
      setErrors((prevErrors) => ({
        ...prevErrors,
        [name]: "",
      }));
    }
  };

  const handleAddDmr = async (e) => {
    e.preventDefault();

    let newErrors = {};
    let hasError = false;

    customers.forEach((ci, custIndex) => {
      if (!ci.customerId) {
        newErrors[`customerId_${custIndex}`] = "Customer is required.";
        hasError = true;
      }
    });

    if (hasError) {
      setErrors(newErrors);
      return;
    }

    try {
      const waybillMap = {};

      const activeWaybill =
        dmrs.find(
          (d) =>
            d.truck_id === parseInt(dmrsData.truckId) &&
            d.waybill !== null &&
            d.status !== "Completed"
        ) || null;

      const waybillNumber = activeWaybill ? activeWaybill.waybill : null;

      const rows = customers.flatMap((ci) =>
        (ci.invoices ?? []).map((inv) => {
          let key;
          if (activeWaybill) {
            key = `TRUCK-${dmrsData.truckId}-WB-${activeWaybill.id}`;
          } else {
            key = `TRUCK-${dmrsData.truckId}-NO-WAYBILL`;
          }

          const waybill = waybillMap[key] || null;
          waybillMap[key] = waybill;

          return {
            week: dmrsData.week || null,
            waybill: waybillNumber,
            category: dmrsData.category || null,
            site_id: dmrsData.siteId ? parseInt(dmrsData.siteId) : null,
            customer_id: ci.customerId ? parseInt(ci.customerId) : null,
            dr_number: inv.drNumber || null,
            po_number: inv.poNumber || null,
            model: inv.model || null,
            quantity: inv.quantity || null,
            amount: inv.amount || null,
            cbm: inv.cbm || null,
            transaction_date: dmrsData.transactionDate || null,
            truck_gate_in: dmrsData.truckGateIn || null,
            dispatch_date_and_time: dmrsData.dispatchDateAndTime || null,
            driver_id: dmrsData.driverId ? parseInt(dmrsData.driverId) : null,
            crews: Array.isArray(dmrsData.crewId)
              ? dmrsData.crewId.map((id) => parseInt(id))
              : [],
            truck_id: dmrsData.truckId ? parseInt(dmrsData.truckId) : null,
            tsm_trucktype:
              inv.tsmTrucktype ||
              ci.tsmTrucktype ||
              dmrsData.tsmTrucktype ||
              null,

            allowance_matrix_id:
              inv.allowanceMatrixId ??
              ci.allowanceMatrixId ??
              dmrsData.allowanceMatrixId ??
              null,
          };
        })
      );

      const response = await axios.post(`${API_BASE_URL}/insert-pana-dmr`, {
        rows,
      });

      if (response.data.success) {
        fetchDmrs();
        closeAddModal();
      } else {
        setErrors((prev) => ({
          ...prev,
          apiError: response.data.message || "An error occurred.",
        }));
      }
    } catch (error) {
      console.error("FRONTEND: Axios error:", error);
      setErrors((prev) => ({
        ...prev,
        apiError: error.response?.data?.message || "Failed to add DMR.",
      }));
    }
  };

  const formatDateForInput = (dateStr, isDateTime = false) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";

    if (isDateTime) {
      return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
    } else {
      return d.toISOString().slice(0, 10);
    }
  };

  const toggleEditModal = (dmr = null) => {
    if (!dmr) {
      return;
    }

    const relatedDmrs = dmrs.filter((item) => item.waybill === dmr.waybill);
    if (relatedDmrs.length === 0) {
      return;
    }

    const customerMap = new Map();
    relatedDmrs.forEach((record) => {
      const custId = record.customer_id?.toString() || "Unknown";
      if (!customerMap.has(custId)) {
        customerMap.set(custId, {
          customerId: record.customer_id?.toString() || "",
          customerName: record.customer_name || "",
          invoices: [],
        });
      }
      customerMap.get(custId).invoices.push({
        drNumber: record.dr_number || "",
        poNumber: record.po_number || "",
        quantity: record.quantity || "",
        model: record.model || "",
        amount: record.amount || "",
        cbm: record.cbm || "",
        allowanceMatrixId: record.allowance_matrix_id || null,
        tsmTrucktype: record.tsm_trucktype || "",
      });
    });

    const parsedCustomers = Array.from(customerMap.values());
    setCustomers(parsedCustomers);

    const base = relatedDmrs[0];
    setDmrsData({
      week: base.week?.toString() || "",
      category: base.category || "",
      siteId: base.site_id?.toString() || "",
      transactionDate: base.transaction_date
        ? formatDateForInput(base.transaction_date)
        : "",
      truckGateIn: base.truck_gate_in
        ? formatDateForInput(base.truck_gate_in, true)
        : "",
      dispatchDateAndTime: base.dispatch_date_and_time
        ? formatDateForInput(base.dispatch_date_and_time, true)
        : "",
      driverId: base.driver_id?.toString() || "",
      crewId: base.crews ? base.crews.split(",").map((s) => s.trim()) : [],
      truckId: base.truck_id?.toString() || "",
    });

    setSelectedDmr(dmr);
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedDmr(null);
    setDmrsData({
      week: "",
      category: "",
      siteId: "",
      transactionDate: "",
      truckGateIn: "",
      dispatchDateAndTime: "",
      driverId: "",
      crewId: [],
      truckId: "",
    });
    setCustomers([
      {
        customerId: "",
        invoices: [
          {
            dr_number: "",
            po_number: "",
            model: "",
            quantity: "",
            amount: "",
            cbm: "",
            tsmTrucktype: "",
            allowanceMatrixId: null,
          },
        ],
      },
    ]);

    setErrors({
      week: "",
      waybill: "",
      category: "",
      siteId: "",
      customerId: "",
      drNumber: "",
      poNumber: "",
      model: "",
      quantity: "",
      amount: "",
      cbm: "",
      transactionDate: "",
      truckGateIn: "",
      dispatchDateAndTime: "",
      driverId: "",
      crewId: "",
      truckId: "",
      tsmTrucktype: "",
      allowanceMatrixId: "",
      apiError: "",
    });
  };

  const handleEditDmr = async (e) => {
    e.preventDefault();

    setErrors({
      week: "",
      waybill: "",
      category: "",
      siteId: "",
      customerId: "",
      drNumber: "",
      poNumber: "",
      model: "",
      quantity: "",
      amount: "",
      cbm: "",
      transactionDate: "",
      truckGateIn: "",
      dispatchDateAndTime: "",
      driverId: "",
      crewId: "",
      truckId: "",
      tsmTrucktype: "",
      allowanceMatrixId: "",
      apiError: "",
    });

    if (!selectedDmr || !selectedDmr.waybill) {
      setErrors((prev) => ({
        ...prev,
        apiError: "Invalid waybill selected.",
      }));
      return;
    }

    let newErrors = {};
    let hasError = false;

    customers.forEach((ci, custIndex) => {
      if (!ci.customerId) {
        newErrors[`customerId_${custIndex}`] = "Customer is required.";
        hasError = true;
      }
    });

    if (hasError) {
      setErrors(newErrors);
      return;
    }

    try {
      const waybillMap = {};

      const activeWaybill =
        dmrs.find(
          (d) =>
            d.truck_id === parseInt(dmrsData.truckId) &&
            d.waybill !== null &&
            d.status !== "Completed"
        ) || null;

      const waybillNumber = activeWaybill ? activeWaybill.waybill : null;

      const rows = customers.flatMap((ci) =>
        (ci.invoices ?? []).map((inv) => {
          let key;
          if (activeWaybill) {
            key = `TRUCK-${dmrsData.truckId}-WB-${activeWaybill.id}`;
          } else {
            key = `TRUCK-${dmrsData.truckId}-NO-WAYBILL`;
          }

          const waybill = waybillMap[key] || null;
          waybillMap[key] = waybill;

          return {
            week: dmrsData.week || null,
            waybill: waybillNumber,
            category: dmrsData.category || null,
            site_id: dmrsData.siteId ? parseInt(dmrsData.siteId) : null,
            customer_id: ci.customerId ? parseInt(ci.customerId) : null,
            dr_number: inv.drNumber || null,
            po_number: inv.poNumber || null,
            model: inv.model || null,
            quantity: inv.quantity || null,
            amount: inv.amount || null,
            cbm: inv.cbm || null,
            transaction_date: dmrsData.transactionDate || null,
            truck_gate_in: dmrsData.truckGateIn || null,
            dispatch_date_and_time: dmrsData.dispatchDateAndTime || null,
            driver_id: dmrsData.driverId ? parseInt(dmrsData.driverId) : null,
            crews: Array.isArray(dmrsData.crewId)
              ? dmrsData.crewId.map((id) => parseInt(id))
              : [],
            truck_id: dmrsData.truckId ? parseInt(dmrsData.truckId) : null,
            tsm_trucktype:
              inv.tsmTrucktype ||
              ci.tsmTrucktype ||
              dmrsData.tsmTrucktype ||
              null,
            allowance_matrix_id:
              inv.allowanceMatrixId ??
              ci.allowanceMatrixId ??
              dmrsData.allowanceMatrixId ??
              null,
          };
        })
      );

      const response = await axios.put(
        `${API_BASE_URL}/update-pana-dmr/${encodeURIComponent(
          dmrsData.waybill
        )}`,
        { rows }
      );

      if (response.data.success) {
        setDmrs((prevDmrs) =>
          prevDmrs
            .filter((dmr) => dmr.waybill !== dmrsData.waybill)
            .concat(
              rows.map((r) => ({
                ...r,
                crews: Array.isArray(r.crews) ? r.crews.join(",") : r.crews,
              }))
            )
        );
        closeEditModal();
      } else {
        setErrors((prev) => ({
          ...prev,
          apiError: response.data.message || "An error occurred.",
        }));
      }
    } catch (error) {
      console.error("FRONTEND: Axios error in handleEditDmr:", error);
      setErrors((prev) => ({
        ...prev,
        apiError: error.response?.data?.message || "Failed to update DMR.",
      }));
    }
  };

  const toggleDeleteModal = (dmr = null) => {
    setSelectedDmr(dmr);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setSelectedDmr(null);
    setIsDeleteModalOpen(false);
  };

  const handleDeleteDmr = async () => {
    if (!selectedDmr || !selectedDmr.waybill) {
      setErrors((prev) => ({
        ...prev,
        apiError: "Invalid waybill selected for deletion.",
      }));
      return;
    }

    try {
      const response = await axios.delete(
        `${API_BASE_URL}/delete-pana-dmr/${encodeURIComponent(
          selectedDmr.waybill
        )}`
      );

      if (response.data.success) {
        setDmrs((prevDmrs) =>
          prevDmrs.filter((dmr) => dmr.waybill !== selectedDmr.waybill)
        );
        fetchDmrs();
        closeDeleteModal();
      } else {
        setErrors((prev) => ({
          ...prev,
          apiError:
            response.data.message || "An error occurred while deleting.",
        }));
      }
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        apiError:
          error.response?.data?.message ||
          "An error occurred while deleting the DMR group.",
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

  const [customers, setCustomers] = useState([
    {
      customerId: "",
      invoices: [
        {
          drNumber: "",
          poNumber: "",
          model: "",
          quantity: "",
          amount: "",
          cbm: "",
          tsmTrucktype: "",
          allowanceMatrixId: null,
        },
      ],
    },
  ]);

  const handleCustomerChange = (custIndex, selected) => {
    setCustomers((prev) => {
      const updated = [...prev];
      updated[custIndex].customerId = selected ? selected.value : "";
      return updated;
    });
  };

  const handleInvoiceFieldChange = (custIndex, invIndex, field, value) => {
    setCustomers((prev) => {
      const updated = [...prev];
      updated[custIndex].invoices[invIndex][field] = value;
      return updated;
    });
  };

  const addInvoice = (custIndex) => {
    setCustomers((prev) => {
      const updated = [...prev];
      updated[custIndex].invoices.push({
        drNumber: "",
        poNumber: "",
        model: "",
        quantity: "",
        amount: "",
        cbm: "",
        tsmTrucktype: "",
        allowanceMatrixId: null,
      });
      return updated;
    });
  };

  const removeInvoice = (custIndex, invIndex) => {
    setCustomers((prev) =>
      prev.map((cust, i) =>
        i !== custIndex
          ? cust
          : {
              ...cust,
              invoices: cust.invoices.filter((_, ii) => ii !== invIndex),
            }
      )
    );
  };

  const addCustomer = () => {
    setCustomers((prev) => [
      ...prev,
      {
        customerId: "",
        invoices: [
          {
            drNumber: "",
            poNumber: "",
            model: "",
            quantity: "",
            amount: "",
            cbm: "",
            tsmTrucktype: "",
            allowanceMatrixId: null,
          },
        ],
      },
    ]);
  };

  const removeCustomer = (custIndex) => {
    setCustomers((prev) => prev.filter((_, i) => i !== custIndex));
  };

  const categoryOptions = [
    { value: "Direct", label: "Direct" },
    { value: "Transshipment", label: "Transshipment" },
    { value: "Coload", label: "Coload" },
    { value: "Backload", label: "Backload" },
  ];

  const [siteOptions, setSiteOptions] = useState([]);

  useEffect(() => {
    axios
      .get(`${API_BASE_URL}/sites`)
      .then((response) => {
        if (response.data.success && Array.isArray(response.data.data)) {
          const options = response.data.data.map((site) => ({
            value: String(site.id),
            label: site.site_name,
          }));
          setSiteOptions(options);
        } else {
          console.error("Invalid data format:", response.data);
        }
      })
      .catch((error) => {
        console.error("Error fetching departments:", error);
      });
  }, []);

  const [customerOptions, setCustomerOptions] = useState([]);

  useEffect(() => {
    axios
      .get(`${API_BASE_URL}/customers`)
      .then((response) => {
        if (response.data.success && Array.isArray(response.data.data)) {
          const options = response.data.data
            .filter((customer) => customer.principal === "PANA")
            .map((customer) => ({
              value: String(customer.id),
              label: customer.customer_name,
            }));

          setCustomerOptions(options);
        } else {
          console.error("Invalid data format:", response.data);
        }
      })
      .catch((error) => {
        console.error("Error fetching customers:", error);
      });
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
            const isAssigned = dmrs.some((dmr) => dmr.user_id === user.id);
            const isCurrentDriver =
              selectedDmr && selectedDmr.user_id === user.id;

            return isDriver && (!isAssigned || isCurrentDriver);
          });

          if (
            selectedDmr &&
            selectedDmr.user_id &&
            !filteredUsers.some((u) => u.id === selectedDmr.user_id)
          ) {
            const currentDriver = users.find(
              (u) => u.id === selectedDmr.user_id
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
  }, [dmrs, selectedDmr]);

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

            const assignedCrewIds = dmrs.flatMap((dmr) => dmr.crew_id || []);

            const isAssigned = assignedCrewIds.includes(user.id);

            const isCurrentCrew = selectedDmr?.crew_id?.includes(user.id);

            return isCrew && (!isAssigned || isCurrentCrew);
          });

          if (selectedDmr?.crew_id) {
            const currentCrew = users.filter((u) =>
              selectedDmr.crew_id.includes(u.id)
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
  }, [dmrs, selectedDmr]);

  const [plateNumberOptions, setPlateNumberOptions] = useState([]);

  useEffect(() => {
    axios
      .get(`${API_BASE_URL}/trucks`)
      .then((response) => {
        if (response.data.success && Array.isArray(response.data.data)) {
          const trucks = response.data.data;

          const filteredTrucks = trucks.filter((truck) => {
            const truckDmrs = dmrs.filter((dmr) => dmr.truck_id === truck.id);

            const hasActiveDmr = truckDmrs.some(
              (dmr) => dmr.status !== "Completed"
            );

            const isCurrentTruck =
              selectedDmr && selectedDmr.truck_id === truck.id;

            return !hasActiveDmr || isCurrentTruck;
          });

          if (
            selectedDmr &&
            selectedDmr.truck_id &&
            !filteredTrucks.some((t) => t.id === selectedDmr.truck_id)
          ) {
            const currentTruck = trucks.find(
              (t) => t.id === selectedDmr.truck_id
            );
            if (currentTruck) {
              filteredTrucks.push(currentTruck);
            }
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
  }, [dmrs, selectedDmr]);

  const [allowanceMatrixData, setAllowanceMatrixData] = useState([]);

  useEffect(() => {
    axios
      .get(`${API_BASE_URL}/matrixes`)
      .then((res) => {
        if (res.data.success && Array.isArray(res.data.data)) {
          setAllowanceMatrixData(res.data.data);
        }
      })
      .catch((err) => console.error("Error fetching allowance matrix:", err));
  }, []);

  const [tsmTrucktypeOptions, setTsmTrucktypeOptions] = useState([]);

  useEffect(() => {
    axios
      .get(`${API_BASE_URL}/trucks`)
      .then((response) => {
        if (response.data.success && Array.isArray(response.data.data)) {
          const uniqueTypes = [
            ...new Set(response.data.data.map((truck) => truck.truck_type)),
          ];

          const options = uniqueTypes.map((type) => ({
            value: type,
            label: type,
          }));

          setTsmTrucktypeOptions(options);
        } else {
          console.error("Invalid data format:", response.data);
        }
      })
      .catch((error) => {
        console.error("Error fetching trucks:", error);
      });
  }, []);

  return (
    <div className={styles["dmr-content"]}>
      <div className={styles["content-header-container"]}>
        <h1 className={styles["page-title"]}>PANA DMR</h1>
      </div>
      <div className={styles["content-body-container"]}>
        <div className={styles["add-dmr-button-container"]}>
          <button className={styles["add-dmr-button"]} onClick={toggleAddModal}>
            Add DMR
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
                <th className={styles.th}>Waybill</th>
                <th className={styles.th}>Category</th>
                <th className={styles.th}>Site</th>
                <th className={styles.th}>Customer ID</th>
                <th className={styles.th}>Customer Name</th>
                <th className={styles.th}>DR Number</th>
                <th className={styles.th}>PO Number</th>
                <th className={styles.th}>Model</th>
                <th className={styles.th}>Quantity</th>
                <th className={styles.th}>Amount</th>
                <th className={styles.th}>CBM</th>
                <th className={styles.th}>Transaction Date</th>
                <th className={styles.th}>Truck Gate In</th>
                <th className={styles.th}>Dispatch Date & Time</th>
                <th className={styles.th}>Driver Name</th>
                <th className={styles.th}>Crews</th>
                <th className={styles.th}>Plate Number</th>
                <th className={styles.th}>Truck Type</th>
                <th className={styles.th}>TSM Truck Type</th>
                <th className={styles.th}>Source - Destination</th>
                <th className={styles.th}>Status</th>
                <th className={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody className={styles.tbody}>
              {paginatedDmrs.map((dmr, index) => {
                const showActions =
                  index === 0 ||
                  dmr.waybill !== paginatedDmrs[index - 1].waybill;

                return (
                  <tr className={styles.btr} key={index}>
                    <td className={styles.td}>
                      <span
                        className={
                          dmr.status === "Pending"
                            ? styles["status-pin-pending"]
                            : dmr.status === "Reviewed"
                            ? styles["status-pin-reviewed"]
                            : dmr.status === "Requested"
                            ? styles["status-pin-requested"]
                            : dmr.status === "Approved"
                            ? styles["status-pin-approved"]
                            : dmr.status === "Declined"
                            ? styles["status-pin-declined"]
                            : dmr.status === "Completed"
                            ? styles["status-pin-completed"]
                            : ""
                        }
                      ></span>
                      {dmr.week}
                    </td>

                    <td className={styles.td}>{dmr.waybill}</td>
                    <td className={styles.td}>{dmr.category}</td>
                    <td className={styles.td}>
                      {dmr.site_name} {dmr.site_code}
                    </td>
                    <td className={styles.td}>{dmr.customer_number}</td>
                    <td className={styles.td}>{dmr.customer_name}</td>
                    <td className={styles.td}>{dmr.dr_number}</td>
                    <td className={styles.td}>{dmr.po_number}</td>
                    <td className={styles.td}>{dmr.model}</td>
                    <td className={styles.td}>{dmr.quantity}</td>
                    <td className={styles.td}>{dmr.amount}</td>
                    <td className={styles.td}>{dmr.cbm}</td>
                    <td className={styles.td}>
                      {formatDate(dmr.transaction_date)}
                    </td>
                    <td className={styles.td}>
                      {formatDate(dmr.truck_gate_in)}
                    </td>
                    <td className={styles.td}>
                      {formatDate(dmr.dispatch_date_and_time)}
                    </td>
                    <td className={styles.td}>{dmr.driver_name}</td>
                    <td className={styles.td}>{dmr.crew_names}</td>
                    <td className={styles.td}>{dmr.plate_number}</td>
                    <td className={styles.td}>{dmr.truck_type}</td>
                    <td className={styles.td}>{dmr.tsm_trucktype}</td>
                    <td className={styles.td}>{dmr.route_name}</td>
                    <td className={styles.td}>{dmr.status}</td>
                    <td className={styles.td}>
                      {showActions &&
                        dmr.status !== "Reviewed" &&
                        dmr.status !== "Requested" &&
                        dmr.status !== "Approved" &&
                        dmr.status !== "Declined" &&
                        dmr.status !== "Completed" && (
                          <div className={styles["action-container"]}>
                            <button
                              className={styles["edit-button"]}
                              onMouseEnter={() => setIsEditHovered(index)}
                              onMouseLeave={() => setIsEditHovered(null)}
                              onClick={() => toggleEditModal(dmr)}
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
                            <button
                              className={styles["delete-button"]}
                              onMouseEnter={() => setIsDeleteHovered(index)}
                              onMouseLeave={() => setIsDeleteHovered(null)}
                              onClick={() => toggleDeleteModal(dmr)}
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
                        )}
                    </td>
                  </tr>
                );
              })}

              {paginatedDmrs.length === 0 && (
                <tr className={styles.btr}>
                  <td
                    colSpan="21"
                    className={`${styles.td} ${styles["search-response"]}`}
                  >
                    No DMRs found.
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
            className={`${styles["modal-container"]} ${styles["add-modal-container"]} ${styles["dmr-modal-container"]}`}
          >
            <div className={styles["modal-header-container"]}>
              <h3 className={styles["modal-title"]}>Add DMR</h3>
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
              className={`${styles["modal-body-container"]} ${styles["modal-dmr-body-container"]}`}
              onSubmit={handleAddDmr}
            >
              <div className={styles["dmr-body-container"]}>
                <label
                  className={`${styles.label} ${styles["dmr-label"]}`}
                  htmlFor="category"
                >
                  Category
                  <Select
                    className={`${styles.input} ${
                      errors.category ? styles["error-input"] : ""
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
                    id="category"
                    name="category"
                    options={categoryOptions}
                    value={
                      categoryOptions.find(
                        (opt) => opt.value === dmrsData.category
                      ) || null
                    }
                    onChange={(selected) =>
                      setDmrsData((prev) => ({
                        ...prev,
                        category: selected?.value || "",
                      }))
                    }
                    placeholder="Select Category"
                  />
                  {errors.category && (
                    <p className={styles["error-message"]}>{errors.category}</p>
                  )}
                </label>
                <label
                  className={`${styles.label} ${styles["dmr-label"]}`}
                  htmlFor="site_id"
                >
                  Site
                  <Select
                    className={`${styles.input} ${
                      errors.siteId ? styles["error-input"] : ""
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
                    id="site_id"
                    name="siteId"
                    options={siteOptions}
                    value={
                      siteOptions.find(
                        (opt) => opt.value === dmrsData.siteId
                      ) || null
                    }
                    onChange={(selected) =>
                      setDmrsData((prev) => ({
                        ...prev,
                        siteId: selected?.value || "",
                      }))
                    }
                    placeholder="Select Site"
                  />
                  {errors.siteId && (
                    <p className={styles["error-message"]}>{errors.siteId}</p>
                  )}
                </label>
                <label
                  className={`${styles.label} ${styles["dmr-label"]}`}
                  htmlFor="transaction_date"
                >
                  Transaction Date
                  <input
                    className={`${styles.input} ${
                      errors.transactionDate ? styles["error-input"] : ""
                    }`}
                    type="date"
                    id="transaction_date"
                    name="transactionDate"
                    value={dmrsData.transactionDate}
                    onChange={handleInputChange}
                  />
                  {errors.transactionDate && (
                    <p className={styles["error-message"]}>
                      {errors.transactionDate}
                    </p>
                  )}
                </label>
                <label
                  className={`${styles.label} ${styles["dmr-label"]}`}
                  htmlFor="truck_gate_in"
                >
                  Truck Gate In
                  <input
                    className={`${styles.input} ${
                      errors.truckGateIn ? styles["error-input"] : ""
                    }`}
                    type="datetime-local"
                    id="truck_gate_in"
                    name="truckGateIn"
                    value={dmrsData.truckGateIn}
                    onChange={handleInputChange}
                  />
                  {errors.truckGateIn && (
                    <p className={styles["error-message"]}>
                      {errors.truckGateIn}
                    </p>
                  )}
                </label>
                <label
                  className={`${styles.label} ${styles["dmr-label"]}`}
                  htmlFor="dispatch_date_and_time"
                >
                  Dispatch Date and Time
                  <input
                    className={`${styles.input} ${
                      errors.dispatchDateAndTime ? styles["error-input"] : ""
                    }`}
                    type="datetime-local"
                    id="dispatch_date_and_time"
                    name="dispatchDateAndTime"
                    value={dmrsData.dispatchDateAndTime}
                    onChange={handleInputChange}
                  />
                  {errors.dispatchDateAndTime && (
                    <p className={styles["error-message"]}>
                      {errors.dispatchDateAndTime}
                    </p>
                  )}
                </label>
                <label
                  className={`${styles.label} ${styles["dmr-label"]}`}
                  htmlFor="driver_id"
                >
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
                        (opt) => opt.value === dmrsData.driverId
                      ) || null
                    }
                    onChange={(selected) =>
                      setDmrsData((prev) => ({
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
                <label
                  className={`${styles.label} ${styles["dmr-label"]}`}
                  htmlFor="crew_id"
                >
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
                      dmrsData.crewId?.includes(opt.value)
                    )}
                    onChange={(selected) => {
                      const values = selected
                        ? selected.map((opt) => opt.value)
                        : [];
                      setDmrsData((prev) => ({ ...prev, crewId: values }));
                    }}
                    classNamePrefix="react-select"
                    placeholder="Select Crew Members"
                  />
                  {errors.crewId && (
                    <p className={styles["error-message"]}>{errors.crewId}</p>
                  )}
                </label>
                <label
                  className={`${styles.label} ${styles["dmr-label"]}`}
                  htmlFor="truck_id"
                >
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
                        (opt) => opt.value === dmrsData.truckId
                      ) || null
                    }
                    onChange={(selected) =>
                      setDmrsData((prev) => ({
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
              </div>
              <div className={styles["invoice-customer-container"]}>
                {(customers ?? []).map((customer, custIndex) => (
                  <div key={custIndex} className={styles["customer-block"]}>
                    <div className={styles["customer-invoice-input-container"]}>
                      {customers.length > 1 && (
                        <div className={styles["remove-button-container"]}>
                          <button
                            className={styles["remove-button"]}
                            type="button"
                            onClick={() => removeCustomer(custIndex)}
                          >
                            <img
                              className={styles["remove-button-icon"]}
                              src={crossIcon}
                              alt="Remove"
                            />
                          </button>
                        </div>
                      )}
                      <label
                        className={`${styles.label} ${styles["customer-invoice-label"]}`}
                        htmlFor="customer"
                      >
                        Customer
                        <Select
                          className={`${styles.input} ${
                            errors[`customerId_${custIndex}`]
                              ? styles["error-input"]
                              : ""
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
                                backgroundColor: isDarkMode
                                  ? "#2a2a2a"
                                  : "#f8f9fa",
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
                          id="customer"
                          options={customerOptions}
                          placeholder="Select Customer"
                          value={customerOptions.find(
                            (opt) => opt.value === customer.customerId
                          )}
                          onChange={(selected) =>
                            handleCustomerChange(custIndex, selected)
                          }
                        />
                        {errors[`customerId_${custIndex}`] && (
                          <p className={styles["error-message"]}>
                            {errors[`customerId_${custIndex}`]}
                          </p>
                        )}
                      </label>
                      {(customer.invoices ?? []).map((inv, invIndex) => {
                        const filteredAllowanceMatrixOptions =
                          allowanceMatrixData
                            .filter(
                              (matrix) =>
                                matrix.trip_type === "DMR" &&
                                matrix.principal === "PANA" &&
                                matrix.truck_type === inv.tsmTrucktype
                            )
                            .map((matrix) => {
                              const secondDest =
                                matrix.second_destination &&
                                matrix.second_destination.trim() !== ""
                                  ? ` → ${matrix.second_destination}`
                                  : "";

                              return {
                                value: String(matrix.id),
                                label: `(${matrix.code}) ${matrix.source} → ${matrix.first_destination}${secondDest}`,
                              };
                            });
                        return (
                          <div
                            key={invIndex}
                            className={styles["invoice-block"]}
                          >
                            {customer.invoices.length > 1 && (
                              <div
                                className={styles["remove-button-container"]}
                              >
                                <button
                                  type="button"
                                  className={styles["remove-button"]}
                                  onClick={() =>
                                    removeInvoice(custIndex, invIndex)
                                  }
                                >
                                  <img
                                    className={styles["remove-button-icon"]}
                                    src={crossIcon}
                                    alt="Remove"
                                  />
                                </button>
                              </div>
                            )}
                            <label
                              className={`${styles.label} ${styles["customer-invoice-label"]} ${styles["invoice-label"]}`}
                              htmlFor="dr_number"
                            >
                              DR Number
                              <input
                                className={`${styles.input} ${
                                  errors.drNumber ? styles["error-input"] : ""
                                }`}
                                type="text"
                                id="dr_number"
                                value={inv.drNumber}
                                onChange={(e) =>
                                  handleInvoiceFieldChange(
                                    custIndex,
                                    invIndex,
                                    "drNumber",
                                    e.target.value
                                  )
                                }
                              />
                              {errors[`drNumber${custIndex}`] && (
                                <p className={styles["error-message"]}>
                                  {errors[`drNumber${custIndex}`]}
                                </p>
                              )}
                            </label>
                            <label
                              className={`${styles.label} ${styles["customer-invoice-label"]} ${styles["invoice-label"]} ${styles["invoice-label"]}`}
                              htmlFor="po_number"
                            >
                              PO Number
                              <input
                                className={`${styles.input} ${
                                  errors.poNumber ? styles["error-input"] : ""
                                }`}
                                type="number"
                                id="po_number"
                                value={inv.poNumber}
                                onChange={(e) =>
                                  handleInvoiceFieldChange(
                                    custIndex,
                                    invIndex,
                                    "poNumber",
                                    e.target.value
                                  )
                                }
                              />
                              {errors[`poNumber${custIndex}`] && (
                                <p className={styles["error-message"]}>
                                  {errors[`poNumber${custIndex}`]}
                                </p>
                              )}
                            </label>
                            <label
                              className={`${styles.label} ${styles["customer-invoice-label"]} ${styles["invoice-label"]}`}
                              htmlFor="model"
                            >
                              Model
                              <input
                                className={`${styles.input} ${
                                  errors.model ? styles["error-input"] : ""
                                }`}
                                type="text"
                                id="model"
                                value={inv.model}
                                onChange={(e) =>
                                  handleInvoiceFieldChange(
                                    custIndex,
                                    invIndex,
                                    "model",
                                    e.target.value
                                  )
                                }
                              />
                              {errors[`model${custIndex}`] && (
                                <p className={styles["error-message"]}>
                                  {errors[`model${custIndex}`]}
                                </p>
                              )}
                            </label>
                            <label
                              className={`${styles.label} ${styles["customer-invoice-label"]} ${styles["invoice-label"]}`}
                              htmlFor="quantity"
                            >
                              Quantity
                              <input
                                className={`${styles.input}  ${
                                  errors.quantity ? styles["error-input"] : ""
                                }`}
                                type="number"
                                id="quantity"
                                value={inv.quantity}
                                onChange={(e) =>
                                  handleInvoiceFieldChange(
                                    custIndex,
                                    invIndex,
                                    "quantity",
                                    e.target.value
                                  )
                                }
                              />
                              {errors[`quantity${custIndex}`] && (
                                <p className={styles["error-message"]}>
                                  {errors[`quantity${custIndex}`]}
                                </p>
                              )}
                            </label>
                            <label
                              className={`${styles.label} ${styles["customer-invoice-label"]} ${styles["invoice-label"]}`}
                              htmlFor="amount"
                            >
                              Amount
                              <input
                                className={`${styles.input} ${
                                  errors.amount ? styles["error-input"] : ""
                                }`}
                                type="number"
                                id="amount"
                                value={inv.amount}
                                onChange={(e) =>
                                  handleInvoiceFieldChange(
                                    custIndex,
                                    invIndex,
                                    "amount",
                                    e.target.value
                                  )
                                }
                              />
                              {errors[`amount${custIndex}`] && (
                                <p className={styles["error-message"]}>
                                  {errors[`amount${custIndex}`]}
                                </p>
                              )}
                            </label>
                            <label
                              className={`${styles.label} ${styles["customer-invoice-label"]} ${styles["invoice-label"]}`}
                              htmlFor="cbm"
                            >
                              CBM
                              <input
                                className={`${styles.input} ${
                                  errors.cbm ? styles["error-input"] : ""
                                }`}
                                type="text"
                                id="cbm"
                                value={inv.cbm}
                                onChange={(e) =>
                                  handleInvoiceFieldChange(
                                    custIndex,
                                    invIndex,
                                    "cbm",
                                    e.target.value
                                  )
                                }
                              />
                              {errors[`cbm${custIndex}`] && (
                                <p className={styles["error-message"]}>
                                  {errors[`cbm${custIndex}`]}
                                </p>
                              )}
                            </label>
                            <label
                              className={`${styles.label} ${styles["customer-invoice-label"]} ${styles["invoice-label"]}`}
                              htmlFor="tsm_trucktype"
                            >
                              TSM Truck Type
                              <Select
                                className={`${styles.input} ${
                                  errors[`tsmTrucktype_${custIndex}`]
                                    ? styles["error-input"]
                                    : ""
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
                                      boxShadow:
                                        "0 0 4px rgba(109, 118, 126, 0.8)",
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
                                      isDarkMode
                                        ? "var(--borders)"
                                        : "var(--borders)"
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
                                      backgroundColor: isDarkMode
                                        ? "#2a2a2a"
                                        : "#f8f9fa",
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
                                id="tsm_trucktype"
                                options={tsmTrucktypeOptions}
                                value={tsmTrucktypeOptions.find(
                                  (opt) => opt.value === inv.tsmTrucktype
                                )}
                                onChange={(selected) =>
                                  handleInvoiceFieldChange(
                                    custIndex,
                                    invIndex,
                                    "tsmTrucktype",
                                    selected?.value || ""
                                  )
                                }
                                placeholder="Select TSM Truck Type"
                              />
                              {errors[`tsmTrucktype_${custIndex}`] && (
                                <p className={styles["error-message"]}>
                                  {errors[`tsmTrucktype_${custIndex}`]}
                                </p>
                              )}
                            </label>
                            <label
                              className={`${styles.label} ${styles["customer-invoice-label"]} ${styles["invoice-label"]}`}
                              htmlFor="allowance_matrix_id"
                            >
                              Source and Destination
                              <Select
                                className={`${styles.input} ${
                                  errors[`allowanceMatrixId${custIndex}`]
                                    ? styles["error-input"]
                                    : ""
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
                                      boxShadow:
                                        "0 0 4px rgba(109, 118, 126, 0.8)",
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
                                      backgroundColor: isDarkMode
                                        ? "#2a2a2a"
                                        : "#f8f9fa",
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
                                options={filteredAllowanceMatrixOptions}
                                value={filteredAllowanceMatrixOptions.find(
                                  (opt) =>
                                    String(opt.value) ===
                                    String(inv.allowanceMatrixId)
                                )}
                                onChange={(selected) =>
                                  handleInvoiceFieldChange(
                                    custIndex,
                                    invIndex,
                                    "allowanceMatrixId",
                                    selected?.value || null
                                  )
                                }
                                placeholder="Select Source and Destination"
                                isDisabled={!inv.tsmTrucktype}
                              />
                              {errors[`allowanceMatrixId${custIndex}`] && (
                                <p className={styles["error-message"]}>
                                  {errors[`allowanceMatrixId${custIndex}`]}
                                </p>
                              )}
                            </label>
                          </div>
                        );
                      })}
                      <button
                        type="button"
                        className={styles["add-customer-invoice"]}
                        onClick={() => addInvoice(custIndex)}
                      >
                        Add Invoice
                      </button>
                    </div>
                  </div>
                ))}
                <button
                  className={styles["add-customer-invoice"]}
                  type="button"
                  onClick={addCustomer}
                >
                  Add Customer
                </button>
              </div>
              {errors.apiError && (
                <p className={styles["error-message"]}>{errors.apiError}</p>
              )}
              <button className={styles["submit-button"]}>Submit</button>
            </form>
          </div>
        </Modal>
      )}
      {isEditModalOpen && selectedDmr && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
        >
          <div
            className={`${styles["modal-container"]} ${styles["edit-modal-container"]} ${styles["dmr-modal-container"]}`}
          >
            <div className={styles["modal-header-container"]}>
              <h3 className={styles["modal-title"]}>Edit Dmr</h3>
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
              className={`${styles["modal-body-container"]} ${styles["modal-dmr-body-container"]}`}
              onSubmit={handleEditDmr}
            >
              <div className={styles["dmr-body-container"]}>
                <label
                  className={`${styles.label} ${styles["dmr-label"]}`}
                  htmlFor="category"
                >
                  Category
                  <Select
                    className={`${styles.input} ${
                      errors.category ? styles["error-input"] : ""
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
                    id="category"
                    name="category"
                    options={categoryOptions}
                    value={
                      categoryOptions.find(
                        (opt) => opt.value === dmrsData.category
                      ) || null
                    }
                    onChange={(selected) =>
                      setDmrsData((prev) => ({
                        ...prev,
                        category: selected?.value || "",
                      }))
                    }
                    placeholder="Select Category"
                  />
                  {errors.category && (
                    <p className={styles["error-message"]}>{errors.category}</p>
                  )}
                </label>
                <label
                  className={`${styles.label} ${styles["dmr-label"]}`}
                  htmlFor="site_id"
                >
                  Site
                  <Select
                    className={`${styles.input} ${
                      errors.siteId ? styles["error-input"] : ""
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
                    id="site_id"
                    name="siteId"
                    options={siteOptions}
                    value={
                      siteOptions.find(
                        (opt) => opt.value === dmrsData.siteId
                      ) || null
                    }
                    onChange={(selected) =>
                      setDmrsData((prev) => ({
                        ...prev,
                        siteId: selected?.value || "",
                      }))
                    }
                    placeholder="Select Site"
                  />
                  {errors.siteId && (
                    <p className={styles["error-message"]}>{errors.siteId}</p>
                  )}
                </label>
                <label
                  className={`${styles.label} ${styles["dmr-label"]}`}
                  htmlFor="transaction_date"
                >
                  Transaction Date
                  <input
                    className={`${styles.input} ${
                      errors.transactionDate ? styles["error-input"] : ""
                    }`}
                    type="date"
                    id="transaction_date"
                    name="transactionDate"
                    value={dmrsData.transactionDate}
                    onChange={handleInputChange}
                  />
                  {errors.transactionDate && (
                    <p className={styles["error-message"]}>
                      {errors.transactionDate}
                    </p>
                  )}
                </label>
                <label
                  className={`${styles.label} ${styles["dmr-label"]}`}
                  htmlFor="truck_gate_in"
                >
                  Truck Gate In
                  <input
                    className={`${styles.input} ${
                      errors.truckGateIn ? styles["error-input"] : ""
                    }`}
                    type="datetime-local"
                    id="truck_gate_in"
                    name="truckGateIn"
                    value={dmrsData.truckGateIn}
                    onChange={handleInputChange}
                  />
                  {errors.truckGateIn && (
                    <p className={styles["error-message"]}>
                      {errors.truckGateIn}
                    </p>
                  )}
                </label>
                <label
                  className={`${styles.label} ${styles["dmr-label"]}`}
                  htmlFor="dispatch_date_and_time"
                >
                  Dispatch Date and Time
                  <input
                    className={`${styles.input} ${
                      errors.dispatchDateAndTime ? styles["error-input"] : ""
                    }`}
                    type="datetime-local"
                    id="dispatch_date_and_time"
                    name="dispatchDateAndTime"
                    value={dmrsData.dispatchDateAndTime}
                    onChange={handleInputChange}
                  />
                  {errors.dispatchDateAndTime && (
                    <p className={styles["error-message"]}>
                      {errors.dispatchDateAndTime}
                    </p>
                  )}
                </label>
                <label
                  className={`${styles.label} ${styles["dmr-label"]}`}
                  htmlFor="driver_id"
                >
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
                        (opt) => opt.value === dmrsData.driverId
                      ) || null
                    }
                    onChange={(selected) =>
                      setDmrsData((prev) => ({
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
                <label
                  className={`${styles.label} ${styles["dmr-label"]}`}
                  htmlFor="crew_id"
                >
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
                      dmrsData.crewId?.includes(opt.value)
                    )}
                    onChange={(selected) => {
                      const values = selected
                        ? selected.map((opt) => opt.value)
                        : [];
                      setDmrsData((prev) => ({ ...prev, crewId: values }));
                    }}
                    classNamePrefix="react-select"
                    placeholder="Select Crew Members"
                  />
                  {errors.crewId && (
                    <p className={styles["error-message"]}>{errors.crewId}</p>
                  )}
                </label>
                <label
                  className={`${styles.label} ${styles["dmr-label"]}`}
                  htmlFor="truck_id"
                >
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
                        (opt) => opt.value === dmrsData.truckId
                      ) || null
                    }
                    onChange={(selected) =>
                      setDmrsData((prev) => ({
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
              </div>
              <div className={styles["invoice-customer-container"]}>
                {(customers ?? []).map((customer, custIndex) => (
                  <div key={custIndex} className={styles["customer-block"]}>
                    <div className={styles["customer-invoice-input-container"]}>
                      {customers.length > 1 && (
                        <div className={styles["remove-button-container"]}>
                          <button
                            className={styles["remove-button"]}
                            type="button"
                            onClick={() => removeCustomer(custIndex)}
                          >
                            <img
                              className={styles["remove-button-icon"]}
                              src={crossIcon}
                              alt="Remove"
                            />
                          </button>
                        </div>
                      )}
                      <label
                        className={`${styles.label} ${styles["customer-invoice-label"]}`}
                        htmlFor="customer"
                      >
                        Customer
                        <Select
                          className={`${styles.input} ${
                            errors[`customerId_${custIndex}`]
                              ? styles["error-input"]
                              : ""
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
                                backgroundColor: isDarkMode
                                  ? "#2a2a2a"
                                  : "#f8f9fa",
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
                          id="customer"
                          options={customerOptions}
                          placeholder="Select Customer"
                          value={customerOptions.find(
                            (opt) => opt.value === customer.customerId
                          )}
                          onChange={(selected) =>
                            handleCustomerChange(custIndex, selected)
                          }
                        />
                        {errors[`customerId_${custIndex}`] && (
                          <p className={styles["error-message"]}>
                            {errors[`customerId_${custIndex}`]}
                          </p>
                        )}
                      </label>
                      {(customer.invoices ?? []).map((inv, invIndex) => {
                        const filteredAllowanceMatrixOptions =
                          allowanceMatrixData
                            .filter(
                              (matrix) =>
                                matrix.trip_type === "DMR" &&
                                matrix.principal === "PANA" &&
                                matrix.truck_type === inv.tsmTrucktype
                            )
                            .map((matrix) => {
                              const secondDest =
                                matrix.second_destination &&
                                matrix.second_destination.trim() !== ""
                                  ? ` → ${matrix.second_destination}`
                                  : "";

                              return {
                                value: String(matrix.id),
                                label: `(${matrix.code}) ${matrix.source} → ${matrix.first_destination}${secondDest}`,
                              };
                            });
                        return (
                          <div
                            key={invIndex}
                            className={styles["invoice-block"]}
                          >
                            {customer.invoices.length > 1 && (
                              <div
                                className={styles["remove-button-container"]}
                              >
                                <button
                                  type="button"
                                  className={styles["remove-button"]}
                                  onClick={() =>
                                    removeInvoice(custIndex, invIndex)
                                  }
                                >
                                  <img
                                    className={styles["remove-button-icon"]}
                                    src={crossIcon}
                                    alt="Remove"
                                  />
                                </button>
                              </div>
                            )}
                            <label
                              className={`${styles.label} ${styles["customer-invoice-label"]} ${styles["invoice-label"]}`}
                              htmlFor="dr_number"
                            >
                              DR Number
                              <input
                                className={`${styles.input} ${
                                  errors[`drNumber${custIndex}`]
                                    ? styles["error-input"]
                                    : ""
                                }`}
                                type="text"
                                id="dr_number"
                                value={inv.drNumber}
                                onChange={(e) =>
                                  handleInvoiceFieldChange(
                                    custIndex,
                                    invIndex,
                                    "drNumber",
                                    e.target.value
                                  )
                                }
                              />
                              {errors[`drNumber${custIndex}`] && (
                                <p className={styles["error-message"]}>
                                  {errors[`drNumber${custIndex}`]}
                                </p>
                              )}
                            </label>
                            <label
                              className={`${styles.label} ${styles["customer-invoice-label"]} ${styles["invoice-label"]}`}
                              htmlFor="po_number"
                            >
                              PO Number
                              <input
                                className={`${styles.input} ${
                                  errors[`poNumber${custIndex}`]
                                    ? styles["error-input"]
                                    : ""
                                }`}
                                type="number"
                                id="po_number"
                                value={inv.poNumber}
                                onChange={(e) =>
                                  handleInvoiceFieldChange(
                                    custIndex,
                                    invIndex,
                                    "poNumber",
                                    e.target.value
                                  )
                                }
                              />
                              {errors[`poNumber${custIndex}`] && (
                                <p className={styles["error-message"]}>
                                  {errors[`poNumber${custIndex}`]}
                                </p>
                              )}
                            </label>
                            <label
                              className={`${styles.label} ${styles["customer-invoice-label"]} ${styles["invoice-label"]}`}
                              htmlFor="model"
                            >
                              Model
                              <input
                                className={`${styles.input} ${
                                  errors[`model${custIndex}`]
                                    ? styles["error-input"]
                                    : ""
                                }`}
                                type="text"
                                id="model"
                                value={inv.model}
                                onChange={(e) =>
                                  handleInvoiceFieldChange(
                                    custIndex,
                                    invIndex,
                                    "model",
                                    e.target.value
                                  )
                                }
                              />
                              {errors[`model${custIndex}`] && (
                                <p className={styles["error-message"]}>
                                  {errors[`model${custIndex}`]}
                                </p>
                              )}
                            </label>
                            <label
                              className={`${styles.label} ${styles["customer-invoice-label"]} ${styles["invoice-label"]}`}
                              htmlFor="quantity"
                            >
                              Quantity
                              <input
                                className={`${styles.input} ${
                                  errors[`quantity${custIndex}`]
                                    ? styles["error-input"]
                                    : ""
                                }`}
                                type="number"
                                id="quantity"
                                value={inv.quantity}
                                onChange={(e) =>
                                  handleInvoiceFieldChange(
                                    custIndex,
                                    invIndex,
                                    "quantity",
                                    e.target.value
                                  )
                                }
                              />
                              {errors[`quantity${custIndex}`] && (
                                <p className={styles["error-message"]}>
                                  {errors[`quantity${custIndex}`]}
                                </p>
                              )}
                            </label>
                            <label
                              className={`${styles.label} ${styles["customer-invoice-label"]} ${styles["invoice-label"]}`}
                              htmlFor="amount"
                            >
                              Amount
                              <input
                                className={`${styles.input} ${
                                  errors[`amount${custIndex}`]
                                    ? styles["error-input"]
                                    : ""
                                }`}
                                type="number"
                                id="amount"
                                value={inv.amount}
                                onChange={(e) =>
                                  handleInvoiceFieldChange(
                                    custIndex,
                                    invIndex,
                                    "amount",
                                    e.target.value
                                  )
                                }
                              />
                              {errors[`amount${custIndex}`] && (
                                <p className={styles["error-message"]}>
                                  {errors[`amount${custIndex}`]}
                                </p>
                              )}
                            </label>
                            <label
                              className={`${styles.label} ${styles["customer-invoice-label"]} ${styles["invoice-label"]}`}
                              htmlFor="cbm"
                            >
                              CBM
                              <input
                                className={`${styles.input} ${
                                  errors[`cbm${custIndex}`]
                                    ? styles["error-input"]
                                    : ""
                                }`}
                                type="text"
                                id="cbm"
                                value={inv.cbm}
                                onChange={(e) =>
                                  handleInvoiceFieldChange(
                                    custIndex,
                                    invIndex,
                                    "cbm",
                                    e.target.value
                                  )
                                }
                              />
                              {errors[`cbm${custIndex}`] && (
                                <p className={styles["error-message"]}>
                                  {errors[`cbm${custIndex}`]}
                                </p>
                              )}
                            </label>
                            <label
                              className={`${styles.label} ${styles["customer-invoice-label"]} ${styles["invoice-label"]}`}
                              htmlFor="tsm_trucktype"
                            >
                              TSM Truck Type
                              <Select
                                className={`${styles.input} ${
                                  errors[`tsmTrucktype_${custIndex}`]
                                    ? styles["error-input"]
                                    : ""
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
                                      boxShadow:
                                        "0 0 4px rgba(109, 118, 126, 0.8)",
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
                                      isDarkMode
                                        ? "var(--borders)"
                                        : "var(--borders)"
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
                                      backgroundColor: isDarkMode
                                        ? "#2a2a2a"
                                        : "#f8f9fa",
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
                                id="tsm_trucktype"
                                options={tsmTrucktypeOptions}
                                value={tsmTrucktypeOptions.find(
                                  (opt) => opt.value === inv.tsmTrucktype
                                )}
                                onChange={(selected) =>
                                  handleInvoiceFieldChange(
                                    custIndex,
                                    invIndex,
                                    "tsmTrucktype",
                                    selected?.value || ""
                                  )
                                }
                                placeholder="Select TSM Truck Type"
                              />
                              {errors[`tsmTrucktype_${custIndex}`] && (
                                <p className={styles["error-message"]}>
                                  {errors[`tsmTrucktype_${custIndex}`]}
                                </p>
                              )}
                            </label>
                            <label
                              className={`${styles.label} ${styles["customer-invoice-label"]} ${styles["invoice-label"]}`}
                              htmlFor="allowance_matrix_id"
                            >
                              Source and Destination
                              <Select
                                className={`${styles.input} ${
                                  errors[`allowanceMatrixId${custIndex}`]
                                    ? styles["error-input"]
                                    : ""
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
                                      boxShadow:
                                        "0 0 4px rgba(109, 118, 126, 0.8)",
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
                                      backgroundColor: isDarkMode
                                        ? "#2a2a2a"
                                        : "#f8f9fa",
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
                                options={filteredAllowanceMatrixOptions}
                                value={filteredAllowanceMatrixOptions.find(
                                  (opt) =>
                                    String(opt.value) ===
                                    String(inv.allowanceMatrixId)
                                )}
                                onChange={(selected) =>
                                  handleInvoiceFieldChange(
                                    custIndex,
                                    invIndex,
                                    "allowanceMatrixId",
                                    selected?.value || null
                                  )
                                }
                                placeholder="Select Source and Destination"
                                isDisabled={!inv.tsmTrucktype}
                              />
                              {errors[`allowanceMatrixId${custIndex}`] && (
                                <p className={styles["error-message"]}>
                                  {errors[`allowanceMatrixId${custIndex}`]}
                                </p>
                              )}
                            </label>
                          </div>
                        );
                      })}
                      <button
                        type="button"
                        className={styles["add-customer-invoice"]}
                        onClick={() => addInvoice(custIndex)}
                      >
                        Add Invoice
                      </button>
                    </div>
                  </div>
                ))}
                <button
                  className={styles["add-customer-invoice"]}
                  type="button"
                  onClick={addCustomer}
                >
                  Add Customer
                </button>
              </div>
              {errors.apiError && (
                <p className={styles["error-message"]}>{errors.apiError}</p>
              )}
              <button className={styles["submit-button"]}>Submit</button>
            </form>
          </div>
        </Modal>
      )}
      {isDeleteModalOpen && selectedDmr && (
        <Modal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
        >
          <div
            className={`${styles["modal-container"]} ${styles["delete-modal-container"]}`}
          >
            <h1 className={styles["delete-modal-header"]}>
              Are you sure to delete this DMR?
            </h1>
            <div className={styles["delete-modal-button-container"]}>
              <button
                className={styles["delete-modal-button"]}
                onClick={handleDeleteDmr}
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

export default OPSPANADmr;
