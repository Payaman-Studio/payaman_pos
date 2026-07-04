import { useState, useRef, useEffect, useCallback } from 'react';
import { Modal, View, StyleSheet, Text, TouchableOpacity, StatusBar, Platform, PermissionsAndroid } from 'react-native';
import { Camera, CameraType } from 'react-native-camera-kit';
import { colors, borderRadius, fontSize, fontWeight } from '../constants/theme';

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
          laserColor={colors.red500}
          frameColor={colors.white}
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
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  permissionBox: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xxl,
    padding: 28,
    alignItems: 'center',
    width: '100%',
    maxWidth: 320,
  },
  permissionTitle: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.extrabold,
    color: colors.gray900,
    marginBottom: 12,
  },
  permissionText: {
    fontSize: fontSize.md,
    color: colors.gray500,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  permissionBtn: {
    backgroundColor: colors.black,
    borderRadius: borderRadius.lg,
    paddingVertical: 14,
    paddingHorizontal: 32,
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
  },
  permissionBtnText: {
    color: colors.white,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  permissionCancel: {
    paddingVertical: 8,
  },
  permissionCancelText: {
    color: colors.gray500,
    fontSize: fontSize.md,
  },
  scanHint: {
    position: 'absolute',
    bottom: 120,
    alignSelf: 'center',
    color: colors.white,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  closeBtn: {
    position: 'absolute',
    top: 60,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: borderRadius.xxl,
    paddingVertical: 8,
    paddingHorizontal: 18,
  },
  closeBtnText: {
    color: colors.white,
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
  },
});

export default BarcodeScannerModal;
