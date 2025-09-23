import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import styles from "../../../assets/styles/FINArchivePayroll.module.css";
import filterIcon from "../../../assets/images/filter-icon.svg";
import sortIcon from "../../../assets/images/sort-icon.svg";
import downloadIcon from "../../../assets/images/download-icon.svg";
import downloadHoverIcon from "../../../assets/images/download-hovered-icon.svg";
import * as XLSX from "xlsx";
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

const FINArchivePayroll = () => {
  const [payrolls, setPayrolls] = useState([]);
  const [search, setSearch] = useState("");
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [appliedRole, setAppliedRole] = useState("");
  const [tempRole, setTempRole] = useState("");
  const [sortOrder, setSortOrder] = useState("");
  const [tempSortOrder, setTempSortOrder] = useState("");
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const filterRef = useRef(null);
  const sortRef = useRef(null);
  const [expandPayroll, setExpandPayroll] = useState(null);
  const [isDownloadHovered, setIsDownloadHovered] = useState(null);

  const isDarkMode =
    document.documentElement.getAttribute("data-theme") === "dark";

  const fetchPayrolls = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/archive-payrolls`);
      setPayrolls(response.data.data);
    } catch (error) {
      console.error("Error fetching payrolls:", error);
    }
  };

  useEffect(() => {
    fetchPayrolls();
  }, []);

  const togglePeriod = (key) => {
    setExpandPayroll(expandPayroll === key ? null : key);
  };

  const filteredPayrolls = payrolls
    .filter((payroll) => {
      const payrollName = (payroll.role || "").toLowerCase();
      const matchesSearch = payrollName.includes(search.toLowerCase());

      const isWithinRoleFilter =
        !appliedRole ||
        payroll.role.toLowerCase() === appliedRole.toLowerCase();

      return matchesSearch && isWithinRoleFilter;
    })
    .sort((a, b) => {
      if (sortOrder === "date-asc")
        return new Date(a.created_at) - new Date(b.created_at);
      if (sortOrder === "date-desc")
        return new Date(b.created_at) - new Date(a.created_at);
      return 0;
    });

  const totalPages = Math.ceil(filteredPayrolls.length / itemsPerPage);
  const paginatedPayrolls = filteredPayrolls.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const applyFilters = (e) => {
    e.preventDefault();
    setAppliedRole(tempRole);
    setFilterDropdownOpen(false);
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

  const toggleSortDropdown = () => {
    setSortDropdownOpen((prev) => !prev);
    setFilterDropdownOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setFilterDropdownOpen(false);
      }
      if (sortRef.current && !sortRef.current.contains(event.target)) {
        setSortDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const downloadGroupExcel = (group) => {
    const employeeRows = group.employees.map((payroll) => ({
      Name: payroll.full_name,
      Department: payroll.department_name,
      Role: payroll.role,
      Rate: payroll.basic_pay_rate,
      Hours: payroll.basic_pay_days,
      Gross: payroll.gross,
      "SSS Contribution": payroll.sss_contribution,
      "SSS Loan": payroll.sss_loan,
      "PAGIBIG Contribution": payroll.pagibig_contribution,
      "PAGIBIG Loan": payroll.pagibig_loan,
      "Philhealth Contribution": payroll.philhealth_contribution,
      Staffshop: payroll.staff_shops,
      "Cash Advance": payroll.cash_advance,
      "Total Deductions": payroll.total_deductions,
      "Net Pay": payroll.net_pay,
      Period: group.payroll_period,
    }));

    const totalsRow = {
      Name: "TOTAL",
      Department: "",
      Role: "",
      Rate: "",
      Hours: "",
      Gross: group.employees.reduce((sum, e) => sum + Number(e.gross || 0), 0),
      "SSS Contribution": group.employees.reduce(
        (sum, e) => sum + Number(e.sss_contribution || 0),
        0
      ),
      "SSS Loan": group.employees.reduce(
        (sum, e) => sum + Number(e.sss_loan || 0),
        0
      ),
      "PAGIBIG Contribution": group.employees.reduce(
        (sum, e) => sum + Number(e.pagibig_contribution || 0),
        0
      ),
      "PAGIBIG Loan": group.employees.reduce(
        (sum, e) => sum + Number(e.pagibig_loan || 0),
        0
      ),
      "Philhealth Contribution": group.employees.reduce(
        (sum, e) => sum + Number(e.philhealth_contribution || 0),
        0
      ),
      Staffshop: group.employees.reduce(
        (sum, e) => sum + Number(e.staff_shops || 0),
        0
      ),
      "Cash Advance": group.employees.reduce(
        (sum, e) => sum + Number(e.cash_advance || 0),
        0
      ),
      "Total Deductions": group.employees.reduce(
        (sum, e) => sum + Number(e.total_deductions || 0),
        0
      ),
      "Net Pay": group.employees.reduce(
        (sum, e) => sum + Number(e.net_pay || 0),
        0
      ),
      Period: "",
    };

    const worksheet = XLSX.utils.json_to_sheet([...employeeRows, totalsRow]);

    const workbook = XLSX.utils.book_new();

    let sheetName = group.payroll_period
      .replace(/[^a-zA-Z0-9 ]/g, "")
      .substring(0, 31);

    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    XLSX.writeFile(
      workbook,
      `Payroll_${group.payroll_period.replace(/[^a-zA-Z0-9]/g, "_")}.xlsx`
    );
  };

  return (
    <div className={styles["payrolls-content"]}>
      <div className={styles["content-header-container"]}>
        <h1 className={styles["page-title"]}>Archive Payroll</h1>
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
                            setTempRole("");
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
                          Admin
                          <input
                            className={styles["filter-input"]}
                            id="from"
                            type="radio"
                            value="Admin"
                            checked={tempRole === "Admin"}
                            onChange={(e) => setTempRole(e.target.value)}
                          />
                        </label>
                        <label className={styles["filter-label"]} htmlFor="to">
                          Driver
                          <input
                            className={styles["filter-input"]}
                            id="to"
                            type="radio"
                            value="Driver"
                            checked={tempRole === "Driver"}
                            onChange={(e) => setTempRole(e.target.value)}
                          />
                        </label>
                        <label className={styles["filter-label"]} htmlFor="to">
                          Crew
                          <input
                            className={styles["filter-input"]}
                            id="to"
                            type="radio"
                            value="Crew"
                            checked={tempRole === "Crew"}
                            onChange={(e) => setTempRole(e.target.value)}
                          />
                        </label>
                      </div>
                    </div>
                    <div className={styles["filter-button-container"]}>
                      <button
                        className={styles["filter-reset-button"]}
                        type="submit"
                        onClick={() => {
                          setTempRole("");
                          setAppliedRole("");
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
          </div>
        </div>
        <div className={styles["table-container"]}>
          <table className={styles.table}>
            <thead className={styles.thead}>
              <tr className={styles.ehtr}>
                <th className={styles.eth} colSpan={3}>
                  Payroll Period
                </th>
                <th className={styles.eth} colSpan={3}>
                  Role
                </th>
                <th className={styles.eth} colSpan={3}>
                  Payroll Start
                </th>
                <th className={styles.eth} colSpan={3}>
                  Payroll End
                </th>
                <th className={styles.eth} colSpan={3}>
                  Action
                </th>
              </tr>
            </thead>
            <tbody className={styles.tbody}>
              {paginatedPayrolls.map((group, index) => {
                const key = `${group.period_start}_${group.period_end}`;
                return (
                  <React.Fragment key={key}>
                    <tr
                      className={styles.ebtr}
                      onClick={() => togglePeriod(key)}
                    >
                      <td className={styles.etd} colSpan={3}>
                        {group.payroll_period}
                      </td>
                      <td className={styles.etd} colSpan={3}>
                        {group.role}
                      </td>
                      <td className={styles.etd} colSpan={3}>
                        {new Date(group.period_start).toLocaleDateString(
                          "en-US",
                          {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          }
                        )}
                      </td>
                      <td className={styles.etd} colSpan={3}>
                        {new Date(group.period_end).toLocaleDateString(
                          "en-US",
                          {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          }
                        )}
                      </td>
                      <td className={styles.td} colSpan={3}>
                        <div className={styles["action-container"]}>
                          <button
                            className={styles["download-button"]}
                            onMouseEnter={() => setIsDownloadHovered(index)}
                            onMouseLeave={() => setIsDownloadHovered(null)}
                            onClick={(e) => {
                              e.stopPropagation();
                              downloadGroupExcel(group);
                            }}
                          >
                            <img
                              className={styles["download-icon"]}
                              src={
                                isDownloadHovered === index
                                  ? downloadHoverIcon
                                  : downloadIcon
                              }
                              alt="Download"
                            />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {expandPayroll === key && (
                      <tr>
                        <td colSpan={15} className={styles.td}>
                          <div className={styles["expanded-container"]}>
                            <table className={styles.table}>
                              <thead className={styles.thead}>
                                <tr className={styles.htr}>
                                  <th className={styles.th}>Name</th>
                                  <th className={styles.th}>Department</th>
                                  <th className={styles.th}>Rate</th>
                                  <th className={styles.th}>Hours</th>
                                  <th className={styles.th}>Gross</th>
                                  <th className={styles.th}>
                                    SSS Contribution
                                  </th>
                                  <th className={styles.th}>SSS Loan</th>
                                  <th className={styles.th}>
                                    PAGIBIG Contribution
                                  </th>
                                  <th className={styles.th}>PAGIBIG Loan</th>
                                  <th className={styles.th}>
                                    Philhealth Contribution
                                  </th>
                                  <th className={styles.th}>Staffshop</th>
                                  <th className={styles.th}>Cash Advance</th>
                                  <th className={styles.th}>Total Deduction</th>
                                  <th className={styles.th}>Net Pay</th>
                                  <th className={styles.th}>Period</th>
                                </tr>
                              </thead>
                              <tbody>
                                {group.employees.map((payroll, idx) => (
                                  <tr className={styles.btr} key={idx}>
                                    <td
                                      className={`${styles.td} ${styles["full-name-td"]}`}
                                    >
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
                                    <td className={styles.td}>
                                      ₱{payroll.basic_pay_rate}
                                    </td>
                                    <td className={styles.td}>
                                      {payroll.basic_pay_days}
                                    </td>
                                    <td className={styles.td}>
                                      ₱{payroll.gross}
                                    </td>
                                    <td className={styles.td}>
                                      ₱{payroll.sss_contribution}
                                    </td>
                                    <td className={styles.td}>
                                      ₱{payroll.sss_loan}
                                    </td>
                                    <td className={styles.td}>
                                      ₱{payroll.pagibig_contribution}
                                    </td>
                                    <td className={styles.td}>
                                      ₱{payroll.pagibig_loan}
                                    </td>
                                    <td className={styles.td}>
                                      ₱{payroll.philhealth_contribution}
                                    </td>
                                    <td className={styles.td}>
                                      ₱{payroll.staff_shops}
                                    </td>
                                    <td className={styles.td}>
                                      ₱{payroll.cash_advance}
                                    </td>
                                    <td className={styles.td}>
                                      ₱{payroll.total_deductions}
                                    </td>
                                    <td className={styles.td}>
                                      ₱{payroll.net_pay}
                                    </td>
                                    <td className={styles.td}>
                                      {group.payroll_period}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                              <tfoot>
                                <tr className={styles.htr}>
                                  <td className={styles.th} colSpan={4}>
                                    Totals
                                  </td>
                                  <td className={styles.td}>
                                    ₱
                                    {group.employees.reduce(
                                      (sum, e) => sum + Number(e.gross || 0),
                                      0
                                    )}
                                  </td>
                                  <td className={styles.td}>
                                    ₱
                                    {group.employees.reduce(
                                      (sum, e) =>
                                        sum + Number(e.sss_contribution || 0),
                                      0
                                    )}
                                  </td>
                                  <td className={styles.td}>
                                    ₱
                                    {group.employees.reduce(
                                      (sum, e) => sum + Number(e.sss_loan || 0),
                                      0
                                    )}
                                  </td>
                                  <td className={styles.td}>
                                    ₱
                                    {group.employees.reduce(
                                      (sum, e) =>
                                        sum +
                                        Number(e.pagibig_contribution || 0),
                                      0
                                    )}
                                  </td>
                                  <td className={styles.td}>
                                    ₱
                                    {group.employees.reduce(
                                      (sum, e) =>
                                        sum + Number(e.pagibig_loan || 0),
                                      0
                                    )}
                                  </td>
                                  <td className={styles.td}>
                                    ₱
                                    {group.employees.reduce(
                                      (sum, e) =>
                                        sum +
                                        Number(e.philhealth_contribution || 0),
                                      0
                                    )}
                                  </td>
                                  <td className={styles.td}>
                                    ₱
                                    {group.employees.reduce(
                                      (sum, e) =>
                                        sum + Number(e.staff_shops || 0),
                                      0
                                    )}
                                  </td>
                                  <td className={styles.td}>
                                    ₱
                                    {group.employees.reduce(
                                      (sum, e) =>
                                        sum + Number(e.cash_advance || 0),
                                      0
                                    )}
                                  </td>
                                  <td className={styles.td}>
                                    ₱
                                    {group.employees.reduce(
                                      (sum, e) =>
                                        sum + Number(e.total_deductions || 0),
                                      0
                                    )}
                                  </td>
                                  <td className={styles.td}>
                                    ₱
                                    {group.employees.reduce(
                                      (sum, e) => sum + Number(e.net_pay || 0),
                                      0
                                    )}
                                  </td>
                                  <td className={styles.td}></td>
                                </tr>
                              </tfoot>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
              {paginatedPayrolls.length === 0 && (
                <tr className={styles.btr}>
                  <td
                    colSpan="15"
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
    </div>
  );
};

export default FINArchivePayroll;
