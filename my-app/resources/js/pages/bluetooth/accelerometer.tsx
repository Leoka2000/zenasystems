import React, { useState, useEffect, useCallback, useRef } from "react";
import api from "./api";

const SERVICE_UUID = "11111111-1111-1111-1111-111111111111";
const READ_NOTIFY_CHARACTERISTIC_UUID = "22222222-2222-2222-2222-222222222222";
const WRITE_CHARACTERISTIC_UUID = "44444444-4444-4444-4444-444444444444";

const SensorDataDisplay = () => {
  const [timestamp, setTimestamp] = useState(null);
  const [accelerometer, setAccelerometer] = useState({ x: null, y: null, z: null });
  const [status, setStatus] = useState("Disconnected");
  const [device, setDevice] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  const notifyCharRef = useRef(null);
  const writeCharRef = useRef(null);
  const writeIntervalRef = useRef(null);

  const parseHexData = useCallback((hexString) => {
    const cleanHex = hexString.startsWith("0x") ? hexString.slice(2) : hexString;

    const timestampHex = cleanHex.slice(0, 8);
    const accelXHex = cleanHex.slice(12, 16);
    const accelYHex = cleanHex.slice(16, 20);
    const accelZHex = cleanHex.slice(20, 24);

    const readableTimestamp = parseInt(timestampHex, 16);

    // Convert to signed 16-bit integers
    const x = parseInt(accelXHex, 16) << 16 >> 16;
    const y = parseInt(accelYHex, 16) << 16 >> 16;
    const z = parseInt(accelZHex, 16) << 16 >> 16;

    return { timestamp: readableTimestamp, x, y, z };
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
      const { timestamp, x, y, z } = parseHexData(hexString);

      setTimestamp(timestamp);
      setAccelerometer({ x, y, z });
      setStatus("Receiving data...");
    } catch (error) {
      console.error("Error parsing device data:", error);
      setStatus("Failed to process data");
    }
  }, [parseHexData]);

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

      sendWriteRequest(); // initial
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
        console.warn("Notification cleanup error:", error);
      }
    }

    if (device?.gatt?.connected) {
      device.gatt.disconnect();
    }

    setIsConnected(false);
    setTimestamp(null);
    setAccelerometer({ x: null, y: null, z: null });
    setDevice(null);
    setStatus("Disconnected");
  }, [device, handleCharacteristicValueChanged, stopWriteInterval]);

  useEffect(() => {
    return () => {
      disconnectBluetooth();
    };
  }, [disconnectBluetooth]);

  return (
    <div className="p-4 mb-2 dark:bg-neutral-950 h-full rounded-lg shadow-md mx-auto">
      <h1 className="text-base font-bold text-gray-800 dark:text-gray-200 mb-6">
        Bluetooth Accelerometer Data
      </h1>

      <div className="mb-6">
        <p className="text-base text-gray-600 dark:text-gray-400 mb-2">
          Status: <span className="font-semibold">{status}</span>
        </p>

        {timestamp && (
          <p className="text-base text-gray-700 dark:text-gray-300 mb-2">
            Timestamp:{" "}
            <span className="font-bold">{formatTimestamp(timestamp)}</span>
          </p>
        )}

        {(accelerometer.x !== null) && (
          <div className="text-base text-gray-700 dark:text-gray-300 space-y-1">
            <p>Accelerometer X: <span className="font-bold">{accelerometer.x}</span></p>
            <p>Accelerometer Y: <span className="font-bold">{accelerometer.y}</span></p>
            <p>Accelerometer Z: <span className="font-bold">{accelerometer.z}</span></p>
          </div>
        )}
      </div>

      <div className="flex flex-col mb-4 font-sm space-y-2">
        {!isConnected ? (
          <button
            onClick={connectBluetooth}
            className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 z-10 dark:hover:bg-blue-600 text-white font-bold py-2 px-3 rounded-lg shadow-md"
          >
            Connect to Bluetooth Device
          </button>
        ) : (
          <button
            onClick={disconnectBluetooth}
            className="bg-red-600 hover:bg-red-700 dark:bg-red-500 z-10 dark:hover:bg-red-600 text-white font-bold py-2 px-3 rounded-lg shadow-md"
          >
            Disconnect
          </button>
        )}
      </div>
    </div>
  );
};

export default SensorDataDisplay;
