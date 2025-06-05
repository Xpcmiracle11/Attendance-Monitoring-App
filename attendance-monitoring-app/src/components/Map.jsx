import React, { useEffect, useState } from "react";
import markerIcon from "../assets/images/marker-icon.svg";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

const currentLocationIcon = new L.Icon({
  iconUrl: markerIcon,
  iconSize: [30, 30],
  iconAnchor: [15, 15],
});

const defaultCenter = [11.3209, 122.5373];

function ChangeView({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, 12);
    }
  }, [center]);
  return null;
}

const Map = ({ onLocationUpdate, isTripStarted, routeCoordinates }) => {
  const [userLocation, setUserLocation] = useState(null);

  // Fetch user's current location using geolocation API
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = [
            position.coords.latitude,
            position.coords.longitude,
          ];
          setUserLocation(location);
          if (onLocationUpdate) {
            onLocationUpdate(location);
          }
        },
        (error) => {
          console.error("Error getting location:", error);
          setUserLocation(defaultCenter);
          if (onLocationUpdate) {
            onLocationUpdate(defaultCenter);
          }
        }
      );
    } else {
      console.error("Geolocation is not supported by this browser.");
      setUserLocation(defaultCenter);
      if (onLocationUpdate) {
        onLocationUpdate(defaultCenter);
      }
    }
  }, [onLocationUpdate]);

  return (
    <MapContainer
      center={userLocation || defaultCenter}
      zoom={12}
      style={{ height: "100%", width: "100%", zIndex: "1" }}
      scrollWheelZoom={true}
    >
      <ChangeView center={userLocation || defaultCenter} />
      <TileLayer
        attribution='&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {isTripStarted && userLocation && (
        <Marker position={userLocation} icon={currentLocationIcon}></Marker>
      )}
      {routeCoordinates.length > 0 && (
        <Polyline
          positions={routeCoordinates}
          color="blue"
          weight={4}
          opacity={0.8}
        />
      )}
    </MapContainer>
  );
};

export default Map;
