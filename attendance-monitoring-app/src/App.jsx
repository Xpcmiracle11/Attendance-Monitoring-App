import React, { useEffect, useState, useRef } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import axios from "axios";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Departments from "./pages/Departments";
import Users from "./pages/Users";
import Trucks from "./pages/Trucks";
import Monitoring from "./pages/Monitoring";
import AdminAttendance from "./pages/AdminAttendance";
import DriverAttendance from "./pages/DriverAttendance";
import CrewAttendance from "./pages/CrewAttendance";
import Device from "./pages/Device";
import CurrentPayroll from "./pages/CurrentPayroll";
import ArchivePayroll from "./pages/ArchivePayroll";
import Profile from "./pages/Profile";
import Site from "./pages/Site";
import NPIDmr from "./pages/NPIDmr";
import Lmr from "./pages/Lmr";
import Etmr from "./pages/Etmr";
import Allowance from "./pages/Allowance";
import Holiday from "./pages/Holiday";
import Matrix from "./pages/Matrix";
import EmployeeProfile from "./pages/EmployeeProfile";
import Customer from "./pages/Customer";
import Loading from "./components/Loading";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";

const PrivateRoute = ({ children, allowedDepartments }) => {
  const [authState, setAuthState] = useState({
    isAuthenticated: null,
    userDepartment: null,
    error: null,
  });

  const abortControllerRef = useRef(null);

  useEffect(() => {
    const token =
      localStorage.getItem("token") || sessionStorage.getItem("token");

    console.log("🔍 Checking token:", token);

    if (!token) {
      console.warn("🚫 No token found. Redirecting to login.");
      setAuthState({
        isAuthenticated: false,
        userDepartment: null,
        error: "No token",
      });
      return;
    }

    if (abortControllerRef.current) abortControllerRef.current.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const validateToken = async () => {
      try {
        console.log("🌐 Validating token at:", `${API_BASE_URL}/user`);
        const response = await axios.get(`${API_BASE_URL}/user`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
          timeout: 10000,
        });

        console.log("✅ Response from backend:", response.data);

        if (response.data?.success && response.data?.user) {
          const user = response.data.user;
          setAuthState({
            isAuthenticated: true,
            userDepartment: user.department_name || null,
            error: null,
          });
        } else {
          console.warn("⚠️ Token validation failed. Redirecting.");
          setAuthState({
            isAuthenticated: false,
            userDepartment: null,
            error: "Invalid token",
          });
        }
      } catch (error) {
        console.error("❌ Token validation error:", error.message);
        setAuthState({
          isAuthenticated: false,
          userDepartment: null,
          error: "Network or server error",
        });
      }
    };

    validateToken();

    return () => controller.abort();
  }, []);

  console.log("🔎 Auth State:", authState);

  if (authState.isAuthenticated === null) {
    return <Loading />;
  }

  if (authState.isAuthenticated) {
    if (!allowedDepartments) return children;
    if (
      authState.userDepartment &&
      allowedDepartments.includes(authState.userDepartment)
    ) {
      return children;
    } else {
      console.warn("🚫 Access denied. Redirecting.");
      return <Navigate to="/" replace />;
    }
  }

  return <Navigate to="/" replace />;
};

function App() {
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "light";
    document.documentElement.setAttribute("data-theme", savedTheme);
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />

        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />

        <Route
          path="/departments"
          element={
            <PrivateRoute allowedDepartments={["IT Department"]}>
              <Departments />
            </PrivateRoute>
          }
        />

        <Route
          path="/users"
          element={
            <PrivateRoute
              allowedDepartments={["Human Resources", "IT Department"]}
            >
              <Users />
            </PrivateRoute>
          }
        />

        <Route
          path="/trucks"
          element={
            <PrivateRoute
              allowedDepartments={["Human Resources", "Operations"]}
            >
              <Trucks />
            </PrivateRoute>
          }
        />

        <Route
          path="/monitoring"
          element={
            <PrivateRoute allowedDepartments={["Human Resources"]}>
              <Monitoring />
            </PrivateRoute>
          }
        />

        <Route
          path="/attendance/admin"
          element={
            <PrivateRoute allowedDepartments={["Human Resources"]}>
              <AdminAttendance />
            </PrivateRoute>
          }
        />

        <Route
          path="/attendance/driver"
          element={
            <PrivateRoute allowedDepartments={["Human Resources"]}>
              <DriverAttendance />
            </PrivateRoute>
          }
        />

        <Route
          path="/attendance/crew"
          element={
            <PrivateRoute allowedDepartments={["Human Resources"]}>
              <CrewAttendance />
            </PrivateRoute>
          }
        />

        <Route
          path="/device"
          element={
            <PrivateRoute allowedDepartments={["IT Department"]}>
              <Device />
            </PrivateRoute>
          }
        />

        <Route
          path="/payroll/current"
          element={
            <PrivateRoute allowedDepartments={["Finance", "Human Resources"]}>
              <CurrentPayroll />
            </PrivateRoute>
          }
        />

        <Route
          path="/payroll/archive"
          element={
            <PrivateRoute allowedDepartments={["Finance", "Human Resources"]}>
              <ArchivePayroll />
            </PrivateRoute>
          }
        />

        <Route
          path="/customer"
          element={
            <PrivateRoute allowedDepartments={["Operations"]}>
              <Customer />
            </PrivateRoute>
          }
        />

        <Route
          path="/matrix"
          element={
            <PrivateRoute allowedDepartments={["Finance"]}>
              <Matrix />
            </PrivateRoute>
          }
        />

        <Route
          path="/site"
          element={
            <PrivateRoute allowedDepartments={["Operations"]}>
              <Site />
            </PrivateRoute>
          }
        />

        <Route
          path="/dmr/npi"
          element={
            <PrivateRoute allowedDepartments={["Operations"]}>
              <NPIDmr />
            </PrivateRoute>
          }
        />

        <Route
          path="/lmr"
          element={
            <PrivateRoute allowedDepartments={["Operations"]}>
              <Lmr />
            </PrivateRoute>
          }
        />

        <Route
          path="/etmr"
          element={
            <PrivateRoute allowedDepartments={["Operations"]}>
              <Etmr />
            </PrivateRoute>
          }
        />

        <Route
          path="/allowance"
          element={
            <PrivateRoute allowedDepartments={["Operations", "Finance"]}>
              <Allowance />
            </PrivateRoute>
          }
        />

        <Route
          path="/holiday"
          element={
            <PrivateRoute allowedDepartments={["Human Resources"]}>
              <Holiday />
            </PrivateRoute>
          }
        />

        <Route
          path="/employee-profile/:id"
          element={
            <PrivateRoute allowedDepartments={["Human Resources"]}>
              <EmployeeProfile />
            </PrivateRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <PrivateRoute
              allowedDepartments={[
                "Finance",
                "Human Resources",
                "IT Department",
                "Operations",
                "Motorpool",
              ]}
            >
              <Profile />
            </PrivateRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
