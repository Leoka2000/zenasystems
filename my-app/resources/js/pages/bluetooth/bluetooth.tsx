import React, { useState, useEffect, useCallback, useRef } from "react";
import { ChartLineInteractive } from "../charts/temperature-chart"; // Make sure this path is correct
import api from "./api"; // Adjust if it's in a different location

const SERVICE_UUID = "11111111-1111-1111-1111-111111111111";
const READ_NOTIFY_CHARACTERISTIC_UUID = "22222222-2222-2222-2222-222222222222";
const WRITE_CHARACTERISTIC_UUID = "44444444-4444-4444-4444-444444444444";

const App = () => {
  const [temperature, setTemperature] = useState(null);
  const [timestamp, setTimestamp] = useState(null);
  const [status, setStatus] = useState("Disconnected");
  const [device, setDevice] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const notifyCharRef = useRef(null);
  const writeCharRef = useRef(null);
  const writeIntervalRef = useRef(null);

  const parseAndConvertHex = useCallback((hexString) => {
    try {
      const cleanHex = hexString.startsWith("0x") ? hexString.slice(2) : hexString;
      const timestampHex = cleanHex.slice(0, 8);
      const temperatureHex = cleanHex.slice(8, 12);

      const readableTimestamp = parseInt(timestampHex, 16);
      const readableTemperature = parseInt(temperatureHex, 16) / 10;

      return { readableTimestamp, readableTemperature };
    } catch (error) {
      console.error("Error parsing hex string:", error);
      throw new Error("Failed to parse data from device");
    }
  }, []);

  const formatTimestamp = useCallback((timestamp) => {
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
  }, []);

  const handleCharacteristicValueChanged = useCallback(async (event) => {
    const value = event.target.value;
    let hexString = "0x";
    for (let i = 0; i < value.byteLength; i++) {
      hexString += ("00" + value.getUint8(i).toString(16)).slice(-2);
    }

    console.log("🔄 Response from device:", hexString);

    try {
      const { readableTimestamp, readableTemperature } = parseAndConvertHex(hexString);

      setTimestamp(readableTimestamp);
      setTemperature(readableTemperature);
      setStatus("Receiving data...");

      // ✅ Send to backend
      await api.post("/temperature", {
        temperature: readableTemperature,
        timestamp: readableTimestamp,
      });
    } catch (error) {
      console.error("Error handling device data:", error);
      setStatus("Failed to process data");
    }
  }, [parseAndConvertHex]);

  const sendWriteRequest = useCallback(async () => {
    if (!writeCharRef.current) return;

    const unixTimestamp = Math.floor(Date.now() / 1000);
    const buffer = new ArrayBuffer(4);
    const view = new DataView(buffer);
    view.setUint32(0, unixTimestamp, false); // Big-endian

    console.log("✉️ Writing timestamp:", `0x${unixTimestamp.toString(16).toUpperCase()}`);

    try {
      await writeCharRef.current.writeValue(buffer);
    } catch (error) {
      console.error("Write error:", error);
    }
  }, []);

  const startWriteInterval = useCallback(() => {
    writeIntervalRef.current = setInterval(sendWriteRequest, 5000);
  }, [sendWriteRequest]);

  const stopWriteInterval = useCallback(() => {
    if (writeIntervalRef.current) {
      clearInterval(writeIntervalRef.current);
      writeIntervalRef.current = null;
    }
  }, []);

  const connectBluetooth = useCallback(async () => {
    if (!navigator.bluetooth) {
      setStatus("Web Bluetooth not supported");
      return;
    }

    try {
      setStatus("Requesting Bluetooth device...");
      const selectedDevice = await navigator.bluetooth.requestDevice({
        filters: [{ services: [SERVICE_UUID] }],
        optionalServices: [SERVICE_UUID],
      });

      setDevice(selectedDevice);
      setStatus("Connecting to GATT server...");
      const server = await selectedDevice.gatt.connect();

      const service = await server.getPrimaryService(SERVICE_UUID);

      const notifyChar = await service.getCharacteristic(READ_NOTIFY_CHARACTERISTIC_UUID);
      const writeChar = await service.getCharacteristic(WRITE_CHARACTERISTIC_UUID);

      notifyCharRef.current = notifyChar;
      writeCharRef.current = writeChar;

      notifyChar.addEventListener("characteristicvaluechanged", handleCharacteristicValueChanged);
      await notifyChar.startNotifications();

      setStatus("Connected and receiving data");
      setIsConnected(true);

      sendWriteRequest(); // Initial write
      startWriteInterval();
    } catch (error) {
      console.error("Bluetooth connection error:", error);
      setStatus(`Connection failed: ${error.message}`);
    }
  }, [handleCharacteristicValueChanged, sendWriteRequest, startWriteInterval]);

  const disconnectBluetooth = useCallback(async () => {
    setStatus("Disconnecting...");

    stopWriteInterval();

    if (notifyCharRef.current) {
      try {
        await notifyCharRef.current.stopNotifications();
        notifyCharRef.current.removeEventListener("characteristicvaluechanged", handleCharacteristicValueChanged);
      } catch (error) {
        console.warn("Error cleaning up notifications:", error);
      }
    }

    if (device?.gatt?.connected) {
      device.gatt.disconnect();
    }

    setIsConnected(false);
    setTemperature(null);
    setTimestamp(null);
    setDevice(null);
    setStatus("Disconnected");
  }, [device, handleCharacteristicValueChanged, stopWriteInterval]);

  useEffect(() => {
    return () => {
      disconnectBluetooth();
    };
  }, [disconnectBluetooth]);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4 font-sans">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md text-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">
          Bluetooth Sensor Data
        </h1>

        <div className="mb-6">
          <p className="text-lg text-gray-600 mb-2">
            Status:{" "}
            <span className="font-semibold text-blue-600">{status}</span>
          </p>
          {temperature !== null && (
            <p className="text-2xl text-gray-700 mb-2">
              Temperature:{" "}
              <span className="font-bold text-indigo-700">
                {temperature.toFixed(2)} °C
              </span>
            </p>
          )}
          {timestamp !== null && (
            <p className="text-2xl text-gray-700">
              Timestamp:{" "}
              <span className="font-bold text-green-700">
                {formatTimestamp(timestamp)}
              </span>
            </p>
          )}
        </div>

        <div className="flex flex-col space-y-4">
          {!isConnected ? (
            <button
              onClick={connectBluetooth}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
            >
              Connect to Bluetooth Device
            </button>
          ) : (
            <button
              onClick={disconnectBluetooth}
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
            >
              Disconnect
            </button>
          )}
        </div>
      </div>

      {/* ✅ Add Chart here */}
      <div className="w-full max-w-3xl">
        <ChartLineInteractive temperature={temperature} timestamp={timestamp} />
      </div>
    </div>
  );
};

export default App;
