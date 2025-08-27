import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import Modal from "../../components/Modal";
import styles from "../../assets/styles/NestleOrders.module.css";
import crossIcon from "../../assets/images/cross-icon.svg";
import editIcon from "../../assets/images/edit-icon.svg";
import deleteIcon from "../../assets/images/delete-icon.svg";
import editHoverIcon from "../../assets/images/edit-hovered-icon.svg";
import deleteHoverIcon from "../../assets/images/delete-hovered-icon.svg";
import filterIcon from "../../assets/images/filter-icon.svg";
import sortIcon from "../../assets/images/sort-icon.svg";
import exportIcon from "../../assets/images/export-icon.svg";
import pdfIcon from "../../assets/images/pdf-icon.svg";
import wordIcon from "../../assets/images/word-icon.svg";
import excelIcon from "../../assets/images/excel-icon.svg";
import pdfActiveIcon from "../../assets/images/pdf-active-icon.svg";
import wordActiveIcon from "../../assets/images/word-active-icon.svg";
import excelActiveIcon from "../../assets/images/excel-active-icon.svg";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Document, Packer, Paragraph, Table, TableRow, TableCell } from "docx";
import Select from "react-select";
import Philippines from "phil-reg-prov-mun-brgy";
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";
const NestleOrders = () => {
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState("");
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [tempFromDate, setTempFromDate] = useState("");
  const [tempToDate, setTempToDate] = useState("");
  const [tempSortOrder, setTempSortOrder] = useState("");
  const [appliedFromDate, setAppliedFromDate] = useState("");
  const [appliedToDate, setAppliedToDate] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(false);
  const [exportFromDate, setExportFromDate] = useState("");
  const [exportToDate, setExportToDate] = useState("");
  const [exportFileType, setExportFileType] = useState("");
  const [exportError, setExportError] = useState("");
  const filterRef = useRef(null);
  const sortRef = useRef(null);
  const exportRef = useRef(null);
  const [isEditHovered, setIsEditHovered] = useState(null);
  const [isDeleteHovered, setIsDeleteHovered] = useState(null);
  const [step, setStep] = useState(1);
  const [ordersData, setOrdersData] = useState({
    transportNumber: "",
    shipper: "",
    originName: "",
    originRegion: null,
    originProvince: null,
    originMunicipality: null,
    originZip: "",
    destinationName: "",
    destinationRegion: null,
    destinationProvince: null,
    destinationMunicipality: null,
    destinationZip: "",
    acceptanceDate: "",
    status: "",
  });
  const [errors, setErrors] = useState({
    transportNumber: "",
    shipper: "",
    originName: "",
    originRegion: "",
    originProvince: "",
    originMunicipality: "",
    originZip: "",
    destinationName: "",
    destinationRegion: "",
    destinationProvince: "",
    destinationMunicipality: "",
    destinationZip: "",
    acceptanceDate: "",
    status: "",
    apiError: "",
  });

  const isDarkMode =
    document.documentElement.getAttribute("data-theme") === "dark";

  const fetchOrders = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/orders`);
      if (response.data.success) {
        const nestleOrders = response.data.data.filter(
          (order) => order.principal === "Nestle"
        );
        setOrders(nestleOrders);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
  };
  useEffect(() => {
    fetchOrders();
  }, []);

  const filteredOrders = orders.filter((order) => {
    const transportNumber = (order.transport_number || "").toLowerCase();
    const matchesSearch = transportNumber.includes(search.toLowerCase());

    const orderDate = order.acceptance_date
      ? new Date(order.acceptance_date.split("T")[0])
      : new Date();
    const iswithinDateRange =
      (!appliedFromDate || orderDate >= new Date(appliedFromDate)) &&
      (!appliedToDate || orderDate <= new Date(appliedToDate));

    return matchesSearch && iswithinDateRange;
  });

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const paginatedOrders = filteredOrders.slice(
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
  const toggleFilterDropdown = () => {
    setFilterDropdownOpen(!filterDropdownOpen);
    setSortDropdownOpen(false);
    setExportDropdownOpen(false);
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

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const options = { year: "numeric", month: "long", day: "numeric" };
    return date.toLocaleDateString("en-US", options);
  };

  const tableColumn = [
    "ID",
    "Transport Number",
    "Shipper",
    "Origin Name",
    "Origin Address",
    "Destination Name",
    "Destination Address",
    "Acceptance Date",
    "Status",
    "Created At",
  ];

  const exportToExcel = (data) => {
    const formattedData = data.map((item, index) => ({
      ID: item.id,
      "Transport Number": item.transport_number,
      Shipper: item.shipper,
      "Origin Name": item.origin_name,
      "Origin Address": item.origin_address,
      "Destination Name": item.destination_name,
      "Destination Address": item.destination_address,
      "Acceptance Date": item.acceptance_date_words,
      Status: item.status,
      "Created At": formatDate(item.created_at),
    }));

    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Orders");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
    });

    saveAs(blob, "orders.xlsx");
  };

  const exportToPDF = (data) => {
    const doc = new jsPDF();

    doc.text("Orders Report", 14, 10);

    const tableRows = data.map((item, index) => [
      item.id || "",
      item.transport_number || "",
      item.shipper || "",
      item.origin_name || "",
      item.origin_address || "",
      item.destination_name || "",
      item.destination_address || "",
      item.acceptance_date_words || "",
      item.status || "",
      formatDate(item.created_at) || "",
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 20,
    });

    doc.save("orders.pdf");
  };

  const exportToWord = (data) => {
    const columnKeyMap = {
      ID: "id",
      "Transport Number": "transport_number",
      Shipper: "shipper",
      "Origin Name": "origin_name",
      "Origin Address": "origin_address",
      "Destination Name": "destination_name",
      "Destination Address": "destination_address",
      "Acceptance Date": "acceptance_date_words",
      Status: "status",
      "Created At": "created_at",
    };

    const tableRows = data.map((item, index) => {
      return new TableRow({
        children: tableColumn.map((column) => {
          const key = columnKeyMap[column];
          const value =
            column === "Created At"
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
      saveAs(blob, "orders.docx");
    });
  };

  const handleExport = () => {
    if (!exportFileType) {
      setExportError("Please select an export format.");
      return;
    }

    const filteredData = orders.filter((orders) => {
      const ordersDate = orders.created_at
        ? new Date(orders.created_at.split("T")[0])
        : new Date();
      return (
        (!exportFromDate || ordersDate >= new Date(exportFromDate)) &&
        (!exportToDate || ordersDate <= new Date(exportToDate))
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
    setOrdersData({
      transportNumber: "",
      shipper: "",
      originName: "",
      originRegion: null,
      originProvince: null,
      originMunicipality: null,
      originZip: "",
      destinationName: "",
      destinationRegion: null,
      destinationProvince: null,
      destinationMunicipality: null,
      destinationZip: "",
      acceptanceDate: "",
      status: "",
    });
    setErrors({
      transportNumber: "",
      shipper: "",
      originName: "",
      originRegion: "",
      originProvince: "",
      originMunicipality: "",
      originZip: "",
      destinationName: "",
      destinationRegion: "",
      destinationProvince: "",
      destinationMunicipality: "",
      destinationZip: "",
      acceptanceDate: "",
      status: "",
      apiError: "",
    });
  };

  const closeAddModal = () => {
    setIsAddModalOpen(false);
    setStep(1);
    setOrdersData({
      transportNumber: "",
      shipper: "",
      originName: "",
      originRegion: null,
      originProvince: null,
      originMunicipality: null,
      originZip: "",
      destinationName: "",
      destinationRegion: null,
      destinationProvince: null,
      destinationMunicipality: null,
      destinationZip: "",
      acceptanceDate: "",
      status: "",
    });
    setErrors({
      transportNumber: "",
      shipper: "",
      originName: "",
      originRegion: "",
      originProvince: "",
      originMunicipality: "",
      originZip: "",
      destinationName: "",
      destinationRegion: "",
      destinationProvince: "",
      destinationMunicipality: "",
      destinationZip: "",
      acceptanceDate: "",
      status: "",
      apiError: "",
    });
  };

  const handleInputChange = (e, name, value) => {
    if (e && e.target) {
      const { name, value } = e.target;
      setOrdersData((prevData) => ({
        ...prevData,
        [name]: value,
      }));
      setErrors((prevErrors) => ({
        ...prevErrors,
        [name]: "",
      }));
    } else {
      setOrdersData((prevData) => ({
        ...prevData,
        [name]: value,
      }));
      setErrors((prevErrors) => ({
        ...prevErrors,
        [name]: "",
      }));
    }
  };

  const [filteredOrigin, setFilteredOrigin] = useState({
    provinces: [],
    municipalities: [],
  });

  const [filteredDestination, setFilteredDestination] = useState({
    provinces: [],
    municipalities: [],
  });

  const regions = Philippines.regions.map((region) => ({
    value: region.reg_code,
    label: region.name,
  }));

  /** ORIGIN REGION CHANGE */
  useEffect(() => {
    if (ordersData.originRegion) {
      const filteredProvinces =
        Philippines.getProvincesByRegion(ordersData.originRegion.value) || [];

      setFilteredOrigin({
        provinces: filteredProvinces.map((province) => ({
          value: province.prov_code,
          label: province.name,
        })),
        municipalities: [],
      });

      setOrdersData((prev) => ({
        ...prev,
        originProvince:
          prev.originProvince &&
          prev.originProvince.value?.startsWith(ordersData.originRegion.value)
            ? prev.originProvince
            : null,
        originMunicipality: prev.originProvince
          ? prev.originMunicipality
          : null,
      }));
    } else {
      setFilteredOrigin({ provinces: [], municipalities: [] });
    }
  }, [ordersData.originRegion]);

  /** ORIGIN PROVINCE CHANGE */
  useEffect(() => {
    if (ordersData.originProvince) {
      const filteredMunicipalities =
        Philippines.getCityMunByProvince(ordersData.originProvince.value) || [];

      setFilteredOrigin((prev) => ({
        ...prev,
        municipalities: filteredMunicipalities.map((mun) => ({
          value: mun.mun_code,
          label: mun.name,
        })),
      }));

      setOrdersData((prev) => {
        const municipalityExists = filteredMunicipalities.some(
          (m) => String(m.mun_code) === String(prev.originMunicipality?.value)
        );

        return {
          ...prev,
          originMunicipality: municipalityExists
            ? prev.originMunicipality
            : null,
        };
      });
    } else {
      setFilteredOrigin((prev) => ({ ...prev, municipalities: [] }));
    }
  }, [ordersData.originProvince]);

  /** DESTINATION REGION CHANGE */
  useEffect(() => {
    if (ordersData.destinationRegion) {
      const filteredProvinces =
        Philippines.getProvincesByRegion(ordersData.destinationRegion.value) ||
        [];

      setFilteredDestination({
        provinces: filteredProvinces.map((province) => ({
          value: province.prov_code,
          label: province.name,
        })),
        municipalities: [],
      });

      setOrdersData((prev) => ({
        ...prev,
        destinationProvince:
          prev.destinationProvince &&
          prev.destinationProvince.value?.startsWith(
            ordersData.destinationRegion.value
          )
            ? prev.destinationProvince
            : null,
        destinationMunicipality: prev.destinationProvince
          ? prev.destinationMunicipality
          : null,
      }));
    } else {
      setFilteredDestination({ provinces: [], municipalities: [] });
    }
  }, [ordersData.destinationRegion]);

  /** DESTINATION PROVINCE CHANGE */
  useEffect(() => {
    if (ordersData.destinationProvince) {
      const filteredMunicipalities =
        Philippines.getCityMunByProvince(
          ordersData.destinationProvince.value
        ) || [];

      setFilteredDestination((prev) => ({
        ...prev,
        municipalities: filteredMunicipalities.map((mun) => ({
          value: mun.mun_code,
          label: mun.name,
        })),
      }));

      setOrdersData((prev) => {
        const municipalityExists = filteredMunicipalities.some(
          (m) =>
            String(m.mun_code) === String(prev.destinationMunicipality?.value)
        );

        return {
          ...prev,
          destinationMunicipality: municipalityExists
            ? prev.destinationMunicipality
            : null,
        };
      });
    } else {
      setFilteredDestination((prev) => ({ ...prev, municipalities: [] }));
    }
  }, [ordersData.destinationProvince]);

  const validateStep = () => {
    let newErrors = {};
    let hasError = false;

    if (step === 1) {
      if (!ordersData.transportNumber.trim()) {
        newErrors.transportNumber = "Transport number is required.";
        hasError = true;
      }
      if (!ordersData.shipper.trim()) {
        newErrors.shipper = "Shipper is required.";
        hasError = true;
      }
      if (!ordersData.originName.trim()) {
        newErrors.originName = "Origin name is required.";
        hasError = true;
      }
      if (!ordersData.originRegion) {
        newErrors.originRegion = "Region is required.";
        hasError = true;
      }
      if (!ordersData.originProvince) {
        newErrors.originProvince = "Province is required.";
        hasError = true;
      }
      if (!ordersData.originMunicipality) {
        newErrors.originMunicipality = "Municipality is required.";
        hasError = true;
      }
    } else if (step === 2) {
      if (!ordersData.destinationName.trim()) {
        newErrors.destinationName = "Destination name is required.";
        hasError = true;
      }
      if (!ordersData.destinationRegion) {
        newErrors.destinationRegion = "Region is required.";
        hasError = true;
      }
      if (!ordersData.destinationProvince) {
        newErrors.destinationProvince = "Province is required.";
        hasError = true;
      }
      if (!ordersData.destinationMunicipality) {
        newErrors.destinationMunicipality = "Municipality is required.";
        hasError = true;
      }
      if (!ordersData.acceptanceDate) {
        newErrors.acceptanceDate = "Acceptance date is required.";
        hasError = true;
      }
    }
    setErrors(newErrors);
    return !hasError;
  };

  const handleNextStep = () => {
    if (validateStep()) {
      setStep((prev) => prev + 1);
    }
  };

  const handlePrevStep = () => {
    setStep((prev) => prev - 1);
  };

  const handleAddOrder = async (e) => {
    e.preventDefault();

    if (!validateStep()) return;

    try {
      const formData = {
        principal: "Nestle",
        transport_number: ordersData.transportNumber,
        shipper: ordersData.shipper,
        origin_name: ordersData.originName,
        origin_region: ordersData.originRegion.label,
        origin_province: ordersData.originProvince.label,
        origin_city: ordersData.originMunicipality.label,
        origin_zip: ordersData.originZip,
        destination_name: ordersData.destinationName,
        destination_region: ordersData.destinationRegion.label,
        destination_province: ordersData.destinationProvince.label,
        destination_city: ordersData.destinationMunicipality.label,
        destination_zip: ordersData.destinationZip,
        acceptance_date: ordersData.acceptanceDate,
        status: "Pending",
      };

      const response = await axios.post(
        `${API_BASE_URL}/insert-order`,
        formData,
        {
          headers: { "Content-Type": "application/json" },
        }
      );

      if (response.data.success) {
        setOrders((prevOrders) => [
          ...prevOrders,
          {
            transport_number: ordersData.transportNumber,
            shipper: ordersData.shipper,
            origin_name: ordersData.originName,
            origin_region: ordersData.originRegion,
            origin_province: ordersData.originProvince,
            origin_municipality: ordersData.originMunicipality,
            origin_zip: ordersData.originZip,
            destination_name: ordersData.destinationName,
            destination_region: ordersData.destinationRegion,
            destination_province: ordersData.destinationProvince,
            destination_municipality: ordersData.destinationMunicipality,
            destination_zip: ordersData.destinationZip,
            acceptance_date: ordersData.acceptanceDate,
          },
        ]);
        fetchOrders();
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
        transportNumber:
          error.response?.data?.message === "Transport number already exist."
            ? "Transport number already exist."
            : error.response?.data?.message || "Something went wrong.",
      }));
      setStep(1);
    }
  };

  const toggleEditModal = (order = null) => {
    setSelectedOrder(order);
    const selectedOriginRegion = regions.find(
      (r) => r.label.toLowerCase() === order.origin_region?.toLowerCase()
    );

    const filteredOriginProvinces = selectedOriginRegion?.value
      ? Philippines.getProvincesByRegion(selectedOriginRegion.value) || []
      : [];

    const selectedOriginProvince = filteredOriginProvinces.find(
      (p) => p.name.toLowerCase() === order.origin_province?.toLowerCase()
    );

    const filteredOriginMunicipalities = selectedOriginProvince?.prov_code
      ? Philippines.getCityMunByProvince(selectedOriginProvince.prov_code) || []
      : [];

    const selectedOriginMunicipality = filteredOriginMunicipalities.find(
      (m) => m.name.toLowerCase() === order.origin_city?.toLowerCase()
    );
    const selectedDestRegion = regions.find(
      (r) => r.label.toLowerCase() === order.destination_region?.toLowerCase()
    );

    const filteredDestProvinces = selectedDestRegion?.value
      ? Philippines.getProvincesByRegion(selectedDestRegion.value) || []
      : [];

    const selectedDestProvince = filteredDestProvinces.find(
      (p) => p.name.toLowerCase() === order.destination_province?.toLowerCase()
    );

    const filteredDestMunicipalities = selectedDestProvince?.prov_code
      ? Philippines.getCityMunByProvince(selectedDestProvince.prov_code) || []
      : [];

    const selectedDestMunicipality = filteredDestMunicipalities.find(
      (m) => m.name.toLowerCase() === order.destination_city?.toLowerCase()
    );

    setOrdersData((prev) => ({
      ...prev,
      transportNumber: order.transport_number || "",
      shipper: order.shipper || "",
      originName: order.origin_name || "",
      originRegion: selectedOriginRegion || null,
      originProvince: selectedOriginProvince
        ? {
            value: selectedOriginProvince.prov_code,
            label: selectedOriginProvince.name,
          }
        : null,
      originMunicipality: selectedOriginMunicipality
        ? {
            value: selectedOriginMunicipality.mun_code,
            label: selectedOriginMunicipality.name,
          }
        : null,
      originZip: order.origin_zip || "",
      destinationName: order.destination_name || "",
      destinationRegion: selectedDestRegion || null,
      destinationProvince: selectedDestProvince
        ? {
            value: selectedDestProvince.prov_code,
            label: selectedDestProvince.name,
          }
        : null,
      destinationMunicipality: selectedDestMunicipality
        ? {
            value: selectedDestMunicipality.mun_code,
            label: selectedDestMunicipality.name,
          }
        : null,
      destinationZip: order.destination_zip || "",
      acceptanceDate: order.acceptance_date || "",
    }));
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setStep(1);
    setOrdersData({
      transportNumber: "",
      shipper: "",
      originName: "",
      originRegion: "",
      originProvince: "",
      originMunicipality: "",
      originZip: "",
      destinationName: "",
      destinationRegion: "",
      destinationProvince: "",
      destinationMunicipality: "",
      destinationZip: "",
      acceptanceDate: "",
      status: "",
    });
    setErrors({
      transportNumber: "",
      shipper: "",
      originName: "",
      originRegion: "",
      originProvince: "",
      originMunicipality: "",
      originZip: "",
      destinationName: "",
      destinationRegion: "",
      destinationProvince: "",
      destinationMunicipality: "",
      destinationZip: "",
      acceptanceDate: "",
      status: "",
      apiError: "",
    });
  };

  const handleEditOrder = async (e) => {
    e.preventDefault();

    if (!validateStep()) return;

    try {
      const response = await axios.put(
        `${API_BASE_URL}/update-order/${selectedOrder.id}`,
        {
          transport_number: ordersData.transportNumber,
          shipper: ordersData.shipper,
          origin_name: ordersData.originName,
          origin_region: ordersData.originRegion.label,
          origin_province: ordersData.originProvince.label,
          origin_city: ordersData.originMunicipality.label,
          origin_zip: ordersData.originZip,
          destination_name: ordersData.destinationName,
          destination_region: ordersData.destinationRegion.label,
          destination_province: ordersData.destinationProvince.label,
          destination_city: ordersData.destinationMunicipality.label,
          destination_zip: ordersData.destinationZip,
          acceptance_date: ordersData.acceptanceDate,
        }
      );
      if (response.data.success) {
        setOrders((prevOrders) =>
          prevOrders.map((order) =>
            order.id === selectedOrder.id
              ? {
                  transport_number: ordersData.transportNumber,
                  shipper: ordersData.shipper,
                  origin_name: ordersData.originName,
                  origin_region: ordersData.originRegion,
                  origin_province: ordersData.originProvince,
                  origin_municipality: ordersData.originMunicipality,
                  origin_zip: ordersData.originZip,
                  destination_name: ordersData.destinationName,
                  destination_region: ordersData.destinationRegion,
                  destination_province: ordersData.destinationProvince,
                  destination_municipality: ordersData.destinationMunicipality,
                  destination_zip: ordersData.destinationZip,
                  acceptance_date: ordersData.acceptanceDate,
                }
              : order
          )
        );
        fetchOrders();
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
        transportNumber:
          error.response?.data?.message === "Transport number already exist."
            ? "Transport number already exist."
            : error.response?.data?.message || "Something went wrong.",
      }));
      setStep(1);
    }
  };

  const toggleDeleteModal = (order = null) => {
    setSelectedOrder(order);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setSelectedOrder(null);
    setIsDeleteModalOpen(false);
  };

  const handleDeleteOrder = async () => {
    if (!selectedOrder) return;

    try {
      const response = await axios.delete(
        `${API_BASE_URL}/delete-order/${selectedOrder.id}`
      );

      if (response.data.success) {
        setOrders((prevOrders) =>
          prevOrders.filter((order) => order.id !== selectedOrder.id)
        );
        fetchOrders();
        toggleDeleteModal();
      }
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        apiError:
          error.response?.data?.message || "An error occured while deleting.",
      }));
    }
  };
  return (
    <div className={styles["order-content"]}>
      <div className={styles["order-table-body-container"]}>
        <div className={styles["add-order-button-container"]}>
          <button
            className={styles["add-order-button"]}
            onClick={toggleAddModal}
          >
            Add Order
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
                <th className={styles.th}>Transport Number</th>
                <th className={styles.th}>Shipper</th>
                <th className={styles.th}>Origin Name</th>
                <th className={styles.th}>Origin Address</th>
                <th className={styles.th}>Destination Name</th>
                <th className={styles.th}>Destination Address</th>
                <th className={styles.th}>Acceptance Date</th>
                <th className={styles.th}>Status</th>
                <th className={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody className={styles.tbody}>
              {paginatedOrders.map((order, index) => (
                <tr className={styles.btr} key={index}>
                  <td className={styles.td}>{order.transport_number}</td>
                  <td className={styles.td}>{order.shipper}</td>
                  <td className={styles.td}>{order.origin_name}</td>
                  <td className={styles.td}>{order.origin_address}</td>
                  <td className={styles.td}>{order.destination_name}</td>
                  <td className={styles.td}>{order.destination_address}</td>
                  <td className={styles.td}>{order.acceptance_date_words}</td>
                  <td className={styles.td}>{order.status}</td>
                  <td className={styles.td}>
                    <div className={styles["action-container"]}>
                      <button
                        className={styles["edit-button"]}
                        onMouseEnter={() => setIsEditHovered(index)}
                        onMouseLeave={() => setIsEditHovered(null)}
                        onClick={() => toggleEditModal(order)}
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
                        onClick={() => toggleDeleteModal(order)}
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
              {paginatedOrders.length === 0 && (
                <tr className={styles.btr}>
                  <td
                    colSpan="9"
                    className={`${styles.td} ${styles["search-response"]}`}
                  >
                    No orders found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div>
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
      </div>
      {isAddModalOpen && (
        <Modal isOpen={isAddModalOpen} onclose={toggleAddModal}>
          <div
            className={`${styles["modal-container"]} ${styles["add-modal-container"]}`}
          >
            <div className={styles["modal-header-container"]}>
              <h3 className={styles["modal-title"]}>Add Order</h3>
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
              onSubmit={handleAddOrder}
            >
              {step === 1 && (
                <div className={styles["label-input-container"]}>
                  <label className={styles.label} htmlFor="transport_number">
                    Transport Number
                    <input
                      className={`${styles.input} ${
                        errors.port ? styles["error-input"] : ""
                      }`}
                      type="text"
                      id="transport_number"
                      name="transportNumber"
                      value={ordersData.transportNumber}
                      onChange={handleInputChange}
                    />
                    {errors.transportNumber && (
                      <p className={styles["error-message"]}>
                        {errors.transportNumber}
                      </p>
                    )}
                  </label>
                  <label className={styles.label} htmlFor="shipper">
                    Shipper
                    <input
                      className={`${styles.input} ${
                        errors.shipper ? styles["error-input"] : ""
                      }`}
                      type="text"
                      id="shipper"
                      name="shipper"
                      value={ordersData.shipper}
                      onChange={handleInputChange}
                    />
                    {errors.shipper && (
                      <p className={styles["error-message"]}>
                        {errors.shipper}
                      </p>
                    )}
                  </label>
                  <label className={styles.label} htmlFor="origin_name">
                    Origin Name
                    <input
                      className={`${styles.input} ${
                        errors.originName ? styles["error-input"] : ""
                      }`}
                      type="text"
                      id="origin_name"
                      name="originName"
                      value={ordersData.originName}
                      onChange={handleInputChange}
                    />
                    {errors.originName && (
                      <p className={styles["error-message"]}>
                        {errors.originName}
                      </p>
                    )}
                  </label>
                  <label className={styles.label} htmlFor="origin_region">
                    Origin Region
                    <Select
                      className={`${styles.input} ${
                        errors.originRegion ? styles["error-input"] : ""
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
                      options={regions}
                      name="originRegion"
                      id="origin_region"
                      value={ordersData.originRegion}
                      onChange={(selected) =>
                        handleInputChange(null, "originRegion", selected)
                      }
                      placeholder="Select Region"
                    />
                    {errors.originRegion && (
                      <p className={styles["error-message"]}>
                        {errors.originRegion}
                      </p>
                    )}
                  </label>
                  <label className={styles.label} htmlFor="origin_province">
                    Origin Province
                    <Select
                      className={`${styles.input} ${
                        errors.originProvince ? styles["error-input"] : ""
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
                      options={filteredOrigin.provinces}
                      name="originProvince"
                      id="origin_province"
                      value={ordersData.originProvince}
                      onChange={(selected) =>
                        handleInputChange(null, "originProvince", selected)
                      }
                      isDisabled={!ordersData.originRegion}
                      placeholder="Select Province"
                    />
                    {errors.originProvince && (
                      <p className={styles["error-message"]}>
                        {errors.originProvince}
                      </p>
                    )}
                  </label>
                  <label className={styles.label} htmlFor="origin_municipality">
                    Origin City/Municipality
                    <Select
                      className={`${styles.input} ${
                        errors.originMunicipality ? styles["error-input"] : ""
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
                      options={filteredOrigin.municipalities}
                      name="originMunicipality"
                      id="origin_municipality"
                      value={ordersData.originMunicipality}
                      onChange={(selected) => {
                        setOrdersData((prev) => ({
                          ...prev,
                          originMunicipality: selected,
                        }));
                      }}
                      isDisabled={!ordersData.originProvince}
                      placeholder="Select City/Municipality"
                    />
                    {errors.originMunicipality && (
                      <p className={styles["error-message"]}>
                        {errors.originMunicipality}
                      </p>
                    )}
                  </label>
                  <label className={styles.label} htmlFor="origin_zip">
                    Origin ZIP
                    <input
                      className={`${styles.input} ${
                        errors.originName ? styles["error-input"] : ""
                      }`}
                      type="number"
                      id="origin_zip"
                      name="originZip"
                      value={ordersData.originZip}
                      onChange={handleInputChange}
                    />
                    {errors.originZip && (
                      <p className={styles["error-message"]}>
                        {errors.originZip}
                      </p>
                    )}
                  </label>
                </div>
              )}
              {step === 2 && (
                <div className={styles["label-input-container"]}>
                  <label className={styles.label} htmlFor="destination_name">
                    Destination Name
                    <input
                      className={`${styles.input} ${
                        errors.destinationName ? styles["error-input"] : ""
                      }`}
                      type="text"
                      id="destination_name"
                      name="destinationName"
                      value={ordersData.destinationName}
                      onChange={handleInputChange}
                    />
                    {errors.destinationName && (
                      <p className={styles["error-message"]}>
                        {errors.destinationName}
                      </p>
                    )}
                  </label>
                  <label className={styles.label} htmlFor="destination_region">
                    Destination Region
                    <Select
                      className={`${styles.input} ${
                        errors.destinationRegion ? styles["error-input"] : ""
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
                      options={regions}
                      name="destinationRegion"
                      id="destination_region"
                      value={ordersData.destinationRegion}
                      onChange={(selected) =>
                        handleInputChange(null, "destinationRegion", selected)
                      }
                      placeholder="Select Region"
                    />
                    {errors.destinationRegion && (
                      <p className={styles["error-message"]}>
                        {errors.destinationRegion}
                      </p>
                    )}
                  </label>
                  <label
                    className={styles.label}
                    htmlFor="destination_province"
                  >
                    Destination Province
                    <Select
                      className={`${styles.input} ${
                        errors.destinationProvince ? styles["error-input"] : ""
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
                      options={filteredDestination.provinces}
                      name="destinationProvince"
                      id="destination_province"
                      value={ordersData.destinationProvince}
                      onChange={(selected) =>
                        handleInputChange(null, "destinationProvince", selected)
                      }
                      isDisabled={!ordersData.destinationRegion}
                      placeholder="Select Province"
                    />
                    {errors.destinationProvince && (
                      <p className={styles["error-message"]}>
                        {errors.destinationProvince}
                      </p>
                    )}
                  </label>
                  <label
                    className={styles.label}
                    htmlFor="destination_municipality"
                  >
                    Destination City/Municipality
                    <Select
                      className={`${styles.input} ${
                        errors.destinationMunicipality
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
                      options={filteredDestination.municipalities}
                      name="destinationMunicipality"
                      id="destination_municipality"
                      value={ordersData.destinationMunicipality}
                      onChange={(selected) => {
                        setOrdersData((prev) => ({
                          ...prev,
                          destinationMunicipality: selected,
                        }));
                      }}
                      isDisabled={!ordersData.destinationProvince}
                      placeholder="Select City/Municipality"
                    />
                    {errors.destinationMunicipality && (
                      <p className={styles["error-message"]}>
                        {errors.destinationMunicipality}
                      </p>
                    )}
                  </label>
                  <label className={styles.label} htmlFor="destination_zip">
                    Destination ZIP
                    <input
                      className={`${styles.input} ${
                        errors.destinationName ? styles["error-input"] : ""
                      }`}
                      type="number"
                      id="destination_zip"
                      name="destinationZip"
                      value={ordersData.destinationZip}
                      onChange={handleInputChange}
                    />
                    {errors.destinationZip && (
                      <p className={styles["error-message"]}>
                        {errors.destinationZip}
                      </p>
                    )}
                  </label>
                  <label className={styles.label} htmlFor="acceptance_date">
                    Acceptance Date
                    <input
                      className={`${styles.input} ${
                        errors.acceptanceDate ? styles["error-input"] : ""
                      }`}
                      type="datetime-local"
                      id="acceptance_date"
                      name="acceptanceDate"
                      value={ordersData.acceptanceDate}
                      onChange={handleInputChange}
                    />
                    {errors.acceptanceDate && (
                      <p className={styles["error-message"]}>
                        {errors.acceptanceDate}
                      </p>
                    )}
                  </label>
                </div>
              )}
              <div className={styles["add-modal-button-container"]}>
                {step > 1 && (
                  <div className={styles["prev-button-container"]}>
                    <button
                      className={styles["prev-button"]}
                      type="button"
                      onClick={handlePrevStep}
                    >
                      Previous
                    </button>
                  </div>
                )}
                {step < 2 && (
                  <div className={styles["next-button-container"]}>
                    <button
                      className={styles["next-button"]}
                      type="button"
                      onClick={handleNextStep}
                    >
                      Next
                    </button>
                  </div>
                )}
                {step === 2 && (
                  <div className={styles["submit-button-container"]}>
                    <button className={styles["submit-button"]} type="submit">
                      Submit
                    </button>
                  </div>
                )}
              </div>
            </form>
          </div>
        </Modal>
      )}
      {isEditModalOpen && selectedOrder && (
        <Modal
          isOpen={isEditModalOpen}
          onclose={() => setIsEditModalOpen(false)}
        >
          <div
            className={`${styles["modal-container"]} ${styles["add-modal-container"]}`}
          >
            <div className={styles["modal-header-container"]}>
              <h3 className={styles["modal-title"]}>Add Order</h3>
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
              onSubmit={handleEditOrder}
            >
              {step === 1 && (
                <div className={styles["label-input-container"]}>
                  <label className={styles.label} htmlFor="transport_number">
                    Transport Number
                    <input
                      className={`${styles.input} ${
                        errors.port ? styles["error-input"] : ""
                      }`}
                      type="text"
                      id="transport_number"
                      name="transportNumber"
                      value={ordersData.transportNumber}
                      onChange={handleInputChange}
                    />
                    {errors.transportNumber && (
                      <p className={styles["error-message"]}>
                        {errors.transportNumber}
                      </p>
                    )}
                  </label>
                  <label className={styles.label} htmlFor="shipper">
                    Shipper
                    <input
                      className={`${styles.input} ${
                        errors.shipper ? styles["error-input"] : ""
                      }`}
                      type="text"
                      id="shipper"
                      name="shipper"
                      value={ordersData.shipper}
                      onChange={handleInputChange}
                    />
                    {errors.shipper && (
                      <p className={styles["error-message"]}>
                        {errors.shipper}
                      </p>
                    )}
                  </label>
                  <label className={styles.label} htmlFor="origin_name">
                    Origin Name
                    <input
                      className={`${styles.input} ${
                        errors.originName ? styles["error-input"] : ""
                      }`}
                      type="text"
                      id="origin_name"
                      name="originName"
                      value={ordersData.originName}
                      onChange={handleInputChange}
                    />
                    {errors.originName && (
                      <p className={styles["error-message"]}>
                        {errors.originName}
                      </p>
                    )}
                  </label>
                  <label className={styles.label} htmlFor="origin_region">
                    Origin Region
                    <Select
                      className={`${styles.input} ${
                        errors.originRegion ? styles["error-input"] : ""
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
                      options={regions}
                      name="originRegion"
                      id="origin_region"
                      value={ordersData.originRegion}
                      onChange={(selected) => {
                        handleInputChange(null, "originRegion", selected);
                        setOrdersData((prev) => ({
                          ...prev,
                          originProvince: prev.originProvince?.value.startsWith(
                            selected?.value
                          )
                            ? prev.originProvince
                            : null,
                          originMunicipality:
                            prev.originMunicipality?.value.startsWith(
                              selected?.value
                            )
                              ? prev.originMunicipality
                              : null,
                        }));
                      }}
                      placeholder="Select Region"
                    />
                    {errors.originRegion && (
                      <p className={styles["error-message"]}>
                        {errors.originRegion}
                      </p>
                    )}
                  </label>
                  <label className={styles.label} htmlFor="origin_province">
                    Origin Province
                    <Select
                      className={`${styles.input} ${
                        errors.originProvince ? styles["error-input"] : ""
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
                      options={filteredOrigin.provinces}
                      name="originProvince"
                      id="origin_province"
                      value={ordersData.originProvince}
                      onChange={(selected) => {
                        setOrdersData((prev) => ({
                          ...prev,
                          originProvince: selected,
                          originMunicipality:
                            prev.originMunicipality?.value.startsWith(
                              selected?.value
                            )
                              ? prev.originMunicipality
                              : null,
                        }));
                      }}
                      isDisabled={!ordersData.originRegion}
                      placeholder="Select Province"
                    />
                    {errors.originProvince && (
                      <p className={styles["error-message"]}>
                        {errors.originProvince}
                      </p>
                    )}
                  </label>
                  <label className={styles.label} htmlFor="origin_municipality">
                    Origin City/Municipality
                    <Select
                      className={`${styles.input} ${
                        errors.originMunicipality ? styles["error-input"] : ""
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
                      options={filteredOrigin.municipalities}
                      name="originMunicipality"
                      id="origin_municipality"
                      value={ordersData.originMunicipality}
                      onChange={(selected) => {
                        setOrdersData((prev) => ({
                          ...prev,
                          originMunicipality: selected,
                        }));
                      }}
                      isDisabled={!ordersData.originProvince}
                      placeholder="Select City/Municipality"
                    />
                    {errors.originMunicipality && (
                      <p className={styles["error-message"]}>
                        {errors.originMunicipality}
                      </p>
                    )}
                  </label>
                  <label className={styles.label} htmlFor="origin_zip">
                    Origin ZIP
                    <input
                      className={`${styles.input} ${
                        errors.originName ? styles["error-input"] : ""
                      }`}
                      type="number"
                      id="origin_zip"
                      name="originZip"
                      value={ordersData.originZip}
                      onChange={handleInputChange}
                    />
                    {errors.originZip && (
                      <p className={styles["error-message"]}>
                        {errors.originZip}
                      </p>
                    )}
                  </label>
                </div>
              )}
              {step === 2 && (
                <div className={styles["label-input-container"]}>
                  <label className={styles.label} htmlFor="destination_name">
                    Destination Name
                    <input
                      className={`${styles.input} ${
                        errors.destinationName ? styles["error-input"] : ""
                      }`}
                      type="text"
                      id="destination_name"
                      name="destinationName"
                      value={ordersData.destinationName}
                      onChange={handleInputChange}
                    />
                    {errors.destinationName && (
                      <p className={styles["error-message"]}>
                        {errors.destinationName}
                      </p>
                    )}
                  </label>
                  <label className={styles.label} htmlFor="destination_region">
                    Destination Region
                    <Select
                      className={`${styles.input} ${
                        errors.destinationRegion ? styles["error-input"] : ""
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
                      options={regions}
                      name="destinationRegion"
                      id="destination_region"
                      value={ordersData.destinationRegion}
                      onChange={(selected) => {
                        handleInputChange(null, "destinationRegion", selected);
                        setOrdersData((prev) => ({
                          ...prev,
                          destinationProvince:
                            prev.destinationProvince?.value.startsWith(
                              selected?.value
                            )
                              ? prev.destinationProvince
                              : null,
                          destinationMunicipality:
                            prev.destinationMunicipality?.value.startsWith(
                              selected?.value
                            )
                              ? prev.destinationMunicipality
                              : null,
                        }));
                      }}
                      placeholder="Select Region"
                    />
                    {errors.destinationRegion && (
                      <p className={styles["error-message"]}>
                        {errors.destinationRegion}
                      </p>
                    )}
                  </label>
                  <label
                    className={styles.label}
                    htmlFor="destination_province"
                  >
                    Destination Province
                    <Select
                      className={`${styles.input} ${
                        errors.destinationProvince ? styles["error-input"] : ""
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
                      options={filteredDestination.provinces}
                      name="destinationProvince"
                      id="destination_province"
                      value={ordersData.destinationProvince}
                      onChange={(selected) => {
                        setOrdersData((prev) => ({
                          ...prev,
                          destinationProvince: selected,
                          destinationMunicipality:
                            prev.destinationMunicipality?.value.startsWith(
                              selected?.value
                            )
                              ? prev.destinationMunicipality
                              : null,
                        }));
                      }}
                      isDisabled={!ordersData.destinationRegion}
                      placeholder="Select Province"
                    />
                    {errors.destinationProvince && (
                      <p className={styles["error-message"]}>
                        {errors.destinationProvince}
                      </p>
                    )}
                  </label>
                  <label
                    className={styles.label}
                    htmlFor="destination_municipality"
                  >
                    Destination City/Municipality
                    <Select
                      className={`${styles.input} ${
                        errors.destinationMunicipality
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
                      options={filteredDestination.municipalities}
                      name="destinationMunicipality"
                      id="destination_municipality"
                      value={ordersData.destinationMunicipality}
                      onChange={(selected) => {
                        setOrdersData((prev) => ({
                          ...prev,
                          destinationMunicipality: selected,
                        }));
                      }}
                      isDisabled={!ordersData.destinationProvince}
                      placeholder="Select City/Municipality"
                    />
                    {errors.destinationMunicipality && (
                      <p className={styles["error-message"]}>
                        {errors.destinationMunicipality}
                      </p>
                    )}
                  </label>
                  <label className={styles.label} htmlFor="destination_zip">
                    Destination ZIP
                    <input
                      className={`${styles.input} ${
                        errors.destinationName ? styles["error-input"] : ""
                      }`}
                      type="number"
                      id="destination_zip"
                      name="destinationZip"
                      value={ordersData.destinationZip}
                      onChange={handleInputChange}
                    />
                    {errors.destinationZip && (
                      <p className={styles["error-message"]}>
                        {errors.destinationZip}
                      </p>
                    )}
                  </label>
                  <label className={styles.label} htmlFor="acceptance_date">
                    Acceptance Date
                    <input
                      className={`${styles.input} ${
                        errors.acceptanceDate ? styles["error-input"] : ""
                      }`}
                      type="datetime-local"
                      id="acceptance_date"
                      name="acceptanceDate"
                      value={ordersData.acceptanceDate}
                      onChange={handleInputChange}
                    />
                    {errors.acceptanceDate && (
                      <p className={styles["error-message"]}>
                        {errors.acceptanceDate}
                      </p>
                    )}
                  </label>
                </div>
              )}
              <div className={styles["add-modal-button-container"]}>
                {step > 1 && (
                  <div className={styles["prev-button-container"]}>
                    <button
                      className={styles["prev-button"]}
                      type="button"
                      onClick={handlePrevStep}
                    >
                      Previous
                    </button>
                  </div>
                )}
                {step < 2 && (
                  <div className={styles["next-button-container"]}>
                    <button
                      className={styles["next-button"]}
                      type="button"
                      onClick={handleNextStep}
                    >
                      Next
                    </button>
                  </div>
                )}
                {step === 2 && (
                  <div className={styles["submit-button-container"]}>
                    <button className={styles["submit-button"]} type="submit">
                      Submit
                    </button>
                  </div>
                )}
              </div>
            </form>
          </div>
        </Modal>
      )}
      {isDeleteModalOpen && selectedOrder && (
        <Modal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
        >
          <div
            className={`${styles["modal-container"]} ${styles["delete-modal-container"]}`}
          >
            <h1 className={styles["delete-modal-header"]}>
              Are you sure to delete this order?
            </h1>
            <div className={styles["delete-modal-button-container"]}>
              <button
                className={styles["delete-modal-button"]}
                onClick={handleDeleteOrder}
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

export default NestleOrders;
