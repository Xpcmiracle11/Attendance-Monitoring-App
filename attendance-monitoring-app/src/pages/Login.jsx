import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import styles from "../assets/styles/Login.module.css";
import loginBackground from "../assets/images/login-background.svg";
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const savedEmail = localStorage.getItem("savedEmail");
    const savedPassword = localStorage.getItem("savedPassword");

    if (savedEmail && savedPassword) {
      setEmail(savedEmail);
      setPassword(savedPassword);
      setRememberMe(true);
    }

    const checkSession = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const response = await axios.get(`${API_BASE_URL}/user`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (response.data.success) {
            navigate("/dashboard");
          }
        } catch (err) {
          console.error("Error validating token:", err);
          localStorage.removeItem("token");
        }
      }
    };

    checkSession();
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const response = await axios.post(`${API_BASE_URL}/login`, {
        email,
        password,
      });

      if (response.data.success) {
        localStorage.setItem("token", response.data.token);

        if (rememberMe) {
          localStorage.setItem("savedEmail", email);
          localStorage.setItem("savedPassword", password);
        } else {
          localStorage.removeItem("savedEmail");
          localStorage.removeItem("savedPassword");
        }

        navigate("/dashboard");
      } else {
        setError(response.data.message);
      }
    } catch (err) {
      setError(err.response?.data?.message || "An unexpected error occurred.");
    }
  };

  return (
    <div className={styles.login}>
      <div className={styles["login-card"]}>
        <div className={styles["card-left-side"]}>
          <img
            className={styles["login-background"]}
            src={loginBackground}
            alt="Background"
          />
        </div>
        <div className={styles["card-right-side"]}>
          <div className={styles["login-header"]}>
            <h1 className={styles["header-label"]}>Welcome Back!</h1>
            <h3 className={styles["header-sub-label"]}>
              Please log-in to continue
            </h3>
          </div>
          <form
            className={styles["input-label-container"]}
            onSubmit={handleLogin}
          >
            <label className={styles.label} htmlFor="email">
              Email
              <input
                className={styles.input}
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>
            <label className={styles.label} htmlFor="password">
              Password
              <input
                className={styles.input}
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </label>
            <label className={styles["checkbox-label"]} htmlFor="checkbox">
              <input
                className={styles["checkbox-input"]}
                id="checkbox"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              Remember me
            </label>
            {error && <p className={styles["error-message"]}>{error}</p>}
            <button className={styles["login-button"]} type="submit">
              Log-in
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
