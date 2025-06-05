import React, { useEffect, useState, useRef } from "react";
import styles from "../assets/styles/UsersProfile.module.css";
import Modal from "../components/Modal";
import axios from "axios";
import io from "socket.io-client";
import userIcon from "../assets/images/user-image-icon.svg";
import crossIcon from "../assets/images/cross-icon.svg";
import cameraIcon from "../assets/images/camera-icon.svg";
import Select from "react-select";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import Philippines from "phil-reg-prov-mun-brgy";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";
const SOCKET_BASE_URL =
  import.meta.env.VITE_SOCKET_URL || "http://localhost:8080";

const socket = io(SOCKET_BASE_URL, {
  withCredentials: true,
});

const UserProfile = () => {
  const [user, setUser] = useState(null);
  const [payrolls, setPayrolls] = useState([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setisViewModalOpen] = useState(false);
  const [selectedPayroll, setSelectedPayroll] = useState(null);
  const [step, setStep] = useState(1);
  const fileInputRef = useRef(null);
  const [previewImage, setPreviewImage] = useState(userIcon);

  const [userData, setUserData] = useState({
    id: "",
    firstName: "",
    middleName: "",
    lastName: "",
    gender: "",
    birthDate: "",
    email: "",
    phoneNumber: "",
    region: null,
    province: null,
    municipality: null,
    barangay: null,
    street: "",
    password: "",
    repeatPassword: "",
    imageFileName: "",
  });
  const [errors, setErrors] = useState({
    id: "",
    firstName: "",
    middleName: "",
    lastName: "",
    gender: "",
    birthDate: "",
    email: "",
    phoneNumber: "",
    region: "",
    province: "",
    municipality: "",
    barangay: "",
    street: "",
    password: "",
    repeatPassword: "",
    apiError: "",
    imageFileName: "",
  });

  const isDarkMode =
    document.documentElement.getAttribute("data-theme") === "dark";

  useEffect(() => {
    const fetchPayroll = async () => {
      try {
        const token = localStorage.getItem("token");

        const response = await axios.get(`${API_BASE_URL}/user-payroll`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.data.success) {
          setPayrolls(response.data.payroll);
        }
      } catch (error) {
        console.error("Failed to fetch payroll:", error);
      }
    };

    fetchPayroll();
  }, []);

  const fetchUser = async () => {
    const token =
      localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!token) return;

    try {
      const response = await axios.get(`${API_BASE_URL}/user`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setUser(response.data.user);
      }
    } catch (error) {
      console.error("Failed to fetch user:", error);
    }
  };

  useEffect(() => {
    fetchUser();

    socket.on("userUpdated", (updatedUser) => {
      setUser(updatedUser);
    });

    return () => {
      socket.off("userUpdated");
    };
  }, []);

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
    if (userData.region) {
      const filteredProvinces =
        Philippines.getProvincesByRegion(userData.region.value) || [];

      setFiltered({
        provinces: filteredProvinces.map((province) => ({
          value: province.prov_code,
          label: province.name,
        })),
        municipalities: [],
        barangays: [],
      });

      setUserData((prev) => ({
        ...prev,
        province:
          prev.province &&
          prev.province.value?.startsWith(userData.region.value)
            ? prev.province
            : null,
        municipality: prev.province ? prev.municipality : null,
        barangay: prev.municipality ? prev.barangay : null,
      }));
    } else {
      setFiltered({ provinces: [], municipalities: [], barangays: [] });
    }
  }, [userData.region]);

  useEffect(() => {
    if (userData.province) {
      const filteredMunicipalities =
        Philippines.getCityMunByProvince(userData.province.value) || [];

      setFiltered((prev) => ({
        ...prev,
        municipalities: filteredMunicipalities.map((mun) => ({
          value: mun.mun_code,
          label: mun.name,
        })),
        barangays: [],
      }));

      setUserData((prev) => {
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
  }, [userData.province]);

  useEffect(() => {
    if (userData.municipality) {
      const filteredBarangays =
        Philippines.getBarangayByMun(userData.municipality.value) || [];

      setFiltered((prev) => ({
        ...prev,
        barangays: filteredBarangays.map((barangay) => ({
          value: barangay.name,
          label: barangay.name,
        })),
      }));

      setUserData((prev) => {
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
  }, [userData.municipality]);

  const genderOptions = [
    { value: "Male", label: "Male" },
    { value: "Female", label: "Female" },
  ];

  const validateStep = () => {
    let newErrors = {};
    let hasError = false;

    if (step === 1) {
      if (!userData.firstName.trim()) {
        newErrors.firstName = "First name is required.";
        hasError = true;
      }
      if (!userData.lastName.trim()) {
        newErrors.lastName = "Last name is required.";
        hasError = true;
      }
      if (!userData.gender.trim()) {
        newErrors.gender = "Gender is required.";
        hasError = true;
      }
      if (!userData.birthDate.trim()) {
        newErrors.birthDate = "Date of birth is required.";
        hasError = true;
      }
      if (!userData.email.trim()) {
        newErrors.email = "Email is required.";
        hasError = true;
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userData.email)) {
        newErrors.email = "Invalid email format.";
        hasError = true;
      }
    } else if (step === 2) {
      if (!userData.phoneNumber) {
        newErrors.phoneNumber = "Phone number is required.";
        hasError = true;
      }
      if (!userData.region) {
        newErrors.region = "Region is required.";
        hasError = true;
      }
      if (!userData.province) {
        newErrors.province = "Province is required.";
        hasError = true;
      }
      if (!userData.municipality) {
        newErrors.municipality = "Municipality is required.";
        hasError = true;
      }
      if (!userData.barangay) {
        newErrors.barangay = "Barangay is required.";
        hasError = true;
      }
    } else if (step === 3) {
      if (isEditModalOpen) {
        if (userData.password.trim() || userData.repeatPassword.trim()) {
          if (userData.password !== userData.repeatPassword) {
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

          setUserData((prevData) => ({
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
    setUserData((prevData) => ({
      ...prevData,
      [fieldName]: value,
    }));

    setErrors((prevErrors) => ({
      ...prevErrors,
      [fieldName]: "",
    }));
  };

  const toggleEditModal = () => {
    setIsEditModalOpen(!isEditModalOpen);
    if (user) {
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
      setUserData({
        id: user.id || "",
        firstName: user.first_name || "",
        middleName: user.middle_name || "",
        lastName: user.last_name || "",
        gender: user.gender || "",
        birthDate: user.birth_date || "",
        email: user.email || "",
        phoneNumber: user.phone_number || "",
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
        street: user.street || "",
        password: "",
        repeatPassword: "",
        imageFileName: user.image_file_name || "",
      });
    }
    setErrors({
      id: "",
      firstName: "",
      middleName: "",
      lastName: "",
      gender: "",
      birthDate: "",
      email: "",
      phoneNumber: "",
      region: "",
      province: "",
      municipality: "",
      barangay: "",
      street: "",
      apiError: "",
    });
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setStep(1);
    setUserData({
      id: "",
      firstName: "",
      middleName: "",
      lastName: "",
      gender: "",
      birthDate: "",
      email: "",
      phoneNumber: "",
      region: null,
      province: null,
      municipality: null,
      barangay: null,
      street: "",
      password: "",
      repeatPassword: "",
    });
    setErrors({
      id: "",
      firstName: "",
      middleName: "",
      lastName: "",
      gender: "",
      birthDate: "",
      email: "",
      phoneNumber: "",
      region: null,
      province: null,
      municipality: null,
      barangay: null,
      street: "",
      password: "",
      repeatPassword: "",
      apiError: "",
    });
  };

  const handleEditUser = async (e) => {
    e.preventDefault();

    if (!validateStep()) return;

    try {
      const formData = new FormData();
      formData.append("first_name", userData.firstName);
      formData.append("middle_name", userData.middleName);
      formData.append("last_name", userData.lastName);
      formData.append("gender", userData.gender);
      formData.append("email", userData.email);
      formData.append("phone_number", userData.phoneNumber);
      formData.append("birth_date", userData.birthDate);
      formData.append(
        "region",
        userData.region?.label || userData.region || ""
      );
      formData.append(
        "province",
        userData.province?.label || userData.province || ""
      );
      formData.append(
        "municipality",
        userData.municipality?.label || userData.municipality || ""
      );
      formData.append(
        "barangay",
        userData.barangay?.label || userData.barangay || ""
      );
      formData.append("street", userData.street);

      if (userData.repeatPassword.trim()) {
        formData.append("password", userData.password);
        formData.append("repeatPassword", userData.repeatPassword);
      }

      if (userData.imageFileName instanceof File) {
        formData.append("imageFileName", userData.imageFileName);
      }

      const response = await axios.put(
        `${API_BASE_URL}/update-user/${userData.id}`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      if (response.data.success) {
        setUser((prevUser) => ({
          ...prevUser,
          ...userData,
        }));

        fetchUser();
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

  const toggleViewModal = (payroll = null) => {
    setSelectedPayroll(payroll);
    setisViewModalOpen(!isViewModalOpen);
  };

  const closeViewModal = () => {
    setSelectedPayroll(null);
    setisViewModalOpen(false);
  };

  return (
    <div className={styles["profile-content"]}>
      <div className={styles["content-header-container"]}>
        <h1 className={styles["page-title"]}>Profile</h1>
      </div>
      <div className={styles["content-body-container"]}>
        <div className={styles["profile-card-container"]}>
          <div className={styles["profile-picture-container"]}>
            <img
              className={styles["user-icon"]}
              src={user?.image_file_path || userIcon}
              alt="User"
            />
            <div className={styles["user-name-department-details"]}>
              <h1 className={styles["user-name"]}>
                {user ? user.full_name : "Loading..."}
              </h1>
              <p className={styles["user-department-role"]}>
                {user ? `${user.department_name} ${user.role}` : "Loading..."}
              </p>
            </div>
            <div className={styles["edit-profile-button-container"]}>
              <button
                className={styles["edit-profile-button"]}
                onClick={toggleEditModal}
              >
                Edit
              </button>
            </div>
          </div>
          <div className={styles["personal-information-container"]}>
            <h1 className={styles["personal-information-label"]}>
              Personal Information
            </h1>
            <div className={styles["personal-information-title-container"]}>
              {[
                { label: "First Name", value: user?.first_name },
                { label: "Last Name", value: user?.last_name },
                { label: "Gender", value: user?.gender },
                {
                  label: "Date of Birth",
                  value: user?.birth_date
                    ? new Date(user.birth_date).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : null,
                },
                { label: "Email", value: user?.email },
                {
                  label: "Phone Number",
                  value: user ? `+${user.phone_number}` : null,
                },
              ].map((info, index) => (
                <div
                  className={styles["personal-information-details-container"]}
                  key={index}
                >
                  <p className={styles["personal-information-details-label"]}>
                    {info.label}
                  </p>
                  <h1 className={styles["personal-information-details-title"]}>
                    {info.value || "Loading..."}
                  </h1>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className={styles["second-row-container"]}>
          <div
            className={`${styles["profile-card-container"]} ${styles["profile-card-second-row-container"]}`}
          >
            <div className={styles["personal-information-container"]}>
              <h1 className={styles["personal-information-label"]}>
                Address Information
              </h1>
              <div className={styles["personal-information-title-container"]}>
                {[
                  { label: "Region", value: user?.region },
                  { label: "Province", value: user?.province },
                  { label: "Municipality", value: user?.municipality },
                  { label: "Barangay", value: user?.barangay },
                ].map((info, index) => (
                  <div
                    className={styles["personal-information-details-container"]}
                    key={index}
                  >
                    <p className={styles["personal-information-details-label"]}>
                      {info.label}
                    </p>
                    <h1
                      className={styles["personal-information-details-title"]}
                    >
                      {typeof info.value === "object"
                        ? info.value?.label || "Loading..."
                        : info.value || "Loading..."}
                    </h1>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div
            className={`${styles["profile-card-container"]} ${styles["profile-card-table-container"]}`}
          >
            <h1 className={styles["personal-information-label"]}>
              Payslip History
            </h1>
            <div className={styles["table-container"]}>
              <table className={styles.table}>
                <thead className={styles.thead}>
                  <tr className={styles.htr}>
                    <th className={styles.th}>Period</th>
                    <th className={styles.th}>Gross</th>
                    <th className={styles.th}>Deduction</th>
                    <th className={styles.th}>NetPay</th>
                  </tr>
                </thead>
                <tbody className={styles.tbody}>
                  {payrolls && payrolls.length > 0 ? (
                    payrolls.map((payroll, index) => (
                      <tr
                        className={`${styles.btr} ${styles["personal-information-table-container"]}`}
                        key={index}
                      >
                        <td
                          className={`${styles.td} ${styles["view-td"]}`}
                          onClick={() => toggleViewModal(payroll)}
                        >
                          {new Date(payroll.period_start).toLocaleDateString(
                            undefined,
                            {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            }
                          )}
                          -
                          {new Date(payroll.period_end).toLocaleDateString(
                            undefined,
                            {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            }
                          )}
                        </td>
                        <td className={styles.td}>
                          ₱{payroll.gross.toLocaleString()}
                        </td>
                        <td className={styles.td}>
                          ₱{payroll.total_deduction}
                        </td>
                        <td className={styles.td}>
                          ₱{payroll.net_pay.toLocaleString()}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className={styles.td} colSpan="4">
                        No payrolls available.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      {isEditModalOpen && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
        >
          <div className={styles["modal-container"]}>
            <div className={styles["modal-header-container"]}>
              <h3 className={styles["modal-title"]}>Edit Profile</h3>
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
                      id="first_name"
                      name="firstName"
                      value={userData.firstName}
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
                      id="middle_name"
                      name="middleName"
                      value={userData.middleName}
                      onChange={handleInputChange}
                    />
                    {errors.middleName && (
                      <p className={styles["error-message"]}>
                        {errors.middleName}
                      </p>
                    )}
                  </label>
                  <label className={styles.label} htmlFor="last_name">
                    Last Name
                    <input
                      className={`${styles.input} ${
                        errors.lastName ? styles["error-input"] : ""
                      }`}
                      type="text"
                      id="last_name"
                      name="lastName"
                      value={userData.lastName}
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
                        (option) => option.value === userData.gender
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
                      value={userData.birthDate}
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
                      value={userData.email}
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
                      value={userData.phoneNumber}
                      onChange={(value) =>
                        setUserData((prevData) => ({
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
                      value={userData.region}
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
                      value={userData.province}
                      onChange={(selected) =>
                        handleInputChange(null, "province", selected)
                      }
                      isDisabled={!userData.region}
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
                      value={userData.municipality}
                      onChange={(selected) =>
                        handleInputChange(null, "municipality", selected)
                      }
                      isDisabled={!userData.province}
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
                      value={userData.barangay}
                      onChange={(selected) =>
                        handleInputChange(null, "barangay", selected)
                      }
                      isDisabled={!userData.municipality}
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
                      value={userData.street}
                      onChange={handleInputChange}
                    />
                  </label>
                </div>
              )}
              {step === 3 && (
                <div className={styles["label-input-container"]}>
                  <label className={styles.label} htmlFor="password">
                    Password
                    <input
                      className={`${styles.input} ${
                        errors.password ? styles["error-input"] : ""
                      }`}
                      type="password"
                      name="password"
                      id="password"
                      value={userData.password}
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
                      value={userData.repeatPassword}
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
                      userData.imageFileName instanceof File
                        ? URL.createObjectURL(userData.imageFileName)
                        : userData.imageFileName
                        ? `http://localhost:8080/uploads/${userData.imageFileName}`
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
      {isViewModalOpen && selectedPayroll && (
        <Modal
          isOpen={isViewModalOpen}
          onClose={() => setisViewModalOpen(false)}
        >
          <div className={styles["modal-container"]}>
            <div className={styles["modal-header-container"]}>
              <h3 className={styles["modal-title"]}>Payslip</h3>
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
                        {selectedPayroll.basic_pay_days}
                      </td>
                      <td className={styles.ptd}>
                        ₱{selectedPayroll.basic_pay_rate}
                      </td>
                      <td className={styles.ptd}>
                        ₱{selectedPayroll.basic_pay_total}
                      </td>
                    </tr>
                    <tr className={styles.htr}>
                      <th className={styles.pth}>Holiday</th>
                      <td className={styles.ptd}>
                        {selectedPayroll.holiday_days}
                      </td>
                      <td className={styles.ptd}>
                        ₱{selectedPayroll.holiday_rate}
                      </td>
                      <td className={styles.ptd}>
                        ₱{selectedPayroll.holiday_total}
                      </td>
                    </tr>
                    <tr className={styles.htr}>
                      <th className={styles.pth}>Adjustments</th>
                      <td className={styles.ptd}>
                        {selectedPayroll.adjustment_days}
                      </td>
                      <td className={styles.ptd}>
                        ₱{selectedPayroll.adjustment_rate}
                      </td>
                      <td className={styles.ptd}>
                        ₱{selectedPayroll.adjustment_total}
                      </td>
                    </tr>
                    <tr className={styles.htr}>
                      <th className={styles.pth}>Leaves</th>
                      <td className={styles.ptd}>
                        {selectedPayroll.leave_days}
                      </td>
                      <td className={styles.ptd}>
                        ₱{selectedPayroll.leave_rate}
                      </td>
                      <td className={styles.ptd}>
                        ₱{selectedPayroll.leave_total}
                      </td>
                    </tr>
                    <tr className={styles.htr}>
                      <th className={styles.pth}>Management Bonus</th>
                      <td className={styles.ptd}></td>
                      <td className={styles.ptd}></td>
                      <td className={styles.ptd}>
                        ₱{selectedPayroll.management_bonus_total}
                      </td>
                    </tr>
                    <tr className={styles.htr}>
                      <th className={styles.pth}>13th Month Pay</th>
                      <td className={styles.ptd}></td>
                      <td className={styles.ptd}></td>
                      <td className={styles.ptd}>
                        ₱{selectedPayroll.thirteenth_month_total}
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
                        {selectedPayroll.regular_ot_hours}
                      </td>
                      <td className={styles.ptd}>
                        ₱{selectedPayroll.regular_ot_rate}
                      </td>
                      <td className={styles.ptd}>
                        ₱{selectedPayroll.regular_ot_total}
                      </td>
                    </tr>
                    <tr className={styles.htr}>
                      <th className={styles.pth}>Regular OT ND</th>
                      <td className={styles.ptd}>
                        {selectedPayroll.rest_day_ot_nd_hours}
                      </td>
                      <td className={styles.ptd}>
                        ₱{selectedPayroll.rest_day_ot_nd_rate}
                      </td>
                      <td className={styles.ptd}>
                        ₱{selectedPayroll.rest_day_ot_nd_total}
                      </td>
                    </tr>
                    <tr className={styles.htr}>
                      <th className={styles.pth}>Rest Day OT</th>
                      <td className={styles.ptd}>
                        {selectedPayroll.rest_day_ot_hours}
                      </td>
                      <td className={styles.ptd}>
                        ₱{selectedPayroll.rest_day_ot_rate}
                      </td>
                      <td className={styles.ptd}>
                        ₱{selectedPayroll.rest_day_ot_total}
                      </td>
                    </tr>
                    <tr className={styles.htr}>
                      <th className={styles.pth}>Rest Day OT Excess</th>
                      <td className={styles.ptd}>
                        {selectedPayroll.rest_day_ot_excess_hours}
                      </td>
                      <td className={styles.ptd}>
                        ₱{selectedPayroll.rest_day_ot_excess_rate}
                      </td>
                      <td className={styles.ptd}>
                        ₱{selectedPayroll.rest_day_ot_excess_total}
                      </td>
                    </tr>
                    <tr className={styles.htr}>
                      <th className={styles.pth}>Rest Day OT ND</th>
                      <td className={styles.ptd}>
                        {selectedPayroll.rest_day_ot_nd_hours}
                      </td>
                      <td className={styles.ptd}>
                        ₱{selectedPayroll.rest_day_ot_nd_rate}
                      </td>
                      <td className={styles.ptd}>
                        ₱{selectedPayroll.rest_day_ot_nd_total}
                      </td>
                    </tr>
                    <tr className={styles.htr}>
                      <th className={styles.pth}>Special Holiday OT</th>
                      <td className={styles.ptd}>
                        {selectedPayroll.special_holiday_ot_hours}
                      </td>
                      <td className={styles.ptd}>
                        ₱{selectedPayroll.special_holiday_ot_rate}
                      </td>
                      <td className={styles.ptd}>
                        ₱{selectedPayroll.special_holiday_ot_total}
                      </td>
                    </tr>
                    <tr className={styles.htr}>
                      <th className={styles.pth}>Legal Hol OT</th>
                      <td className={styles.ptd}>
                        {selectedPayroll.legal_holiday_ot_hours}
                      </td>
                      <td className={styles.ptd}>
                        ₱{selectedPayroll.legal_holiday_ot_rate}
                      </td>
                      <td className={styles.ptd}>
                        ₱{selectedPayroll.legal_holiday_ot_total}
                      </td>
                    </tr>
                    <tr className={styles.htr}>
                      <th className={styles.pth}>Legal Hol OT Excess</th>
                      <td className={styles.ptd}>
                        {selectedPayroll.legal_holiday_ot_excess_hours}
                      </td>
                      <td className={styles.ptd}>
                        ₱{selectedPayroll.legal_holiday_ot_excess_rate}
                      </td>
                      <td className={styles.ptd}>
                        ₱{selectedPayroll.legal_holiday_ot_excess_total}
                      </td>
                    </tr>
                    <tr className={styles.htr}>
                      <th className={styles.pth}>Legal Hol OT ND</th>
                      <td className={styles.ptd}>
                        {selectedPayroll.legal_holiday_ot_nd_hours}
                      </td>
                      <td className={styles.ptd}>
                        ₱{selectedPayroll.legal_holiday_ot_nd_rate}
                      </td>
                      <td className={styles.ptd}>
                        ₱{selectedPayroll.legal_holiday_ot_nd_total}
                      </td>
                    </tr>
                    <tr className={styles.htr}>
                      <th className={styles.pth}>Night Diff</th>
                      <td className={styles.ptd}>
                        {selectedPayroll.night_diff_hours}
                      </td>
                      <td className={styles.ptd}>
                        ₱{selectedPayroll.night_diff_rate}
                      </td>
                      <td className={styles.ptd}>
                        ₱{selectedPayroll.night_diff_total}
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
                        ₱{selectedPayroll.basic_allowance_total}
                      </td>
                    </tr>
                    <tr className={styles.htr}>
                      <th className={styles.pth}>Temp Allowance</th>
                      <td className={styles.ptd}></td>
                      <td className={styles.ptd}></td>
                      <td className={styles.ptd}>
                        ₱{selectedPayroll.temp_allowance_total}
                      </td>
                    </tr>
                    <tr className={styles.htr}>
                      <th className={styles.pth}>Total Earnings</th>
                      <td className={styles.ptd}></td>
                      <td className={styles.ptd}></td>
                      <td className={styles.ptd}>₱{selectedPayroll.gross}</td>
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
                        ₱{selectedPayroll.sss_contribution}
                      </td>
                    </tr>
                    <tr className={styles.htr}>
                      <th className={styles.pth}>SSS Loan</th>
                      <td className={styles.ptd}></td>
                      <td className={styles.ptd}></td>
                      <td className={styles.ptd}>
                        ₱{selectedPayroll.sss_loan}
                      </td>
                    </tr>
                    <tr className={styles.htr}>
                      <th className={styles.pth}>Pag-IBIG Contribution</th>
                      <td className={styles.ptd}></td>
                      <td className={styles.ptd}></td>
                      <td className={styles.ptd}>
                        ₱{selectedPayroll.pagibig_contribution}
                      </td>
                    </tr>
                    <tr className={styles.htr}>
                      <th className={styles.pth}>Pag-IBIG Loan</th>
                      <td className={styles.ptd}></td>
                      <td className={styles.ptd}></td>
                      <td className={styles.ptd}>
                        ₱{selectedPayroll.pagibig_loan}
                      </td>
                    </tr>
                    <tr className={styles.htr}>
                      <th className={styles.pth}>PhilHealth Contribution</th>
                      <td className={styles.ptd}></td>
                      <td className={styles.ptd}></td>
                      <td className={styles.ptd}>
                        ₱{selectedPayroll.philhealth_contribution}
                      </td>
                    </tr>
                    <tr className={styles.htr}>
                      <th className={styles.pth}>Donation</th>
                      <td className={styles.ptd}></td>
                      <td className={styles.ptd}></td>
                      <td className={styles.ptd}>
                        ₱{selectedPayroll.donation}
                      </td>
                    </tr>
                    <tr className={styles.htr}>
                      <th className={styles.pth}>Cash Advance</th>
                      <td className={styles.ptd}></td>
                      <td className={styles.ptd}></td>
                      <td className={styles.ptd}>
                        ₱{selectedPayroll.cash_advance}
                      </td>
                    </tr>
                    <tr className={styles.htr}>
                      <th className={styles.pth}>Staff Shops</th>
                      <td className={styles.ptd}></td>
                      <td className={styles.ptd}></td>
                      <td className={styles.ptd}>
                        ₱{selectedPayroll.staff_shops}
                      </td>
                    </tr>
                    <tr className={styles.htr}>
                      <th className={styles.pth}>Net Pay</th>
                      <td className={styles.ptd}></td>
                      <td className={styles.ptd}></td>
                      <td className={styles.ptd}>₱{selectedPayroll.net_pay}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default UserProfile;
