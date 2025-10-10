import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import Modal from "../../Modal";
import styles from "../../../assets/styles/HRUsers.module.css";
import crossIcon from "../../../assets/images/cross-icon.svg";
import cameraIcon from "../../../assets/images/camera-icon.svg";
import userIcon from "../../../assets/images/user-image-icon.svg";
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
import Philippines from "phil-reg-prov-mun-brgy";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

const HRUsers = () => {
  const [users, setUsers] = useState([]);
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
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
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
  const [step, setStep] = useState(1);
  const [previewImage, setPreviewImage] = useState(userIcon);
  const fileInputRef = useRef(null);
  const [usersData, setUsersData] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    gender: "",
    birthDate: "",
    region: null,
    province: null,
    municipality: null,
    barangay: null,
    street: "",
    company: "",
    email: "",
    phoneNumber: "",
    departmentId: null,
    role: "",
    branch: "",
    salary: "",
    password: "",
    repeatPassword: "",
    imageFileName: "",
  });
  const [errors, setErrors] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    gender: "",
    birthDate: "",
    region: "",
    province: "",
    municipality: "",
    barangay: "",
    street: "",
    company: "",
    email: "",
    phoneNumber: "",
    departmentId: "",
    role: "",
    branch: "",
    salary: "",
    password: "",
    repeatPassword: "",
    imageFileName: "",
    apiError: "",
  });

  const isDarkMode =
    document.documentElement.getAttribute("data-theme") === "dark";

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/users`);
      if (response.data.success) {
        const admins = response.data.data.filter(
          (user) => user.role !== "Manager" && user.role !== "Corporate"
        );
        setUsers(admins);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users
    .filter((user) => {
      const userName = (user.full_name || "").toLowerCase();
      const matchesSearch = userName.includes(search.toLowerCase());

      const userDate = user.created_at
        ? new Date(user.created_at.split("T")[0])
        : new Date();
      const iswithinDateRange =
        (!appliedFromDate || userDate >= new Date(appliedFromDate)) &&
        (!appliedToDate || userDate <= new Date(appliedToDate));

      return matchesSearch && iswithinDateRange;
    })
    .sort((a, b) => {
      if (sortOrder === "date-asc")
        return new Date(a.created_at) - new Date(b.created_at);
      if (sortOrder === "date-desc")
        return new Date(b.created_at) - new Date(a.created_at);

      if (sortOrder === "full_name-asc") {
        return (a.full_name || "").localeCompare(b.full_name || "");
      }
      if (sortOrder === "full_name-desc") {
        return (b.full_name || "").localeCompare(a.full_name || "");
      }

      return 0;
    });

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice(
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
    "First Name",
    "Middle Name",
    "Last Name",
    "Gender",
    "Date of Birth",
    "Email",
    "Phone Number",
    "Region",
    "Province",
    "Municipality",
    "Barangay",
    "Street",
    "Department Name",
    "Role",
    "Branch",
    "Salary Type",
    "Salary",
    "Created At",
  ];

  const exportToExcel = (data) => {
    const formattedData = data.map((item, index) => ({
      ID: index + 1,
      "First Name": item.first_name || "",
      "Middle Name": item.middle_name || "",
      "Last Name": item.last_name || "",
      Gender: item.gender || "",
      "Date of Birth": formatDate(item.birth_date),
      Email: item.email || "",
      "Phone Number": item.phone_number || "",
      Region: item.region || "",
      Province: item.province || "",
      Municipality: item.municipality || "",
      Barangay: item.barangay || "",
      Street: item.street || "",
      "Department Name": item.department_name || "",
      Role: item.role || "",
      Branch: item.branch || "",
      Salary: item.salary || "",
      "Created At": formatDate(item.created_at),
    }));

    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Users");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
    });

    saveAs(blob, "users.xlsx");
  };

  const exportToPDF = (data) => {
    const doc = new jsPDF("landscape");
    doc.text("Users Report", 14, 10);

    const tableRows = data.map((item, index) => [
      index + 1,
      item.first_name || "",
      item.middle_name || "",
      item.last_name || "",
      item.gender || "",
      formatDate(item.birth_date),
      item.email || "",
      item.phone_number || "",
      item.region || "",
      item.province || "",
      item.municipality || "",
      item.barangay || "",
      item.street || "",
      item.department_name || "",
      item.role || "",
      item.branch || "",
      item.salary || "",
      formatDate(item.created_at),
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 20,
    });

    doc.save("users.pdf");
  };

  const exportToWord = (data) => {
    const columnKeyMap = {
      ID: "id",
      "First Name": "first_name",
      "Middle Name": "middle_name",
      "Last Name": "last_name",
      Gender: "gender",
      "Date of Birth": "birth_date",
      Email: "email",
      "Phone Number": "phone_number",
      Region: "region",
      Province: "province",
      Municipality: "municipality",
      Barangay: "barangay",
      Street: "street",
      "Department Name": "department_name",
      Role: "role",
      Branch: "branch",
      Salary: "salary",
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
      saveAs(blob, "users.docx");
    });
  };

  const handleExport = () => {
    if (!exportFileType) {
      setExportError("Please select an export format.");
      return;
    }

    const filteredData = users.filter((user) => {
      const userDate = user.created_at
        ? new Date(user.created_at.split("T")[0])
        : new Date();
      return (
        (!exportFromDate || userDate >= new Date(exportFromDate)) &&
        (!exportToDate || userDate <= new Date(exportToDate))
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
    setStep(1);
    setErrors({
      firstName: "",
      middleName: "",
      lastName: "",
      gender: "",
      birthDate: "",
      region: "",
      province: "",
      municipality: "",
      barangay: "",
      street: "",
      email: "",
      company: "",
      phoneNumber: "",
      departmentId: "",
      role: "",
      branch: "",
      salary: "",
      password: "",
      repeatPassword: "",
      imageFileName: "",
      apiError: "",
    });
  };
  const closeAddModal = () => {
    setIsAddModalOpen(false);
    setStep(1);
    setUsersData({
      firstName: "",
      middleName: "",
      lastName: "",
      gender: "",
      birthDate: "",
      region: "",
      province: "",
      municipality: "",
      barangay: "",
      street: "",
      company: "",
      email: "",
      phoneNumber: "",
      departmentId: "",
      role: "",
      branch: "",
      salary: "",
      password: "",
      repeatPassword: "",
      imageFileName: "",
    });
    setErrors({
      firstName: "",
      middleName: "",
      lastName: "",
      gender: "",
      birthDate: "",
      region: "",
      province: "",
      municipality: "",
      barangay: "",
      street: "",
      company: "",
      email: "",
      phoneNumber: "",
      departmentId: "",
      role: "",
      branch: "",
      salary: "",
      password: "",
      repeatPassword: "",
      imageFileName: "",
      apiError: "",
    });
  };

  const companyOptions = [
    {
      value: "EHD",
      label: "EHD",
    },
    {
      value: "PACK",
      label: "PACK",
    },
  ];

  const genderOptions = [
    { value: "Male", label: "Male" },
    { value: "Female", label: "Female" },
  ];

  const [filtered, setFiltered] = useState({
    provinces: [],
    municipalities: [],
    barangays: [],
  });

  const regions = Philippines.regions.map((region) => ({
    value: region.reg_code,
    label: region.name,
  }));

  useEffect(() => {
    if (usersData.region) {
      const filteredProvinces =
        Philippines.getProvincesByRegion(usersData.region.value) || [];

      setFiltered({
        provinces: filteredProvinces.map((province) => ({
          value: province.prov_code,
          label: province.name,
        })),
        municipalities: [],
        barangays: [],
      });

      setUsersData((prev) => ({
        ...prev,
        province:
          prev.province &&
          prev.province.value?.startsWith(usersData.region.value)
            ? prev.province
            : null,
        municipality: prev.province ? prev.municipality : null,
        barangay: prev.municipality ? prev.barangay : null,
      }));
    } else {
      setFiltered({ provinces: [], municipalities: [], barangays: [] });
    }
  }, [usersData.region]);

  useEffect(() => {
    if (usersData.province) {
      const filteredMunicipalities =
        Philippines.getCityMunByProvince(usersData.province.value) || [];

      setFiltered((prev) => ({
        ...prev,
        municipalities: filteredMunicipalities.map((mun) => ({
          value: mun.mun_code,
          label: mun.name,
        })),
        barangays: [],
      }));

      setUsersData((prev) => {
        const municipalityExists = filteredMunicipalities.some(
          (m) => String(m.mun_code) === String(prev.municipality?.value)
        );

        return {
          ...prev,
          municipality: municipalityExists ? prev.municipality : null,
          barangay: municipalityExists ? prev.barangay : null,
        };
      });
    } else {
      setFiltered((prev) => ({
        ...prev,
        municipalities: [],
        barangays: [],
      }));
    }
  }, [usersData.province]);

  useEffect(() => {
    if (usersData.municipality) {
      const filteredBarangays =
        Philippines.getBarangayByMun(usersData.municipality.value) || [];

      setFiltered((prev) => ({
        ...prev,
        barangays: filteredBarangays.map((barangay) => ({
          value: barangay.name,
          label: barangay.name,
        })),
      }));

      setUsersData((prev) => {
        const barangayExists = filteredBarangays.some(
          (b) =>
            b.name.trim().toLowerCase() ===
            prev.barangay?.value.trim().toLowerCase()
        );

        return {
          ...prev,
          barangay: barangayExists ? prev.barangay : null,
        };
      });
    } else {
      setFiltered((prev) => ({ ...prev, barangays: [] }));
    }
  }, [usersData.municipality]);

  const [departmentOptions, setDepartmentOptions] = useState([]);

  useEffect(() => {
    axios
      .get(`${API_BASE_URL}/departments`)
      .then((response) => {
        if (response.data.success && Array.isArray(response.data.data)) {
          const options = response.data.data.map((dept) => ({
            value: String(dept.id),
            label: dept.name,
          }));
          setDepartmentOptions(options);
        } else {
          console.error("Invalid data format:", response.data);
        }
      })
      .catch((error) => {
        console.error("Error fetching departments:", error);
      });
  }, []);

  const roleOptions = [
    {
      value: "Admin",
      label: "Admin",
    },
    {
      value: "Crew",
      label: "Crew",
    },
    {
      value: "Driver",
      label: "Driver",
    },
  ];

  const handleInputChange = (e, name, selectedOption) => {
    let value, fieldName;

    if (e) {
      if (e.target.type === "file") {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
            setPreviewImage(reader.result);
          };
          reader.readAsDataURL(file);

          setUsersData((prevData) => ({
            ...prevData,
            imageFileName: file,
            imagePreview: reader.result,
          }));
        }
        return;
      }

      value = e.target.value;
      fieldName = e.target.name;
    } else if (name && selectedOption !== undefined) {
      value = selectedOption;
      fieldName = name;
    }
    setUsersData((prevData) => ({
      ...prevData,
      [fieldName]: value,
    }));

    setErrors((prevErrors) => ({
      ...prevErrors,
      [fieldName]: "",
    }));
  };

  const validateStep = () => {
    let newErrors = {};
    let hasError = false;

    if (step === 1) {
      if (!usersData.firstName.trim()) {
        newErrors.firstName = "First name is required.";
        hasError = true;
      }
      if (!usersData.lastName.trim()) {
        newErrors.lastName = "Last name is required.";
        hasError = true;
      }
      if (!usersData.gender.trim()) {
        newErrors.gender = "Gender is required.";
        hasError = true;
      }
      if (!usersData.birthDate.trim()) {
        newErrors.birthDate = "Date of birth is required.";
        hasError = true;
      }
      if (!usersData.email.trim()) {
        newErrors.email = "Email is required.";
        hasError = true;
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(usersData.email)) {
        newErrors.email = "Invalid email format.";
        hasError = true;
      }
    } else if (step === 2) {
      if (!usersData.phoneNumber) {
        newErrors.phoneNumber = "Phone number is required.";
        hasError = true;
      }
      if (!usersData.region) {
        newErrors.region = "Region is required.";
        hasError = true;
      }
      if (!usersData.province) {
        newErrors.province = "Province is required.";
        hasError = true;
      }
      if (!usersData.municipality) {
        newErrors.municipality = "Municipality is required.";
        hasError = true;
      }
      if (!usersData.barangay) {
        newErrors.barangay = "Barangay is required.";
        hasError = true;
      }
    } else if (step === 3) {
      if (!usersData.company) {
        newErrors.company = "Company is required";
        hasError = true;
      }
      if (!usersData.departmentId) {
        newErrors.departmentId = "Department is required.";
        hasError = true;
      }
      if (!usersData.role.trim()) {
        newErrors.role = "Role is required.";
        hasError = true;
      }
      if (!usersData.salary.trim()) {
        newErrors.salary = "Salary is required.";
        hasError = true;
      }
      if (!usersData.branch.trim()) {
        newErrors.branch = "Branch is required.";
        hasError = true;
      }
      if (isAddModalOpen) {
        if (!usersData.password.trim()) {
          newErrors.password = "Password is required.";
          hasError = true;
        }
        if (
          !usersData.repeatPassword.trim() ||
          usersData.password !== usersData.repeatPassword
        ) {
          newErrors.repeatPassword = "Passwords do not match.";
          hasError = true;
        }
      }
      if (isEditModalOpen) {
        if (usersData.password.trim() || usersData.repeatPassword.trim()) {
          if (usersData.password !== usersData.repeatPassword) {
            newErrors.repeatPassword = "Passwords do not match.";
            hasError = true;
          }
        }
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

  const handleAddUser = async (e) => {
    e.preventDefault();

    if (!validateStep()) return;

    try {
      const formData = new FormData();
      formData.append("first_name", usersData.firstName);
      formData.append("middle_name", usersData.middleName);
      formData.append("last_name", usersData.lastName);
      formData.append("gender", usersData.gender);
      formData.append("birth_date", usersData.birthDate);
      formData.append("region", usersData.region.label);
      formData.append("province", usersData.province.label);
      formData.append("municipality", usersData.municipality.label);
      formData.append("barangay", usersData.barangay.label);
      formData.append("street", usersData.street);
      formData.append("company", usersData.company);
      formData.append("email", usersData.email);
      formData.append("phone_number", usersData.phoneNumber);
      formData.append("department_id", usersData.departmentId);
      formData.append("role", usersData.role);
      formData.append("branch", usersData.branch);
      formData.append("salary", usersData.salary);
      formData.append("password", usersData.password);

      if (usersData.imageFileName) {
        formData.append("image", usersData.imageFileName);
      }
      console.log(formData);
      const response = await axios.post(
        `${API_BASE_URL}/insert-user`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      if (response.data.success) {
        setUsers((prevUsers) => [
          ...prevUsers,
          {
            first_name: usersData.firstName,
            middle_name: usersData.middleName,
            last_name: usersData.lastName,
            gender: usersData.gender,
            birth_date: usersData.birthDate,
            region: usersData.region,
            province: usersData.province,
            municipality: usersData.municipality,
            barangay: usersData.barangay,
            street: usersData.street,
            company: usersData.company,
            email: usersData.email,
            phone_number: usersData.phoneNumber,
            department_id: usersData.departmentId,
            role: usersData.role,
            branch: usersData.branch,
            salary: usersData.salary,
            image_file_name: response.data.image_file_name,
          },
        ]);
        fetchUsers();
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
        salary:
          error.response?.data?.message === "Email already exists."
            ? "Email already exists."
            : error.response?.data?.message || "Something went wrong.",
      }));
      setStep(1);
    }
  };

  const toggleEditModal = (user = null) => {
    setSelectedUser(user);
    const selectedRegion = regions.find(
      (r) => r.label.toLowerCase() === user.region.toLowerCase()
    );

    const filteredProvinces = selectedRegion?.value
      ? Philippines.getProvincesByRegion(selectedRegion.value) || []
      : [];

    const selectedProvince = filteredProvinces.find(
      (p) => p.name.toLowerCase() === user.province.toLowerCase()
    );

    const filteredMunicipalities = selectedProvince?.prov_code
      ? Philippines.getCityMunByProvince(selectedProvince.prov_code) || []
      : [];

    const selectedMunicipality = filteredMunicipalities.find(
      (m) => m.name.toLowerCase() === user.municipality.toLowerCase()
    );

    const filteredBarangays = selectedMunicipality?.mun_code
      ? Philippines.getBarangayByMun(selectedMunicipality.mun_code) || []
      : [];

    const selectedBarangay = filteredBarangays.find(
      (b) => b.name.toLowerCase() === user.barangay.toLowerCase()
    );

    setUsersData((prev) => ({
      ...prev,
      description: user?.description || "",
      firstName: user?.first_name || "",
      middleName: user?.middle_name || "",
      lastName: user?.last_name || "",
      gender: user?.gender || "",
      birthDate: user?.birth_date || "",
      region: selectedRegion || null,
      province: selectedProvince
        ? {
            value: selectedProvince.prov_code,
            label: selectedProvince.name,
          }
        : null,
      municipality: selectedMunicipality
        ? {
            value: selectedMunicipality.mun_code,
            label: selectedMunicipality.name,
          }
        : null,
      barangay: selectedBarangay
        ? { value: selectedBarangay.name, label: selectedBarangay.name }
        : null,
      street: user?.street || "",
      company: user?.company || "",
      email: user?.email || "",
      phoneNumber: user?.phone_number || "",
      departmentId: user?.department_id || "",
      role: user?.role || "",
      branch: user?.branch || "",
      salary: user?.salary || "",
      password: "",
      repeatPassword: "",
      imageFileName: user?.image_file_name || "",
    }));
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setPreviewImage(userIcon);
    setStep(1);
    setIsEditModalOpen(false);
    setUsersData({
      departmentName: "",
      description: "",
      firstName: "",
      middleName: "",
      lastName: "",
      gender: "",
      birthDate: "",
      region: "",
      province: "",
      municipality: "",
      barangay: "",
      street: "",
      company: "",
      email: "",
      phoneNumber: "",
      departmentId: "",
      role: "",
      branch: "",
      salary: "",
      password: "",
      repeatPassword: "",
      imageFileName: "",
    });
    setErrors({
      firstName: "",
      middleName: "",
      lastName: "",
      gender: "",
      birthDate: "",
      region: "",
      province: "",
      municipality: "",
      barangay: "",
      street: "",
      company: "",
      email: "",
      phoneNumber: "",
      departmentId: "",
      role: "",
      branch: "",
      salary: "",
      password: "",
      repeatPassword: "",
      imageFileName: "",
      apiError: "",
    });
    setSelectedUser(null);
  };

  const handleEditUser = async (e) => {
    e.preventDefault();

    if (!validateStep()) return;

    try {
      const formData = new FormData();
      formData.append("first_name", usersData.firstName);
      formData.append("middle_name", usersData.middleName);
      formData.append("last_name", usersData.lastName);
      formData.append("gender", usersData.gender);
      formData.append("birth_date", usersData.birthDate);
      formData.append("region", usersData.region?.label || "");
      formData.append("province", usersData.province?.label || "");
      formData.append("municipality", usersData.municipality?.label || "");
      formData.append("barangay", usersData.barangay?.label || "");
      formData.append("street", usersData.street);
      formData.append("company", usersData.company);
      formData.append("email", usersData.email);
      formData.append("phone_number", usersData.phoneNumber);
      formData.append("department_id", usersData.departmentId || "");
      formData.append("role", usersData.role);
      formData.append("branch", usersData.branch);
      formData.append("salary", usersData.salary);

      if (usersData.repeatPassword.trim()) {
        formData.append("password", usersData.password);
        formData.append("repeatPassword", usersData.repeatPassword);
      }

      if (usersData.imageFileName instanceof File) {
        formData.append("imageFileName", usersData.imageFileName);
      }
      const response = await axios.put(
        `${API_BASE_URL}/update-user/${selectedUser.id}`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      if (response.data.success) {
        setUsers((prevUsers) =>
          prevUsers.map((user) =>
            user.id === selectedUser.id ? { ...user, ...usersData } : user
          )
        );
        fetchUsers();
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
        email:
          error.response?.data?.message === "Email already exists."
            ? "Email already exists."
            : error.response?.data?.message || "Something went wrong.",
      }));
      setStep(1);
    }
  };

  const toggleDeleteModal = (user = null) => {
    setSelectedUser(user);
    setIsDeleteModalOpen(!isDeleteModalOpen);
  };
  const closeDeleteModal = () => {
    setSelectedUser(null);
    setIsDeleteModalOpen(false);
  };
  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      const response = await axios.delete(
        `${API_BASE_URL}/delete-user/${selectedUser.id}`
      );

      if (response.data.success) {
        setUsers((prevUsers) =>
          prevUsers.filter((dept) => dept.id !== selectedUser.id)
        );
        fetchUsers();
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

  const toggleViewModal = (user = null) => {
    setSelectedUser(user);
    setIsViewModalOpen(!isViewModalOpen);
  };

  const closeViewModal = () => {
    setSelectedUser(null);
    setIsViewModalOpen(false);
    setErrors({
      apiError: "",
    });
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
    <div className={styles["users-content"]}>
      <div className={styles["content-header-container"]}>
        <h1 className={styles["page-title"]}>Users</h1>
      </div>
      <div className={styles["content-body-container"]}>
        <div className={styles["add-user-button-container"]}>
          <button
            className={styles["add-user-button"]}
            onClick={toggleAddModal}
          >
            Add User
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
                <th className={styles.th}>ID</th>
                <th className={styles.th}>Gender</th>
                <th className={styles.th}>Email</th>
                <th className={styles.th}>Phone Number</th>
                <th className={styles.th}>Department</th>
                <th className={styles.th}>Role</th>
                <th className={styles.th}>Branch</th>
                <th className={styles.th}>Date Employed</th>
                <th className={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody className={styles.tbody}>
              {paginatedUsers.map((user, index) => (
                <tr className={styles.btr} key={index}>
                  <td
                    className={`${styles.td} ${styles["user-name-td"]}`}
                    onClick={() => toggleViewModal(user)}
                  >
                    <div className={styles["user-table-image-container"]}>
                      <img
                        className={styles["user-table-image"]}
                        src={
                          user.image_file_path ? user.image_file_path : userIcon
                        }
                        alt={user.full_name}
                      />
                    </div>
                    {user.full_name}
                  </td>
                  <td className={styles.td}>{user.id}</td>
                  <td className={styles.td}>{user.gender}</td>
                  <td className={styles.td}>{user.email}</td>
                  <td className={styles.td}>+{user.phone_number}</td>
                  <td className={styles.td}>{user.department_name}</td>
                  <td className={styles.td}>{user.role}</td>
                  <td className={styles.td}>{user.branch}</td>
                  <td className={styles.td}>
                    {new Date(user.created_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </td>
                  <td className={styles.td}>
                    <div className={styles["action-container"]}>
                      <button
                        className={styles["edit-button"]}
                        onMouseEnter={() => setIsEditHovered(index)}
                        onMouseLeave={() => setIsEditHovered(null)}
                        onClick={() => toggleEditModal(user)}
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
                        onClick={() => toggleDeleteModal(user)}
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
              {paginatedUsers.length === 0 && (
                <tr className={styles.btr}>
                  <td
                    colSpan="8"
                    className={`${styles.td} ${styles["search-response"]}`}
                  >
                    No users found.
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
              <h3 className={styles["modal-title"]}>Add User</h3>
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
              onSubmit={handleAddUser}
            >
              {step === 1 && (
                <div className={styles["label-input-container"]}>
                  <label className={styles.label} htmlFor="first_name">
                    First Name
                    <input
                      className={`${styles.input} ${
                        errors.firstName ? styles["error-input"] : ""
                      }`}
                      type="text"
                      name="firstName"
                      id="first_name"
                      value={usersData.firstName}
                      onChange={handleInputChange}
                    />
                    {errors.firstName && (
                      <p className={styles["error-message"]}>
                        {errors.firstName}
                      </p>
                    )}
                  </label>
                  <label className={styles.label} htmlFor="middle_name">
                    Middle Name
                    <input
                      className={`${styles.input} ${
                        errors.middleName ? styles["error-input"] : ""
                      }`}
                      type="text"
                      name="middleName"
                      id="middle_name"
                      value={usersData.middleName}
                      onChange={handleInputChange}
                    />
                  </label>
                  <label className={styles.label} htmlFor="last_name">
                    Last Name
                    <input
                      className={`${styles.input} ${
                        errors.lastName ? styles["error-input"] : ""
                      }`}
                      type="text"
                      name="lastName"
                      id="last_name"
                      value={usersData.lastName}
                      onChange={handleInputChange}
                    />
                    {errors.lastName && (
                      <p className={styles["error-message"]}>
                        {errors.lastName}
                      </p>
                    )}
                  </label>
                  <label className={styles.label} htmlFor="gender">
                    Gender
                    <Select
                      className={`${styles.input} ${
                        errors.gender ? styles["error-input"] : ""
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
                      options={genderOptions}
                      placeholder="Select Gender"
                      name="gender"
                      id="gender"
                      value={genderOptions.find(
                        (option) => option.value === usersData.gender
                      )}
                      onChange={(selectedOption) =>
                        handleInputChange(null, "gender", selectedOption.value)
                      }
                    />
                    {errors.gender && (
                      <p className={styles["error-message"]}>{errors.gender}</p>
                    )}
                  </label>
                  <label className={styles.label} htmlFor="date_of_birth">
                    Date of Birth
                    <input
                      className={`${styles.input} ${
                        errors.birthDate ? styles["error-input"] : ""
                      }`}
                      type="date"
                      name="birthDate"
                      id="date_of_birth"
                      value={usersData.birthDate}
                      onChange={handleInputChange}
                    />
                    {errors.birthDate && (
                      <p className={styles["error-message"]}>
                        {errors.birthDate}
                      </p>
                    )}
                  </label>
                  <label className={styles.label} htmlFor="email">
                    Email
                    <input
                      className={`${styles.input} ${
                        errors.email ? styles["error-input"] : ""
                      }`}
                      type="email"
                      name="email"
                      id="email"
                      value={usersData.email}
                      onChange={handleInputChange}
                    />
                    {errors.email && (
                      <p className={styles["error-message"]}>{errors.email}</p>
                    )}
                  </label>
                </div>
              )}
              {step === 2 && (
                <div className={styles["label-input-container"]}>
                  <label className={styles.label} htmlFor="phone_number">
                    Phone Number
                    <PhoneInput
                      className={`${styles.input} ${
                        errors.phoneNumber ? styles["error-input"] : ""
                      }`}
                      country={"ph"}
                      name="phoneNumber"
                      id="phone_number"
                      value={usersData.phoneNumber}
                      onChange={(value) =>
                        setUsersData((prevData) => ({
                          ...prevData,
                          phoneNumber: value,
                        }))
                      }
                      inputStyle={{
                        outline: "none",
                        fontSize: "16px",
                        borderRadius: "6px",
                        border: "1px solid var(--borders)",
                        backgroundColor: "var(--background)",
                        transition: "0.3s ease-in-out",
                        width: "100%",
                        height: "100%",
                      }}
                      containerStyle={{
                        width: "100%",
                      }}
                      buttonStyle={{
                        backgroundColor: "var(--background)",
                        border: "1px solid var(--borders)",
                        borderRadius: "6px 0 0 6px",
                      }}
                      dropdownStyle={{
                        backgroundColor: "var(--background)",
                        border: "1px solid var(--borders)",
                      }}
                    />
                    {errors.phoneNumber && (
                      <p className={styles["error-message"]}>
                        {errors.phoneNumber}
                      </p>
                    )}
                  </label>
                  <label className={styles.label} htmlFor="region">
                    Region
                    <Select
                      className={`${styles.input} ${
                        errors.region ? styles["error-input"] : ""
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
                      name="region"
                      id="region"
                      value={usersData.region}
                      onChange={(selected) =>
                        handleInputChange(null, "region", selected)
                      }
                      placeholder="Select Region"
                    />
                    {errors.region && (
                      <p className={styles["error-message"]}>{errors.region}</p>
                    )}
                  </label>
                  <label className={styles.label} htmlFor="province">
                    Province
                    <Select
                      className={`${styles.input} ${
                        errors.province ? styles["error-input"] : ""
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
                      options={filtered.provinces}
                      name="province"
                      id="province"
                      value={usersData.province}
                      onChange={(selected) =>
                        handleInputChange(null, "province", selected)
                      }
                      isDisabled={!usersData.region}
                      placeholder="Select Province"
                    />
                    {errors.province && (
                      <p className={styles["error-message"]}>
                        {errors.province}
                      </p>
                    )}
                  </label>
                  <label className={styles.label} htmlFor="municipality">
                    City/Municipality
                    <Select
                      className={`${styles.input} ${
                        errors.municipality ? styles["error-input"] : ""
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
                      options={filtered.municipalities}
                      name="municipality"
                      id="municipality"
                      value={usersData.municipality}
                      onChange={(selected) =>
                        handleInputChange(null, "municipality", selected)
                      }
                      isDisabled={!usersData.province}
                      placeholder="Select City/Municipality"
                    />
                    {errors.municipality && (
                      <p className={styles["error-message"]}>
                        {errors.municipality}
                      </p>
                    )}
                  </label>
                  <label className={styles.label} htmlFor="barangay">
                    Barangay
                    <Select
                      className={`${styles.input} ${
                        errors.barangay ? styles["error-input"] : ""
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
                      options={filtered.barangays}
                      name="barangay"
                      id="barangay"
                      value={usersData.barangay}
                      onChange={(selected) =>
                        handleInputChange(null, "barangay", selected)
                      }
                      isDisabled={!usersData.municipality}
                      placeholder="Select Barangay"
                    />
                    {errors.barangay && (
                      <p className={styles["error-message"]}>
                        {errors.barangay}
                      </p>
                    )}
                  </label>
                  <label className={styles.label} htmlFor="street">
                    Street/House No.
                    <input
                      className={`${styles.input} ${
                        errors.street ? styles["error-input"] : ""
                      }`}
                      type="text"
                      name="street"
                      id="street"
                      value={usersData.street}
                      onChange={handleInputChange}
                    />
                  </label>
                </div>
              )}
              {step === 3 && (
                <div className={styles["label-input-container"]}>
                  <label className={styles.label} htmlFor="company">
                    Company
                    <Select
                      className={`${styles.input} ${
                        errors.company ? styles["error-input"] : ""
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
                      options={companyOptions}
                      placeholder="Select Company"
                      name="company"
                      id="company"
                      value={companyOptions.find(
                        (option) => option.value === usersData.company
                      )}
                      onChange={(selectedOption) =>
                        handleInputChange(null, "company", selectedOption.value)
                      }
                    />
                    {errors.company && (
                      <p className={styles["error-message"]}>
                        {errors.company}
                      </p>
                    )}
                  </label>
                  <label className={styles.label} htmlFor="department">
                    Department
                    <Select
                      className={`${styles.input} ${
                        errors.departmentId ? styles["error-input"] : ""
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
                      options={departmentOptions}
                      placeholder="Select Department"
                      name="departmentId"
                      id="department"
                      value={departmentOptions.find(
                        (option) => option.value === usersData.departmentId
                      )}
                      onChange={(selectedOption) =>
                        handleInputChange(
                          null,
                          "departmentId",
                          selectedOption.value
                        )
                      }
                    />
                    {errors.departmentId && (
                      <p className={styles["error-message"]}>
                        {errors.departmentId}
                      </p>
                    )}
                  </label>
                  <div className={styles["salary-input-details-container"]}>
                    <label className={styles.label} htmlFor="role">
                      Role
                      <Select
                        className={`${styles.input} ${
                          errors.role ? styles["error-input"] : ""
                        }`}
                        styles={{
                          control: (base, state) => ({
                            ...base,
                            borderColor: state.isFocused
                              ? "var(--text-secondary)"
                              : "var(--borders)",
                            boxShadow:
                              state.isFocused || state.isHovered
                                ? "0 0 4px rgba(109, 118, 126, 0.8)"
                                : "none",
                            backgroundColor: isDarkMode
                              ? "var(--cards)"
                              : "var(--background)",
                            color: isDarkMode
                              ? "var(--text-primary)"
                              : "var(--text-primary)",
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
                            color: isDarkMode
                              ? "var(--text-primary)"
                              : "var(--text-primary)",
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
                        options={roleOptions}
                        placeholder="Select Role"
                        name="role"
                        id="role"
                        value={roleOptions.find(
                          (option) => option.value === usersData.role
                        )}
                        onChange={(selectedOption) =>
                          handleInputChange(null, "role", selectedOption.value)
                        }
                      />
                      {errors.role && (
                        <p className={styles["error-message"]}>{errors.role}</p>
                      )}
                    </label>
                    <label className={styles.label} htmlFor="salary">
                      Daily Salary
                      <input
                        className={`${styles.input} ${
                          errors.salary ? styles["error-input"] : ""
                        }`}
                        type="number"
                        name="salary"
                        id="salary"
                        value={usersData.salary}
                        onChange={handleInputChange}
                      />
                      {errors.salary && (
                        <p className={styles["error-message"]}>
                          {errors.salary}
                        </p>
                      )}
                    </label>
                  </div>
                  <label className={styles.label} htmlFor="branch">
                    Branch
                    <input
                      className={`${styles.input} ${
                        errors.branch ? styles["error-input"] : ""
                      }`}
                      type="text"
                      name="branch"
                      id="branch"
                      value={usersData.branch}
                      onChange={handleInputChange}
                    />
                    {errors.branch && (
                      <p className={styles["error-message"]}>{errors.branch}</p>
                    )}
                  </label>
                  <label className={styles.label} htmlFor="password">
                    Password
                    <input
                      className={`${styles.input} ${
                        errors.password ? styles["error-input"] : ""
                      }`}
                      type="password"
                      name="password"
                      id="password"
                      value={usersData.password}
                      onChange={handleInputChange}
                    />
                    {errors.password && (
                      <p className={styles["error-message"]}>
                        {errors.password}
                      </p>
                    )}
                  </label>
                  <label className={styles.label} htmlFor="repeat_password">
                    Repeat Password
                    <input
                      className={`${styles.input} ${
                        errors.repeatPassword ? styles["error-input"] : ""
                      }`}
                      type="password"
                      name="repeatPassword"
                      id="repeat_password"
                      value={usersData.repeatPassword}
                      onChange={handleInputChange}
                    />
                    {errors.repeatPassword && (
                      <p className={styles["error-message"]}>
                        {errors.repeatPassword}
                      </p>
                    )}
                  </label>
                </div>
              )}
              {step === 4 && (
                <div className={styles["profile-image-container"]}>
                  <img
                    className={styles["profile-image"]}
                    src={previewImage}
                    alt="Profile"
                  />

                  <div className={styles["profile-button-container"]}>
                    <button
                      className={styles["profile-image-button"]}
                      type="button"
                      onClick={() => fileInputRef.current.click()}
                    >
                      <img
                        className={styles["profile-image-icon"]}
                        src={cameraIcon}
                        alt="Camera"
                      />
                    </button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      style={{ display: "none" }}
                      accept="image/*"
                      name="imageFileName"
                      onChange={handleInputChange}
                    />
                  </div>
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
                {step < 4 && (
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
                {step === 4 && (
                  <div className={styles["submit-button-container"]}>
                    <button type="submit" className={styles["submit-button"]}>
                      Submit
                    </button>
                  </div>
                )}
              </div>
            </form>
          </div>
        </Modal>
      )}
      {isEditModalOpen && selectedUser && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
        >
          <div className={styles["modal-container"]}>
            <div className={styles["modal-header-container"]}>
              <h3 className={styles["modal-title"]}>Edit User</h3>
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
              onSubmit={handleEditUser}
            >
              {step === 1 && (
                <div className={styles["label-input-container"]}>
                  <label className={styles.label} htmlFor="first_name">
                    First Name
                    <input
                      className={`${styles.input} ${
                        errors.firstName ? styles["error-input"] : ""
                      }`}
                      type="text"
                      name="firstName"
                      id="first_name"
                      value={usersData.firstName}
                      onChange={handleInputChange}
                    />
                    {errors.firstName && (
                      <p className={styles["error-message"]}>
                        {errors.firstName}
                      </p>
                    )}
                  </label>
                  <label className={styles.label} htmlFor="middle_name">
                    Middle Name
                    <input
                      className={`${styles.input} ${
                        errors.middleName ? styles["error-input"] : ""
                      }`}
                      type="text"
                      name="middleName"
                      id="middle_name"
                      value={usersData.middleName}
                      onChange={handleInputChange}
                    />
                  </label>
                  <label className={styles.label} htmlFor="last_name">
                    Last Name
                    <input
                      className={`${styles.input} ${
                        errors.lastName ? styles["error-input"] : ""
                      }`}
                      type="text"
                      name="lastName"
                      id="last_name"
                      value={usersData.lastName}
                      onChange={handleInputChange}
                    />
                    {errors.lastName && (
                      <p className={styles["error-message"]}>
                        {errors.lastName}
                      </p>
                    )}
                  </label>
                  <label className={styles.label} htmlFor="gender">
                    Gender
                    <Select
                      className={`${styles.input} ${
                        errors.gender ? styles["error-input"] : ""
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
                      options={genderOptions}
                      placeholder="Select Gender"
                      name="gender"
                      id="gender"
                      value={genderOptions.find(
                        (option) => option.value === usersData.gender
                      )}
                      onChange={(selectedOption) =>
                        handleInputChange(null, "gender", selectedOption.value)
                      }
                    />
                    {errors.gender && (
                      <p className={styles["error-message"]}>{errors.gender}</p>
                    )}
                  </label>
                  <label className={styles.label} htmlFor="date_of_birth">
                    Date of Birth
                    <input
                      className={`${styles.input} ${
                        errors.birthDate ? styles["error-input"] : ""
                      }`}
                      type="date"
                      name="birthDate"
                      id="date_of_birth"
                      value={usersData.birthDate}
                      onChange={handleInputChange}
                    />
                    {errors.birthDate && (
                      <p className={styles["error-message"]}>
                        {errors.birthDate}
                      </p>
                    )}
                  </label>
                  <label className={styles.label} htmlFor="email">
                    Email
                    <input
                      className={`${styles.input} ${
                        errors.email ? styles["error-input"] : ""
                      }`}
                      type="email"
                      name="email"
                      id="email"
                      value={usersData.email}
                      onChange={handleInputChange}
                    />
                    {errors.email && (
                      <p className={styles["error-message"]}>{errors.email}</p>
                    )}
                  </label>
                </div>
              )}
              {step === 2 && (
                <div className={styles["label-input-container"]}>
                  <label className={styles.label} htmlFor="email">
                    Phone Number
                    <PhoneInput
                      className={`${styles.input} ${
                        errors.email ? styles["error-input"] : ""
                      }`}
                      country={"ph"}
                      name="phoneNumber"
                      value={usersData.phoneNumber}
                      onChange={(value) =>
                        setUsersData((prevData) => ({
                          ...prevData,
                          phoneNumber: value,
                        }))
                      }
                      inputStyle={{
                        outline: "none",
                        fontSize: "16px",
                        borderRadius: "6px",
                        border: "1px solid var(--borders)",
                        backgroundColor: "var(--background)",
                        transition: "0.3s ease-in-out",
                        width: "100%",
                        height: "100%",
                      }}
                      containerStyle={{
                        width: "100%",
                      }}
                      buttonStyle={{
                        backgroundColor: "var(--background)",
                        border: "1px solid var(--borders)",
                        borderRadius: "6px 0 0 6px",
                      }}
                      dropdownStyle={{
                        backgroundColor: "var(--background)",
                        border: "1px solid var(--borders)",
                      }}
                    />
                    {errors.phoneNumber && (
                      <p className={styles["error-message"]}>
                        {errors.phoneNumber}
                      </p>
                    )}
                  </label>
                  <label className={styles.label} htmlFor="region">
                    Region
                    <Select
                      className={`${styles.input} ${
                        errors.region ? styles["error-input"] : ""
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
                      name="region"
                      id="region"
                      value={usersData.region}
                      onChange={(selected) => {
                        handleInputChange(null, "region", selected);
                        setUsersData((prev) => ({
                          ...prev,
                          province: prev.province?.value.startsWith(
                            selected?.value
                          )
                            ? prev.province
                            : null,
                          municipality: prev.municipality?.value.startsWith(
                            selected?.value
                          )
                            ? prev.municipality
                            : null,
                          barangay: prev.barangay?.value.startsWith(
                            selected?.value
                          )
                            ? prev.barangay
                            : null,
                        }));
                      }}
                      placeholder="Select Region"
                    />
                    {errors.region && (
                      <p className={styles["error-message"]}>{errors.region}</p>
                    )}
                  </label>
                  <label className={styles.label} htmlFor="province">
                    Province
                    <Select
                      className={`${styles.input} ${
                        errors.province ? styles["error-input"] : ""
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
                      options={filtered.provinces}
                      name="province"
                      id="province"
                      value={usersData.province}
                      onChange={(selected) => {
                        setUsersData((prev) => ({
                          ...prev,
                          province: selected,
                          municipality: prev.municipality?.value.startsWith(
                            selected?.value
                          )
                            ? prev.municipality
                            : null,
                          barangay: prev.barangay?.value.startsWith(
                            selected?.value
                          )
                            ? prev.barangay
                            : null,
                        }));
                      }}
                      isDisabled={!usersData.region}
                      placeholder="Select Province"
                    />
                    {errors.province && (
                      <p className={styles["error-message"]}>
                        {errors.province}
                      </p>
                    )}
                  </label>
                  <label className={styles.label} htmlFor="municipality">
                    City/Municipality
                    <Select
                      className={`${styles.input} ${
                        errors.municipality ? styles["error-input"] : ""
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
                      options={filtered.municipalities}
                      name="municipality"
                      id="municipality"
                      value={usersData.municipality}
                      onChange={(selected) => {
                        setUsersData((prev) => ({
                          ...prev,
                          municipality: selected,
                          barangay: prev.barangay?.value.startsWith(
                            selected?.value
                          )
                            ? prev.barangay
                            : null,
                        }));
                      }}
                      isDisabled={!usersData.province}
                      placeholder="Select City/Municipality"
                    />
                    {errors.municipality && (
                      <p className={styles["error-message"]}>
                        {errors.municipality}
                      </p>
                    )}
                  </label>
                  <label className={styles.label} htmlFor="barangay">
                    Barangay
                    <Select
                      className={`${styles.input} ${
                        errors.barangay ? styles["error-input"] : ""
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
                      options={filtered.barangays}
                      name="barangay"
                      id="barangay"
                      value={usersData.barangay}
                      onChange={(selected) => {
                        setUsersData((prev) => ({
                          ...prev,
                          barangay: selected,
                        }));
                      }}
                      isDisabled={!usersData.municipality}
                      placeholder="Select Barangay"
                    />
                    {errors.barangay && (
                      <p className={styles["error-message"]}>
                        {errors.barangay}
                      </p>
                    )}
                  </label>
                  <label className={styles.label} htmlFor="street">
                    Street/House No.
                    <input
                      className={`${styles.input} ${
                        errors.street ? styles["error-input"] : ""
                      }`}
                      type="text"
                      name="street"
                      id="street"
                      value={usersData.street}
                      onChange={handleInputChange}
                    />
                  </label>
                </div>
              )}
              {step === 3 && (
                <div className={styles["label-input-container"]}>
                  <label className={styles.label} htmlFor="company">
                    Company
                    <Select
                      className={`${styles.input} ${
                        errors.company ? styles["error-input"] : ""
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
                      options={companyOptions}
                      placeholder="Select Company"
                      name="company"
                      id="company"
                      value={companyOptions.find(
                        (option) => option.value === usersData.company
                      )}
                      onChange={(selectedOption) =>
                        handleInputChange(null, "company", selectedOption.value)
                      }
                    />
                    {errors.company && (
                      <p className={styles["error-message"]}>
                        {errors.company}
                      </p>
                    )}
                  </label>
                  <label className={styles.label} htmlFor="department">
                    Department
                    <Select
                      className={`${styles.input} ${
                        errors.departmentId ? styles["error-input"] : ""
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
                      options={departmentOptions}
                      placeholder="Select Department"
                      name="departmentId"
                      id="department"
                      value={departmentOptions.find(
                        (option) => option.value === usersData.departmentId
                      )}
                      onChange={(selectedOption) =>
                        handleInputChange(
                          null,
                          "departmentId",
                          selectedOption.value
                        )
                      }
                    />
                    {errors.departmentId && (
                      <p className={styles["error-message"]}>
                        {errors.departmentId}
                      </p>
                    )}
                  </label>
                  <div className={styles["salary-input-details-container"]}>
                    <label className={styles.label} htmlFor="role">
                      Role
                      <Select
                        className={`${styles.input} ${
                          errors.role ? styles["error-input"] : ""
                        }`}
                        styles={{
                          control: (base, state) => ({
                            ...base,
                            borderColor: state.isFocused
                              ? "var(--text-secondary)"
                              : "var(--borders)",
                            boxShadow:
                              state.isFocused || state.isHovered
                                ? "0 0 4px rgba(109, 118, 126, 0.8)"
                                : "none",
                            backgroundColor: isDarkMode
                              ? "var(--cards)"
                              : "var(--background)",
                            color: isDarkMode
                              ? "var(--text-primary)"
                              : "var(--text-primary)",
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
                            color: isDarkMode
                              ? "var(--text-primary)"
                              : "var(--text-primary)",
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
                        options={roleOptions}
                        placeholder="Select Role"
                        name="role"
                        id="role"
                        value={roleOptions.find(
                          (option) => option.value === usersData.role
                        )}
                        onChange={(selectedOption) =>
                          handleInputChange(null, "role", selectedOption.value)
                        }
                      />
                      {errors.role && (
                        <p className={styles["error-message"]}>{errors.role}</p>
                      )}
                    </label>
                    <label className={styles.label} htmlFor="salary">
                      Daily Salary{" "}
                      <input
                        className={`${styles.input} ${
                          errors.salary ? styles["error-input"] : ""
                        }`}
                        type="number"
                        name="salary"
                        id="salary"
                        value={usersData.salary}
                        onChange={handleInputChange}
                      />
                      {errors.salary && (
                        <p className={styles["error-message"]}>
                          {errors.salary}
                        </p>
                      )}
                    </label>
                  </div>
                  <label className={styles.label} htmlFor="branch">
                    Branch
                    <input
                      className={`${styles.input} ${
                        errors.branch ? styles["error-input"] : ""
                      }`}
                      type="text"
                      name="branch"
                      id="branch"
                      value={usersData.branch}
                      onChange={handleInputChange}
                    />
                    {errors.branch && (
                      <p className={styles["error-message"]}>{errors.branch}</p>
                    )}
                  </label>
                  <label className={styles.label} htmlFor="password">
                    Password
                    <input
                      className={`${styles.input} ${
                        errors.password ? styles["error-input"] : ""
                      }`}
                      type="password"
                      name="password"
                      id="password"
                      value={usersData.password}
                      onChange={handleInputChange}
                    />
                    {errors.password && (
                      <p className={styles["error-message"]}>
                        {errors.password}
                      </p>
                    )}
                  </label>
                  <label className={styles.label} htmlFor="repeat_password">
                    Repeat Password
                    <input
                      className={`${styles.input} ${
                        errors.repeatPassword ? styles["error-input"] : ""
                      }`}
                      type="password"
                      name="repeatPassword"
                      id="repeat_password"
                      value={usersData.repeatPassword}
                      onChange={handleInputChange}
                    />
                    {errors.repeatPassword && (
                      <p className={styles["error-message"]}>
                        {errors.repeatPassword}
                      </p>
                    )}
                  </label>
                </div>
              )}
              {step === 4 && (
                <div className={styles["profile-image-container"]}>
                  <img
                    className={styles["profile-image"]}
                    src={
                      usersData.imageFileName instanceof File
                        ? URL.createObjectURL(usersData.imageFileName)
                        : usersData.imageFileName
                        ? `http://localhost:8080/uploads/${usersData.imageFileName}`
                        : previewImage
                    }
                    alt="Profile"
                  />
                  <div className={styles["profile-button-container"]}>
                    <button
                      className={styles["profile-image-button"]}
                      type="button"
                      onClick={() => fileInputRef.current.click()}
                    >
                      <img
                        className={styles["profile-image-icon"]}
                        src={cameraIcon}
                        alt="Camera"
                      />
                    </button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      style={{ display: "none" }}
                      accept="image/*"
                      name="imageFileName"
                      onChange={handleInputChange}
                    />
                  </div>
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
                {step < 4 && (
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
                {step === 4 && (
                  <div className={styles["submit-button-container"]}>
                    <button type="submit" className={styles["submit-button"]}>
                      Submit
                    </button>
                  </div>
                )}
              </div>
            </form>
          </div>
        </Modal>
      )}
      {isDeleteModalOpen && selectedUser && (
        <Modal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
        >
          <div
            className={`${styles["modal-container"]} ${styles["delete-modal-container"]}`}
          >
            <h1 className={styles["delete-modal-header"]}>
              Are you sure to delete this user?
            </h1>
            <div className={styles["delete-modal-button-container"]}>
              <button
                className={styles["delete-modal-button"]}
                onClick={handleDeleteUser}
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
      {isViewModalOpen && selectedUser && (
        <Modal
          isOpen={isViewModalOpen}
          onClose={() => setIsViewModalOpen(false)}
        >
          <div className={styles["modal-container"]}>
            <div className={styles["modal-header-container"]}>
              <h3 className={styles["modal-title"]}>View User</h3>
              <button
                className={styles["close-modal-button"]}
                onClick={closeViewModal}
              >
                <img
                  className={styles["close-modal-icon"]}
                  src={crossIcon}
                  alt="Close"
                />
              </button>
            </div>
            <div className={styles["modal-view-body-container"]}>
              <div className={styles["modal-view-profile-image-container"]}>
                <img
                  className={styles["modal-view-profile-image"]}
                  src={
                    selectedUser.image_file_path
                      ? selectedUser.image_file_path
                      : userIcon
                  }
                  alt="Profile"
                />
              </div>
              <div className={styles["modal-view-user-information-container"]}>
                <div
                  className={
                    styles["modal-view-user-information-label-container"]
                  }
                >
                  <p className={styles["modal-view-user-label"]}>Name</p>
                  <p className={styles["modal-view-user-information"]}>
                    {selectedUser.full_name}
                  </p>
                </div>
                <div
                  className={
                    styles["modal-view-user-information-label-container"]
                  }
                >
                  <p className={styles["modal-view-user-label"]}>Gender</p>
                  <p className={styles["modal-view-user-information"]}>
                    {selectedUser.gender}
                  </p>
                </div>
                <div
                  className={
                    styles["modal-view-user-information-label-container"]
                  }
                >
                  <p className={styles["modal-view-user-label"]}>
                    Date of Birth
                  </p>
                  <p className={styles["modal-view-user-information"]}>
                    {new Date(selectedUser.birth_date).toLocaleDateString(
                      "en-US",
                      {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      }
                    )}
                  </p>
                </div>
                <div
                  className={
                    styles["modal-view-user-information-label-container"]
                  }
                >
                  <p className={styles["modal-view-user-label"]}>Email</p>
                  <p className={styles["modal-view-user-information"]}>
                    {selectedUser.email}
                  </p>
                </div>
                <div
                  className={
                    styles["modal-view-user-information-label-container"]
                  }
                >
                  <p className={styles["modal-view-user-label"]}>
                    Phone Number
                  </p>
                  <p className={styles["modal-view-user-information"]}>
                    +{selectedUser.phone_number}
                  </p>
                </div>
                <div
                  className={
                    styles["modal-view-user-information-label-container"]
                  }
                >
                  <p className={styles["modal-view-user-label"]}>Address</p>
                  <p className={styles["modal-view-user-information"]}>
                    {selectedUser.province}, {selectedUser.municipality},{" "}
                    {selectedUser.barangay}
                  </p>
                </div>
                <div
                  className={
                    styles["modal-view-user-information-label-container"]
                  }
                >
                  <p className={styles["modal-view-user-label"]}>
                    Branch Department & Role
                  </p>
                  <p className={styles["modal-view-user-information"]}>
                    {selectedUser.branch} {selectedUser.department_name}{" "}
                    {selectedUser.role}
                  </p>
                </div>
                <div
                  className={
                    styles["modal-view-user-information-label-container"]
                  }
                >
                  <p className={styles["modal-view-user-label"]}>Salary</p>
                  <p className={styles["modal-view-user-information"]}>
                    ₱{selectedUser.salary}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default HRUsers;
