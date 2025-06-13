import React, { useEffect, useState } from "react";
import axios from "axios";
import styles from "../../../assets/styles/HRDashboard.module.css";
import totalUserIcon from "../../../assets/images/total-user-icon.svg";
import totalAdminIcon from "../../../assets/images/total-admin-icon.svg";
import totalDriverIcon from "../../../assets/images/total-driver-icon.svg";
import totalCrewIcon from "../../../assets/images/total-crew-icon.svg";
import Chart from "react-apexcharts";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

const HRDashboard = () => {
  const [users, setUsers] = useState(0);
  const [barChartData, setBarChartData] = useState({
    series: [],
    categories: [],
  });
  const [radialChartSeries, setRadialChartSeries] = useState([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [chartKey, setChartKey] = useState(0);
  const [attendanceRate, setAttendanceRate] = useState(null);
  const [dailyAttendanceData, setDailyAttendanceData] = useState([]);

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/user-count`);
      if (response.data.success) {
        const { totals, attendanceRateToday, dailyAttendance } =
          response.data.data;

        setUsers(totals);
        setRadialChartSeries([
          totals.total_admins,
          totals.total_crews,
          totals.total_drivers,
        ]);
        setTotalUsers(totals.total_users);
        setAttendanceRate(attendanceRateToday);

        const dates = dailyAttendance.map((item) =>
          new Date(item.date).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
          })
        );
        const counts = dailyAttendance.map((item) => item.present);

        setDailyAttendanceData({
          categories: dates,
          series: [
            {
              name: "Present Employees",
              data: counts,
            },
          ],
        });
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setTimeout(() => {
        window.dispatchEvent(new Event("resize"));
        setChartKey((prev) => prev + 1);
      }, 100);
    }
  };

  const fetchChartData = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/user-count`);
      if (response.data.success) {
        const data = response.data.data.chart;

        const months = data.map((item) => {
          const date = new Date(item.y, item.m - 1);
          return date.toLocaleString("default", { month: "short" });
        });

        const admins = data.map((item) => item.admins || 0);
        const crews = data.map((item) => item.crews || 0);
        const drivers = data.map((item) => item.drivers || 0);

        setBarChartData({
          categories: months,
          series: [
            { name: "Admins", data: admins },
            { name: "Crews", data: crews },
            { name: "Drivers", data: drivers },
          ],
        });
      }
    } catch (error) {
      console.error("Error fetching chart data:", error);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchChartData();
  }, []);

  const radialChartOptions = {
    chart: {
      type: "donut",
      fontFamily: "'Poppins', sans-serif",
      foreColor: "var(--text-primary)",
    },
    labels: ["Admins", "Crews", "Drivers"],
    colors: ["#3399FF", "#33CCCC", "#6666CC"],
    legend: { position: "bottom" },
    dataLabels: {
      enabled: true,
      formatter: (val) => `${val.toFixed(1)}%`,
    },
    plotOptions: {
      pie: {
        donut: {
          size: "70%",
          labels: {
            show: true,
            total: {
              show: true,
              label: "Total",
              fontSize: "18px",
              fontWeight: 600,
              color: "#333",
              formatter: () => `${totalUsers}`,
            },
          },
        },
      },
    },
  };

  const barChartOptions = {
    chart: {
      stacked: true,
      toolbar: { show: false },
      fontFamily: "'Poppins', sans-serif",
      foreColor: "var(--text-primary)",
      animations: {
        enabled: true,
        easing: "easeinout",
        speed: 800,
        animateGradually: { enabled: true, delay: 150 },
        dynamicAnimation: { enabled: true, speed: 350 },
      },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        borderRadius: 5,
        columnWidth: "50%",
        dataLabels: {
          total: {
            enabled: true,
            style: { fontSize: "13px", fontWeight: 900 },
          },
        },
      },
    },
    dataLabels: { enabled: false },
    xaxis: {
      categories: barChartData.categories,
      title: {
        text: "Number of Employees",
        style: {
          fontWeight: "normal",
        },
      },
    },
    legend: { position: "top" },
    fill: { opacity: 1 },
    colors: ["#3399FF", "#33CCCC", "#6666CC"],
  };

  const attendanceRateOptions = {
    chart: {
      type: "radialBar",
      fontFamily: "'Poppins', sans-serif",
      foreColor: "var(--text-primary)",
    },
    plotOptions: {
      radialBar: {
        hollow: { size: "70%" },
        dataLabels: {
          name: { offsetY: -10, fontSize: "16px" },
          value: { fontSize: "22px" },
        },
      },
    },
    labels: ["Attendance Rate"],
    colors: ["#00C49F"],
  };

  const lineChartOptions = {
    chart: {
      id: "daily-attendance-line",
      type: "line",
      toolbar: { show: false },
      fontFamily: "'Poppins', sans-serif",
      foreColor: "var(--text-primary)",
      zoom: {
        enabled: true,
        type: "x",
        autoScaleYaxis: true,
      },
      events: {
        mounted: (chartContext) => {
          const total = dailyAttendanceData.categories?.length || 0;

          if (total > 20) {
            const categories = dailyAttendanceData.categories;
            const from = new Date(categories[total - 20]).getTime();
            const to = new Date(categories[total - 1]).getTime();
            chartContext.chart.zoomX(from, to);
          }
        },
      },
    },
    xaxis: {
      type: "datetime",
      categories: dailyAttendanceData.categories || [],
    },
    yaxis: {
      min: 0,
      forceNiceScale: true,
    },
    stroke: {
      curve: "smooth",
      width: 3,
    },
    markers: {
      size: 4,
    },
    colors: ["#6666CC"],
    tooltip: {
      x: { format: "dd MMM" },
    },
  };

  return (
    <div className={styles["dashboards-content"]}>
      <div className={styles["content-header-container"]}>
        <h1 className={styles["page-title"]}>Dashboard</h1>
      </div>
      <div className={styles["content-body-container"]}>
        <div className={styles["total-card-container"]}>
          {users &&
            [
              {
                label: "Total Users",
                value: users.total_users,
                image: totalUserIcon,
              },
              {
                label: "Total Admins",
                value: users.total_admins,
                image: totalAdminIcon,
              },
              {
                label: "Total Drivers",
                value: users.total_drivers,
                image: totalDriverIcon,
              },
              {
                label: "Total Crews",
                value: users.total_crews,
                image: totalCrewIcon,
              },
            ].map((info, index) => (
              <div className={styles["total-card"]} key={index}>
                <div className={styles["total-card-info-container"]}>
                  <p className={styles["total-card-label"]}>{info.label}</p>
                  <h1 className={styles["total-card-value"]}>{info.value}</h1>
                </div>
                <div className={styles["total-card-icon-container"]}>
                  <img
                    className={styles["total-card-icon"]}
                    src={info.image}
                    alt={info.label}
                  />
                </div>
              </div>
            ))}
        </div>
        <div className={styles["employee-charts-info-container"]}>
          <div className={styles["employee-bar-chart-info-card"]}>
            {barChartData.series.length > 0 && (
              <Chart
                key={`bar-${chartKey}`}
                type="bar"
                height={250}
                style={{ width: "100%" }}
                options={barChartOptions}
                series={barChartData.series}
              />
            )}
          </div>

          <div className={styles["employee-radial-chart-info-card"]}>
            {radialChartSeries.length > 0 && (
              <Chart
                key={`donut-${chartKey}`}
                type="donut"
                height={250}
                style={{ width: "100%" }}
                series={radialChartSeries}
                options={radialChartOptions}
              />
            )}
          </div>
        </div>
        <div className={styles["employee-attendance-info-container"]}>
          <div className={styles["employee-attendance-radial-info-card"]}>
            {attendanceRate && (
              <>
                <Chart
                  type="radialBar"
                  height={250}
                  options={attendanceRateOptions}
                  series={[parseFloat(attendanceRate.rate)]}
                />
                <p className={styles["employee-attendance-info-label"]}>
                  Present: {attendanceRate.present} / {attendanceRate.total}
                </p>
              </>
            )}
          </div>
          <div className={styles["employee-attendance-line-info-card"]}>
            {dailyAttendanceData.series && (
              <>
                <Chart
                  type="line"
                  height={250}
                  style={{ width: "100%" }}
                  options={lineChartOptions}
                  series={dailyAttendanceData.series}
                />
                <p className={styles["employee-attendance-info-label"]}>
                  Daily Attendance Monitoring
                </p>
              </>
            )}
          </div>
          <div className={styles["employee-attendance-calendar-info-card"]}>
            <div className={styles["calendar-wrapper"]}>
              <iframe
                src="https://calendar.google.com/calendar/embed?height=600&wkst=1&ctz=UTC&showPrint=0&src=Y2hhcmxlc2FndXN0aW4ubW9ucmVhbEBnbWFpbC5jb20&src=ZW4ucGhpbGlwcGluZXMjaG9saWRheUBncm91cC52LmNhbGVuZGFyLmdvb2dsZS5jb20&color=%23039be5&color=%230b8043"
                style={{
                  width: "100%",
                  height: "100%",
                  minHeight: 250,
                  backgroundColor: "#0000",
                }}
                frameBorder="0"
                scrolling="no"
                title="Google Calendar"
              ></iframe>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HRDashboard;
