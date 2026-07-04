import { useState } from 'react';
import { StyleSheet } from 'react-native';
import { Modal, Portal, Button, Text, Snackbar, ActivityIndicator } from 'react-native-paper';
import { useQueryClient } from '@tanstack/react-query';
import Share from 'react-native-share';
import { pick, types } from '@react-native-documents/picker';
import {
  exportDatabaseToFile,
  importDatabaseFromFileWithPhotos,
} from '../database/dbDataTransfer';

interface Props {
  visible: boolean;
  onDismiss: () => void;
}

export default function DataManagementModal({ visible, onDismiss }: Props) {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    visible: boolean;
    text: string;
  }>({ visible: false, text: '' });

  const handleExport = async () => {
    setLoading(true);
    try {
      const result = await exportDatabaseToFile();
      if (!result.success || !result.filePath) {
        setSnackbar({ visible: true, text: result.message });
        return;
      }

      await Share.open({
        url: `file://${result.filePath}`,
        type: 'application/octet-stream',
        filename: 'waroeng.db',
        title: 'Waroeng - Backup Database',
      });
    } catch (e: unknown) {
      const err = e as { message?: string };
      if (err?.message !== 'User did not share') {
        setSnackbar({ visible: true, text: 'Gagal membagikan database' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    try {
      const [file] = await pick({
        type: [types.allFiles],
      });

      if (!file?.uri) return;

      setLoading(true);
      const importResult = await importDatabaseFromFileWithPhotos(file.uri);
      setSnackbar({ visible: true, text: importResult.message });

      if (importResult.success) {
        queryClient.invalidateQueries({ queryKey: ['products'] });
        queryClient.invalidateQueries({ queryKey: ['commodities'] });
        queryClient.invalidateQueries({ queryKey: ['transactions'] });
        onDismiss();
      }
    } catch (e: unknown) {
      const err = e as { code?: string };
      if (err?.code !== 'DOCUMENT_PICKER_CANCELED') {
        setSnackbar({ visible: true, text: 'Gagal memilih file' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Portal>
        <Modal
          visible={visible}
          onDismiss={onDismiss}
          contentContainerStyle={styles.modal}
        >
          <Text variant="titleLarge" style={styles.title}>
            Kelola Database
          </Text>

          {loading ? (
            <ActivityIndicator animating={true} size="large" style={styles.loading} />
          ) : (
            <>
              <Text style={styles.description}>
                Export atau import file database (.db) waroeng.
              </Text>

              <Button
                mode="contained"
                icon="database-export-outline"
                onPress={handleExport}
                style={styles.actionButton}
              >
                Export .db & Bagikan
              </Button>
              <Button
                mode="contained"
                icon="database-import-outline"
                onPress={handleImport}
                style={styles.actionButton}
              >
                Import .db dari File
              </Button>
            </>
          )}

          <Button
            onPress={onDismiss}
            style={styles.cancelButton}
            disabled={loading}
          >
            Tutup
          </Button>
        </Modal>
      </Portal>

      <Snackbar
        visible={snackbar.visible}
        onDismiss={() => setSnackbar({ visible: false, text: '' })}
        duration={3000}
      >
        {snackbar.text}
      </Snackbar>
    </>
  );
}

const styles = StyleSheet.create({
  modal: {
    backgroundColor: '#fff',
    margin: 20,
    borderRadius: 12,
    padding: 24,
  },
  title: {
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    marginVertical: 12,
    color: '#555',
  },
  actionButton: {
    marginTop: 12,
  },
  cancelButton: {
    marginTop: 16,
  },
  loading: {
    padding: 32,
  },
});
