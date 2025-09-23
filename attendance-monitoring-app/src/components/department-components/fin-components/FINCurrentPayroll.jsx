import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import Modal from "../../Modal";
import styles from "../../../assets/styles/FINCurrentPayroll.module.css";
import crossIcon from "../../../assets/images/cross-icon.svg";
import checkIcon from "../../../assets/images/check-icon.svg";
import checkHoverIcon from "../../../assets/images/check-hovered-icon.svg";
import editIcon from "../../../assets/images/edit-icon.svg";
import editHoverIcon from "../../../assets/images/edit-hovered-icon.svg";
import deleteIcon from "../../../assets/images/delete-icon.svg";
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

const FINCurrentPayroll = () => {
  const [payrolls, setPayrolls] = useState([]);
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
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [selectedPayroll, setSelectedPayroll] = useState(false);
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
  const [manualOverrides, setManualOverrides] = React.useState({
    sssContribution: false,
    philhealthContribution: false,
    pagibigContribution: false,
  });
  const [payrollsData, setPayrollsData] = useState({
    payrollPeriod: "",
    role: "",
    periodStart: "",
    periodEnd: "",
    basicPayDays: 0,
    basicPayRate: 0,
    basicPayTotal: 0,
    holidayDays: 0,
    holidayRate: 0,
    holidayTotal: 0,
    adjustmentDays: 0,
    adjustmentRate: 0,
    adjustmentTotal: 0,
    leaveDays: 0,
    leaveRate: 0,
    leaveTotal: 0,
    managementBonusTotal: 0,
    thirteenthMonthTotal: 0,
    regularOtHours: 0,
    regularOtRate: 0,
    regularOtTotal: 0,
    regularOtNdHours: 0,
    regularOtNdRate: 0,
    regularOtNdTotal: 0,
    restDayOtHours: 0,
    restDayOtRate: 0,
    restDayOtTotal: 0,
    restDayOtExcessHours: 0,
    restDayOtExcessRate: 0,
    restDayOtExcessTotal: 0,
    restDayOtNdHours: 0,
    restDayOtNdRate: 0,
    restDayOtNdTotal: 0,
    specialHolidayOtHours: 0,
    specialHolidayOtRate: 0,
    specialHolidayOtTotal: 0,
    legalHolidayOtHours: 0,
    legalHolidayOtRate: 0,
    legalHolidayOtTotal: 0,
    legalHolidayOtExcessHours: 0,
    legalHolidayOtExcessRate: 0,
    legalHolidayOtExcessTotal: 0,
    legalHolidayOtNdHours: 0,
    legalHolidayOtNdRate: 0,
    legalHolidayOtNdTotal: 0,
    nightDiffHours: 0,
    nightDiffRate: 0,
    nightDiffTotal: 0,
    basicAllowanceTotal: 0,
    tempAllowanceTotal: 0,
    gross: 0,
    sssContribution: 0,
    sssLoan: 0,
    philhealthContribution: 0,
    pagibigContribution: 0,
    pagibigLoan: 0,
    donation: 0,
    cashAdvance: 0,
    staffShops: 0,
    netPay: 0,
  });
  const [errors, setErrors] = useState({
    payrollPeriod: "",
    role: "",
    periodStart: "",
    periodEnd: "",
    basicPayDays: 0,
    basicPayRate: 0,
    basicPayTotal: 0,
    holidayDays: 0,
    holidayRate: 0,
    holidayTotal: 0,
    adjustmentDays: 0,
    adjustmentRate: 0,
    adjustmentTotal: 0,
    leaveDays: 0,
    leaveRate: 0,
    leaveTotal: 0,
    managementBonusTotal: 0,
    thirteenthMonthTotal: 0,
    regularOtHours: 0,
    regularOtRate: 0,
    regularOtTotal: 0,
    regularOtNdHours: 0,
    regularOtNdRate: 0,
    regularOtNdTotal: 0,
    restDayOtHours: 0,
    restDayOtRate: 0,
    restDayOtTotal: 0,
    restDayOtExcessHours: 0,
    restDayOtExcessRate: 0,
    restDayOtExcessTotal: 0,
    restDayOtNdHours: 0,
    restDayOtNdRate: 0,
    restDayOtNdTotal: 0,
    specialHolidayOtHours: 0,
    specialHolidayOtRate: 0,
    specialHolidayOtTotal: 0,
    legalHolidayOtHours: 0,
    legalHolidayOtRate: 0,
    legalHolidayOtTotal: 0,
    legalHolidayOtExcessHours: 0,
    legalHolidayOtExcessRate: 0,
    legalHolidayOtExcessTotal: 0,
    legalHolidayOtNdHours: 0,
    legalHolidayOtNdRate: 0,
    legalHolidayOtNdTotal: 0,
    nightDiffHours: 0,
    nightDiffRate: 0,
    nightDiffTotal: 0,
    basicAllowanceTotal: 0,
    tempAllowanceTotal: 0,
    gross: 0,
    sssContribution: 0,
    sssLoan: 0,
    philhealthContribution: 0,
    pagibigContribution: 0,
    pagibigLoan: 0,
    donation: 0,
    cashAdvance: 0,
    staffShops: 0,
    netPay: 0,
    apiError: "",
  });

  const isDarkMode =
    document.documentElement.getAttribute("data-theme") === "dark";

  const fetchPayrolls = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/payrolls`);
      if (response.data.success) {
        const paidPayrolls = response.data.data.filter(
          (payroll) => payroll.status !== "Paid" && payroll.status !== "Pending"
        );
        setPayrolls(paidPayrolls);
      }
    } catch (error) {
      console.error("Error fetching payrolls:", error);
    }
  };

  useEffect(() => {
    fetchPayrolls();
  }, []);

  const filteredPayrolls = payrolls
    .filter((payroll) => {
      const payrollName = (payroll.full_name || "").toLowerCase();
      const matchesSearch = payrollName.includes(search.toLowerCase());

      const payrollDate = payroll.created_at
        ? new Date(payroll.created_at.split("T")[0])
        : new Date();
      const iswithinDateRange =
        (!appliedFromDate || payrollDate >= new Date(appliedFromDate)) &&
        (!appliedToDate || payrollDate <= new Date(appliedToDate));

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

  const totalPages = Math.ceil(filteredPayrolls.length / itemsPerPage);
  const paginatedPayrolls = filteredPayrolls.slice(
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
    "Name",
    "Department",
    "Rate",
    "Hours",
    "Gross",
    "SSS Contribution",
    "SSS Loan",
    "PAGIBIG Contribution",
    "PAGIBIG Loan",
    "Philhealth Contribution",
    "Staffshop",
    "Cash Advance",
    "Total Deductions",
    "Net Pay",
    "Period",
  ];

  const exportToExcel = (data) => {
    const formattedData = data.map((item, index) => ({
      ID: index + 1,
      Name: item.full_name || "",
      Department: `${item.department_name} ${item.role}` || "",
      Rate: item.basic_pay_rate || "",
      Hours: item.basic_pay_days || "",
      Gross: item.gross || "",
      "SSS Contribution": item.sss_contribution || "",
      "SSS Loan": item.sss_loan || "",
      "PAGIBIG Contribution": item.pagibig_contribution || "",
      "PAGIBIG Loan": item.pagibig_loan || "",
      "Philhealth Contribution": item.philhealth_contribution || "",
      Staffshop: item.staff_shops || "",
      "Cash Advance": item.cash_advance || "",
      "Total Deductions": item.total_deductions || "",
      "Net Pay": item.net_pay || "",
      Period:
        `${formatDate(item.period_start)} - ${formatDate(item.period_end)}` ||
        "",
    }));

    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Payrolls");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
    });

    saveAs(blob, "payrolls.xlsx");
  };

  const exportToPDF = (data) => {
    const doc = new jsPDF();

    doc.text("Payrolls Report", 14, 10);

    const tableRows = data.map((item, index) => [
      index + 1,
      item.full_name,
      `${item.department_name} ${item.role}`,
      item.basic_pay_rate,
      item.basic_pay_days,
      item.gross,
      item.sss_contribution,
      item.sss_loan,
      item.pagibig_contribution,
      item.pagibig_loan,
      item.philhealth_contribution,
      item.staff_shops,
      item.cash_advance,
      item.total_deductions,
      item.net_pay,
      `${formatDate(item.period_start)} ${formatDate(item.period_end)}`,
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 20,
    });

    doc.save("payrolls.pdf");
  };

  const exportToWord = (data) => {
    const columnKeyMap = {
      ID: "id",
      Name: "full_name",
      Department: "department",
      Rate: "basic_pay_rate",
      Hours: "basic_pay_days",
      Gross: "gross",
      "SSS Contribution": "sss_contribution",
      "SSS Loan": "sss_loan",
      "PAGIBIG Contribution": "pagibig_contribution",
      "PAGIBIG Loan": "pagibig_loan",
      "Philhealth Contribution": "philhealth_contribution",
      "Total Deductions": "total_deductions",
      "Net Pay": "net_pay",
      Period: "period",
    };

    const tableRows = data.map((item, index) => {
      return new TableRow({
        children: tableColumn.map((column) => {
          let value = "";

          if (column === "ID") {
            value = (index + 1).toString();
          } else if (column === "Department") {
            value = `${item.department_name || ""} ${item.role || ""}`;
          } else if (column === "Period") {
            value = `${formatDate(item.period_start)} - ${formatDate(
              item.period_end
            )}`;
          } else {
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
      saveAs(blob, "payrolls.docx");
    });
  };

  const handleExport = () => {
    if (!exportFileType) {
      setExportError("Please select an export format.");
      return;
    }

    const filteredData = payrolls.filter((payroll) => {
      const payrollDate = payroll.created_at
        ? new Date(payroll.created_at.split("T")[0])
        : new Date();
      return (
        (!exportFromDate || payrollDate >= new Date(exportFromDate)) &&
        (!exportToDate || payrollDate <= new Date(exportToDate))
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

  useEffect(() => {
    const calculatePayroll = () => {
      const grossValue = parseFloat(payrollsData.gross) || 0;
      const payrollPeriod = payrollsData.payrollPeriod;

      const sssContribution = manualOverrides.sssContribution
        ? parseFloat(payrollsData.sssContribution) || 0
        : payrollPeriod === "Payroll Period 1"
        ? getSSSContribution(grossValue * 2)
        : 0;

      const philhealthContribution = manualOverrides.philhealthContribution
        ? parseFloat(payrollsData.philhealthContribution) || 0
        : payrollPeriod === "Payroll Period 1"
        ? +(grossValue * 0.05).toFixed(2)
        : 0;

      const pagibigContribution = manualOverrides.pagibigContribution
        ? parseFloat(payrollsData.pagibigContribution) || 0
        : payrollPeriod === "Payroll Period 2"
        ? 200
        : 0;

      const deductions = {
        sssContribution,
        philhealthContribution,
        pagibigContribution,
        sssLoan: parseFloat(payrollsData.sssLoan || 0),
        pagibigLoan: parseFloat(payrollsData.pagibigLoan || 0),
        donation: parseFloat(payrollsData.donation || 0),
        cashAdvance: parseFloat(payrollsData.cashAdvance || 0),
        staffShops: parseFloat(payrollsData.staffShops || 0),
      };

      const totalDeductions = Object.values(deductions)
        .reduce((sum, val) => sum + val, 0)
        .toFixed(2);

      const netPay = (grossValue - totalDeductions).toFixed(2);

      setPayrollsData((prev) => ({
        ...prev,
        ...deductions,
        netPay,
      }));
    };

    if (payrollsData.payrollPeriod && payrollsData.gross) {
      calculatePayroll();
    }
  }, [payrollsData.gross, payrollsData.payrollPeriod, manualOverrides]);

  const getSSSContribution = (gross) => {
    const sssTable = [
      { limit: 4000, contribution: 180.0 },
      { limit: 4500, contribution: 202.5 },
      { limit: 5000, contribution: 225.0 },
      { limit: 5500, contribution: 247.5 },
      { limit: 6000, contribution: 270.0 },
      { limit: 6500, contribution: 292.5 },
      { limit: 7000, contribution: 315.0 },
      { limit: 7500, contribution: 337.5 },
      { limit: 8000, contribution: 360.0 },
      { limit: 8500, contribution: 382.5 },
      { limit: 9000, contribution: 405.0 },
      { limit: 9500, contribution: 427.5 },
      { limit: 10000, contribution: 450.0 },
      { limit: 10500, contribution: 472.5 },
      { limit: 11000, contribution: 495.0 },
      { limit: 11500, contribution: 517.5 },
      { limit: 12000, contribution: 540.0 },
      { limit: 12500, contribution: 562.5 },
      { limit: 13000, contribution: 585.0 },
      { limit: 13500, contribution: 607.5 },
      { limit: 14000, contribution: 630.0 },
      { limit: 14500, contribution: 652.5 },
      { limit: 15000, contribution: 675.0 },
      { limit: 15500, contribution: 697.5 },
      { limit: 16000, contribution: 720.0 },
      { limit: 16500, contribution: 742.5 },
      { limit: 17000, contribution: 765.0 },
      { limit: 17500, contribution: 787.5 },
      { limit: 18000, contribution: 810.0 },
      { limit: 18500, contribution: 832.5 },
      { limit: 19000, contribution: 855.0 },
      { limit: 19500, contribution: 877.5 },
      { limit: Infinity, contribution: 900.0 },
    ];

    for (let i = 0; i < sssTable.length; i++) {
      if (gross <= sssTable[i].limit) {
        return sssTable[i].contribution;
      }
    }

    return 0;
  };

  const handleInputChange = (eventOrValue, name, value) => {
    let fieldName, fieldValue;

    if (eventOrValue?.target) {
      fieldName = eventOrValue.target.name;
      fieldValue = eventOrValue.target.value;
    } else {
      fieldName = name;
      fieldValue = value;
    }

    if (
      fieldName === "sssContribution" ||
      fieldName === "philhealthContribution" ||
      fieldName === "pagibigContribution"
    ) {
      setManualOverrides((prev) => ({
        ...prev,
        [fieldName]: true,
      }));
    }

    setPayrollsData((prevData) => {
      const updatedData = {
        ...prevData,
        [fieldName]: fieldValue,
      };

      const calculateTotal = (qtyKey, rateKey) => {
        const qty = parseFloat(updatedData[qtyKey]) || 0;
        const rate = parseFloat(updatedData[rateKey]) || 0;
        return +(qty * rate).toFixed(2);
      };

      const totals = {
        basicPayTotal: calculateTotal("basicPayDays", "basicPayRate"),
        holidayTotal: calculateTotal("holidayDays", "holidayRate"),
        adjustmentTotal: calculateTotal("adjustmentDays", "adjustmentRate"),
        leaveTotal: calculateTotal("leaveDays", "leaveRate"),
        regularOtTotal: calculateTotal("regularOtHours", "regularOtRate"),
        regularOtNdTotal: calculateTotal("regularOtNdHours", "regularOtNdRate"),
        restDayOtTotal: calculateTotal("restDayOtHours", "restDayOtRate"),
        restDayOtExcessTotal: calculateTotal(
          "restDayOtExcessHours",
          "restDayOtExcessRate"
        ),
        restDayOtNdTotal: calculateTotal("restDayOtNdHours", "restDayOtNdRate"),
        specialHolidayOtTotal: calculateTotal(
          "specialHolidayOtHours",
          "specialHolidayOtRate"
        ),
        legalHolidayOtTotal: calculateTotal(
          "legalHolidayOtHours",
          "legalHolidayOtRate"
        ),
        legalHolidayOtExcessTotal: calculateTotal(
          "legalHolidayOtExcessHours",
          "legalHolidayOtExcessRate"
        ),
        legalHolidayOtNdTotal: calculateTotal(
          "legalHolidayOtNdHours",
          "legalHolidayOtNdRate"
        ),
        nightDiffTotal: calculateTotal("nightDiffHours", "nightDiffRate"),
        managementBonusTotal: parseFloat(updatedData.managementBonusTotal || 0),
        thirteenthMonthTotal: parseFloat(updatedData.thirteenthMonthTotal || 0),
        basicAllowanceTotal: parseFloat(updatedData.basicAllowanceTotal || 0),
        tempAllowanceTotal: parseFloat(updatedData.tempAllowanceTotal || 0),
      };

      const gross = Object.values(totals)
        .reduce((sum, val) => sum + val, 0)
        .toFixed(2);
      const grossValue = parseFloat(gross);
      const payrollPeriod = updatedData.payrollPeriod || "";

      let sssContribution = manualOverrides.sssContribution
        ? parseFloat(updatedData.sssContribution) || 0
        : payrollPeriod === "Payroll Period 1"
        ? getSSSContribution(grossValue * 2)
        : 0;

      let philhealthContribution = manualOverrides.philhealthContribution
        ? parseFloat(updatedData.philhealthContribution) || 0
        : payrollPeriod === "Payroll Period 1"
        ? +(grossValue * 0.05).toFixed(2)
        : 0;

      const pagibigContribution = manualOverrides.pagibigContribution
        ? parseFloat(updatedData.pagibigContribution) || 0
        : payrollPeriod === "Payroll Period 2"
        ? 200
        : 0;

      const deductions = {
        sssContribution,
        sssLoan: parseFloat(updatedData.sssLoan || 0),
        pagibigContribution,
        pagibigLoan: parseFloat(updatedData.pagibigLoan || 0),
        philhealthContribution,
        donation: parseFloat(updatedData.donation || 0),
        cashAdvance: parseFloat(updatedData.cashAdvance || 0),
        staffShops: parseFloat(updatedData.staffShops || 0),
      };

      const totalDeductions = Object.values(deductions)
        .reduce((sum, val) => sum + val, 0)
        .toFixed(2);
      const netPay = (grossValue - totalDeductions).toFixed(2);

      return {
        ...updatedData,
        ...totals,
        ...deductions,
        gross,
        netPay,
      };
    });

    setErrors((prevErrors) => ({
      ...prevErrors,
      [fieldName]: "",
    }));
  };

  const toggleEditModal = (payroll = null) => {
    setSelectedPayroll(payroll);
    setPayrollsData({
      payrollPeriod: payroll?.payroll_period || "",
      periodStart: payroll?.payroll_start || "",
      periodEnd: payroll?.payroll_end || "",
      basicPayDays: payroll?.basic_pay_days || 0,
      basicPayRate: payroll?.basic_pay_rate || 0,
      basicPayTotal: payroll?.basic_pay_total || 0,
      holidayDays: payroll?.holiday_days || 0,
      holidayRate: payroll?.holiday_rate || 0,
      holidayTotal: payroll?.holiday_total || 0,
      adjustmentDays: payroll?.adjustment_days || 0,
      adjustmentRate: payroll?.adjustment_rate || 0,
      adjustmentTotal: payroll?.adjustment_total || 0,
      leaveDays: payroll?.leave_days || 0,
      leaveRate: payroll?.leave_rate || 0,
      leaveTotal: payroll?.leave_total || 0,
      managementBonusTotal: payroll?.management_bonus_total || 0,
      thirteenthMonthTotal: payroll?.thirteenth_month_total || 0,
      regularOtHours: payroll?.regular_ot_hours || 0,
      regularOtRate: payroll?.regular_ot_rate || 0,
      regularOtTotal: payroll?.regular_ot_total || 0,
      regularOtNdHours: payroll?.regular_ot_nd_hours || 0,
      regularOtNdRate: payroll?.regular_ot_nd_rate || 0,
      regularOtNdTotal: payroll?.regular_ot_nd_total || 0,
      restDayOtHours: payroll?.rest_day_ot_hours || 0,
      restDayOtRate: payroll?.rest_day_ot_rate || 0,
      restDayOtTotal: payroll?.rest_day_ot_total || 0,
      restDayOtExcessHours: payroll?.rest_day_ot_excess_hours || 0,
      restDayOtExcessRate: payroll?.rest_day_ot_excess_rate || 0,
      restDayOtExcessTotal: payroll?.rest_day_ot_excess_total || 0,
      restDayOtNdHours: payroll?.rest_day_ot_nd_hours || 0,
      restDayOtNdRate: payroll?.rest_day_ot_nd_rate || 0,
      restDayOtNdTotal: payroll?.rest_day_ot_nd_total || 0,
      specialHolidayOtHours: payroll?.special_holiday_ot_hours || 0,
      specialHolidayOtRate: payroll?.special_holiday_ot_rate || 0,
      specialHolidayOtTotal: payroll?.special_holiday_ot_total || 0,
      legalHolidayOtHours: payroll?.legal_holiday_ot_hours || 0,
      legalHolidayOtRate: payroll?.legal_holiday_ot_rate || 0,
      legalHolidayOtTotal: payroll?.legal_holiday_ot_total || 0,
      legalHolidayOtExcessHours: payroll?.legal_holiday_ot_excess_hours || 0,
      legalHolidayOtExcessRate: payroll?.legal_holiday_ot_excess_rate || 0,
      legalHolidayOtExcessTotal: payroll?.legal_holiday_ot_excess_total || 0,
      legalHolidayOtNdHours: payroll?.legal_holiday_ot_nd_hours || 0,
      legalHolidayOtNdRate: payroll?.legal_holiday_ot_nd_rate || 0,
      legalHolidayOtNdTotal: payroll?.legal_holiday_ot_nd_total || 0,
      nightDiffHours: payroll?.night_diff_hours || 0,
      nightDiffRate: payroll?.night_diff_rate || 0,
      nightDiffTotal: payroll?.night_diff_total || 0,
      basicAllowanceTotal: payroll?.basic_allowance_total || 0,
      tempAllowanceTotal: payroll?.temp_allowance_total || 0,
      gross: payroll?.gross || 0,
      sssContribution: payroll?.sss_contribution || 0,
      sssLoan: payroll?.sss_loan || 0,
      philhealthContribution: payroll?.philhealth_contribution || 0,
      pagibigContribution: payroll?.pagibig_contribution || 0,
      pagibigLoan: payroll?.pagibig_loan || 0,
      donation: payroll?.donation || 0,
      cashAdvance: payroll?.cash_advance || 0,
      staffShops: payroll?.staff_shops || 0,
      netPay: payroll?.net_pay || 0,
    });
    setIsEditModalOpen(!isEditModalOpen);
    setErrors({
      payrollPeriod: "",
      periodStart: "",
      periodEnd: "",
      basicPayDays: "",
      basicPayRate: "",
      basicPayTotal: "",
      holidayDays: "",
      holidayRate: "",
      holidayTotal: "",
      adjustmentDays: "",
      adjustmentRate: "",
      adjustmentTotal: "",
      leaveDays: "",
      leaveRate: "",
      leaveTotal: "",
      managementBonusTotal: "",
      thirteenthMonthTotal: "",
      regularOtHours: "",
      regularOtRate: "",
      regularOtTotal: "",
      regularOtNdHours: "",
      regularOtNdRate: "",
      regularOtNdTotal: "",
      restDayOtHours: "",
      restDayOtRate: "",
      restDayOtTotal: "",
      restDayOtExcessHours: "",
      restDayOtExcessRate: "",
      restDayOtExcessTotal: "",
      restDayOtNdHours: "",
      restDayOtNdRate: "",
      restDayOtNdTotal: "",
      specialHolidayOtHours: "",
      specialHolidayOtRate: "",
      specialHolidayOtTotal: "",
      legalHolidayOtHours: "",
      legalHolidayOtRate: "",
      legalHolidayOtTotal: "",
      legalHolidayOtExcessHours: "",
      legalHolidayOtExcessRate: "",
      legalHolidayOtExcessTotal: "",
      legalHolidayOtNdHours: "",
      legalHolidayOtNdRate: "",
      legalHolidayOtNdTotal: "",
      nightDiffHours: "",
      nightDiffRate: "",
      nightDiffTotal: "",
      basicAllowanceTotal: "",
      tempAllowanceTotal: "",
      gross: "",
      sssContribution: "",
      sssLoan: "",
      philhealthContribution: "",
      pagibigContribution: "",
      pagibigLoan: "",
      donation: "",
      cashAdvance: "",
      staffShops: "",
      netPay: "",
      apiError: "",
    });
  };
  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedPayroll(null);
    setPayrollsData({
      payrollPeriod: "",
      periodStart: "",
      periodEnd: "",
      basicPayDays: "",
      basicPayRate: "",
      basicPayTotal: "",
      holidayDays: "",
      holidayRate: "",
      holidayTotal: "",
      managementBonusTotal: "",
      thirteenthMonthTotal: "",
      regularOtHours: "",
      regularOtRate: "",
      regularOtTotal: "",
      regularOtNdHours: "",
      regularOtNdRate: "",
      regularOtNdTotal: "",
      restDayOtHours: "",
      restDayOtRate: "",
      restDayOtTotal: "",
      restDayOtExcessHours: "",
      restDayOtExcessRate: "",
      restDayOtExcessTotal: "",
      restDayOtNdHours: "",
      restDayOtNdRate: "",
      restDayOtNdTotal: "",
      specialHolidayOtHours: "",
      specialHolidayOtRate: "",
      specialHolidayOtTotal: "",
      legalHolidayOtHours: "",
      legalHolidayOtRate: "",
      legalHolidayOtTotal: "",
      legalHolidayOtExcessHours: "",
      legalHolidayOtExcessRate: "",
      legalHolidayOtExcessTotal: "",
      legalHolidayOtNdHours: "",
      legalHolidayOtNdRate: "",
      legalHolidayOtNdTotal: "",
      nightDiffHours: "",
      nightDiffRate: "",
      nightDiffTotal: "",
      basicAllowanceTotal: "",
      tempAllowanceTotal: "",
      gross: "",
      sssContribution: "",
      sssLoan: "",
      philhealthContribution: "",
      pagibigContribution: "",
      pagibigLoan: "",
      donation: "",
      cashAdvance: "",
      staffShops: "",
      netPay: "",
    });
    setErrors({
      payrollPeriod: "",
      periodStart: "",
      periodEnd: "",
      basicPayDays: "",
      basicPayRate: "",
      basicPayTotal: "",
      holidayDays: "",
      holidayRate: "",
      holidayTotal: "",
      managementBonusTotal: "",
      thirteenthMonthTotal: "",
      regularOtHours: "",
      regularOtRate: "",
      regularOtTotal: "",
      regularOtNdHours: "",
      regularOtNdRate: "",
      regularOtNdTotal: "",
      restDayOtHours: "",
      restDayOtRate: "",
      restDayOtTotal: "",
      restDayOtExcessHours: "",
      restDayOtExcessRate: "",
      restDayOtExcessTotal: "",
      restDayOtNdHours: "",
      restDayOtNdRate: "",
      restDayOtNdTotal: "",
      specialHolidayOtHours: "",
      specialHolidayOtRate: "",
      specialHolidayOtTotal: "",
      legalHolidayOtHours: "",
      legalHolidayOtRate: "",
      legalHolidayOtTotal: "",
      legalHolidayOtExcessHours: "",
      legalHolidayOtExcessRate: "",
      legalHolidayOtExcessTotal: "",
      legalHolidayOtNdHours: "",
      legalHolidayOtNdRate: "",
      legalHolidayOtNdTotal: "",
      nightDiffHours: "",
      nightDiffRate: "",
      nightDiffTotal: "",
      basicAllowanceTotal: "",
      tempAllowanceTotal: "",
      gross: "",
      sssContribution: "",
      sssLoan: "",
      philhealthContribution: "",
      pagibigContribution: "",
      pagibigLoan: "",
      donation: "",
      cashAdvance: "",
      staffShops: "",
      netPay: "",
      apiError: "",
    });
  };

  const handleEditPayroll = async (e) => {
    e.preventDefault();

    setErrors({
      apiError: "",
    });

    if (!selectedPayroll || !selectedPayroll.id) {
      setErrors((prev) => ({
        ...prev,
        apiError: "Invalid payroll selected.",
      }));
      return;
    }

    try {
      const response = await axios.put(
        `${API_BASE_URL}/update-payroll/${selectedPayroll.id}`,
        {
          basic_pay_days: payrollsData.basicPayDays,
          basic_pay_rate: payrollsData.basicPayRate,
          basic_pay_total: payrollsData.basicPayTotal,
          holiday_days: payrollsData.holidayDays,
          holiday_rate: payrollsData.holidayRate,
          holiday_total: payrollsData.holidayTotal,
          management_bonus_total: payrollsData.managementBonusTotal,
          thirteenth_month_total: payrollsData.thirteenthMonthTotal,
          regular_ot_hours: payrollsData.regularOtHours,
          regular_ot_rate: payrollsData.regularOtRate,
          regular_ot_total: payrollsData.regularOtTotal,
          regular_ot_nd_hours: payrollsData.regularOtNdHours,
          regular_ot_nd_rate: payrollsData.regularOtNdRate,
          regular_ot_nd_total: payrollsData.regularOtNdTotal,
          rest_day_ot_hours: payrollsData.restDayOtHours,
          rest_day_ot_rate: payrollsData.restDayOtRate,
          rest_day_ot_total: payrollsData.restDayOtTotal,
          rest_day_ot_excess_hours: payrollsData.restDayOtExcessHours,
          rest_day_ot_excess_rate: payrollsData.restDayOtExcessRate,
          rest_day_ot_excess_total: payrollsData.restDayOtExcessTotal,
          rest_day_ot_nd_hours: payrollsData.restDayOtNdHours,
          rest_day_ot_nd_rate: payrollsData.restDayOtNdRate,
          rest_day_ot_nd_total: payrollsData.restDayOtNdTotal,
          special_holiday_ot_hours: payrollsData.specialHolidayOtHours,
          special_holiday_ot_rate: payrollsData.specialHolidayOtRate,
          special_holiday_ot_total: payrollsData.specialHolidayOtTotal,
          legal_holiday_ot_hours: payrollsData.legalHolidayOtHours,
          legal_holiday_ot_rate: payrollsData.legalHolidayOtRate,
          legal_holiday_ot_total: payrollsData.legalHolidayOtTotal,
          legal_holiday_ot_excess_hours: payrollsData.legalHolidayOtExcessHours,
          legal_holiday_ot_excess_rate: payrollsData.legalHolidayOtExcessRate,
          legal_holiday_ot_excess_total: payrollsData.legalHolidayOtExcessTotal,
          legal_holiday_ot_nd_hours: payrollsData.legalHolidayOtNdHours,
          legal_holiday_ot_nd_rate: payrollsData.legalHolidayOtNdRate,
          legal_holiday_ot_nd_total: payrollsData.legalHolidayOtNdTotal,
          night_diff_hours: payrollsData.nightDiffHours,
          night_diff_rate: payrollsData.nightDiffRate,
          night_diff_total: payrollsData.nightDiffTotal,
          basic_allowance_total: payrollsData.basicAllowanceTotal,
          temp_allowance_total: payrollsData.tempAllowanceTotal,
          gross: payrollsData.gross,
          sss_contribution: payrollsData.sssContribution,
          sss_loan: payrollsData.sssLoan,
          philhealth_contribution: payrollsData.philhealthContribution,
          pagibig_contribution: payrollsData.pagibigContribution,
          pagibig_loan: payrollsData.pagibigLoan,
          donation: payrollsData.donation,
          cash_advance: payrollsData.cashAdvance,
          staff_shops: payrollsData.staffShops,
          net_pay: payrollsData.netPay,
        }
      );
      if (response.data.success) {
        setPayrolls((prevPayrolls) =>
          prevPayrolls.map((payroll) =>
            payroll.id === selectedPayroll.id
              ? {
                  ...payroll,
                  basic_pay_days: payrollsData.basicPayDays,
                  basic_pay_rate: payrollsData.basicPayRate,
                  basic_pay_total: payrollsData.basicPayTotal,
                  holiday_days: payrollsData.holidayDays,
                  holiday_rate: payrollsData.holidayRate,
                  holiday_total: payrollsData.holidayTotal,
                  management_bonus_total: payrollsData.managementBonusTotal,
                  thirteenth_month_total: payrollsData.thirteenthMonthTotal,
                  regular_ot_hours: payrollsData.regularOtHours,
                  regular_ot_rate: payrollsData.regularOtRate,
                  regular_ot_total: payrollsData.regularOtTotal,
                  regular_ot_nd_hours: payrollsData.regularOtNdHours,
                  regular_ot_nd_rate: payrollsData.regularOtNdRate,
                  regular_ot_nd_total: payrollsData.regularOtNdTotal,
                  rest_day_ot_hours: payrollsData.restDayOtHours,
                  rest_day_ot_rate: payrollsData.restDayOtRate,
                  rest_day_ot_total: payrollsData.restDayOtTotal,
                  rest_day_ot_excess_hours: payrollsData.restDayOtExcessHours,
                  rest_day_ot_excess_rate: payrollsData.restDayOtExcessRate,
                  rest_day_ot_excess_total: payrollsData.restDayOtExcessTotal,
                  rest_day_ot_nd_hours: payrollsData.restDayOtNdHours,
                  rest_day_ot_nd_rate: payrollsData.restDayOtNdRate,
                  rest_day_ot_nd_total: payrollsData.restDayOtNdTotal,
                  special_holiday_ot_hours: payrollsData.specialHolidayOtHours,
                  special_holiday_ot_rate: payrollsData.specialHolidayOtRate,
                  special_holiday_ot_total: payrollsData.specialHolidayOtTotal,
                  legal_holiday_ot_hours: payrollsData.legalHolidayOtHours,
                  legal_holiday_ot_rate: payrollsData.legalHolidayOtRate,
                  legal_holiday_ot_total: payrollsData.legalHolidayOtTotal,
                  legal_holiday_ot_excess_hours:
                    payrollsData.legalHolidayOtExcessHours,
                  legal_holiday_ot_excess_rate:
                    payrollsData.legalHolidayOtExcessRate,
                  legal_holiday_ot_excess_total:
                    payrollsData.legalHolidayOtExcessTotal,
                  legal_holiday_ot_nd_hours: payrollsData.legalHolidayOtNdHours,
                  legal_holiday_ot_nd_rate: payrollsData.legalHolidayOtNdRate,
                  legal_holiday_ot_nd_total: payrollsData.legalHolidayOtNdTotal,
                  night_diff_hours: payrollsData.nightDiffHours,
                  night_diff_rate: payrollsData.nightDiffRate,
                  night_diff_total: payrollsData.nightDiffTotal,
                  basic_allowance_total: payrollsData.basicAllowanceTotal,
                  temp_allowance_total: payrollsData.tempAllowanceTotal,
                  gross: payrollsData.gross,
                  sss_contribution: payrollsData.sssContribution,
                  sss_loan: payrollsData.sssLoan,
                  philhealth_contribution: payrollsData.philhealthContribution,
                  pagibig_contribution: payrollsData.pagibigContribution,
                  pagibig_loan: payrollsData.pagibigLoan,
                  donation: payrollsData.donation,
                  cash_advance: payrollsData.cashAdvance,
                  staff_shops: payrollsData.staffShops,
                  net_pay: payrollsData.netPay,
                }
              : payroll
          )
        );
        fetchPayrolls();
        closeEditModal();
      } else {
        setErrors((prev) => ({
          ...prev,
          apiError: response.data.message || "An error occured.",
        }));
      }
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        apiError: error.response?.data?.message || "Something went wrong.",
      }));
    }
  };

  const toggleConfirmModal = (payroll = null) => {
    setSelectedPayroll(payroll);
    setIsConfirmModalOpen(!isConfirmModalOpen);
  };

  const closeConfirmModal = () => {
    setSelectedPayroll(null);
    setIsConfirmModalOpen(false);
  };

  const handleConfirmPayroll = async () => {
    if (!selectedPayroll) return;

    try {
      const response = await axios.put(
        `${API_BASE_URL}/confirm-payroll/${selectedPayroll.id}`
      );

      if (response.data.success) {
        setPayrolls((prevPayrolls) =>
          prevPayrolls.filter((payroll) => payroll.id !== selectedPayroll.id)
        );
        fetchPayrolls();
        closeConfirmModal();
      }
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        apiError:
          error.response?.data?.message || "An error occurred while deleting.",
      }));
    }
  };

  const toggleDeleteModal = (payroll = null) => {
    setSelectedPayroll(payroll);
    setIsDeleteModalOpen(!isDeleteModalOpen);
  };

  const closeDeleteModal = () => {
    setSelectedPayroll(null);
    setIsDeleteModalOpen(false);
  };

  const handleDeletePayroll = async () => {
    if (!selectedPayroll) return;

    try {
      const response = await axios.delete(
        `${API_BASE_URL}/delete-payroll/${selectedPayroll.id}`
      );

      if (response.data.success) {
        setPayrolls((prevPayrolls) =>
          prevPayrolls.filter((payroll) => payroll.id !== selectedPayroll.id)
        );
        fetchPayrolls();
        closeDeleteModal();
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

  const payrollPeriodOptions = [
    {
      value: "Payroll Period 1",
      label: "Payroll Period 1",
    },
    {
      value: "Payroll Period 2",
      label: "Payroll Period 2",
    },
  ];

  const roleOptions = [
    {
      value: "Admin",
      label: "Admin",
    },
    {
      value: "Driver",
      label: "Driver",
    },
    {
      value: "Crew",
      label: "Crew",
    },
  ];
  return (
    <div className={styles["payrolls-content"]}>
      <div className={styles["content-header-container"]}>
        <h1 className={styles["page-title"]}>Payroll</h1>
      </div>
      <div className={styles["content-body-container"]}>
        <div className={styles["add-payroll-button-container"]}></div>
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
                <th className={styles.th}>Department</th>
                <th className={styles.th}>Rate</th>
                <th className={styles.th}>Hours</th>
                <th className={styles.th}>Gross</th>
                <th className={styles.th}>SSS Contribution</th>
                <th className={styles.th}>SSS Loan</th>
                <th className={styles.th}>PAGIBIG Contribution</th>
                <th className={styles.th}>PAGIBIG Loan</th>
                <th className={styles.th}>Philhealth Contribution</th>
                <th className={styles.th}>Staffshop</th>
                <th className={styles.th}>Cash Advance</th>
                <th className={styles.th}>Total Deduction</th>
                <th className={styles.th}>Net Pay</th>
                <th className={styles.th}>Period</th>
                <th className={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody className={styles.tbody}>
              {paginatedPayrolls.map((payroll, index) => (
                <React.Fragment key={index}>
                  <tr className={styles.btr}>
                    <td className={`${styles.td} ${styles["full-name-td"]}`}>
                      <span
                        className={`${styles.status} ${
                          payroll.status === "Pending"
                            ? styles["status-pending"]
                            : payroll.status === "Unpaid"
                            ? styles["status-unpaid"]
                            : payroll.status === "Paid"
                            ? styles["status-paid"]
                            : ""
                        }`}
                      ></span>
                      {payroll.full_name}
                    </td>
                    <td className={styles.td}>
                      {payroll.department_name} {payroll.role}
                    </td>
                    <td className={styles.td}>₱{payroll.basic_pay_rate}</td>
                    <td className={styles.td}>{payroll.basic_pay_days}</td>
                    <td className={styles.td}>₱{payroll.gross}</td>
                    <td className={styles.td}>₱{payroll.sss_contribution}</td>
                    <td className={styles.td}>₱{payroll.sss_loan}</td>
                    <td className={styles.td}>
                      ₱{payroll.pagibig_contribution}
                    </td>
                    <td className={styles.td}>₱{payroll.pagibig_loan}</td>
                    <td className={styles.td}>
                      ₱{payroll.philhealth_contribution}
                    </td>
                    <td className={styles.td}>₱{payroll.staff_shops}</td>
                    <td className={styles.td}>₱{payroll.cash_advance}</td>
                    <td className={styles.td}>₱{payroll.total_deductions}</td>
                    <td className={styles.td}>₱{payroll.net_pay}</td>
                    <td className={styles.td}>
                      {new Date(payroll.period_start).toLocaleDateString(
                        "en-US",
                        {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        }
                      )}{" "}
                      -{" "}
                      {new Date(payroll.period_end).toLocaleDateString(
                        "en-US",
                        {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        }
                      )}
                    </td>
                    <td className={styles.td}>
                      <div className={styles["action-container"]}>
                        <button
                          className={styles["check-button"]}
                          onMouseEnter={() => setIsCheckHovered(index)}
                          onMouseLeave={() => setIsCheckHovered(null)}
                          onClick={() => toggleConfirmModal(payroll)}
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
                        </button>
                        <button
                          className={styles["edit-button"]}
                          onMouseEnter={() => setIsEditHovered(index)}
                          onMouseLeave={() => setIsEditHovered(null)}
                          onClick={() => toggleEditModal(payroll)}
                        >
                          <img
                            className={styles["edit-icon"]}
                            src={
                              isEditHovered === index ? editHoverIcon : editIcon
                            }
                            alt="Edit"
                          />
                        </button>
                        <button
                          className={styles["delete-button"]}
                          onMouseEnter={() => setIsDeleteHovered(index)}
                          onMouseLeave={() => setIsDeleteHovered(null)}
                          onClick={() => toggleDeleteModal(payroll)}
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
                        </button>
                      </div>
                    </td>
                  </tr>
                </React.Fragment>
              ))}
              {paginatedPayrolls.length === 0 && (
                <tr className={styles.btr}>
                  <td
                    colSpan="7"
                    className={`${styles.td} ${styles["search-response"]}`}
                  >
                    No payrolls found.
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
      {isEditModalOpen && selectedPayroll && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
        >
          <div
            className={`${styles["modal-container"]} ${styles["edit-modal-container"]}`}
          >
            <div className={styles["modal-header-container"]}>
              <h3 className={styles["modal-title"]}>Edit Payroll</h3>
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
              onSubmit={handleEditPayroll}
            >
              <div className={styles["payroll-table-container"]}>
                <table className={styles.table}>
                  <thead className={styles.thead}>
                    <tr className={styles.htr}>
                      <th className={`${styles.pth} ${styles["pth-label"]}`}>
                        Additional
                      </th>
                      <th className={styles.pth}>No. of Days</th>
                      <th className={styles.pth}>Rate</th>
                      <th className={styles.pth}>Total</th>
                    </tr>
                  </thead>
                  <tbody className={styles.tbody}>
                    <tr className={styles.htr}>
                      <th className={styles.pth}>Basic Pay</th>
                      <td className={styles.ptd}>
                        <input
                          className={`${styles.input} ${styles["payroll-input"]}`}
                          type="number"
                          name="basicPayDays"
                          value={payrollsData.basicPayDays || 0}
                          onChange={handleInputChange}
                        />
                      </td>
                      <td className={styles.ptd}>
                        <input
                          className={`${styles.input} ${styles["payroll-input"]}`}
                          type="number"
                          name="basicPayRate"
                          value={payrollsData.basicPayRate || 0}
                          onChange={handleInputChange}
                        />
                      </td>
                      <td className={styles.ptd}>
                        <input
                          className={`${styles.input} ${styles["payroll-input"]}`}
                          type="number"
                          name="basicPayTotal"
                          onChange={handleInputChange}
                          value={payrollsData.basicPayTotal || 0}
                          readOnly
                        />
                      </td>
                    </tr>
                    <tr className={styles.htr}>
                      <th className={styles.pth}>Holiday</th>
                      <td className={styles.ptd}>
                        <input
                          className={`${styles.input} ${styles["payroll-input"]}`}
                          type="number"
                          name="holidayDays"
                          value={payrollsData.holidayDays || 0}
                          onChange={handleInputChange}
                        />
                      </td>
                      <td className={styles.ptd}>
                        <input
                          className={`${styles.input} ${styles["payroll-input"]}`}
                          type="number"
                          name="holidayRate"
                          value={payrollsData.holidayRate || 0}
                          onChange={handleInputChange}
                        />
                      </td>
                      <td className={styles.ptd}>
                        <input
                          className={`${styles.input} ${styles["payroll-input"]}`}
                          type="number"
                          name="holidayTotal"
                          onChange={handleInputChange}
                          value={payrollsData.holidayTotal || 0}
                          readOnly
                        />
                      </td>
                    </tr>
                    <tr className={styles.htr}>
                      <th className={styles.pth}>Adjustments</th>
                      <td className={styles.ptd}>
                        <input
                          className={`${styles.input} ${styles["payroll-input"]}`}
                          type="number"
                          name="adjustmentDays"
                          value={payrollsData.adjustmentDays || 0}
                          onChange={handleInputChange}
                        />
                      </td>
                      <td className={styles.ptd}>
                        <input
                          className={`${styles.input} ${styles["payroll-input"]}`}
                          type="number"
                          name="adjustmentRate"
                          value={payrollsData.adjustmentRate || 0}
                          onChange={handleInputChange}
                        />
                      </td>
                      <td className={styles.ptd}>
                        <input
                          className={`${styles.input} ${styles["payroll-input"]}`}
                          type="number"
                          name="adjustmentTotal"
                          onChange={handleInputChange}
                          value={payrollsData.adjustmentTotal || 0}
                          readOnly
                        />
                      </td>
                    </tr>
                    <tr className={styles.htr}>
                      <th className={styles.pth}>Leaves</th>
                      <td className={styles.ptd}>
                        <input
                          className={`${styles.input} ${styles["payroll-input"]}`}
                          type="number"
                          name="leaveDays"
                          onChange={handleInputChange}
                          value={payrollsData.leaveDays || 0}
                        />
                      </td>
                      <td className={styles.ptd}>
                        <input
                          className={`${styles.input} ${styles["payroll-input"]}`}
                          type="number"
                          name="leaveRate"
                          onChange={handleInputChange}
                          value={payrollsData.leaveRate || 0}
                        />
                      </td>
                      <td className={styles.ptd}>
                        <input
                          className={`${styles.input} ${styles["payroll-input"]}`}
                          type="number"
                          name="leaveTotal"
                          onChange={handleInputChange}
                          value={payrollsData.leaveTotal || 0}
                          readOnly
                        />
                      </td>
                    </tr>
                    <tr className={styles.htr}>
                      <th className={styles.pth}>Management Bonus</th>
                      <td className={styles.ptd}></td>
                      <td className={styles.ptd}></td>
                      <td className={styles.ptd}>
                        <input
                          className={`${styles.input} ${styles["payroll-input"]}`}
                          type="number"
                          name="managementBonusTotal"
                          onChange={handleInputChange}
                          value={payrollsData.managementBonusTotal || 0}
                        />
                      </td>
                    </tr>
                    <tr className={styles.htr}>
                      <th className={styles.pth}>13th Month Pay</th>
                      <td className={styles.ptd}></td>
                      <td className={styles.ptd}></td>
                      <td className={styles.ptd}>
                        <input
                          className={`${styles.input} ${styles["payroll-input"]}`}
                          type="number"
                          name="thirteenthMonthTotal"
                          onChange={handleInputChange}
                          value={payrollsData.thirteenthMonthTotal || 0}
                        />
                      </td>
                    </tr>
                  </tbody>
                  <thead className={styles.thead}>
                    <tr className={styles.htr}>
                      <th className={`${styles.pth} ${styles["pth-label"]}`}>
                        Overtime
                      </th>
                      <th className={styles.pth}>No. of Hours</th>
                      <th className={styles.pth}>Rate</th>
                      <th className={styles.pth}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className={styles.htr}>
                      <th className={styles.pth}>Regular OT</th>
                      <td className={styles.ptd}>
                        <input
                          className={`${styles.input} ${styles["payroll-input"]}`}
                          type="number"
                          name="regularOtHours"
                          onChange={handleInputChange}
                          value={payrollsData.regularOtHours || 0}
                        />
                      </td>
                      <td className={styles.ptd}>
                        <input
                          className={`${styles.input} ${styles["payroll-input"]}`}
                          type="number"
                          name="regularOtRate"
                          onChange={handleInputChange}
                          value={payrollsData.regularOtRate}
                        />
                      </td>
                      <td className={styles.ptd}>
                        <input
                          className={`${styles.input} ${styles["payroll-input"]}`}
                          type="number"
                          name="regularOtTotal"
                          onChange={handleInputChange}
                          value={payrollsData.regularOtTotal || 0}
                          readOnly
                        />
                      </td>
                    </tr>
                    <tr className={styles.htr}>
                      <th className={styles.pth}>Regular OT ND</th>
                      <td className={styles.ptd}>
                        <input
                          className={`${styles.input} ${styles["payroll-input"]}`}
                          type="number"
                          name="regularOtNdHours"
                          onChange={handleInputChange}
                          value={payrollsData.regularOtNdHours || 0}
                        />
                      </td>
                      <td className={styles.ptd}>
                        <input
                          className={`${styles.input} ${styles["payroll-input"]}`}
                          type="number"
                          name="regularOtNdRate"
                          onChange={handleInputChange}
                          value={payrollsData.regularOtNdRate || 0}
                        />
                      </td>
                      <td className={styles.ptd}>
                        <input
                          className={`${styles.input} ${styles["payroll-input"]}`}
                          type="number"
                          name="regularOtNdTotal"
                          onChange={handleInputChange}
                          value={payrollsData.regularOtNdTotal || 0}
                          readOnly
                        />
                      </td>
                    </tr>
                    <tr className={styles.htr}>
                      <th className={styles.pth}>Rest Day OT</th>
                      <td className={styles.ptd}>
                        <input
                          className={`${styles.input} ${styles["payroll-input"]}`}
                          type="number"
                          name="restDayOtHours"
                          onChange={handleInputChange}
                          value={payrollsData.restDayOtHours || 0}
                        />
                      </td>
                      <td className={styles.ptd}>
                        <input
                          className={`${styles.input} ${styles["payroll-input"]}`}
                          type="number"
                          name="restDayOtRate"
                          onChange={handleInputChange}
                          value={payrollsData.restDayOtRate || 0}
                        />
                      </td>
                      <td className={styles.ptd}>
                        <input
                          className={`${styles.input} ${styles["payroll-input"]}`}
                          type="number"
                          name="restDayOtTotal"
                          onChange={handleInputChange}
                          value={payrollsData.restDayOtTotal || 0}
                          readOnly
                        />
                      </td>
                    </tr>
                    <tr className={styles.htr}>
                      <th className={styles.pth}>Rest Day OT Excess</th>
                      <td className={styles.ptd}>
                        <input
                          className={`${styles.input} ${styles["payroll-input"]}`}
                          type="number"
                          name="restDayOtExcessHours"
                          onChange={handleInputChange}
                          value={payrollsData.restDayOtExcessHours || 0}
                        />
                      </td>
                      <td className={styles.ptd}>
                        <input
                          className={`${styles.input} ${styles["payroll-input"]}`}
                          type="number"
                          name="restDayOtExcessRate"
                          onChange={handleInputChange}
                          value={payrollsData.restDayOtExcessRate || 0}
                        />
                      </td>
                      <td className={styles.ptd}>
                        <input
                          className={`${styles.input} ${styles["payroll-input"]}`}
                          type="number"
                          name="restDayOtExcessTotal"
                          onChange={handleInputChange}
                          value={payrollsData.restDayOtExcessTotal || 0}
                          readOnly
                        />
                      </td>
                    </tr>
                    <tr className={styles.htr}>
                      <th className={styles.pth}>Rest Day OT ND</th>
                      <td className={styles.ptd}>
                        <input
                          className={`${styles.input} ${styles["payroll-input"]}`}
                          type="number"
                          name="restDayOtNdHours"
                          onChange={handleInputChange}
                          value={payrollsData.restDayOtNdHours || 0}
                        />
                      </td>
                      <td className={styles.ptd}>
                        <input
                          className={`${styles.input} ${styles["payroll-input"]}`}
                          type="number"
                          name="restDayOtNdRate"
                          onChange={handleInputChange}
                          value={payrollsData.restDayOtNdRate || 0}
                        />
                      </td>
                      <td className={styles.ptd}>
                        <input
                          className={`${styles.input} ${styles["payroll-input"]}`}
                          type="number"
                          name="restDayOtNdTotal"
                          onChange={handleInputChange}
                          value={payrollsData.restDayOtNdTotal || 0}
                          readOnly
                        />
                      </td>
                    </tr>
                    <tr className={styles.htr}>
                      <th className={styles.pth}>Special Holiday OT</th>
                      <td className={styles.ptd}>
                        <input
                          className={`${styles.input} ${styles["payroll-input"]}`}
                          type="number"
                          name="specialHolidayOtHours"
                          onChange={handleInputChange}
                          value={payrollsData.specialHolidayOtHours || 0}
                        />
                      </td>
                      <td className={styles.ptd}>
                        <input
                          className={`${styles.input} ${styles["payroll-input"]}`}
                          type="number"
                          name="specialHolidayOtRate"
                          onChange={handleInputChange}
                          value={payrollsData.specialHolidayOtRate || 0}
                        />
                      </td>
                      <td className={styles.ptd}>
                        <input
                          className={`${styles.input} ${styles["payroll-input"]}`}
                          type="number"
                          name="specialHolidayOtTotal"
                          onChange={handleInputChange}
                          value={payrollsData.specialHolidayOtTotal || 0}
                          readOnly
                        />
                      </td>
                    </tr>
                    <tr className={styles.htr}>
                      <th className={styles.pth}>Legal Hol OT</th>
                      <td className={styles.ptd}>
                        <input
                          className={`${styles.input} ${styles["payroll-input"]}`}
                          type="number"
                          name="legalHolidayOtHours"
                          onChange={handleInputChange}
                          value={payrollsData.legalHolidayOtHours || 0}
                        />
                      </td>
                      <td className={styles.ptd}>
                        <input
                          className={`${styles.input} ${styles["payroll-input"]}`}
                          type="number"
                          name="legalHolidayOtRate"
                          onChange={handleInputChange}
                          value={payrollsData.legalHolidayOtRate || 0}
                        />
                      </td>
                      <td className={styles.ptd}>
                        <input
                          className={`${styles.input} ${styles["payroll-input"]}`}
                          type="number"
                          name="legalHolidayOtTotal"
                          onChange={handleInputChange}
                          value={payrollsData.legalHolidayOtTotal || 0}
                          readOnly
                        />
                      </td>
                    </tr>
                    <tr className={styles.htr}>
                      <th className={styles.pth}>Legal Hol OT Excess</th>
                      <td className={styles.ptd}>
                        <input
                          className={`${styles.input} ${styles["payroll-input"]}`}
                          type="number"
                          name="legalHolidayOtExcessHours"
                          onChange={handleInputChange}
                          value={payrollsData.legalHolidayOtExcessHours || 0}
                        />
                      </td>
                      <td className={styles.ptd}>
                        <input
                          className={`${styles.input} ${styles["payroll-input"]}`}
                          type="number"
                          name="legalHolidayOtExcessRate"
                          onChange={handleInputChange}
                          value={payrollsData.legalHolidayOtExcessRate || 0}
                        />
                      </td>
                      <td className={styles.ptd}>
                        <input
                          className={`${styles.input} ${styles["payroll-input"]}`}
                          type="number"
                          name="legalHolidayOtExcessTotal"
                          onChange={handleInputChange}
                          value={payrollsData.legalHolidayOtExcessTotal || 0}
                          readOnly
                        />
                      </td>
                    </tr>
                    <tr className={styles.htr}>
                      <th className={styles.pth}>Legal Hol OT ND</th>
                      <td className={styles.ptd}>
                        <input
                          className={`${styles.input} ${styles["payroll-input"]}`}
                          type="number"
                          name="legalHolidayOtNdHours"
                          onChange={handleInputChange}
                          value={payrollsData.legalHolidayOtNdHours || 0}
                        />
                      </td>
                      <td className={styles.ptd}>
                        <input
                          className={`${styles.input} ${styles["payroll-input"]}`}
                          type="number"
                          name="legalHolidayOtNdRate"
                          onChange={handleInputChange}
                          value={payrollsData.legalHolidayOtNdRate || 0}
                        />
                      </td>
                      <td className={styles.ptd}>
                        <input
                          className={`${styles.input} ${styles["payroll-input"]}`}
                          type="number"
                          name="legalHolidayOtNdRate"
                          onChange={handleInputChange}
                          value={payrollsData.legalHolidayOtNdTotal || 0}
                          readOnly
                        />
                      </td>
                    </tr>
                    <tr className={styles.htr}>
                      <th className={styles.pth}>Night Diff</th>
                      <td className={styles.ptd}>
                        <input
                          className={`${styles.input} ${styles["payroll-input"]}`}
                          type="number"
                          name="nightDiffHours"
                          onChange={handleInputChange}
                          value={payrollsData.nightDiffHours || 0}
                        />
                      </td>
                      <td className={styles.ptd}>
                        <input
                          className={`${styles.input} ${styles["payroll-input"]}`}
                          type="number"
                          name="nightDiffRate"
                          onChange={handleInputChange}
                          value={payrollsData.nightDiffRate || 0}
                        />
                      </td>
                      <td className={styles.ptd}>
                        <input
                          className={`${styles.input} ${styles["payroll-input"]}`}
                          type="number"
                          name="nightDiffTotal"
                          onChange={handleInputChange}
                          value={payrollsData.nightDiffTotal || 0}
                          readOnly
                        />
                      </td>
                    </tr>
                  </tbody>
                  <thead className={styles.thead}>
                    <tr className={styles.htr}>
                      <th className={`${styles.pth} ${styles["pth-label"]}`}>
                        Allowances
                      </th>
                      <th className={styles.pth}></th>
                      <th className={styles.pth}></th>
                      <th className={styles.pth}>Total</th>
                    </tr>
                  </thead>
                  <tbody className={styles.tbody}>
                    <tr className={styles.htr}>
                      <th className={styles.pth}>Basic Allowance</th>
                      <td className={styles.ptd}></td>
                      <td className={styles.ptd}></td>
                      <td className={styles.ptd}>
                        <input
                          className={`${styles.input} ${styles["payroll-input"]}`}
                          type="number"
                          name="basicAllowanceTotal"
                          onChange={handleInputChange}
                          value={payrollsData.basicAllowanceTotal || 0}
                        />
                      </td>
                    </tr>
                    <tr className={styles.htr}>
                      <th className={styles.pth}>Temp Allowance</th>
                      <td className={styles.ptd}></td>
                      <td className={styles.ptd}></td>
                      <td className={styles.ptd}>
                        <input
                          className={`${styles.input} ${styles["payroll-input"]}`}
                          type="number"
                          name="tempAllowanceTotal"
                          onChange={handleInputChange}
                          value={payrollsData.tempAllowanceTotal || 0}
                        />
                      </td>
                    </tr>
                    <tr className={styles.htr}>
                      <th className={styles.pth}>Total Earnings</th>
                      <td className={styles.ptd}></td>
                      <td className={styles.ptd}></td>
                      <td className={styles.ptd}>
                        <input
                          className={`${styles.input} ${styles["payroll-input"]}`}
                          type="number"
                          name="gross"
                          onChange={handleInputChange}
                          value={payrollsData.gross || 0}
                          readOnly
                        />
                      </td>
                    </tr>
                  </tbody>
                  <thead className={styles.thead}>
                    <tr className={styles.htr}>
                      <th className={`${styles.pth} ${styles["pth-label"]}`}>
                        Deductions
                      </th>
                      <th className={styles.pth}></th>
                      <th className={styles.pth}></th>
                      <th className={styles.pth}>Total</th>
                    </tr>
                  </thead>
                  <tbody className={styles.tbody}>
                    <tr className={styles.htr}>
                      <th className={styles.pth}>SSS Contribution</th>
                      <td className={styles.ptd}></td>
                      <td className={styles.ptd}></td>
                      <td className={styles.ptd}>
                        <input
                          className={`${styles.input} ${styles["payroll-input"]}`}
                          type="number"
                          name="sssContribution"
                          onChange={handleInputChange}
                          value={payrollsData.sssContribution || 0}
                        />
                      </td>
                    </tr>
                    <tr className={styles.htr}>
                      <th className={styles.pth}>SSS Loan</th>
                      <td className={styles.ptd}></td>
                      <td className={styles.ptd}></td>
                      <td className={styles.ptd}>
                        <input
                          className={`${styles.input} ${styles["payroll-input"]}`}
                          type="number"
                          name="sssLoan"
                          onChange={handleInputChange}
                          value={payrollsData.sssLoan || 0}
                        />
                      </td>
                    </tr>
                    <tr className={styles.htr}>
                      <th className={styles.pth}>Pag-IBIG Contribution</th>
                      <td className={styles.ptd}></td>
                      <td className={styles.ptd}></td>
                      <td className={styles.ptd}>
                        <input
                          className={`${styles.input} ${styles["payroll-input"]}`}
                          type="number"
                          name="pagibigContribution"
                          onChange={handleInputChange}
                          value={payrollsData.pagibigContribution || 0}
                        />
                      </td>
                    </tr>
                    <tr className={styles.htr}>
                      <th className={styles.pth}>Pag-IBIG Loan</th>
                      <td className={styles.ptd}></td>
                      <td className={styles.ptd}></td>
                      <td className={styles.ptd}>
                        <input
                          className={`${styles.input} ${styles["payroll-input"]}`}
                          type="number"
                          name="pagibigLoan"
                          onChange={handleInputChange}
                          value={payrollsData.pagibigLoan || 0}
                        />
                      </td>
                    </tr>
                    <tr className={styles.htr}>
                      <th className={styles.pth}>PhilHealth Contribution</th>
                      <td className={styles.ptd}></td>
                      <td className={styles.ptd}></td>
                      <td className={styles.ptd}>
                        <input
                          className={`${styles.input} ${styles["payroll-input"]}`}
                          type="number"
                          name="philhealthContribution"
                          onChange={handleInputChange}
                          value={payrollsData.philhealthContribution || 0}
                        />
                      </td>
                    </tr>
                    <tr className={styles.htr}>
                      <th className={styles.pth}>Donation</th>
                      <td className={styles.ptd}></td>
                      <td className={styles.ptd}></td>
                      <td className={styles.ptd}>
                        <input
                          className={`${styles.input} ${styles["payroll-input"]}`}
                          type="number"
                          name="donation"
                          onChange={handleInputChange}
                          value={payrollsData.donation || 0}
                        />
                      </td>
                    </tr>
                    <tr className={styles.htr}>
                      <th className={styles.pth}>Cash Advance</th>
                      <td className={styles.ptd}></td>
                      <td className={styles.ptd}></td>
                      <td className={styles.ptd}>
                        <input
                          className={`${styles.input} ${styles["payroll-input"]}`}
                          type="number"
                          name="cashAdvance"
                          onChange={handleInputChange}
                          value={payrollsData.cashAdvance || 0}
                        />
                      </td>
                    </tr>
                    <tr className={styles.htr}>
                      <th className={styles.pth}>Staff Shops</th>
                      <td className={styles.ptd}></td>
                      <td className={styles.ptd}></td>
                      <td className={styles.ptd}>
                        <input
                          className={`${styles.input} ${styles["payroll-input"]}`}
                          type="number"
                          name="staffShops"
                          onChange={handleInputChange}
                          value={payrollsData.staffShops || 0}
                        />
                      </td>
                    </tr>
                    <tr className={styles.htr}>
                      <th className={styles.pth}>Net Pay</th>
                      <td className={styles.ptd}></td>
                      <td className={styles.ptd}></td>
                      <td className={styles.ptd}>
                        <input
                          className={`${styles.input} ${styles["payroll-input"]}`}
                          type="number"
                          name="netPay"
                          onChange={handleInputChange}
                          value={payrollsData.netPay || 0}
                          readOnly
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              {errors.apiError && (
                <p className={styles["error-message"]}>{errors.apiError}</p>
              )}
              <button className={styles["submit-button"]}>Submit</button>
            </form>
          </div>
        </Modal>
      )}
      {isConfirmModalOpen && selectedPayroll && (
        <Modal
          isOpen={isConfirmModalOpen}
          onClose={() => setIsConfirmModalOpen(false)}
        >
          <div
            className={`${styles["modal-container"]} ${styles["confirm-modal-container"]}`}
          >
            <h1 className={styles["confirm-modal-header"]}>
              Confirm payment for {selectedPayroll.full_name}
            </h1>
            <div className={styles["confirm-modal-button-container"]}>
              <button
                className={styles["confirm-modal-button"]}
                onClick={handleConfirmPayroll}
              >
                Confirm
              </button>
              <button
                className={styles["cancel-confirm-modal-button"]}
                onClick={closeConfirmModal}
              >
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}
      {isDeleteModalOpen && selectedPayroll && (
        <Modal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
        >
          <div
            className={`${styles["modal-container"]} ${styles["delete-modal-container"]}`}
          >
            <h1 className={styles["delete-modal-header"]}>
              Are you sure to delete this payroll?
            </h1>
            <div className={styles["delete-modal-button-container"]}>
              <button
                className={styles["delete-modal-button"]}
                onClick={handleDeletePayroll}
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

export default FINCurrentPayroll;
