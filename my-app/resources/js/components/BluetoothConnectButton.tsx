// components/BluetoothConnectButton.tsx
import { useBluetoothSensor } from "../context/useBluetoothSensor";
import { Button } from "@/components/ui/button"


const BluetoothConnectButton = () => {
  const { isConnected, connectBluetooth, disconnectBluetooth } = useBluetoothSensor();

  return (
    <div className="flex flex-col font-sm space-y-2">
      {!isConnected ? (
        <Button 
          onClick={connectBluetooth}
        className="max-w-3xs cursor-pointer"
        >
          Connect to Bluetooth Device
        </Button>
      ) : (
        <Button variant="destructive"
          onClick={disconnectBluetooth}
          className="max-w-3xs cursor-pointer"
        >
          Disconnect
        </Button>
      )}
    </div>
  );
};

export default BluetoothConnectButton;
