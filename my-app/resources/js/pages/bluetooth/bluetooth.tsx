import React, { useState, useEffect, useCallback, useRef } from "react";

const SERVICE_UUID = "11111111-1111-1111-1111-111111111111";
const READ_NOTIFY_CHARACTERISTIC_UUID = "22222222-2222-2222-2222-222222222222";
const WRITE_CHARACTERISTIC_UUID = "44444444-4444-4444-4444-444444444444";

const App = () => {
  const [temperature, setTemperature] = useState(null);
  const [timestamp, setTimestamp] = useState(null);
  const [status, setStatus] = useState("Disconnected");
  const [device, setDevice] = useState(null);
  const [readCharacteristic, setReadCharacteristic] = useState(null);
  const [writeCharacteristic, setWriteCharacteristic] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  const writeIntervalRef = useRef(null);

  const parseAndConvertHex = useCallback((hexString) => {
    try {
      const cleanHexString = hexString.startsWith("0x")
        ? hexString.substring(2)
        : hexString;

      const timestampHex = cleanHexString.substring(0, 8);
      const temperatureHex = cleanHexString.substring(8, 12);

      const rawTimestampDecimal = parseInt(timestampHex, 16);
      const rawTemperatureDecimal = parseInt(temperatureHex, 16);

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

  const formatTimestamp = useCallback((timestamp) => {
    if (!timestamp) return "N/A";
    const date = new Date(timestamp * 1000);
    const options = {
      timeZone: "Europe/Paris",
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

  const handleCharacteristicValueChanged = useCallback(
    (event) => {
      try {
        const value = event.target.value;
        let hexString = "0x";
        for (let i = 0; i < value.byteLength; i++) {
          hexString += ("00" + value.getUint8(i).toString(16)).slice(-2);
        }

        const { readableTimestamp, readableTemperature } =
          parseAndConvertHex(hexString);

        setTimestamp(readableTimestamp);
        setTemperature(readableTemperature);
        setStatus("Receiving data...");
      } catch (error) {
        console.error("Error handling characteristic value:", error);
        setStatus(`Error: ${error.message}`);
      }
    },
    [parseAndConvertHex]
  );

  const startWriteInterval = useCallback(() => {
    if (!writeCharacteristic) return;

    writeIntervalRef.current = setInterval(async () => {
      const currentUnixTimestamp = Math.floor(Date.now() / 1000);
      const buffer = new ArrayBuffer(4);
      const view = new DataView(buffer);
      view.setUint32(0, currentUnixTimestamp, false); // Big-endian

      try {
        await writeCharacteristic.writeValue(buffer);
        console.log("Wrote timestamp:", "0x" + currentUnixTimestamp.toString(16));
      } catch (error) {
        console.error("Error writing timestamp:", error);
      }
    }, 1000); // every second
  }, [writeCharacteristic]);

  const stopWriteInterval = () => {
    if (writeIntervalRef.current) {
      clearInterval(writeIntervalRef.current);
      writeIntervalRef.current = null;
    }
  };

  const resetConnectionState = useCallback(() => {
    stopWriteInterval();
    setStatus("Disconnected");
    setTemperature(null);
    setTimestamp(null);
    setIsConnected(false);
  }, []);

  const fullDisconnectCleanup = useCallback(async () => {
    const currentDevice = device;
    if (readCharacteristic) {
      try {
        readCharacteristic.removeEventListener(
          "characteristicvaluechanged",
          handleCharacteristicValueChanged
        );
        await readCharacteristic.stopNotifications();
      } catch (e) {
        console.warn("Cleanup error:", e);
      }
    }

    if (currentDevice?.gatt?.connected) {
      try {
        currentDevice.gatt.disconnect();
      } catch (e) {
        console.warn("Disconnection error:", e);
      }
    }

    setReadCharacteristic(null);
    setWriteCharacteristic(null);
    setDevice(null);
    resetConnectionState();
  }, [device, readCharacteristic, handleCharacteristicValueChanged, resetConnectionState]);

  const handleDisconnectedEvent = useCallback(() => {
    console.log("Disconnected unexpectedly");
    setStatus("Disconnected unexpectedly");
    fullDisconnectCleanup();
  }, [fullDisconnectCleanup]);

  const connectBluetooth = useCallback(async () => {
    if (!navigator.bluetooth) {
      setStatus("Web Bluetooth not supported");
      return;
    }

    try {
      setStatus("Requesting device...");
      const selectedDevice = await navigator.bluetooth.requestDevice({
        filters: [{ services: [SERVICE_UUID] }],
        optionalServices: [SERVICE_UUID],
      });

      setDevice(selectedDevice);
      selectedDevice.addEventListener("gattserverdisconnected", handleDisconnectedEvent);

      const server = await selectedDevice.gatt.connect();
      const service = await server.getPrimaryService(SERVICE_UUID);

      const writeChar = await service.getCharacteristic(WRITE_CHARACTERISTIC_UUID);
      const readChar = await service.getCharacteristic(READ_NOTIFY_CHARACTERISTIC_UUID);

      setWriteCharacteristic(writeChar);
      setReadCharacteristic(readChar);

      readChar.addEventListener("characteristicvaluechanged", handleCharacteristicValueChanged);
      await readChar.startNotifications();

      setStatus("Connected");
      setIsConnected(true);

      startWriteInterval();
    } catch (error) {
      console.error("Bluetooth connection error:", error);
      setStatus(`Connection failed: ${error.message}`);
      fullDisconnectCleanup();
    }
  }, [handleDisconnectedEvent, handleCharacteristicValueChanged, fullDisconnectCleanup, startWriteInterval]);

  const disconnectBluetooth = useCallback(async () => {
    if (!isConnected) {
      setStatus("Already disconnected");
      return;
    }

    setStatus("Disconnecting...");
    await fullDisconnectCleanup();
    setStatus("Disconnected by user");
  }, [isConnected, fullDisconnectCleanup]);

  useEffect(() => {
    return () => {
      if (isConnected) {
        fullDisconnectCleanup();
      }
    };
  }, [isConnected, fullDisconnectCleanup]);

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 font-sans">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Bluetooth Sensor Data</h1>

        <div className="mb-6">
          <p className="text-lg text-gray-600 mb-2">
            Status: <span className="font-semibold text-blue-600">{status}</span>
          </p>
          {temperature !== null && (
            <p className="text-2xl text-gray-700 mb-2">
              Temperature: <span className="font-bold text-indigo-700">{temperature.toFixed(2)} °C</span>
            </p>
          )}
          {timestamp !== null && (
            <p className="text-2xl text-gray-700">
              Timestamp: <span className="font-bold text-green-700">{formatTimestamp(timestamp)}</span>
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
    </div>
  );
};

export default App;
