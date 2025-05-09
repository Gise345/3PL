import { useState, useCallback } from 'react';

interface UseBarcodeProps {
  onScan?: (barcodeData: string) => void;
  validateBarcode?: (barcode: string) => Promise<boolean>;
}

export const useBarcode = ({
  onScan,
  validateBarcode,
}: UseBarcodeProps = {}) => {
  const [showScanner, setShowScanner] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scannedData, setScannedData] = useState<string | null>(null);
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Open scanner
  const openScanner = useCallback(() => {
    setShowScanner(true);
    setScanning(true);
    setError(null);
  }, []);

  // Close scanner
  const closeScanner = useCallback(() => {
    setShowScanner(false);
    setScanning(false);
  }, []);

  // Handle barcode scanning
  const handleBarcodeScanned = useCallback(async (barcode: string) => {
    setScannedData(barcode);
    setScanning(false);
    
    if (validateBarcode) {
      try {
        const valid = await validateBarcode(barcode);
        setIsValid(valid);
        
        if (!valid) {
          setError(`Invalid barcode: ${barcode}`);
        } else if (onScan) {
          onScan(barcode);
          setShowScanner(false);
        }
      } catch (err: any) {
        setError(err.message || 'Error validating barcode');
        setIsValid(false);
      }
    } else if (onScan) {
      onScan(barcode);
      setShowScanner(false);
    }
  }, [onScan, validateBarcode]);

  // Reset state
  const reset = useCallback(() => {
    setScannedData(null);
    setIsValid(null);
    setError(null);
  }, []);

  return {
    showScanner,
    scanning,
    scannedData,
    isValid,
    error,
    openScanner,
    closeScanner,
    handleBarcodeScanned,
    reset
  };
};

export default useBarcode;