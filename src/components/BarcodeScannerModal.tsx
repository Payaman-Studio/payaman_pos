import { useState, useRef, useEffect, useCallback } from 'react';
import { Modal, View, StyleSheet, Text, TouchableOpacity, StatusBar, Platform, PermissionsAndroid } from 'react-native';
import { Camera, CameraType } from 'react-native-camera-kit';

type BarcodeFormat =
  | 'code-128' | 'code-39' | 'code-93' | 'codabar'
  | 'ean-13' | 'ean-8' | 'itf' | 'itf-14'
  | 'upc-a' | 'upc-e' | 'qr' | 'pdf-417'
  | 'aztec' | 'data-matrix' | 'unknown';

interface OnReadCodeData {
  nativeEvent: {
    codeStringValue: string;
    codeFormat: string;
  };
}

interface BarcodeScannerModalProps {
  visible: boolean;
  onClose: () => void;
  onBarcodeScanned: (barcode: string) => void;
}

function BarcodeScannerModal({
  visible,
  onClose,
  onBarcodeScanned,
}: BarcodeScannerModalProps) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const scannedRef = useRef(false);

  useEffect(() => {
    if (visible) {
      scannedRef.current = false;
      if (hasPermission === null) {
        requestCameraPermission();
      }
    }
  }, [visible, hasPermission]);

  const requestCameraPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
        );
        setHasPermission(granted === PermissionsAndroid.RESULTS.GRANTED);
      } catch {
        setHasPermission(false);
      }
    } else {
      setHasPermission(true);
    }
  };

  const handleReadCode = useCallback(
    (event: OnReadCodeData) => {
      const code = event.nativeEvent.codeStringValue;
      if (code && !scannedRef.current) {
        scannedRef.current = true;
        onBarcodeScanned(code);
      }
    },
    [onBarcodeScanned],
  );

  const resetScan = () => {
    scannedRef.current = false;
  };

  if (hasPermission === null) {
    return null;
  }

  if (!hasPermission) {
    return (
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
        <View style={styles.overlay}>
          <View style={styles.permissionBox}>
            <Text style={styles.permissionTitle}>Izin Kamera</Text>
            <Text style={styles.permissionText}>
              Aplikasi membutuhkan akses kamera untuk memindai barcode.
            </Text>
            <TouchableOpacity
              style={styles.permissionBtn}
              onPress={requestCameraPermission}
            >
              <Text style={styles.permissionBtnText}>Berikan Izin</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.permissionCancel} onPress={onClose}>
              <Text style={styles.permissionCancelText}>Tutup</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <StatusBar barStyle="light-content" />
      {visible && hasPermission && (
        <Camera
          style={styles.camera}
          cameraType={CameraType.Back}
          scanBarcode
          showFrame
          laserColor="#DC2626"
          frameColor="#FFFFFF"
          scanThrottleDelay={500}
          onReadCode={handleReadCode}
          allowedBarcodeTypes={
            [
              'ean-13',
              'ean-8',
              'code-128',
              'code-39',
              'upc-a',
              'upc-e',
              'qr',
              ...(Platform.OS === 'ios'
                ? (['code-93', 'pdf-417', 'itf-14'] as BarcodeFormat[])
                : []),
            ] as BarcodeFormat[]
          }
        />
      )}

      <Text style={styles.scanHint}>Arahkan kamera ke barcode produk</Text>

      <TouchableOpacity
        style={styles.closeBtn}
        onPress={() => {
          resetScan();
          onClose();
        }}
      >
        <Text style={styles.closeBtnText}>Tutup</Text>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  permissionBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 28,
    alignItems: 'center',
    width: '100%',
    maxWidth: 320,
  },
  permissionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 12,
  },
  permissionText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  permissionBtn: {
    backgroundColor: '#000000',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 32,
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
  },
  permissionBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  permissionCancel: {
    paddingVertical: 8,
  },
  permissionCancelText: {
    color: '#6B7280',
    fontSize: 14,
  },
  scanHint: {
    position: 'absolute',
    bottom: 120,
    alignSelf: 'center',
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  closeBtn: {
    position: 'absolute',
    top: 60,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 18,
  },
  closeBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});

export default BarcodeScannerModal;
