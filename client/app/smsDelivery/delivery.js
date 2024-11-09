import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { Button, DataTable } from 'react-native-paper';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';

const BASEURL = process.env.EXPO_PUBLIC_API_URL;

const SmsHistoryPage = () => {
  const navigation = useNavigation();
  const [smsData, setSmsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedSms, setSelectedSms] = useState(null);

  useEffect(() => {
    // Set the screen title to "Sent SMS"
    navigation.setOptions({ title: 'Sent SMS' });
  }, [navigation]);

  const fetchSmsData = async (currentPage = 1) => {
    setLoading(true);
    try {
      const response = await axios.get(`${BASEURL}/sms-history?page=${currentPage}`);
      setSmsData(response.data.data);
      setTotalPages(Math.ceil(response.data.total / 10));
      setLoading(false);
    } catch (error) {
      console.error('Error fetching SMS data:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSmsData(page);
  }, [page]);

  const shortenMessage = (message) => message.length > 3 ? message.slice(0, 3) + '...' : message;
  const shortenPhone = (phone) => phone.length > 5 ? phone.slice(0, 5) : phone;
  const shortenDate = (date) => date.length > 3 ? date.slice(0, 3) + '...' : date;

  const openModal = (item) => {
    setSelectedSms(item);
    setModalVisible(true);
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity onPress={() => openModal(item)}>
      <DataTable.Row>
        <DataTable.Cell>{item.clientsmsid}</DataTable.Cell>
        <DataTable.Cell>{shortenPhone(item.mobile)}</DataTable.Cell>
        <DataTable.Cell>{shortenMessage(item.message)}</DataTable.Cell>
        <DataTable.Cell>{item.status}</DataTable.Cell>
        <DataTable.Cell>{shortenDate(new Date(item.createdAt).toLocaleString())}</DataTable.Cell>
      </DataTable.Row>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6200EE" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>SMS History</Text>

      <DataTable style={styles.table}>
        <DataTable.Header>
          <DataTable.Title>Client SMS ID</DataTable.Title>
          <DataTable.Title>Mobile</DataTable.Title>
          <DataTable.Title>Message</DataTable.Title>
          <DataTable.Title>Status</DataTable.Title>
          <DataTable.Title>Created At</DataTable.Title>
        </DataTable.Header>

        <FlatList
          data={smsData}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={<Text style={styles.emptyText}>No SMS messages found.</Text>}
        />
      </DataTable>

      <View style={styles.paginationContainer}>
        <Button
          mode="contained"
          onPress={() => setPage(page > 1 ? page - 1 : 1)}
          disabled={page === 1}
          style={styles.paginationButton}
        >
          Previous
        </Button>
        <Text style={styles.paginationText}>Page {page} of {totalPages}</Text>
        <Button
          mode="contained"
          onPress={() => setPage(page < totalPages ? page + 1 : totalPages)}
          disabled={page === totalPages}
          style={styles.paginationButton}
        >
          Next
        </Button>
      </View>

      {selectedSms && (
        <Modal
          visible={modalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>SMS Details</Text>
              <Text><Text style={styles.modalLabel}>Client SMS ID:</Text> {selectedSms.clientsmsid}</Text>
              <Text><Text style={styles.modalLabel}>Mobile:</Text> {selectedSms.mobile}</Text>
              <Text><Text style={styles.modalLabel}>Message:</Text> {selectedSms.message}</Text>
              <Text><Text style={styles.modalLabel}>Status:</Text> {selectedSms.status}</Text>
              <Text><Text style={styles.modalLabel}>Created At:</Text> {new Date(selectedSms.createdAt).toLocaleString()}</Text>

              <Button mode="contained" onPress={() => setModalVisible(false)} style={styles.closeButton}>
                Close
              </Button>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  table: {
    marginBottom: 20,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#888',
    marginTop: 20,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
  },
  paginationText: {
    fontSize: 16,
    color: '#6200EE',
    fontWeight: 'bold',
  },
  paginationButton: {
    flex: 1,
    marginHorizontal: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalLabel: {
    fontWeight: 'bold',
  },
  closeButton: {
    marginTop: 20,
  },
});

export default SmsHistoryPage;
