import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import Modal from "../../../Modal";
import styles from "../../../../assets/styles/OPSNPIDmr.module.css";
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

const OPSNPIDmr = () => {
  const [dmrs, setDmrs] = useState([]);
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
    invoice: "",
    cdn: "",
    quantity: "",
    amount: "",
    poNumber: "",
    foNumber: "",
    sealNumber: "",
    transactionDate: "",
    truckGateIn: "",
    dispatchDateAndTime: "",
    rdd: "",
    driverId: "",
    crewId: "",
    truckId: "",
    destination: "",
    secondLegFo: "",
  });

  const [errors, setErrors] = useState({
    week: "",
    waybill: "",
    category: "",
    siteId: "",
    customerId: "",
    invoice: "",
    cdn: "",
    quantity: "",
    amount: "",
    poNumber: "",
    foNumber: "",
    sealNumber: "",
    transactionDate: "",
    truckGateIn: "",
    dispatchDateAndTime: "",
    rdd: "",
    driverId: "",
    crewId: "",
    truckId: "",
    destination: "",
    secondLegFo: "",
    apiError: "",
  });

  const isDarkMode =
    document.documentElement.getAttribute("data-theme") === "dark";

  const fetchDmrs = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/dmrs`);
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
    "Destination",
    "Second Leg FO",
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
      Invoice: item.invoice,
      CDN: item.cdn,
      Quantity: item.quantity,
      Amount: item.amount,
      "PO Number": item.po_number,
      "FO Number": item.fo_number,
      "Seal Number": item.seal_number,
      "Transaction Date": formatDate(item.transaction_date),
      "Truck Gate In": formatDate(item.truck_gate_in),
      "Dispatch Date and Time": formatDate(item.dispatch_date_and_time),
      RDD: formatDate(item.rdd),
      "Driver Name": item.driver_name,
      Crews: item.crew_names,
      "Plate Number": item.plate_number,
      "Truck Type": item.truck_type,
      Destination: item.destination,
      "Second Leg FO": item.second_leg_fo,
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
      item.invoice || "",
      item.cdn || "",
      item.quantity || "",
      item.amount || "",
      item.po_number || "",
      item.fo_number || "",
      item.seal_number || "",
      formatDate(item.transaction_date),
      formatDate(item.truck_gate_in),
      formatDate(item.dispatch_date_and_time),
      formatDate(item.rdd),
      item.driver_name || "",
      item.crew_names || "",
      item.plate_number || "",
      item.truck_type || "",
      item.destination || "",
      item.second_leg_fo || "",
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
          Invoice: item.invoice,
          CDN: item.cdn,
          Quantity: item.quantity,
          Amount: item.amount,
          "PO Number": item.po_number,
          "FO Number": item.fo_number,
          "Seal Number": item.seal_number,
          "Transaction Date": formatDate(item.transaction_date),
          "Truck Gate In": formatDate(item.truck_gate_in),
          "Dispatch Date and Time": formatDate(item.dispatch_date_and_time),
          RDD: formatDate(item.rdd),
          "Driver Name": item.driver_name,
          Crews: item.crew_names,
          "Plate Number": item.plate_number,
          "Truck Type": item.truck_type,
          Destination: item.destination,
          "Second Leg FO": item.second_leg_fo,
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
      invoice: "",
      cdn: "",
      quantity: "",
      amount: "",
      poNumber: "",
      foNumber: "",
      sealNumber: "",
      transactionDate: "",
      truckGateIn: "",
      dispatchDateAndTime: "",
      rdd: "",
      driverId: "",
      crewId: "",
      truckId: "",
      destination: "",
      secondLegFo: "",
      apiError: "",
    });
  };

  const closeAddModal = () => {
    setIsAddModalOpen(false);
    setDmrsData({
      week: "",
      waybill: "",
      category: "",
      siteId: "",
      customerId: "",
      invoice: "",
      cdn: "",
      quantity: "",
      amount: "",
      poNumber: "",
      foNumber: "",
      sealNumber: "",
      transactionDate: "",
      truckGateIn: "",
      dispatchDateAndTime: "",
      rdd: "",
      driverId: "",
      crewId: "",
      truckId: "",
      destination: "",
      secondLegFo: "",
    });
    setErrors({
      week: "",
      waybill: "",
      category: "",
      siteId: "",
      customerId: "",
      invoice: "",
      cdn: "",
      quantity: "",
      amount: "",
      poNumber: "",
      foNumber: "",
      sealNumber: "",
      transactionDate: "",
      truckGateIn: "",
      dispatchDateAndTime: "",
      rdd: "",
      driverId: "",
      crewId: "",
      truckId: "",
      destination: "",
      secondLegFo: "",
      apiError: "",
    });
    setCustomersInvoices([
      {
        customerId: "",
        invoice: "",
        cdn: "",
        quantity: "",
        amount: "",
        poNumber: "",
        sealNumber: "",
        destination: "",
        secondLegFo: "",
      },
    ]);
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
    setErrors({
      week: "",
      waybill: "",
      category: "",
      siteId: "",
      customerId: "",
      invoice: "",
      cdn: "",
      quantity: "",
      amount: "",
      poNumber: "",
      foNumber: "",
      sealNumber: "",
      transactionDate: "",
      truckGateIn: "",
      dispatchDateAndTime: "",
      rdd: "",
      driverId: "",
      crewId: "",
      truckId: "",
      destination: "",
      secondLegFo: "",
      apiError: "",
    });

    let hasError = false;

    if (
      customersInvoices.length === 0 ||
      customersInvoices.some((ci) => !ci.customerId)
    ) {
      setErrors((prev) => ({
        ...prev,
        customerId: "At least one customer is required.",
      }));
      hasError = true;
    }

    if (dmrsData.category === "Transshipment" && !dmrsData.foNumber?.trim()) {
      setErrors((prev) => ({
        ...prev,
        foNumber: "FO Number is required for Transshipment.",
      }));
      hasError = true;
    }

    if (
      dmrsData.category === "Transshipment" &&
      customersInvoices.some(
        (ci) => String(ci.customerId) !== "152" && !ci.secondLegFo?.trim()
      )
    ) {
      setErrors((prev) => ({
        ...prev,
        secondLegFo:
          "Second Leg FO Number is required for Transshipment rows (except TRANSSHIPMENT).",
      }));
      hasError = true;
    }

    if (
      customersInvoices.some(
        (ci) =>
          String(ci.customerId) !== "152" &&
          (!ci.invoice || String(ci.invoice).trim() === "")
      )
    ) {
      setErrors((prev) => ({
        ...prev,
        invoice:
          "Invoice number is required for all customers except TRANSSHIPMENT.",
      }));
      hasError = true;
    }

    if (hasError) return;

    try {
      const waybillMap = {};

      const rows = customersInvoices.map((ci) => {
        let key;
        if (dmrsData.category === "Transshipment") {
          key = `${dmrsData.foNumber}-${ci.secondLegFo || "NULL"}`;
        } else {
          key = `${dmrsData.foNumber}`;
        }

        const waybill = waybillMap[key] || null;
        waybillMap[key] = waybill;

        return {
          week: dmrsData.week || null,
          waybill,
          category: dmrsData.category || null,
          site_id: dmrsData.siteId ? parseInt(dmrsData.siteId) : null,
          customer_id: ci.customerId ? parseInt(ci.customerId) : null,
          invoice: ci.invoice || null,
          cdn: ci.cdn || null,
          quantity: ci.quantity || null,
          amount: ci.amount || null,
          po_number: ci.poNumber || null,
          fo_number: dmrsData.foNumber || null,
          seal_number: ci.sealNumber || null,
          transaction_date: dmrsData.transactionDate || null,
          truck_gate_in: dmrsData.truckGateIn || null,
          dispatch_date_and_time: dmrsData.dispatchDateAndTime || null,
          rdd: dmrsData.rdd || null,
          driver_id: dmrsData.driverId ? parseInt(dmrsData.driverId) : null,
          crews: dmrsData.crewId.map((id) => parseInt(id)),
          truck_id: dmrsData.truckId ? parseInt(dmrsData.truckId) : null,
          destination: ci.destination || dmrsData.destination || null,
          second_leg_fo:
            dmrsData.category === "Transshipment"
              ? ci.secondLegFo || null
              : null,
        };
      });

      const response = await axios.post(`${API_BASE_URL}/insert-dmr`, { rows });

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

  const toggleEditModal = (dmr = null) => {
    setSelectedDmr(dmr);
    setDmrsData({
      week: dmr?.week || "",
      waybill: dmr?.waybill || "",
      category: dmr?.category || "",
      siteId: dmr?.site_id || "",
      customerId: dmr?.customer_id || "",
      invoice: dmr?.invoice || "",
      cdn: dmr?.cdn || "",
      quantity: dmr?.quantity || "",
      amount: dmr?.amount || "",
      poNumber: dmr?.po_number || "",
      foNumber: dmr?.fo_number || "",
      sealNumber: dmr?.seal_number || "",
      transactionDate: dmr?.transaction_date || "",
      truckGateIn: dmr?.truck_gate_in || "",
      dispatchDateAndTime: dmr?.dispatch_date_and_time || "",
      rdd: dmr?.rdd || "",
      driverId: dmr?.driver_id || "",
      crewId: dmr?.crew_id || "",
      truckId: dmr?.truck_id || "",
      destination: dmr?.destination || "",
      secondLegFo: dmr?.second_leg_fo || "",
    });
    setIsEditModalOpen(true);
    setErrors({
      week: "",
      waybill: "",
      category: "",
      siteId: "",
      customerId: "",
      invoice: "",
      cdn: "",
      quantity: "",
      amount: "",
      poNumber: "",
      foNumber: "",
      sealNumber: "",
      transactionDate: "",
      truckGateIn: "",
      dispatchDateAndTime: "",
      rdd: "",
      driverId: "",
      crewId: "",
      truckId: "",
      destination: "",
      secondLegFo: "",
      apiError: "",
    });
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedDmr(null);
    setDmrsData({
      week: "",
      waybill: "",
      category: "",
      siteId: "",
      customerId: "",
      invoice: "",
      cdn: "",
      quantity: "",
      amount: "",
      poNumber: "",
      foNumber: "",
      sealNumber: "",
      transactionDate: "",
      truckGateIn: "",
      dispatchDateAndTime: "",
      rdd: "",
      driverId: "",
      crewId: "",
      truckId: "",
      destination: "",
      secondLegFo: "",
    });
    setErrors({
      week: "",
      waybill: "",
      category: "",
      siteId: "",
      customerId: "",
      invoice: "",
      cdn: "",
      quantity: "",
      amount: "",
      poNumber: "",
      foNumber: "",
      sealNumber: "",
      transactionDate: "",
      truckGateIn: "",
      dispatchDateAndTime: "",
      rdd: "",
      driverId: "",
      crewId: "",
      truckId: "",
      destination: "",
      secondLegFo: "",
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
      invoice: "",
      cdn: "",
      quantity: "",
      amount: "",
      poNumber: "",
      foNumber: "",
      sealNumber: "",
      transactionDate: "",
      truckGateIn: "",
      dispatchDateAndTime: "",
      rdd: "",
      driverId: "",
      crewId: "",
      truckId: "",
      destination: "",
      secondLegFo: "",
      apiError: "",
    });

    if (!selectedDmr || !selectedDmr.id) {
      setErrors((prev) => ({
        ...prev,
        apiError: "Invalid DMR selected.",
      }));
      return;
    }

    let hasError = false;

    if (!dmrsData.customerId.trim()) {
      setErrors((prev) => ({
        ...prev,
        customerId: "Customer is required.",
      }));
      hasError = true;
    }

    if (!dmrsData.foNumber.trim()) {
      setErrors((prev) => ({
        ...prev,
        foNumber: "FO Number is required.",
      }));
      hasError = true;
    }

    if (hasError) return;

    try {
      const response = await axios.put(
        `${API_BASE_URL}/update-dmr/${selectedDmr.id}`,
        {
          week: dmrsData.week,
          waybill: dmrsData.waybill,
          category: dmrsData.category,
          site_id: dmrsData.siteId,
          customer_id: dmrsData.customerId,
          invoice: dmrsData.invoice,
          cdn: dmrsData.cdn,
          quantity: dmrsData.quantity,
          amount: dmrsData.amount,
          po_number: dmrsData.poNumber,
          fo_number: dmrsData.foNumber,
          seal_number: dmrsData.sealNumber,
          transaction_date: dmrsData.transactionDate,
          truck_gate_in: dmrsData.truckGateIn,
          dispatch_date_and_time: dmrsData.dispatchDateAndTime,
          rdd: dmrsData.rdd,
          driver_id: dmrsData.driverId,
          crew_id: dmrsData.crewId,
          truck_id: dmrsData.truckId,
          destination: dmrsData.destination,
          second_leg_fo: dmrsData.secondLegFo,
        }
      );

      if (response.data.success) {
        setDmrs((prevDmrs) =>
          prevDmrs.map((dmr) =>
            dmr.id === selectedDmr.id
              ? { ...dmrsData, id: selectedDmr.id }
              : dmr
          )
        );
        fetchDmrs();
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
    if (!selectedDmr || !selectedDmr.id) return;

    try {
      const response = await axios.delete(
        `${API_BASE_URL}/delete-dmr/${selectedDmr.id}`
      );

      if (response.data.success) {
        setDmrs((prevDmrs) =>
          prevDmrs.filter((dmr) => dmr.id !== selectedDmr.id)
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
          "An error occurred while deleting the DMR.",
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

  const [customersInvoices, setCustomersInvoices] = useState([
    {
      customerId: "",
      invoice: "",
      cdn: "",
      quantity: "",
      amount: "",
      poNumber: "",
      sealNumber: "",
      destination: "",
      secondLegFo: "",
    },
  ]);

  const handleCustomerChange = (index, selected) => {
    const updated = [...customersInvoices];
    updated[index].customerId = selected?.value || "";
    setCustomersInvoices(updated);
  };

  const handleInvoiceChange = (index, value) => {
    const updated = [...customersInvoices];
    updated[index].invoice = value;
    setCustomersInvoices(updated);
  };

  const handleCdnChange = (index, value) => {
    const updated = [...customersInvoices];
    updated[index].cdn = value;
    setCustomersInvoices(updated);
  };

  const handleQuantityChange = (index, value) => {
    const updated = [...customersInvoices];
    updated[index].quantity = value;
    setCustomersInvoices(updated);
  };

  const handleAmountChange = (index, value) => {
    const updated = [...customersInvoices];
    updated[index].amount = value;
    setCustomersInvoices(updated);
  };

  const handlePoNumberChange = (index, value) => {
    const updated = [...customersInvoices];
    updated[index].poNumber = value;
    setCustomersInvoices(updated);
  };

  const handleSealNumberChange = (index, value) => {
    const updated = [...customersInvoices];
    updated[index].sealNumber = value;
    setCustomersInvoices(updated);
  };

  const handleDestinationChange = (index, value) => {
    const updated = [...customersInvoices];
    updated[index].destination = value;
    setCustomersInvoices(updated);
  };

  const handleSecondLegFoChange = (index, value) => {
    const updated = [...customersInvoices];
    updated[index].secondLegFo = value;
    setCustomersInvoices(updated);
  };

  const addCustomerInvoice = () => {
    setCustomersInvoices((prev) => [
      ...prev,
      {
        customerId: "",
        invoice: "",
        cdn: "",
        quantity: "",
        amount: "",
        poNumber: "",
        sealNumber: "",
        secondLegFo: "",
      },
    ]);
  };

  const removeCustomerInvoice = (index) => {
    setCustomersInvoices((prev) => prev.filter((_, i) => i !== index));
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
          const options = response.data.data.map((customer) => ({
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
            const isAssigned = dmrs.some((dmr) => dmr.truck_id === truck.id);
            const isCurrentTruck =
              selectedDmr && selectedDmr.truck_id === truck.id;

            return !isAssigned || isCurrentTruck;
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

  return (
    <div className={styles["dmr-content"]}>
      <div className={styles["content-header-container"]}>
        <h1 className={styles["page-title"]}>Dmr</h1>
      </div>
      <div className={styles["content-body-container"]}>
        <div className={styles["add-dmr-button-container"]}>
          <button className={styles["add-dmr-button"]} onClick={toggleAddModal}>
            Add Dmr
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
                <th className={styles.th}>Destination</th>
                <th className={styles.th}>Second Leg FO</th>
                <th className={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody className={styles.tbody}>
              {paginatedDmrs.map((dmr, index) => (
                <tr className={styles.btr} key={index}>
                  <td className={styles.td}>{dmr.week}</td>
                  <td className={styles.td}>{dmr.waybill}</td>
                  <td className={styles.td}>{dmr.category}</td>
                  <td className={styles.td}>
                    {dmr.site_name} {dmr.site_code}
                  </td>
                  <td className={styles.td}>{dmr.customer_number}</td>
                  <td className={styles.td}>{dmr.customer_name}</td>
                  <td className={styles.td}>{dmr.invoice}</td>
                  <td className={styles.td}>{dmr.cdn}</td>
                  <td className={styles.td}>{dmr.quantity}</td>
                  <td className={styles.td}>{dmr.amount}</td>
                  <td className={styles.td}>{dmr.po_number}</td>
                  <td className={styles.td}>{dmr.fo_number}</td>
                  <td className={styles.td}>{dmr.seal_number}</td>
                  <td className={styles.td}>
                    {formatDate(dmr.transaction_date)}
                  </td>
                  <td className={styles.td}>{formatDate(dmr.truck_gate_in)}</td>
                  <td className={styles.td}>
                    {formatDate(dmr.dispatch_date_and_time)}
                  </td>
                  <td className={styles.td}>{formatDate(dmr.rdd)}</td>
                  <td className={styles.td}>{dmr.driver_name}</td>
                  <td className={styles.td}>{dmr.crew_names}</td>
                  <td className={styles.td}>{dmr.plate_number}</td>
                  <td className={styles.td}>{dmr.truck_type}</td>
                  <td className={styles.td}>{dmr.destination}</td>
                  <td className={styles.td}>{dmr.second_leg_fo}</td>
                  <td className={styles.td}>
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
                  </td>
                </tr>
              ))}
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
            className={`${styles["modal-container"]} ${styles["add-modal-container"]}`}
          >
            <div className={styles["modal-header-container"]}>
              <h3 className={styles["modal-title"]}>Add Dmr</h3>
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
              onSubmit={handleAddDmr}
            >
              <label className={styles.label} htmlFor="category">
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
              <label className={styles.label} htmlFor="site_id">
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
                    siteOptions.find((opt) => opt.value === dmrsData.siteId) ||
                    null
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
              <div className={styles["invoice-customer-container"]}>
                {customersInvoices.map((item, index) => (
                  <div key={index} className={styles["customer-invoice-row"]}>
                    <div className={styles["customer-invoice-input-container"]}>
                      {customersInvoices.length > 1 && (
                        <div className={styles["remove-button-container"]}>
                          <button
                            className={styles["remove-button"]}
                            type="button"
                            onClick={() => removeCustomerInvoice(index)}
                          >
                            <img
                              className={styles["remove-button-icon"]}
                              src={crossIcon}
                              alt="Remove"
                            />
                          </button>
                        </div>
                      )}
                      <div className={styles["customer-invoice-input-wrapper"]}>
                        <label
                          className={`${styles.label} ${styles["customer-invoice-label"]}`}
                        >
                          Customer
                          <Select
                            className={`${styles.input} ${
                              errors[`customerId_${index}`]
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
                            options={customerOptions}
                            value={customerOptions.find(
                              (opt) => opt.value === item.customerId
                            )}
                            onChange={(selected) =>
                              handleCustomerChange(index, selected)
                            }
                            placeholder="Select Customer"
                          />
                        </label>
                        <label
                          className={`${styles.label} ${styles["customer-invoice-label"]}`}
                        >
                          Invoice
                          <input
                            className={styles.input}
                            type="number"
                            value={item.invoice}
                            onChange={(e) =>
                              handleInvoiceChange(index, e.target.value)
                            }
                          />
                        </label>
                        <label
                          className={`${styles.label} ${styles["customer-invoice-label"]}`}
                        >
                          CDN
                          <input
                            className={styles.input}
                            type="text"
                            value={item.cdn}
                            onChange={(e) =>
                              handleCdnChange(index, e.target.value)
                            }
                          />
                        </label>
                        <label
                          className={`${styles.label} ${styles["customer-invoice-label"]}`}
                        >
                          Quantity
                          <input
                            className={styles.input}
                            type="number"
                            value={item.quantity}
                            onChange={(e) =>
                              handleQuantityChange(index, e.target.value)
                            }
                          />
                        </label>
                        <label
                          className={`${styles.label} ${styles["customer-invoice-label"]}`}
                        >
                          Amount
                          <input
                            className={styles.input}
                            type="number"
                            value={item.amount}
                            onChange={(e) =>
                              handleAmountChange(index, e.target.value)
                            }
                          />
                        </label>
                        <label
                          className={`${styles.label} ${styles["customer-invoice-label"]}`}
                        >
                          PO Number
                          <input
                            className={styles.input}
                            type="text"
                            value={item.poNumber}
                            onChange={(e) =>
                              handlePoNumberChange(index, e.target.value)
                            }
                          />
                        </label>
                        <label
                          className={`${styles.label} ${styles["customer-invoice-label"]}`}
                        >
                          Seal Number
                          <input
                            className={styles.input}
                            type="text"
                            value={item.sealNumber}
                            onChange={(e) =>
                              handleSealNumberChange(index, e.target.value)
                            }
                          />
                        </label>
                        <label
                          className={`${styles.label} ${styles["customer-invoice-label"]}`}
                          htmlFor="destination"
                        >
                          Destination
                          <input
                            className={`${styles.input} ${
                              errors.destination ? styles["error-input"] : ""
                            }`}
                            type="text"
                            id="destination"
                            name="destination"
                            value={item.destination}
                            onChange={(e) =>
                              handleDestinationChange(index, e.target.value)
                            }
                          />
                          {errors.destination && (
                            <p className={styles["error-message"]}>
                              {errors.destination}
                            </p>
                          )}
                        </label>
                        {dmrsData.category === "Transshipment" &&
                          item.customerId &&
                          String(item.customerId) !== "152" && (
                            <label className={styles.label}>
                              Second Leg FO Number
                              <input
                                className={styles.input}
                                type="text"
                                value={item.secondLegFo || ""}
                                onChange={(e) =>
                                  handleSecondLegFoChange(index, e.target.value)
                                }
                              />
                            </label>
                          )}
                      </div>
                    </div>
                  </div>
                ))}
                <button
                  className={styles["add-customer-invoice"]}
                  type="button"
                  onClick={addCustomerInvoice}
                >
                  Add More
                </button>
              </div>
              <label className={styles.label} htmlFor="fo_number">
                FO Number
                <input
                  className={`${styles.input} ${
                    errors.foNumber ? styles["error-input"] : ""
                  }`}
                  type="text"
                  id="fo_number"
                  name="foNumber"
                  value={dmrsData.foNumber}
                  onChange={handleInputChange}
                />
                {errors.foNumber && (
                  <p className={styles["error-message"]}>{errors.foNumber}</p>
                )}
              </label>
              <label className={styles.label} htmlFor="transaction_date">
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
              <label className={styles.label} htmlFor="truck_gate_in">
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
              <label className={styles.label} htmlFor="dispatch_date_and_time">
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
              <label className={styles.label} htmlFor="rdd">
                RDD
                <input
                  className={`${styles.input} ${
                    errors.rdd ? styles["error-input"] : ""
                  }`}
                  type="date"
                  id="rdd"
                  name="rdd"
                  value={dmrsData.rdd}
                  onChange={handleInputChange}
                />
                {errors.rdd && (
                  <p className={styles["error-message"]}>{errors.rdd}</p>
                )}
              </label>
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
          <div className={styles["modal-container"]}>
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
              className={styles["modal-body-container"]}
              onSubmit={handleEditDmr}
            >
              <label className={styles.label} htmlFor="category">
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
              <label className={styles.label} htmlFor="site_id">
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
                    siteOptions.find((opt) => opt.value === dmrsData.siteId) ||
                    null
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
              <div className={styles["invoice-customer-container"]}>
                {customersInvoices.map((item, index) => (
                  <div key={index} className={styles["customer-invoice-row"]}>
                    <label className={styles.label}>
                      Customer
                      <Select
                        className={`${styles.input} ${
                          errors[`customerId_${index}`]
                            ? styles["error-input"]
                            : ""
                        }`}
                        options={customerOptions}
                        value={customerOptions.find(
                          (opt) => opt.value === item.customerId
                        )}
                        onChange={(selected) =>
                          handleCustomerChange(index, selected)
                        }
                        placeholder="Select Customer"
                      />
                      {errors[`customerId_${index}`] && (
                        <p className={styles["error-message"]}>
                          {errors[`customerId_${index}`]}
                        </p>
                      )}
                    </label>
                    <label className={styles.label}>
                      Invoice
                      <input
                        className={`${styles.input} ${
                          errors[`invoice_${index}`]
                            ? styles["error-input"]
                            : ""
                        }`}
                        type="number"
                        value={item.invoice}
                        onChange={(e) =>
                          handleInvoiceChange(index, e.target.value)
                        }
                      />
                      {errors[`invoice_${index}`] && (
                        <p className={styles["error-message"]}>
                          {errors[`invoice_${index}`]}
                        </p>
                      )}
                    </label>
                    {customersInvoices.length > 1 && (
                      <button
                        className={styles["remove-button"]}
                        type="button"
                        onClick={() => removeCustomerInvoice(index)}
                      >
                        <img
                          className={styles["remove-button-icon"]}
                          src={crossIcon}
                          alt="Remove"
                        />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  className={styles["add-customer-invoice"]}
                  type="button"
                  onClick={addCustomerInvoice}
                >
                  Add More
                </button>
              </div>
              <label className={styles.label} htmlFor="cdn">
                CDN
                <input
                  className={`${styles.input} ${
                    errors.cdn ? styles["error-input"] : ""
                  }`}
                  type="text"
                  id="cdn"
                  name="cdn"
                  value={dmrsData.cdn}
                  onChange={handleInputChange}
                />
                {errors.cdn && (
                  <p className={styles["error-message"]}>{errors.cdn}</p>
                )}
              </label>
              <label className={styles.label} htmlFor="quantity">
                Quantity
                <input
                  className={`${styles.input} ${
                    errors.quantity ? styles["error-input"] : ""
                  }`}
                  type="number"
                  id="quantity"
                  name="quantity"
                  value={dmrsData.quantity}
                  onChange={handleInputChange}
                />
                {errors.quantity && (
                  <p className={styles["error-message"]}>{errors.quantity}</p>
                )}
              </label>
              <label className={styles.label} htmlFor="amount">
                Amount
                <input
                  className={`${styles.input} ${
                    errors.amount ? styles["error-input"] : ""
                  }`}
                  type="number"
                  id="amount"
                  name="amount"
                  value={dmrsData.amount}
                  onChange={handleInputChange}
                />
                {errors.amount && (
                  <p className={styles["error-message"]}>{errors.amount}</p>
                )}
              </label>
              <label className={styles.label} htmlFor="po_number">
                PO Number
                <input
                  className={`${styles.input} ${
                    errors.poNumber ? styles["error-input"] : ""
                  }`}
                  type="text"
                  id="po_number"
                  name="poNumber"
                  value={dmrsData.poNumber}
                  onChange={handleInputChange}
                />
                {errors.poNumber && (
                  <p className={styles["error-message"]}>{errors.poNumber}</p>
                )}
              </label>
              <label className={styles.label} htmlFor="fo_number">
                FO Number
                <input
                  className={`${styles.input} ${
                    errors.foNumber ? styles["error-input"] : ""
                  }`}
                  type="text"
                  id="fo_number"
                  name="foNumber"
                  value={dmrsData.foNumber}
                  onChange={handleInputChange}
                />
                {errors.foNumber && (
                  <p className={styles["error-message"]}>{errors.foNumber}</p>
                )}
              </label>
              <label className={styles.label} htmlFor="seal_number">
                Seal Number
                <input
                  className={`${styles.input} ${
                    errors.sealNumber ? styles["error-input"] : ""
                  }`}
                  type="number"
                  id="seal_number"
                  name="sealNumber"
                  value={dmrsData.sealNumber}
                  onChange={handleInputChange}
                />
                {errors.sealNumber && (
                  <p className={styles["error-message"]}>{errors.sealNumber}</p>
                )}
              </label>
              <label className={styles.label} htmlFor="transaction_date">
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
              <label className={styles.label} htmlFor="truck_gate_in">
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
              <label className={styles.label} htmlFor="dispatch_date_and_time">
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
              <label className={styles.label} htmlFor="rdd">
                RDD
                <input
                  className={`${styles.input} ${
                    errors.rdd ? styles["error-input"] : ""
                  }`}
                  type="date"
                  id="rdd"
                  name="rdd"
                  value={dmrsData.rdd}
                  onChange={handleInputChange}
                />
                {errors.rdd && (
                  <p className={styles["error-message"]}>{errors.rdd}</p>
                )}
              </label>
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
              <label className={styles.label} htmlFor="destination">
                Destination
                <input
                  className={`${styles.input} ${
                    errors.destination ? styles["error-input"] : ""
                  }`}
                  type="text"
                  id="destination"
                  name="destination"
                  value={dmrsData.destination}
                  onChange={handleInputChange}
                />
                {errors.destination && (
                  <p className={styles["error-message"]}>
                    {errors.destination}
                  </p>
                )}
              </label>
              <label className={styles.label} htmlFor="second_leg_fo">
                Second Leg FO Number
                <input
                  className={`${styles.input} ${
                    errors.secondLegFo ? styles["error-input"] : ""
                  }`}
                  type="text"
                  id="second_leg_fo"
                  name="secondLegFo"
                  value={dmrsData.secondLegFo}
                  onChange={handleInputChange}
                />
                {errors.secondLegFo && (
                  <p className={styles["error-message"]}>
                    {errors.secondLegFo}
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

export default OPSNPIDmr;
