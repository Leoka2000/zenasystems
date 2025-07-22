import React, { useState, useEffect, useCallback } from "react";
import { ChartLineInteractive } from "../charts/temperature-chart";
import api from "./api";
// Define the Bluetooth service and characteristic UUIDs
const SERVICE_UUID = "11111111-1111-1111-1111-111111111111";
const CHARACTERISTIC_UUID = "22222222-2222-2222-2222-222222222222";

const BluetoothTemperature = () => {
  const [temperature, setTemperature] = useState(null);
  const [timestamp, setTimestamp] = useState(null);
  const [status, setStatus] = useState("Disconnected");
  const [device, setDevice] = useState(null);
  const [characteristic, setCharacteristic] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  // Function to convert hexadecimal string to decimal
  const parseAndConvertHex = useCallback((hexString) => {
    try {
      const cleanHexString = hexString.startsWith("0x")
        ? hexString.substring(2)
        : hexString;

      // Extract timestamp (first 8 characters)
      const timestampHex = cleanHexString.substring(0, 8);
      // Extract temperature (next 4 characters)
      const temperatureHex = cleanHexString.substring(8, 12);

      // Convert hex to decimal
      const rawTimestampDecimal = parseInt(timestampHex, 16);
      const rawTemperatureDecimal = parseInt(temperatureHex, 16);

      // Only divide temperature by 10 (keep timestamp as raw value)
      const readableTemperature = rawTemperatureDecimal / 10;

      return {
        readableTimestamp: rawTimestampDecimal,
        readableTemperature,
      };
    } catch (error) {
      console.error("Error parsing hex string:", error);
      throw new Error("Failed to parse data from device");
    }
  }, []);

  const sendWriteCommand = useCallback(async () => {
  if (!characteristic) {
    setStatus("No characteristic available to write");
    return;
  }

  try {
    // Example payload: send 0x01 as a single byte
    const value = new Uint8Array([0x01]); // you can modify this to match your device spec

    await characteristic.writeValueWithoutResponse(value);
    setStatus("Write successful!");
  } catch (error) {
    console.error("Write error:", error);
    setStatus(`Write failed: ${error.message}`);
  }
}, [characteristic]);

  // Format timestamp to CET timezone with correct hours, minutes, seconds
  const formatTimestamp = useCallback((timestamp) => {
    if (!timestamp) return "N/A";

    const date = new Date(timestamp * 1000);

    // Options for CET timezone display
    const options = {
      timeZone: "Europe/Paris", // CET timezone
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    };

    return new Intl.DateTimeFormat("en-GB", options).format(date);
  }, []);

  // Handler for characteristic value changes
  const handleCharacteristicValueChanged = useCallback(
    async (event) => {
      try {
        const value = event.target.value;
        let hexString = "0x";
        for (let i = 0; i < value.byteLength; i++) {
          hexString += ("00" + value.getUint8(i).toString(16)).slice(-2);
        }

        const { readableTimestamp, readableTemperature } = parseAndConvertHex(
          hexString
        );

        setTimestamp(readableTimestamp);
        setTemperature(readableTemperature);
        setStatus("Receiving data...");

        // SEND DATA TO BACKEND
        await api.post("/temperature", {
          temperature: readableTemperature,
          timestamp: readableTimestamp,
        });
      } catch (error) {
        console.error("Error handling characteristic value:", error);
        setStatus(`Error: ${error.message}`);
      }
    },
    [parseAndConvertHex]
  );

  // Centralized function to reset all connection-related state
  const resetConnectionState = useCallback(() => {
    setStatus("Disconnected");
    setTemperature(null);
    setTimestamp(null);
    setIsConnected(false);
  }, []);

  // Function to safely remove characteristic listeners
  const removeCharacteristicListeners = useCallback(
    (char) => {
      if (char) {
        try {
          char.removeEventListener(
            "characteristicvaluechanged",
            handleCharacteristicValueChanged
          );
        } catch (e) {
          console.warn("Error removing characteristic listener:", e);
        }
      }
    },
    [handleCharacteristicValueChanged]
  );

  // Function to safely stop notifications
  const safelyStopNotifications = useCallback(async (char) => {
    if (char) {
      try {
        await char.stopNotifications();
      } catch (e) {
        console.warn(
          "Error stopping notifications (may already be stopped):",
          e
        );
      }
    }
  }, []);

  const fullDisconnectCleanup = useCallback(async () => {
    console.log("Performing full disconnect cleanup...");

    const currentChar = characteristic;
    const currentDevice = device;

    removeCharacteristicListeners(currentChar);

    await safelyStopNotifications(currentChar);

    if (currentDevice && currentDevice.gatt && currentDevice.gatt.connected) {
      try {
        console.log("Disconnecting GATT server...");
        await currentDevice.gatt.disconnect();
      } catch (e) {
        console.warn("Error disconnecting GATT server:", e);
      }
    }

    // 4. Clear state
    setCharacteristic(null);
    setDevice(null);
    resetConnectionState();
  }, [
    characteristic,
    device,
    removeCharacteristicListeners,
    safelyStopNotifications,
    resetConnectionState,
  ]);

  // Handle unexpected disconnections
  const handleDisconnectedEvent = useCallback(
    (event) => {
      console.log("Bluetooth device disconnected unexpectedly");
      setStatus("Disconnected unexpectedly");
      fullDisconnectCleanup();
    },
    [fullDisconnectCleanup]
  );

  // Effect for managing device event listeners
  useEffect(() => {
    const currentDevice = device;

    if (currentDevice) {
      currentDevice.addEventListener(
        "gattserverdisconnected",
        handleDisconnectedEvent
      );

      return () => {
        if (currentDevice) {
          currentDevice.removeEventListener(
            "gattserverdisconnected",
            handleDisconnectedEvent
          );
        }
      };
    }
  }, [device, handleDisconnectedEvent]);

  // Effect for managing characteristic notifications
  useEffect(() => {
    const currentChar = characteristic;
    let isMounted = true;

    const setupNotifications = async () => {
      if (!currentChar) return;

      try {
        currentChar.addEventListener(
          "characteristicvaluechanged",
          handleCharacteristicValueChanged
        );

        await currentChar.startNotifications();
        if (isMounted) {
          setStatus("Connected and receiving data");
          setIsConnected(true);
        }
      } catch (error) {
        console.error("Error setting up notifications:", error);
        if (isMounted) {
          setStatus(`Error: ${error.message}`);
          fullDisconnectCleanup();
        }
      }
    };

    setupNotifications();

    return () => {
      isMounted = false;
      if (currentChar) {
        removeCharacteristicListeners(currentChar);
        safelyStopNotifications(currentChar);
      }
    };
  }, [
    characteristic,
    handleCharacteristicValueChanged,
    fullDisconnectCleanup,
    removeCharacteristicListeners,
    safelyStopNotifications,
  ]);

  // Function to connect to the Bluetooth device
  const connectBluetooth = useCallback(async () => {
    if (!navigator.bluetooth) {
      setStatus("Web Bluetooth not supported in this browser");
      return;
    }

    try {
      setStatus("Requesting Bluetooth device...");

      // Request device
      const selectedDevice = await navigator.bluetooth.requestDevice({
        filters: [{ services: [SERVICE_UUID] }],
        optionalServices: [SERVICE_UUID],
      });

      setDevice(selectedDevice);
      setStatus("Connecting to GATT server...");

      // Connect to GATT server
      const server = await selectedDevice.gatt.connect();
      setStatus("Getting service...");

      // Get service
      const service = await server.getPrimaryService(SERVICE_UUID);
      setStatus("Getting characteristic...");

      // Get characteristic
      const selectedCharacteristic = await service.getCharacteristic(
        CHARACTERISTIC_UUID
      );

      setCharacteristic(selectedCharacteristic);
      setStatus("Setting up notifications...");
    } catch (error) {
      console.error("Bluetooth connection error:", error);
      setStatus(`Connection failed: ${error.message}`);
      fullDisconnectCleanup();
    }
  }, [fullDisconnectCleanup]);

  // User-initiated disconnect
  const disconnectBluetooth = useCallback(async () => {
    if (!isConnected) {
      setStatus("Already disconnected");
      return;
    }

    setStatus("Disconnecting...");
    await fullDisconnectCleanup();
    setStatus("Disconnected by user");
  }, [isConnected, fullDisconnectCleanup]);

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      if (isConnected) {
        fullDisconnectCleanup();
      }
    };
  }, [isConnected, fullDisconnectCleanup]);

  return (
    <div className="p-4 mb-2 dark:bg-black h-full rounded-lg shadow-md">
      <h1 className="text-base font-bold text-gray-800 dark:text-gray-200 mb-6">
        Bluetooth Sensor Data
      </h1>

      <div className="mb-6">
        <p className="text-base text-gray-600 dark:text-gray-400 mb-2">
          Status:{" "}
          <span className="font-semibold text-base text-gray-700 dark:text-gray-400 ">
            {status}
          </span>
        </p>

        {temperature !== null && (
          <p className="text-base text-gray-700 dark:text-gray-300 mb-2">
            Temperature:{" "}
            <span className="font-bold text-base text-orange-700 dark:text-orange-400">
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

      <div className="flex flex-col mb-4 font-sm space-y-2">
        {!isConnected ? (
          <button
            onClick={connectBluetooth}
            className="bg-blue-600 hover:bg-blue-700 max-w-2xs  dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-bold py-2 px-3 rounded-lg text-base shadow-md transition  transform hover:scale-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
          >
            Connect to bluetooth device
          </button>
        ) : (
          <button
            onClick={disconnectBluetooth}
            className="bg-red-600 hover:bg-red-700 max-w-2xs  dark:bg-red-500 dark:hover:bg-red-600 text-white font-bold py-2 px-3 rounded-lg text-base shadow-md transition transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
          >
            Disconnect
          </button>

          
        )}
        {isConnected && (
  <button
    onClick={sendWriteCommand}
    className="bg-green-600 hover:bg-green-700 max-w-2xs dark:bg-green-500 dark:hover:bg-green-600 text-white font-bold py-2 px-3 rounded-lg text-base shadow-md transition transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
  >
    Send Write Request
  </button>
)}
      </div>

      <ChartLineInteractive temperature={temperature} timestamp={timestamp} />
    </div>
  );
};

export default BluetoothTemperature;