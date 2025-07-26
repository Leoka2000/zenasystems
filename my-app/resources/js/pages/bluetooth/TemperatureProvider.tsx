import React from "react";
import { ChartLineInteractive } from "../charts/temperature-chart";
import { useBluetoothSensor } from "../../context/useBluetoothSensor";

const TemperatureProvider = () => {
 const { status, temperatureData } = useBluetoothSensor();
const temperature = temperatureData?.temperature ?? null;
const timestamp = temperatureData?.timestamp ?? null;

  const formatTimestamp = (timestamp: number | null) => {
    if (!timestamp) return "N/A";
    const date = new Date(timestamp * 1000);
    return new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/Paris",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).format(date);
  };

  return (
    <div className="p-4 mb-2 dark:bg-neutral-950 h-full rounded-lg shadow-md mx-auto">
      <h1 className="text-base font-bold text-gray-800 dark:text-gray-200 mb-6">
        Bluetooth Temperature Sensor
      </h1>

      <div className="mb-6">
        <p className="text-base text-gray-600 dark:text-gray-400 mb-2">
          Status: <span className="font-semibold">{status}</span>
        </p>

        {temperature !== null && (
          <p className="text-base text-gray-700 dark:text-gray-300 mb-2">
            Temperature:{" "}
            <span className="font-bold text-orange-700 dark:text-orange-400">
              {temperature.toFixed(2)} °C
            </span>
          </p>
        )}

        {timestamp !== null && (
          <p className="text-base text-gray-700 dark:text-gray-300">
            Timestamp:{" "}
            <span className="font-bold text-gray-600 dark:text-gray-400">
              {formatTimestamp(timestamp)}
            </span>
          </p>
        )}
      </div>

      

      <ChartLineInteractive temperature={temperature} timestamp={timestamp} />
    </div>
  );
};

export default TemperatureProvider;