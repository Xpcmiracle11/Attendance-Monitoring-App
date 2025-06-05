import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import Modal from "../../Modal";
import Select from "react-select";
import styles from "../../../assets/styles/HRTrucks.module.css";
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
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

const HRTrucks = () => {
  const [trucks, setTrucks] = useState([]);
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
  const [isRegrationModalOpen, setIsRegistrationModalOpen] = useState(false);
  const [selectedTruck, setSelectedTruck] = useState(null);
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
  const [trucksData, setTrucksData] = useState({
    renewalMonth: "",
    plateNumber: "",
    truckType: "",
    truckBrand: "",
    bodyType: "",
    engineNumber: "",
    chasisNumber: "",
    classification: "",
    MvFileNumber: "",
    crNumber: "",
    grossWeight: "",
    yearModel: "",
    color: "",
    registeredOwner: "",
    amountPaid: "",
    registrationDate: "",
  });
  const [errors, setErrors] = useState({
    renewalMonth: "",
    plateNumber: "",
    truckType: "",
    truckBrand: "",
    bodyType: "",
    engineNumber: "",
    chasisNumber: "",
    classification: "",
    MvFileNumber: "",
    crNumber: "",
    grossWeight: "",
    yearModel: "",
    color: "",
    registeredOwner: "",
    amountPaid: "",
    registrationDate: "",
    apiError: "",
  });

  const isDarkMode =
    document.documentElement.getAttribute("data-theme") === "dark";

  const fetchTrucks = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/trucks`);
      if (response.data.success) {
        setTrucks(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching trucks:", error);
    }
  };
  useEffect(() => {
    fetchTrucks();
  }, []);

  const filteredTrucks = trucks
    .filter((truck) => {
      const truckPlate = (truck.plate_number || "").toLowerCase();
      const matchesSearch = truckPlate.includes(search.toLowerCase());

      const truckDate = truck.created_at
        ? new Date(truck.created_at.split("T")[0])
        : new Date();
      const iswithinDateRange =
        (!appliedFromDate || truckDate >= new Date(appliedFromDate)) &&
        (!appliedToDate || truckDate <= new Date(appliedToDate));

      return matchesSearch && iswithinDateRange;
    })
    .sort((a, b) => {
      if (sortOrder === "date-asc")
        return new Date(a.created_at) - new Date(b.created_at);
      if (sortOrder === "date-desc")
        return new Date(b.created_at) - new Date(a.created_at);
      if (sortOrder === "plate_number-asc")
        return a.plate_number.localeCompare(b.plate_number);
      if (sortOrder === "plate_number-desc")
        return b.plate_number.localeCompare(a.plate_number);
      return 0;
    });

  const totalPages = Math.ceil(filteredTrucks.length / itemsPerPage);
  const paginatedTrucks = filteredTrucks.slice(
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
    "Truck Brand",
    "Body Type",
    "Engine No.",
    "Chasis No.",
    "Classification",
    "MV File No.",
    "CR No.",
    "Gross Weight",
    "Year Model",
    "Color",
    "Registered Owner",
    "Status",
    "Created At",
  ];

  const exportToExcel = (data) => {
    const formattedData = data.map((item, index) => ({
      ID: index + 1,
      "Truck Brand": item.truck_brand || "",
      "Body Type": item.body_type || "",
      "Engine No.": item.engine_number || "",
      "Chasis No.": item.chasis_number || "",
      Classification: item.classification || "",
      "MV File No.": item.mv_file_number || "",
      "CR No.": item.cr_number || "",
      "Gross Weight": item.gross_weight || "",
      "Year Model": item.year_model || "",
      Color: item.color || "",
      "Registered Owner": item.registered_owner || "",
      Status: item.status || "",
      "Created At": formatDate(item.created_at),
    }));

    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Trucks");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
    });

    saveAs(blob, "trucks.xlsx");
  };

  const exportToPDF = (data) => {
    const doc = new jsPDF("landscape");

    doc.text("Trucks Report", 14, 10);

    const tableRows = data.map((truck, index) => [
      index + 1,
      truck.truck_brand || "",
      truck.body_type || "",
      truck.engine_number || "",
      truck.chasis_number || "",
      truck.classification || "",
      truck.mv_file_number || "",
      truck.cr_number || "",
      truck.gross_weight || "",
      truck.year_model || "",
      truck.color || "",
      truck.registered_owner || "",
      truck.status || "",
      formatDate(truck.created_at) || "",
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 20,
    });

    doc.save("trucks.pdf");
  };

  const exportToWord = (data) => {
    const columnKeyMap = {
      ID: "id",
      "Truck Brand": "truck_brand",
      "Body Type": "body_type",
      "Engine No.": "engine_number",
      "Chasis No.": "chasis_number",
      Classification: "classification",
      "MV File No.": "mv_file_number",
      "CR No.": "cr_number",
      "Gross Weight": "gross_weight",
      "Year Model": "year_model",
      Color: "color",
      "Registered Owner": "registered_owner",
      Status: "status",
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
          properties: {
            page: {
              size: {
                width: 16838,
                height: 11906,
              },
            },
          },
          children: [
            new Paragraph("Exported Data"),
            new Table({ rows: tableRows }),
          ],
        },
      ],
    });

    Packer.toBlob(doc).then((blob) => {
      saveAs(blob, "trucks.docx");
    });
  };

  const handleExport = () => {
    if (!exportFileType) {
      setExportError("Please select an export format.");
      return;
    }

    const filteredData = trucks.filter((truck) => {
      const truckDate = truck.created_at
        ? new Date(truck.created_at.split("T")[0])
        : new Date();
      return (
        (!exportFromDate || truckDate >= new Date(exportFromDate)) &&
        (!exportToDate || truckDate <= new Date(exportToDate))
      );
    });

    if (filteredData.length === 0) {
      setExportError(
        "No data available found within the specified date range."
      );
      return;
    }

    if (exportFileType === "excel") {
      exportToExcel(filteredData);
    } else if (exportFileType === "pdf") {
      exportToPDF(filteredData);
    } else if (exportFileType === "word") {
      exportToWord(filteredData);
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
      renewalMonth: "",
      plateNumber: "",
      truckType: "",
      truckBrand: "",
      bodyType: "",
      engineNumber: "",
      chasisNumber: "",
      classification: "",
      MvFileNumber: "",
      crNumber: "",
      grossWeight: "",
      yearModel: "",
      color: "",
      registeredOwner: "",
      apiError: "",
    });
  };
  const closeAddModal = () => {
    setIsAddModalOpen(false);
    setTrucksData({
      renewalMonth: "",
      plateNumber: "",
      truckType: "",
      truckBrand: "",
      bodyType: "",
      engineNumber: "",
      chasisNumber: "",
      classification: "",
      MvFileNumber: "",
      crNumber: "",
      grossWeight: "",
      yearModel: "",
      color: "",
      registeredOwner: "",
    });
    setErrors({
      renewalMonth: "",
      plateNumber: "",
      truckType: "",
      truckBrand: "",
      bodyType: "",
      engineNumber: "",
      chasisNumber: "",
      classification: "",
      MvFileNumber: "",
      crNumber: "",
      grossWeight: "",
      yearModel: "",
      color: "",
      registeredOwner: "",
      apiError: "",
    });
  };

  const monthOptions = [
    { value: "January", label: "January" },
    { value: "February", label: "February" },
    { value: "March", label: "March" },
    { value: "April", label: "April" },
    { value: "May", label: "May" },
    { value: "June", label: "June" },
    { value: "July", label: "July" },
    { value: "August", label: "August" },
    { value: "September", label: "September" },
    { value: "October", label: "October" },
    { value: "November", label: "November" },
    { value: "December", label: "December" },
  ];

  const truckTypeOptions = [
    { value: "10W", label: "10W" },
    { value: "12W", label: "12W" },
    { value: "40FT", label: "40FT" },
    { value: "4W", label: "4W" },
    { value: "6W Fighter", label: "6W Fighter" },
    { value: "6WC", label: "6WC" },
    { value: "6WF", label: "6WF" },
    { value: "8W", label: "8W" },
    { value: "ELF", label: "ELF" },
    { value: "L300 Van", label: "L300 Van" },
    { value: "Trailer Heavy", label: "Trailer Heavy" },
  ];

  const truckBrandOptions = [
    { value: "FUSO", label: "FUSO" },
    { value: "HINO", label: "HINO" },
    { value: "IZUSU", label: "IZUSU" },
    { value: "MITSUBISHI", label: "MITSUBISHI" },
    { value: "REBUILT", label: "REBUILT" },
  ];

  const bodyTypeOptions = [
    { value: "10W GULLWING VAN", label: "10W GULLWING VAN" },
    { value: "10 CARGO VAN", label: "10 CARGO VAN" },
    { value: "10W WING VAN", label: "10W GULL WIN" },
    { value: "ALUMINUM VAN", label: "ALUMINUM VAN" },
    { value: "ALUMINUM WING VAN TRUCK", label: "ALUMINUM WING VAN TRUCK" },
    { value: "GULL WING VAN", label: "GULL WING VAN" },
    { value: "REEFER VAN TRUCK", label: "REEFER VAN TRUCK" },
    { value: "WING VAN", label: "REEFER VAN TRUCK" },
    { value: "WING VAN TRUCK", label: "WING VAN TRUCK" },
  ];

  const classificationOptions = [
    {
      value: "NOT FOR HIRE / GREEN PLATE",
      label: "NOT FOR HIRE / GREEN PLATE",
    },
    { value: "FOR HIRE / YELLOW PLATE", label: "FOR HIRE / YELLOW PLATE" },
  ];

  const currentYear = new Date().getFullYear();
  const yearOptions = [];

  for (let year = 1980; year <= currentYear; year++) {
    yearOptions.push({ value: year, label: year.toString() });
  }

  const handleInputChange = (e, name, value) => {
    if (e && e.target) {
      const { name, value } = e.target;
      setTrucksData((prevData) => ({
        ...prevData,
        [name]: value,
      }));
      setErrors((prevErrors) => ({
        ...prevErrors,
        [name]: "",
      }));
    } else {
      setTrucksData((prevData) => ({
        ...prevData,
        [name]: value,
      }));
      setErrors((prevErrors) => ({
        ...prevErrors,
        [name]: "",
      }));
    }
  };
  const handleAddTruck = async (e) => {
    e.preventDefault();
    setErrors({
      renewalMonth: "",
      plateNumber: "",
      truckType: "",
      truckBrand: "",
      bodyType: "",
      engineNumber: "",
      chasisNumber: "",
      classification: "",
      MvFileNumber: "",
      crNumber: "",
      grossWeight: "",
      yearModel: "",
      color: "",
      registeredOwner: "",
      apiError: "",
    });

    let hasError = false;

    if (!trucksData.plateNumber.trim()) {
      setErrors((prev) => ({
        ...prev,
        plateNumber: "Plate Number is required.",
      }));
      hasError = true;
    }

    if (!trucksData.renewalMonth.trim()) {
      setErrors((prev) => ({
        ...prev,
        renewalMonth: "Renewal month is required.",
      }));
      hasError = true;
    }

    if (!trucksData.truckType.trim()) {
      setErrors((prev) => ({
        ...prev,
        truckType: "Truck type is required.",
      }));
      hasError = true;
    }

    if (!trucksData.truckBrand.trim()) {
      setErrors((prev) => ({
        ...prev,
        truckBrand: "Truck brand is required.",
      }));
      hasError = true;
    }

    if (!trucksData.bodyType.trim()) {
      setErrors((prev) => ({
        ...prev,
        bodyType: "Body type is required.",
      }));
      hasError = true;
    }

    if (!trucksData.engineNumber.trim()) {
      setErrors((prev) => ({
        ...prev,
        engineNumber: "Engine number is required.",
      }));
      hasError = true;
    }

    if (!trucksData.chasisNumber.trim()) {
      setErrors((prev) => ({
        ...prev,
        chasisNumber: "Chasis Number is required.",
      }));
      hasError = true;
    }

    if (!trucksData.classification.trim()) {
      setErrors((prev) => ({
        ...prev,
        classification: "Classification is required.",
      }));
      hasError = true;
    }

    if (!trucksData.MvFileNumber.trim()) {
      setErrors((prev) => ({
        ...prev,
        MvFileNumber: "MV file number is required.",
      }));
      hasError = true;
    }

    if (!trucksData.crNumber.trim()) {
      setErrors((prev) => ({
        ...prev,
        crNumber: "CR Number is required.",
      }));
      hasError = true;
    }

    if (!trucksData.grossWeight.trim()) {
      setErrors((prev) => ({
        ...prev,
        grossWeight: "Gross weight is required.",
      }));
      hasError = true;
    }

    if (!trucksData.yearModel) {
      setErrors((prev) => ({
        ...prev,
        yearModel: "Year model is required.",
      }));
      hasError = true;
    }

    if (!trucksData.color.trim()) {
      setErrors((prev) => ({
        ...prev,
        color: "Plate Number is required.",
      }));
      hasError = true;
    }

    if (!trucksData.registeredOwner.trim()) {
      setErrors((prev) => ({
        ...prev,
        registeredOwner: "Plate Number is required.",
      }));
      hasError = true;
    }

    if (hasError) return;

    try {
      const response = await axios.post(`${API_BASE_URL}/insert-truck`, {
        plate_number: trucksData.plateNumber,
        renewal_month: trucksData.renewalMonth,
        truck_type: trucksData.truckType,
        truck_brand: trucksData.truckBrand,
        body_type: trucksData.bodyType,
        engine_number: trucksData.engineNumber,
        chasis_number: trucksData.chasisNumber,
        classification: trucksData.classification,
        mv_file_number: trucksData.MvFileNumber,
        cr_number: trucksData.crNumber,
        gross_weight: trucksData.grossWeight,
        year_model: trucksData.yearModel,
        color: trucksData.color,
        registered_owner: trucksData.registeredOwner,
      });
      if (response.data.success) {
        setTrucks((prevTrucks) => [
          ...prevTrucks,
          {
            plate_number: trucksData.plateNumber,
            renewal_month: trucksData.renewalMonth,
            truck_type: trucksData.truckType,
            truck_brand: trucksData.truckBrand,
            body_type: trucksData.bodyType,
            engine_number: trucksData.engineNumber,
            chasis_number: trucksData.chasisNumber,
            classification: trucksData.classification,
            mv_file_number: trucksData.MvFileNumber,
            cr_number: trucksData.crNumber,
            gross_weight: trucksData.grossWeight,
            year_model: trucksData.yearModel,
            color: trucksData.color,
            registered_owner: trucksData.registeredOwner,
          },
        ]);
        fetchTrucks();
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
        apiError:
          error.response?.data?.message === "Truck already exists."
            ? "Truck already exists."
            : error.response?.data?.message || "Something went wrong.",
      }));
    }
  };

  const toggleEditModal = (truck = null) => {
    setSelectedTruck(truck);
    setTrucksData({
      renewalMonth: truck?.renewal_month || "",
      plateNumber: truck?.plate_number || "",
      truckType: truck?.truck_type || "",
      truckBrand: truck?.truck_brand || "",
      bodyType: truck?.body_type || "",
      engineNumber: truck?.engine_number || "",
      chasisNumber: truck?.chasis_number || "",
      classification: truck?.classification || "",
      MvFileNumber: truck?.mv_file_number || "",
      crNumber: truck?.cr_number || "",
      grossWeight: truck?.gross_weight || "",
      yearModel: truck?.year_model || "",
      color: truck?.color || "",
      registeredOwner: truck?.registered_owner || "",
    });
    setIsEditModalOpen(true);
    setErrors({
      renewalMonth: "",
      plateNumber: "",
      truckType: "",
      truckBrand: "",
      bodyType: "",
      engineNumber: "",
      chasisNumber: "",
      classification: "",
      MvFileNumber: "",
      crNumber: "",
      grossWeight: "",
      yearModel: "",
      color: "",
      registeredOwner: "",
      apiError: "",
    });
  };
  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedTruck(null);
    setTrucksData({
      renewalMonth: "",
      plateNumber: "",
      truckType: "",
      truckBrand: "",
      bodyType: "",
      engineNumber: "",
      chasisNumber: "",
      classification: "",
      MvFileNumber: "",
      crNumber: "",
      grossWeight: "",
      yearModel: "",
      color: "",
      registeredOwner: "",
    });
    setErrors({
      renewalMonth: "",
      plateNumber: "",
      truckType: "",
      truckBrand: "",
      bodyType: "",
      engineNumber: "",
      chasisNumber: "",
      classification: "",
      MvFileNumber: "",
      crNumber: "",
      grossWeight: "",
      yearModel: "",
      color: "",
      registeredOwner: "",
      apiError: "",
    });
  };

  const handleEditTruck = async (e) => {
    e.preventDefault();

    setErrors({
      renewalMonth: "",
      plateNumber: "",
      truckType: "",
      truckBrand: "",
      bodyType: "",
      engineNumber: "",
      chasisNumber: "",
      classification: "",
      MvFileNumber: "",
      crNumber: "",
      grossWeight: "",
      yearModel: "",
      color: "",
      registeredOwner: "",
      apiError: "",
    });

    if (!selectedTruck || !selectedTruck.id) {
      setErrors((prev) => ({
        ...prev,
        apiError: "Invalid truck selected.",
      }));
      return;
    }

    let hasError = false;

    if (!trucksData.plateNumber.trim()) {
      setErrors((prev) => ({
        ...prev,
        plateNumber: "Plate Number is required.",
      }));
      hasError = true;
    }

    if (!trucksData.renewalMonth.trim()) {
      setErrors((prev) => ({
        ...prev,
        renewalMonth: "Renewal month is required.",
      }));
      hasError = true;
    }

    if (!trucksData.truckType.trim()) {
      setErrors((prev) => ({
        ...prev,
        truckType: "Truck type is required.",
      }));
      hasError = true;
    }

    if (!trucksData.truckBrand.trim()) {
      setErrors((prev) => ({
        ...prev,
        truckBrand: "Truck brand is required.",
      }));
      hasError = true;
    }

    if (!trucksData.bodyType.trim()) {
      setErrors((prev) => ({
        ...prev,
        bodyType: "Body type is required.",
      }));
      hasError = true;
    }

    if (!trucksData.engineNumber.trim()) {
      setErrors((prev) => ({
        ...prev,
        engineNumber: "Engine number is required.",
      }));
      hasError = true;
    }

    if (!trucksData.chasisNumber.trim()) {
      setErrors((prev) => ({
        ...prev,
        chasisNumber: "Chasis Number is required.",
      }));
      hasError = true;
    }

    if (!trucksData.classification.trim()) {
      setErrors((prev) => ({
        ...prev,
        classification: "Classification is required.",
      }));
      hasError = true;
    }

    if (!trucksData.MvFileNumber.trim()) {
      setErrors((prev) => ({
        ...prev,
        MvFileNumber: "MV file number is required.",
      }));
      hasError = true;
    }

    if (!trucksData.crNumber.trim()) {
      setErrors((prev) => ({
        ...prev,
        crNumber: "CR Number is required.",
      }));
      hasError = true;
    }

    if (!trucksData.grossWeight.trim()) {
      setErrors((prev) => ({
        ...prev,
        grossWeight: "Gross weight is required.",
      }));
      hasError = true;
    }

    if (!trucksData.yearModel) {
      setErrors((prev) => ({
        ...prev,
        yearModel: "Year model is required.",
      }));
      hasError = true;
    }

    if (!trucksData.color.trim()) {
      setErrors((prev) => ({
        ...prev,
        color: "Plate Number is required.",
      }));
      hasError = true;
    }

    if (!trucksData.registeredOwner.trim()) {
      setErrors((prev) => ({
        ...prev,
        registeredOwner: "Plate Number is required.",
      }));
      hasError = true;
    }

    if (hasError) return;

    try {
      const response = await axios.put(
        `${API_BASE_URL}/update-truck/${selectedTruck.id}`,
        {
          renewal_month: trucksData.renewalMonth,
          plate_number: trucksData.plateNumber,
          truck_type: trucksData.truckType,
          truck_brand: trucksData.truckBrand,
          body_type: trucksData.bodyType,
          engine_number: trucksData.engineNumber,
          chasis_number: trucksData.chasisNumber,
          classification: trucksData.classification,
          mv_file_number: trucksData.MvFileNumber,
          cr_number: trucksData.crNumber,
          gross_weight: trucksData.grossWeight,
          year_model: trucksData.yearModel,
          color: trucksData.color,
          registered_owner: trucksData.registeredOwner,
        }
      );
      if (response.data.success) {
        setTrucks((prevTrucks) =>
          prevTrucks.map((truck) =>
            truck.id === selectedTruck.id
              ? {
                  ...truck,
                  renewal_month: trucksData.renewalMonth,
                  plate_number: trucksData.plateNumber,
                  truck_type: trucksData.truckType,
                  truck_brand: trucksData.truckBrand,
                  body_type: trucksData.bodyType,
                  engine_number: trucksData.engineNumber,
                  chasis_number: trucksData.chasisNumber,
                  classification: trucksData.classification,
                  mv_file_number: trucksData.MvFileNumber,
                  cr_number: trucksData.crNumber,
                  gross_weight: trucksData.grossWeight,
                  year_model: trucksData.yearModel,
                  color: trucksData.color,
                  registered_owner: trucksData.registeredOwner,
                }
              : truck
          )
        );
        fetchTrucks();
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
          error.response?.data?.message === "Truck already exists."
            ? "Truck already exists."
            : error.response?.data?.message || "Something went wrong.",
      }));
    }
  };

  const toggleDeleteModal = (truck = null) => {
    setSelectedTruck(truck);
    setIsDeleteModalOpen(!isDeleteModalOpen);
  };

  const closeDeleteModal = () => {
    setSelectedTruck(null);
    setIsDeleteModalOpen(false);
  };

  const handleDeleteTruck = async () => {
    if (!selectedTruck) return;

    try {
      const response = await axios.delete(
        `${API_BASE_URL}/delete-truck/${selectedTruck.id}`
      );

      if (response.data.success) {
        setTrucks((prevTrucks) =>
          prevTrucks.filter((truck) => truck.id !== selectedTruck.id)
        );
        fetchTrucks();
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

  const toggleRegistrationModal = (truck) => {
    setSelectedTruck(truck);
    setIsRegistrationModalOpen(!isRegrationModalOpen);
  };

  const closeRegistrationModal = () => {
    setSelectedTruck(null);
    setIsRegistrationModalOpen(false);
    setTrucksData({});
    setErrors({});
  };

  const handleInsertTruckRegistration = async (e) => {
    e.preventDefault();

    setErrors({
      amountPaid: "",
      registrationDate: "",
      apiError: "",
    });

    if (!selectedTruck || !selectedTruck.id) {
      setErrors((prev) => ({
        ...prev,
        apiError: "Invalid truck selected.",
      }));
      return;
    }

    let hasError = false;

    if (!trucksData.amountPaid.trim()) {
      setErrors((prev) => ({
        ...prev,
        amountPaid: "Amount is required.",
      }));
      hasError = true;
    }

    if (!trucksData.registrationDate.trim()) {
      setErrors((prev) => ({
        ...prev,
        registrationDate: "Registration date is required.",
      }));
      hasError = true;
    }

    if (hasError) return;

    try {
      const response = await axios.post(
        `${API_BASE_URL}/insert-truck-registration/${selectedTruck.id}`,
        {
          truck_id: selectedTruck.id,
          amount: trucksData.amountPaid,
          registration_date: trucksData.registrationDate,
        }
      );

      if (response.data.success) {
        fetchTrucks();
        closeRegistrationModal();
      } else {
        setErrors((prev) => ({
          ...prev,
          apiError: response.data.message || "An error occurred.",
        }));
      }
    } catch (error) {
      const apiMessage = error.response?.data?.message;

      setErrors((prev) => ({
        ...prev,
        apiError:
          apiMessage === "Truck already registered this year."
            ? "Truck already registered this year."
            : apiMessage ||
              "Something went wrong while saving the registration.",
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
    <div className={styles["trucks-content"]}>
      <div className={styles["content-header-container"]}>
        <h1 className={styles["page-title"]}>Trucks</h1>
      </div>
      <div className={styles["content-body-container"]}>
        <div className={styles["add-truck-button-container"]}>
          <button
            className={styles["add-truck-button"]}
            onClick={toggleAddModal}
          >
            Add Truck
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
                          checked={tempSortOrder === "plate_number-asc"}
                          onChange={() => setTempSortOrder("plate_number-asc")}
                        />
                        A-Z
                      </label>
                      <label className={styles["sort-label"]} htmlFor="z-a">
                        <input
                          className={styles["sort-input"]}
                          id="z-a"
                          type="radio"
                          name="sort"
                          checked={tempSortOrder === "plate_number-desc"}
                          onChange={() => setTempSortOrder("plate_number-desc")}
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
                <th className={styles.th}>Plate Number</th>
                <th className={styles.th}>Renewal Month</th>
                <th className={styles.th}>Truck Type</th>
                <th className={styles.th}>Truck Brand</th>
                <th className={styles.th}>Body Type</th>
                <th className={styles.th}>Engine Number</th>
                <th className={styles.th}>Chasis Number</th>
                <th className={styles.th}>Classification</th>
                <th className={styles.th}>MV File Number</th>
                <th className={styles.th}>CR Number</th>
                <th className={styles.th}>Gross Weight</th>
                <th className={styles.th}>Year Model</th>
                <th className={styles.th}>Color</th>
                <th className={styles.th}>Registered Owner</th>
                <th className={styles.th}>Registration Status</th>
                <th className={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody className={styles.tbody}>
              {paginatedTrucks.map((truck, index) => (
                <tr className={styles.btr} key={index}>
                  <td
                    className={styles.td}
                    onClick={() => toggleRegistrationModal(truck)}
                  >
                    {index + 1}. {truck.plate_number}
                  </td>
                  <td className={styles.td}>{truck.renewal_month}</td>
                  <td className={styles.td}>{truck.truck_type}</td>
                  <td className={styles.td}>{truck.truck_brand}</td>
                  <td className={styles.td}>{truck.body_type}</td>
                  <td className={styles.td}>{truck.engine_number}</td>
                  <td className={styles.td}>{truck.chasis_number}</td>
                  <td className={styles.td}>{truck.classification}</td>
                  <td className={styles.td}>{truck.mv_file_number}</td>
                  <td className={styles.td}>{truck.cr_number}</td>
                  <td className={styles.td}>{truck.gross_weight}</td>
                  <td className={styles.td}>{truck.year_model}</td>
                  <td className={styles.td}>{truck.color}</td>
                  <td className={styles.td}>{truck.registered_owner}</td>
                  <td className={styles.td}>{truck.status}</td>
                  <td className={styles.td}>
                    <div className={styles["action-container"]}>
                      <button
                        className={styles["edit-button"]}
                        onMouseEnter={() => setIsEditHovered(index)}
                        onMouseLeave={() => setIsEditHovered(null)}
                        onClick={() => toggleEditModal(truck)}
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
                        onClick={() => toggleDeleteModal(truck)}
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
              {paginatedTrucks.length === 0 && (
                <tr className={styles.btr}>
                  <td
                    colSpan="1"
                    className={`${styles.td} ${styles["search-response"]}`}
                  >
                    No trucks found.
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
              <h3 className={styles["modal-title"]}>Add Truck</h3>
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
              onSubmit={handleAddTruck}
            >
              <label className={styles.label} htmlFor="plate_number">
                Plate Number
                <input
                  className={`${styles.input} ${
                    errors.plateNumber ? styles["error"] : ""
                  }`}
                  type="text"
                  id="plate_number"
                  name="plateNumber"
                  value={trucksData.plateNumber}
                  onChange={handleInputChange}
                />
                {errors.plateNumber && (
                  <p className={styles["error-message"]}>
                    {errors.plateNumber}
                  </p>
                )}
              </label>
              <label className={styles.label} htmlFor="renewal_month">
                Renewal Month
                <Select
                  className={`${styles.input} ${
                    errors.renewalMonth ? styles["error"] : ""
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
                  options={monthOptions}
                  placeholder="Select Month"
                  name="renewalMonth"
                  id="renewal_month"
                  value={monthOptions.find(
                    (option) => option.value === trucksData.renewalMonth
                  )}
                  onChange={(selectedOption) =>
                    handleInputChange(
                      null,
                      "renewalMonth",
                      selectedOption.value
                    )
                  }
                />
                {errors.renewalMonth && (
                  <p className={styles["error-message"]}>
                    {errors.renewalMonth}
                  </p>
                )}
              </label>
              <label className={styles.label} htmlFor="truck_type">
                Truck Type
                <Select
                  className={`${styles.input} ${
                    errors.truckType ? styles["error"] : ""
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
                  options={truckTypeOptions}
                  placeholder="Select Truck Type"
                  name="truckType"
                  id="truck_type"
                  value={truckTypeOptions.find(
                    (option) => option.value === trucksData.truckType
                  )}
                  onChange={(selectedOption) =>
                    handleInputChange(null, "truckType", selectedOption.value)
                  }
                />
                {errors.truckType && (
                  <p className={styles["error-message"]}>{errors.truckType}</p>
                )}
              </label>
              <label className={styles.label} htmlFor="truck_brand">
                Truck Brand
                <Select
                  className={`${styles.input} ${
                    errors.truckBrand ? styles["error"] : ""
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
                  options={truckBrandOptions}
                  placeholder="Select Brand"
                  name="truckBrand"
                  id="truck_brand"
                  value={truckBrandOptions.find(
                    (option) => option.value === trucksData.truckBrand
                  )}
                  onChange={(selectedOption) =>
                    handleInputChange(null, "truckBrand", selectedOption.value)
                  }
                />
                {errors.truckBrand && (
                  <p className={styles["error-message"]}>{errors.truckBrand}</p>
                )}
              </label>
              <label className={styles.label} htmlFor="body_type">
                Body Type
                <Select
                  className={`${styles.input} ${
                    errors.bodyType ? styles["error"] : ""
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
                  options={bodyTypeOptions}
                  placeholder="Select Body Type"
                  name="bodyType"
                  id="body_type"
                  value={bodyTypeOptions.find(
                    (option) => option.value === trucksData.bodyType
                  )}
                  onChange={(selectedOption) =>
                    handleInputChange(null, "bodyType", selectedOption.value)
                  }
                />
                {errors.bodyType && (
                  <p className={styles["error-message"]}>{errors.bodyType}</p>
                )}
              </label>
              <label className={styles.label} htmlFor="engine_number">
                Engine Number
                <input
                  className={`${styles.input} ${
                    errors.engineNumber ? styles["error"] : ""
                  }`}
                  type="text"
                  id="engine_number"
                  name="engineNumber"
                  value={trucksData.engineNumber}
                  onChange={handleInputChange}
                />
                {errors.engineNumber && (
                  <p className={styles["error-message"]}>
                    {errors.engineNumber}
                  </p>
                )}
              </label>
              <label className={styles.label} htmlFor="chasis_number">
                Chasis Number
                <input
                  className={`${styles.input} ${
                    errors.chasisNumber ? styles["error"] : ""
                  }`}
                  type="text"
                  id="chasis_number"
                  name="chasisNumber"
                  value={trucksData.chasisNumber}
                  onChange={handleInputChange}
                />
                {errors.chasisNumber && (
                  <p className={styles["error-message"]}>
                    {errors.chasisNumber}
                  </p>
                )}
              </label>
              <label className={styles.label} htmlFor="classification">
                Classification
                <Select
                  className={`${styles.input} ${
                    errors.classification ? styles["error"] : ""
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
                  options={classificationOptions}
                  placeholder="Select Classification"
                  name="classification"
                  id="classification"
                  value={classificationOptions.find(
                    (option) => option.value === trucksData.classification
                  )}
                  onChange={(selectedOption) =>
                    handleInputChange(
                      null,
                      "classification",
                      selectedOption.value
                    )
                  }
                />
                {errors.classification && (
                  <p className={styles["error-message"]}>
                    {errors.classification}
                  </p>
                )}
              </label>
              <label className={styles.label} htmlFor="mv_file_number">
                MV File Number
                <input
                  className={`${styles.input} ${
                    errors.MvFileNumber ? styles["error"] : ""
                  }`}
                  type="text"
                  id="mv_file_number"
                  name="MvFileNumber"
                  value={trucksData.MvFileNumber}
                  onChange={handleInputChange}
                />
                {errors.MvFileNumber && (
                  <p className={styles["error-message"]}>
                    {errors.MvFileNumber}
                  </p>
                )}
              </label>
              <label className={styles.label} htmlFor="cr_number">
                CR Number
                <input
                  className={`${styles.input} ${
                    errors.crNumber ? styles["error"] : ""
                  }`}
                  type="text"
                  id="cr_number"
                  name="crNumber"
                  value={trucksData.crNumber}
                  onChange={handleInputChange}
                />
                {errors.crNumber && (
                  <p className={styles["error-message"]}>{errors.crNumber}</p>
                )}
              </label>
              <label className={styles.label} htmlFor="gross_weight">
                Gross Weight
                <input
                  className={`${styles.input} ${
                    errors.grossWeight ? styles["error"] : ""
                  }`}
                  type="text"
                  id="gross_weight"
                  name="grossWeight"
                  value={trucksData.grossWeight}
                  onChange={handleInputChange}
                />
                {errors.grossWeight && (
                  <p className={styles["error-message"]}>
                    {errors.grossWeight}
                  </p>
                )}
              </label>
              <label className={styles.label} htmlFor="year_model">
                Year Model
                <Select
                  className={`${styles.input} ${
                    errors.yearModel ? styles["error"] : ""
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
                  options={yearOptions}
                  placeholder="Select Body Type"
                  name="yearModel"
                  id="year_model"
                  value={yearOptions.find(
                    (option) => option.value === trucksData.yearModel
                  )}
                  onChange={(selectedOption) =>
                    handleInputChange(null, "yearModel", selectedOption.value)
                  }
                />
                {errors.yearModel && (
                  <p className={styles["error-message"]}>{errors.yearModel}</p>
                )}
              </label>
              <label className={styles.label} htmlFor="color">
                Color
                <input
                  className={`${styles.input} ${
                    errors.color ? styles["error"] : ""
                  }`}
                  type="text"
                  id="color"
                  name="color"
                  value={trucksData.color}
                  onChange={handleInputChange}
                />
                {errors.color && (
                  <p className={styles["error-message"]}>{errors.color}</p>
                )}
              </label>
              <label className={styles.label} htmlFor="registed_owner">
                Registered Owner
                <input
                  className={`${styles.input} ${
                    errors.registeredOwner ? styles["error"] : ""
                  }`}
                  type="text"
                  id="registered_owner"
                  name="registeredOwner"
                  value={trucksData.registeredOwner}
                  onChange={handleInputChange}
                />
                {errors.registeredOwner && (
                  <p className={styles["error-message"]}>
                    {errors.registeredOwner}
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
      {isEditModalOpen && selectedTruck && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
        >
          <div className={styles["modal-container"]}>
            <div className={styles["modal-header-container"]}>
              <h3 className={styles["modal-title"]}>Edit Truck</h3>
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
              onSubmit={handleEditTruck}
            >
              <label className={styles.label} htmlFor="plate_number">
                Plate Number
                <input
                  className={`${styles.input} ${
                    errors.plateNumber ? styles["error"] : ""
                  }`}
                  type="text"
                  id="plate_number"
                  name="plateNumber"
                  value={trucksData.plateNumber}
                  onChange={handleInputChange}
                />
                {errors.plateNumber && (
                  <p className={styles["error-message"]}>
                    {errors.plateNumber}
                  </p>
                )}
              </label>
              <label className={styles.label} htmlFor="renewal_month">
                Renewal Month
                <Select
                  className={`${styles.input} ${
                    errors.renewalMonth ? styles["error"] : ""
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
                  options={monthOptions}
                  placeholder="Select Month"
                  name="renewalMonth"
                  id="renewal_month"
                  value={monthOptions.find(
                    (option) => option.value === trucksData.renewalMonth
                  )}
                  onChange={(selectedOption) =>
                    handleInputChange(
                      null,
                      "renewalMonth",
                      selectedOption.value
                    )
                  }
                />
                {errors.renewalMonth && (
                  <p className={styles["error-message"]}>
                    {errors.renewalMonth}
                  </p>
                )}
              </label>
              <label className={styles.label} htmlFor="truck_type">
                Truck Type
                <Select
                  className={`${styles.input} ${
                    errors.truckType ? styles["error"] : ""
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
                  options={truckTypeOptions}
                  placeholder="Select Truck Type"
                  name="truckType"
                  id="truck_type"
                  value={truckTypeOptions.find(
                    (option) => option.value === trucksData.truckType
                  )}
                  onChange={(selectedOption) =>
                    handleInputChange(null, "truckType", selectedOption.value)
                  }
                />
                {errors.truckType && (
                  <p className={styles["error-message"]}>{errors.truckType}</p>
                )}
              </label>
              <label className={styles.label} htmlFor="truck_brand">
                Truck Brand
                <Select
                  className={`${styles.input} ${
                    errors.truckBrand ? styles["error"] : ""
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
                  options={truckBrandOptions}
                  placeholder="Select Brand"
                  name="truckBrand"
                  id="truck_brand"
                  value={truckBrandOptions.find(
                    (option) => option.value === trucksData.truckBrand
                  )}
                  onChange={(selectedOption) =>
                    handleInputChange(null, "truckBrand", selectedOption.value)
                  }
                />
                {errors.truckBrand && (
                  <p className={styles["error-message"]}>{errors.truckBrand}</p>
                )}
              </label>
              <label className={styles.label} htmlFor="body_type">
                Body Type
                <Select
                  className={`${styles.input} ${
                    errors.bodyType ? styles["error"] : ""
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
                  options={bodyTypeOptions}
                  placeholder="Select Body Type"
                  name="bodyType"
                  id="body_type"
                  value={bodyTypeOptions.find(
                    (option) => option.value === trucksData.bodyType
                  )}
                  onChange={(selectedOption) =>
                    handleInputChange(null, "bodyType", selectedOption.value)
                  }
                />
                {errors.bodyType && (
                  <p className={styles["error-message"]}>{errors.bodyType}</p>
                )}
              </label>
              <label className={styles.label} htmlFor="engine_number">
                Engine Number
                <input
                  className={`${styles.input} ${
                    errors.engineNumber ? styles["error"] : ""
                  }`}
                  type="text"
                  id="engine_number"
                  name="engineNumber"
                  value={trucksData.engineNumber}
                  onChange={handleInputChange}
                />
                {errors.engineNumber && (
                  <p className={styles["error-message"]}>
                    {errors.engineNumber}
                  </p>
                )}
              </label>
              <label className={styles.label} htmlFor="chasis_number">
                Chasis Number
                <input
                  className={`${styles.input} ${
                    errors.chasisNumber ? styles["error"] : ""
                  }`}
                  type="text"
                  id="chasis_number"
                  name="chasisNumber"
                  value={trucksData.chasisNumber}
                  onChange={handleInputChange}
                />
                {errors.chasisNumber && (
                  <p className={styles["error-message"]}>
                    {errors.chasisNumber}
                  </p>
                )}
              </label>
              <label className={styles.label} htmlFor="classification">
                Classification
                <Select
                  className={`${styles.input} ${
                    errors.classification ? styles["error"] : ""
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
                  options={classificationOptions}
                  placeholder="Select Classification"
                  name="classification"
                  id="classification"
                  value={classificationOptions.find(
                    (option) => option.value === trucksData.classification
                  )}
                  onChange={(selectedOption) =>
                    handleInputChange(
                      null,
                      "classification",
                      selectedOption.value
                    )
                  }
                />
                {errors.classification && (
                  <p className={styles["error-message"]}>
                    {errors.classification}
                  </p>
                )}
              </label>
              <label className={styles.label} htmlFor="mv_file_number">
                MV File Number
                <input
                  className={`${styles.input} ${
                    errors.MvFileNumber ? styles["error"] : ""
                  }`}
                  type="text"
                  id="mv_file_number"
                  name="MvFileNumber"
                  value={trucksData.MvFileNumber}
                  onChange={handleInputChange}
                />
                {errors.MvFileNumber && (
                  <p className={styles["error-message"]}>
                    {errors.MvFileNumber}
                  </p>
                )}
              </label>
              <label className={styles.label} htmlFor="cr_number">
                CR Number
                <input
                  className={`${styles.input} ${
                    errors.crNumber ? styles["error"] : ""
                  }`}
                  type="text"
                  id="cr_number"
                  name="crNumber"
                  value={trucksData.crNumber}
                  onChange={handleInputChange}
                />
                {errors.crNumber && (
                  <p className={styles["error-message"]}>{errors.crNumber}</p>
                )}
              </label>
              <label className={styles.label} htmlFor="gross_weight">
                Gross Weight
                <input
                  className={`${styles.input} ${
                    errors.grossWeight ? styles["error"] : ""
                  }`}
                  type="text"
                  id="gross_weight"
                  name="grossWeight"
                  value={trucksData.grossWeight}
                  onChange={handleInputChange}
                />
                {errors.grossWeight && (
                  <p className={styles["error-message"]}>
                    {errors.grossWeight}
                  </p>
                )}
              </label>
              <label className={styles.label} htmlFor="year_model">
                Year Model
                <Select
                  className={`${styles.input} ${
                    errors.yearModel ? styles["error"] : ""
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
                  options={yearOptions}
                  placeholder="Select Body Type"
                  name="yearModel"
                  id="year_model"
                  value={yearOptions.find(
                    (option) => option.value === trucksData.yearModel
                  )}
                  onChange={(selectedOption) =>
                    handleInputChange(null, "yearModel", selectedOption.value)
                  }
                />
                {errors.yearModel && (
                  <p className={styles["error-message"]}>{errors.yearModel}</p>
                )}
              </label>
              <label className={styles.label} htmlFor="color">
                Color
                <input
                  className={`${styles.input} ${
                    errors.color ? styles["error"] : ""
                  }`}
                  type="text"
                  id="color"
                  name="color"
                  value={trucksData.color}
                  onChange={handleInputChange}
                />
                {errors.color && (
                  <p className={styles["error-message"]}>{errors.color}</p>
                )}
              </label>
              <label className={styles.label} htmlFor="registed_owner">
                Registered Owner
                <input
                  className={`${styles.input} ${
                    errors.registeredOwner ? styles["error"] : ""
                  }`}
                  type="text"
                  id="registered_owner"
                  name="registeredOwner"
                  value={trucksData.registeredOwner}
                  onChange={handleInputChange}
                />
                {errors.registeredOwner && (
                  <p className={styles["error-message"]}>
                    {errors.registeredOwner}
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
      {isDeleteModalOpen && selectedTruck && (
        <Modal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
        >
          <div
            className={`${styles["modal-container"]} ${styles["delete-modal-container"]}`}
          >
            <h1 className={styles["delete-modal-header"]}>
              Are you sure to delete this truck?
            </h1>
            <div className={styles["delete-modal-button-container"]}>
              <button
                className={styles["delete-modal-button"]}
                onClick={handleDeleteTruck}
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
      {isRegrationModalOpen && selectedTruck && (
        <Modal
          isOpen={isRegrationModalOpen}
          onClose={() => setIsRegistrationModalOpen(false)}
        >
          <div className={styles["modal-container"]}>
            <div className={styles["modal-header-container"]}>
              <h3 className={styles["modal-title"]}>
                {selectedTruck.plate_number} Registration
              </h3>
              <button
                className={styles["close-modal-button"]}
                onClick={closeRegistrationModal}
              >
                <img
                  className={styles["close-modal-icon"]}
                  src={crossIcon}
                  alt="Close"
                />
              </button>
            </div>
            <div
              className={`${styles["modal-body-container"]} ${styles["registration-modal-body-container"]}`}
            >
              <div className={styles["truck-details-container"]}>
                <p className={styles["truck-details-label"]}>Renewal Month</p>
                <p className={styles["truck-details-information"]}>
                  {selectedTruck.renewal_month}
                </p>
              </div>
              <div className={styles["truck-details-container"]}>
                <p className={styles["truck-details-label"]}>Truck Type</p>
                <p className={styles["truck-details-information"]}>
                  {selectedTruck.truck_type}
                </p>
              </div>
              <div className={styles["truck-details-container"]}>
                <p className={styles["truck-details-label"]}>Truck Brand</p>
                <p className={styles["truck-details-information"]}>
                  {selectedTruck.truck_brand}
                </p>
              </div>
              <div className={styles["truck-details-container"]}>
                <p className={styles["truck-details-label"]}>Body Type</p>
                <p className={styles["truck-details-information"]}>
                  {selectedTruck.body_type}
                </p>
              </div>
              <div className={styles["truck-details-container"]}>
                <p className={styles["truck-details-label"]}>Engine Number</p>
                <p className={styles["truck-details-information"]}>
                  {selectedTruck.engine_number}
                </p>
              </div>
              <div className={styles["truck-details-container"]}>
                <p className={styles["truck-details-label"]}>Chasis Number</p>
                <p className={styles["truck-details-information"]}>
                  {selectedTruck.chasis_number}
                </p>
              </div>
              <div className={styles["truck-details-container"]}>
                <p className={styles["truck-details-label"]}>Classification</p>
                <p className={styles["truck-details-information"]}>
                  {selectedTruck.classification}
                </p>
              </div>
              <div className={styles["truck-details-container"]}>
                <p className={styles["truck-details-label"]}>MV File Number</p>
                <p className={styles["truck-details-information"]}>
                  {selectedTruck.mv_file_number}
                </p>
              </div>
              <div className={styles["truck-details-container"]}>
                <p className={styles["truck-details-label"]}>CR Number</p>
                <p className={styles["truck-details-information"]}>
                  {selectedTruck.cr_number}
                </p>
              </div>
              <div className={styles["truck-details-container"]}>
                <p className={styles["truck-details-label"]}>Gross Weight</p>
                <p className={styles["truck-details-information"]}>
                  {selectedTruck.gross_weight}
                </p>
              </div>
              <div className={styles["truck-details-container"]}>
                <p className={styles["truck-details-label"]}>Year Model</p>
                <p className={styles["truck-details-information"]}>
                  {selectedTruck.year_model}
                </p>
              </div>
              <div className={styles["truck-details-container"]}>
                <p className={styles["truck-details-label"]}>Color</p>
                <p className={styles["truck-details-information"]}>
                  {selectedTruck.color}
                </p>
              </div>
            </div>
            <div className={styles["registration-modal-history"]}>
              <h3 className={styles["modal-title"]}>Registration History</h3>
              <div
                className={styles["registration-modal-input-label-container"]}
              >
                <div className={styles["registration-modal-label-container"]}>
                  <p className={styles["truck-registration-label"]}>Amount</p>
                  <p className={styles["truck-registration-label"]}>
                    Registration Date
                  </p>
                </div>
                <div
                  className={
                    styles["registration-modal-history-item-container"]
                  }
                >
                  {selectedTruck.registration_history &&
                  selectedTruck.registration_history.length > 0 ? (
                    selectedTruck.registration_history.map((history, index) => (
                      <div
                        key={index}
                        className={styles["registration-modal-history-item"]}
                      >
                        <p className={styles["truck-registration-information"]}>
                          {" "}
                          ₱{parseFloat(history.amount).toLocaleString()}
                        </p>

                        <p className={styles["truck-registration-information"]}>
                          {new Date(
                            history.registration_date
                          ).toLocaleDateString("en-US", {
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className={styles["truck-registration-information"]}>
                      No registration history available.
                    </p>
                  )}
                </div>
                <form
                  className={styles["truck-registration-form"]}
                  onSubmit={handleInsertTruckRegistration}
                >
                  <label
                    className={styles["truck-registration-input-label"]}
                    htmlFor="amount_paid"
                  >
                    Amount Paid
                    <input
                      className={styles["truck-registration-input"]}
                      type="number"
                      name="amountPaid"
                      id="amount_paid"
                      value={trucksData.amountPaid || ""}
                      onChange={handleInputChange}
                    />
                    {errors.amountPaid && (
                      <p className={styles["error-message"]}>
                        {errors.amountPaid}
                      </p>
                    )}
                  </label>
                  <label
                    className={styles["truck-registration-input-label"]}
                    htmlFor="registration_date"
                  >
                    Date of Registration
                    <input
                      className={styles["truck-registration-input"]}
                      type="date"
                      name="registrationDate"
                      id="registration_date"
                      value={trucksData.registrationDate || ""}
                      onChange={handleInputChange}
                    />
                    {errors.registrationDate && (
                      <p className={styles["error-message"]}>
                        {errors.registrationDate}
                      </p>
                    )}
                  </label>
                  {errors.apiError && (
                    <p className={styles["error-message"]}>{errors.apiError}</p>
                  )}
                  <button className={styles["submit-button"]}>Submit</button>
                </form>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default HRTrucks;
