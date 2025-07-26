
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react"
import { parseAccelerometerHexData, parseTemperatureHex } from "../lib/utils";

const BluetoothSensorContext = createContext(null)

const SERVICE_UUID = "11111111-1111-1111-1111-111111111111"
const READ_NOTIFY_CHARACTERISTIC_UUID = "22222222-2222-2222-2222-222222222222"
const WRITE_CHARACTERISTIC_UUID = "44444444-4444-4444-4444-444444444444"

export const BluetoothSensorProvider = ({ children }) => {
  const [status, setStatus] = useState("Disconnected")
  const [device, setDevice] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
 const [temperatureData, setTemperatureData] = useState(null)
const [accelerometerData, setAccelerometerData] = useState(null)

  const notifyCharRef = useRef(null)
  const writeCharRef = useRef(null)
  const writeIntervalRef = useRef(null)

  const sendWriteRequest = useCallback(async () => {
    if (!writeCharRef.current) return

    const unixTimestamp = Math.floor(Date.now() / 1000)
    const buffer = new ArrayBuffer(4)
    const view = new DataView(buffer)
    view.setUint32(0, unixTimestamp, false)

    try {
      await writeCharRef.current.writeValue(buffer)
    } catch (error) {
      console.error("Write error:", error)
    }
  }, [])

  const startWriteInterval = useCallback(() => {
    writeIntervalRef.current = setInterval(sendWriteRequest, 5000)
  }, [sendWriteRequest])

  const stopWriteInterval = useCallback(() => {
    if (writeIntervalRef.current) {
      clearInterval(writeIntervalRef.current)
      writeIntervalRef.current = null
    }
  }, [])

 const handleCharacteristicValueChanged = useCallback(
  async (event) => {
    const value = event.target.value;
    let hexString = "0x";
    for (let i = 0; i < value.byteLength; i++) {
      hexString += ("00" + value.getUint8(i).toString(16)).slice(-2);
    }

    try {
      const parsedTemperature = parseTemperatureHex(hexString);
      const parsedAccelerometer = parseAccelerometerHexData(hexString);

      // Save both types if available
      if (parsedTemperature?.temperature) {
        setTemperatureData(parsedTemperature);
        await fetch('/api/temperature', {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(parsedTemperature),
        });
      }

      if (parsedAccelerometer?.x !== undefined) {
        setAccelerometerData(parsedAccelerometer);
        await fetch('/api/accelerometer', {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(parsedAccelerometer),
        });
      }

      setStatus("Receiving data...");
    } catch (error) {
      console.error("Error parsing device data:", error);
      setStatus("Failed to process data");
    }
  },
  []
);

  const connectBluetooth = useCallback(async () => {
    if (!navigator.bluetooth) {
      setStatus("Web Bluetooth not supported")
      return
    }

    try {
      setStatus("Requesting Bluetooth device...")
      const selectedDevice = await navigator.bluetooth.requestDevice({
        filters: [{ services: [SERVICE_UUID] }],
        optionalServices: [SERVICE_UUID],
      })

      setDevice(selectedDevice)
      setStatus("Connecting to GATT server...")
      const server = await selectedDevice.gatt.connect()

      const service = await server.getPrimaryService(SERVICE_UUID)
      const notifyChar = await service.getCharacteristic(READ_NOTIFY_CHARACTERISTIC_UUID)
      const writeChar = await service.getCharacteristic(WRITE_CHARACTERISTIC_UUID)

      notifyCharRef.current = notifyChar
      writeCharRef.current = writeChar

      notifyChar.addEventListener("characteristicvaluechanged", handleCharacteristicValueChanged)
      await notifyChar.startNotifications()

      setStatus("Connected and receiving data")
      setIsConnected(true)

      sendWriteRequest()
      startWriteInterval()
    } catch (error) {
      console.error("Bluetooth connection error:", error)
      setStatus(`Connection failed: ${error.message}`)
    }
  }, [handleCharacteristicValueChanged, sendWriteRequest, startWriteInterval])

  const disconnectBluetooth = useCallback(async () => {
    setStatus("Disconnecting...")
    stopWriteInterval()

    if (notifyCharRef.current) {
      try {
        await notifyCharRef.current.stopNotifications()
        notifyCharRef.current.removeEventListener("characteristicvaluechanged", handleCharacteristicValueChanged)
      } catch (error) {
        console.warn("Notification cleanup error:", error)
      }
    }

    if (device?.gatt?.connected) {
      device.gatt.disconnect()
    }

    setIsConnected(false)
    setTemperatureData(null)
    setAccelerometerData(null)
    setDevice(null)
    setStatus("Disconnected")
  }, [device, handleCharacteristicValueChanged, stopWriteInterval])

  useEffect(() => {
    return () => {
      disconnectBluetooth()
    }
  }, [disconnectBluetooth])

  return (
    <BluetoothSensorContext.Provider
      value={{
        status,
        isConnected,
        temperatureData,
    accelerometerData,
        connectBluetooth,
        disconnectBluetooth,
      }}>
      {children}
    </BluetoothSensorContext.Provider>
  )
}

export const useBluetoothSensor = () => useContext(BluetoothSensorContext)
