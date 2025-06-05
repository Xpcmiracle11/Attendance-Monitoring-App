import React, { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Departments from "./pages/Departments";
import Users from "./pages/Users";
import Trucks from "./pages/Trucks";
import Monitoring from "./pages/Monitoring";
import Attendance from "./pages/Attendance";
import Dispatch from "./pages/Dispatch";
import Device from "./pages/Device";
import Payroll from "./pages/Payroll";
import Loan from "./pages/Loan";
import Profile from "./pages/Profile";
import Loading from "./components/Loading";
import axios from "axios";
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";
const PrivateRoute = ({ children, allowedDepartments }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [userDepartment, setUserDepartment] = useState(null);

  useEffect(() => {
    const validateToken = async () => {
      const token =
        localStorage.getItem("token") || sessionStorage.getItem("token");
      if (!token) {
        setIsAuthenticated(false);
        return;
      }
      try {
        const response = await axios.get(`${API_BASE_URL}/user`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.data.success) {
          setIsAuthenticated(true);
          setUserDepartment(response.data.user.department_name);
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error("Error validating token: ", error);

        if (
          error.response?.data?.message ===
          "Session expired. Please log-in again."
        ) {
          localStorage.removeItem("token");
          sessionStorage.removeItem("token");
          window.location.href = "/";
        }
        setIsAuthenticated(false);
      }
    };
    validateToken();
  }, []);

  useEffect(() => {
    const handleStorageChange = (event) => {
      if (event.key === "token" && !event.newValue) {
        window.location.href = "/";
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  if (isAuthenticated === null) {
    return <Loading />;
  }

  if (
    isAuthenticated &&
    (!allowedDepartments || allowedDepartments.includes(userDepartment))
  ) {
    return children;
  }

  return <Navigate to="/" />;
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
            <PrivateRoute allowedDepartments={["Human Resources"]}>
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
          path="/attendance"
          element={
            <PrivateRoute allowedDepartments={["Human Resources"]}>
              <Attendance />
            </PrivateRoute>
          }
        />
        <Route
          path="/dispatch"
          element={
            <PrivateRoute allowedDepartments={["Operations"]}>
              <Dispatch />
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
          path="/payroll"
          element={
            <PrivateRoute allowedDepartments={["Finance", "Human Resources"]}>
              <Payroll />
            </PrivateRoute>
          }
        />
        <Route
          path="/loan"
          element={
            <PrivateRoute allowedDepartments={["Human Resources", "Finance"]}>
              <Loan />
            </PrivateRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <Profile />
            </PrivateRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
