import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Modal, TextInput, Button } from 'react-native';
import axios from 'axios';
import { useRoute } from '@react-navigation/native';
import { useNavigation } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons'; // Importing Material Icons for the message icon


const BASEURL = process.env.EXPO_PUBLIC_API_URL;

const CustomerDetailsPage = () => {
  const route = useRoute();
  const { customerId } = route.params;
  const navigation = useNavigation();

  const [customerData, setCustomerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [smsMessage, setSmsMessage] = useState(''); // To hold the SMS message content
  const [modalVisible, setModalVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarVisible, setSnackbarVisible] = useState(false);

  useEffect(() => {
    const fetchCustomerDetails = async () => {
      try {
        const response = await axios.get(`${BASEURL}/customer-details/${customerId}`);
        setCustomerData(response.data);
      } catch (error) {
        console.error('Error fetching customer data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomerDetails();
  }, [customerId]);

  useEffect(() => {
    if (customerData) {
      navigation.setOptions({ title: customerData.firstName });
    }
  }, [navigation, customerData]);

  if (loading) {
    return <ActivityIndicator size="large" color="#0000ff" />;
  }

  if (!customerData) {
    return <Text style={styles.message}>No customer data found.</Text>;
  }

  const handleSendSMS = async (selectedCustomer) => {
    try {
      if (!selectedCustomer.phoneNumber || !smsMessage) {
        setSnackbarMessage('Phone number or message missing.');
        setSnackbarVisible(true);
        return;
      }

      const response = await axios.post(
        `${BASEURL}/send-sms`,
        {
          mobile: selectedCustomer.phoneNumber,
          message: smsMessage,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      setSnackbarMessage('SMS sent successfully!');
      setSnackbarVisible(true);
      setModalVisible(false); // Close modal after sending
      setSmsMessage(''); // Clear the input after sending
    } catch (error) {
      console.error('Error sending SMS:', error.response?.data || error.message);
      setSnackbarMessage('Failed to send SMS.');
      setSnackbarVisible(true);
    }
  };

  const sendCurrentBill = async () => {
    try {
      const response = await axios.post(`${BASEURL}/send-bill`, { customerId });
      Alert.alert('Success', 'Bill sent successfully!');
    } catch (error) {
      console.error('Error sending bill:', error);
      Alert.alert('Error', 'Failed to send bill.');
    }
  };

  const renderCustomerDetails = () => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Customer Details</Text>
      <Text>First Name: {customerData?.firstName}</Text>
      <Text>Last Name: {customerData?.lastName}</Text>
      <Text>Email: {customerData?.email}</Text>
      <Text>Phone: {customerData?.phoneNumber}</Text>
      <Text>County: {customerData?.county}</Text>
      <Text>Town: {customerData?.town}</Text>
      <Text>Category: {customerData?.category}</Text>
      <Text>Status: {customerData?.status}</Text>
      <Text>Monthly Charge: ${customerData?.monthlyCharge}</Text>
      <Text>Collection Day: {customerData?.garbageCollectionDay}</Text>
      <Text>Collected: {customerData?.collected ? 'Yes' : 'No'}</Text>
      <Text>Closing Balance: ${customerData?.closingBalance}</Text>
    </View>
  );

  const renderInvoiceItem = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Invoice #: {item?.invoiceNumber}</Text>
      <Text>Amount: ${item?.invoiceAmount}</Text>
      <Text>Status: {item?.status}</Text>
      <Text>Created At: {new Date(item?.createdAt).toLocaleDateString()}</Text>
      <Text>Closing Balance: ${item?.closingBalance}</Text>
    </View>
  );

  const renderInvoicesSection = () => (
    <>
      <Text style={styles.sectionTitle}>Invoices</Text>
      <FlatList
        data={customerData.invoices}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderInvoiceItem}
        style={styles.flatList}
      />
    </>
  );

  const data = [
    { type: 'customerDetails' },
    { type: 'invoices' },
  ];

  const renderItem = ({ item }) => {
    switch (item.type) {
      case 'customerDetails':
        return renderCustomerDetails();
      case 'invoices':
        return renderInvoicesSection();
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.sendSMSButton}
        onPress={() => setModalVisible(true)}>
        <MaterialIcons name="message" size={30} color="white" />
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.sendBillButton}
        onPress={sendCurrentBill}>
        <Text style={styles.sendBillButtonText}>Send Current Bill</Text>
      </TouchableOpacity>

      <FlatList
        data={data}
        renderItem={renderItem}
        keyExtractor={(item) => item.type}
        contentContainerStyle={styles.listContainer}
      />

      {/* SMS Modal */}
      <Modal
        visible={modalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Type your SMS</Text>
            <TextInput
              style={styles.smsInput}
              value={smsMessage}
              onChangeText={setSmsMessage}
              placeholder="Enter your SMS message"
              multiline
              numberOfLines={4}
            />
            <View style={styles.modalButtonContainer}>
              <Button title="Send" onPress={() => handleSendSMS(customerData)}/>
              <Button title="Cancel" onPress={() => setModalVisible(false)} color="gray" />
            </View>
          </View>
        </View>
      </Modal>

      {/* Snackbar */}
      {snackbarVisible && (
        <View style={styles.snackbar}>
          <Text style={styles.snackbarText}>{snackbarMessage}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#e0f7fa',
  },
  listContainer: {
    paddingBottom: 60, // Padding to ensure content doesn't get hidden behind the button
  },
  card: {
    marginBottom: 12,
    padding: 10,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#004d40',
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 8,
    color: '#00796b',
  },
  sendSMSButton: {
    position: 'absolute',
    top: 70,
    right: 20,
    backgroundColor: '#00796b',
    padding: 12,
    borderRadius: 50,
    elevation: 5,
    zIndex: 10,
  },
  sendBillButton: {
    backgroundColor: '#00796b',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 10,
  },
  sendBillButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    padding: 20,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#00796b',
  },
  smsInput: {
    width: '100%',
    height: 100,
    borderColor: '#00796b',
    borderWidth: 1,
    marginBottom: 20,
    padding: 10,
    borderRadius: 8,
    textAlignVertical: 'top', // Ensures the text aligns properly when typing multi-line text
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 10,
  },
  snackbar: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    backgroundColor: '#00796b',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  snackbarText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default CustomerDetailsPage;
