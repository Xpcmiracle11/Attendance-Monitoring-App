import React, { useState } from "react";
import styles from "../../../assets/styles/OPSOrders.module.css";
import NestleOrders from "../../orders/NestleOrders";
import PanasonicOrders from "../../orders/PanasonicOrders";
import UnilabOrders from "../../orders/UnilabOrders";
import APCargoOrders from "../../orders/APCargoOrders";
import TanduayOrders from "../../orders/TanduayOrders";
const OPSOrders = () => {
  const [selectedCompany, setSelectedCompany] = useState("Nestle");

  const renderSelectedOrders = () => {
    switch (selectedCompany) {
      case "Nestle":
        return <NestleOrders />;
      case "Panasonic":
        return <PanasonicOrders />;
      case "Unilab":
        return <UnilabOrders />;
      case "AP Cargo":
        return <APCargoOrders />;
      case "Tanduay":
        return <TanduayOrders />;
    }
  };

  return (
    <div className={styles["orders-content"]}>
      <div className={styles["content-header-container"]}>
        <h1 className={styles["page-title"]}>Orders</h1>
      </div>
      <div className={styles["content-body-container"]}>
        <div className={styles["add-orders-button-container"]}>
          <div className={styles["radio-inputs"]}>
            {["Nestle", "Panasonic", "Unilab", "AP Cargo", "Tanduay"].map(
              (company) => (
                <label className={styles["radio"]} key={company}>
                  <input
                    type="radio"
                    name="radio"
                    value={company}
                    checked={selectedCompany === company}
                    onChange={() => setSelectedCompany(company)}
                  />
                  <span className={styles.name}>{company}</span>
                </label>
              )
            )}
          </div>
        </div>
        <div className={styles["principal-orders-content"]}>
          {renderSelectedOrders()}
        </div>
      </div>
    </div>
  );
};

export default OPSOrders;
