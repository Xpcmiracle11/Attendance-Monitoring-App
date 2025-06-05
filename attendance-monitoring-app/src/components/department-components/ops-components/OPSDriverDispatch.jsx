import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import Map from "../../Map";
import Loading from "../../Loading";
import styles from "../../../assets/styles/OPSDriverDispatch.module.css";

const OPSDriverDispatch = () => {
  const [dispatchData, setDispatchData] = useState(null);
  const [isTripStarted, setIsTripStarted] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [userLocation, setUserLocation] = useState(null);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const intervalRef = useRef(null);
  const pollingIntervalRef = useRef(null);
  const locationUpdateInterval = useRef(null);

  const fetchDispatchData = async () => {
    try {
      const response = await axios.get("http://localhost:8080/api/trip", {
        headers: {
          Authorization: `Bearer ${
            localStorage.getItem("token") || sessionStorage.getItem("token")
          }`,
        },
      });

      if (response.data.success) {
        const data = response.data.dispatchDetails;
        setDispatchData(data);

        if (data?.id) {
          fetchRouteHistory(data.id);
        }
        if (data.status === "Active") {
          setIsTripStarted(true);
          const startTime = new Date(data.start_time).getTime();
          const now = new Date().getTime();
          const elapsedSeconds = Math.floor((now - startTime) / 1000);
          setElapsedTime(elapsedSeconds);

          if (!intervalRef.current) {
            intervalRef.current = setInterval(() => {
              setElapsedTime((prev) => prev + 1);
            }, 1000);
          }
        }
      }
    } catch (err) {
      console.error("Error fetching dispatch data:", err);
    }
  };

  const fetchRouteHistory = async (dispatchId) => {
    try {
      const response = await axios.get(
        `http://localhost:8080/api/route-history/${dispatchId}`
      );

      if (response.data.success) {
        const coordinates = response.data.data.map((point) => [
          point.latitude,
          point.longitude,
        ]);
        setRouteCoordinates(coordinates);
      }
    } catch (error) {
      console.error("Error fetching route history:", error);
    }
  };

  useEffect(() => {
    pollingIntervalRef.current = setInterval(() => {
      fetchDispatchData();
    }, 1000);

    return () => clearInterval(pollingIntervalRef.current);
  }, []);

  useEffect(() => {
    fetchDispatchData();
    return () => {
      clearInterval(intervalRef.current);
      clearInterval(pollingIntervalRef.current);
    };
  }, []);

  useEffect(() => {
    if (dispatchData?.status === "Active") {
      if (!intervalRef.current) {
        intervalRef.current = setInterval(() => {
          setElapsedTime((prev) => prev + 1);
        }, 1000);
      }
    } else {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    return () => clearInterval(intervalRef.current);
  }, [dispatchData?.status]);

  const handleStartTrip = async () => {
    if (!userLocation) {
      alert("User location is not available.");
      return;
    }

    try {
      const response = await axios.put(
        "http://localhost:8080/api/start-trip",
        {
          dispatch_id: dispatchData?.id,
          location: userLocation,
        },
        {
          headers: {
            Authorization: `Bearer ${
              localStorage.getItem("token") || sessionStorage.getItem("token")
            }`,
          },
        }
      );

      if (response.data.success) {
        setIsTripStarted(true);

        setDispatchData((prev) => ({
          ...prev,
          status: "Active",
          start_time: new Date().toISOString(),
        }));

        setElapsedTime(0);
        clearInterval(intervalRef.current);
        intervalRef.current = setInterval(() => {
          setElapsedTime((prev) => prev + 1);
        }, 1000);

        locationUpdateInterval.current = setInterval(async () => {
          try {
            if (!userLocation) {
              console.warn(
                "User location is not available for periodic update."
              );
              return;
            }

            await axios.post(
              "http://localhost:8080/api/insert-route-history",
              {
                dispatch_id: dispatchData?.id,
                location: userLocation,
              },
              {
                headers: {
                  Authorization: `Bearer ${
                    localStorage.getItem("token") ||
                    sessionStorage.getItem("token")
                  }`,
                },
              }
            );
          } catch (error) {
            console.error("Error inserting route history:", error);
          }
        }, 60000);
      }
    } catch (error) {
      console.error("Error starting trip:", error);
    }
  };

  const handleEndTrip = async () => {
    if (!userLocation) {
      alert("User location is not available.");
      return;
    }

    try {
      const response = await axios.put(
        "http://localhost:8080/api/end-trip",
        {
          dispatch_id: dispatchData?.id,
          location: userLocation,
        },
        {
          headers: {
            Authorization: `Bearer ${
              localStorage.getItem("token") || sessionStorage.getItem("token")
            }`,
          },
        }
      );

      if (response.data.success) {
        clearInterval(intervalRef.current);
        clearInterval(locationUpdateInterval.current);

        setIsTripStarted(false);
        setElapsedTime(0);

        setDispatchData((prev) => ({
          ...prev,
          status: "Done",
          end_time: new Date().toISOString(),
        }));
      }
    } catch (error) {
      console.error("Error ending trip:", error);
    }
  };

  useEffect(() => {
    return () => {
      clearInterval(intervalRef.current);
      if (locationUpdateInterval.current) {
        clearInterval(locationUpdateInterval.current);
      }
    };
  }, []);

  const formatTime = (seconds) => {
    if (typeof seconds !== "number" || isNaN(seconds)) {
      return "00:00:00";
    }

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
      2,
      "0"
    )}:${String(remainingSeconds).padStart(2, "0")}`;
  };

  return (
    <div className={styles["driver-dispatch-content"]}>
      {dispatchData?.status === "Done" || !dispatchData ? (
        <div className={styles["no-dispatch-message-container"]}>
          <h1 className={styles["no-dispatch-message"]}>
            No available dispatch for now.
          </h1>
          <Loading />
        </div>
      ) : (
        <div className={styles["driver-dispatch-container"]}>
          <div className={styles["driver-dispatch-details-container"]}>
            <div className={styles["driver-information-status-container"]}>
              <div className={styles["driver-information-container"]}>
                <h1 className={styles["driver-name"]}>
                  {dispatchData?.driver_name || "Unknown Driver"}
                </h1>
                <h1 className={styles["driver-plate-number"]}>
                  Plate No: {dispatchData?.plate_number || "N/A"}
                </h1>
              </div>
              <div className={styles["driver-dispatch-operation-container"]}>
                <h1
                  className={`${
                    dispatchData?.status === "Pending"
                      ? styles["driver-dispatch-pending"]
                      : dispatchData?.status === "Active"
                      ? styles["driver-dispatch-active"]
                      : dispatchData?.status === "Done"
                      ? styles["driver-dispatch-done"]
                      : ""
                  }`}
                >
                  {dispatchData?.status || "Unknown Status"}
                </h1>
              </div>
            </div>
            <div className={styles["start-trip-button-container"]}>
              {!isTripStarted ? (
                <button
                  className={styles["start-trip-button"]}
                  onClick={handleStartTrip}
                >
                  Start Trip
                </button>
              ) : (
                <button
                  className={styles["end-trip-button"]}
                  onClick={handleEndTrip}
                >
                  End Trip
                </button>
              )}
            </div>
            <div className={styles["dispatch-details-container"]}>
              <div className={styles["header-details-container"]}>
                <h1 className={styles["dispatch-details-header"]}>
                  Bound From:
                </h1>
                <h1 className={styles["dispatch-details-information"]}>
                  {dispatchData?.bound_from || "N/A"}
                </h1>
              </div>
              <div className={styles["header-details-container"]}>
                <h1 className={styles["dispatch-details-header"]}>Bound To:</h1>
                <h1 className={styles["dispatch-details-information"]}>
                  {dispatchData?.bound_to || "N/A"}
                </h1>
              </div>
            </div>
            <div className={styles["dispatch-details-container"]}>
              <div className={styles["header-details-container"]}>
                <h1 className={styles["dispatch-details-header"]}>
                  Cargo Type:
                </h1>
                <h1 className={styles["dispatch-details-information"]}>
                  {dispatchData?.cargo_type || "N/A"}
                </h1>
              </div>
              <div className={styles["header-details-container"]}>
                <h1 className={styles["dispatch-details-header"]}>Duration:</h1>
                <h1 className={styles["dispatch-details-information"]}>
                  {dispatchData?.status === "Done"
                    ? formatTime(dispatchData?.duration || 0)
                    : formatTime(elapsedTime)}
                </h1>
              </div>
            </div>
          </div>
          <Map
            onLocationUpdate={setUserLocation}
            isTripStarted={isTripStarted}
            routeCoordinates={routeCoordinates}
          />
        </div>
      )}
    </div>
  );
};

export default OPSDriverDispatch;
