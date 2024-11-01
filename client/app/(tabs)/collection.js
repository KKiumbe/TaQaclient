

import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, Modal, TouchableOpacity, Linking, TextInput, ActivityIndicator } from 'react-native';
import { Button, Menu, Divider, Snackbar } from 'react-native-paper';
import axios from 'axios';

const BASEURL =process.env.EXPO_PUBLIC_API_URL

const CustomerCollectionScreen = () => {
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [selectedDay, setSelectedDay] = useState('');
  const [menuVisible, setMenuVisible] = useState(false);
  const [viewType, setViewType] = useState('list'); // Manage view state (list or map)
  const [selectedCustomer, setSelectedCustomer] = useState(null); // To hold the customer data for modal
  const [smsMessage, setSmsMessage] = useState(''); // State for SMS message input
  const [bulkSmsModalVisible, setBulkSmsModalVisible] = useState(false); // State for bulk SMS modal
  const [loading, setLoading] = useState(true); // Loading state
  const [refreshing, setRefreshing] = useState(false); // Refreshing state for swipe-to-refresh
  const [modalVisible, setModalVisible] = useState(false); // To manage the SMS modal visibility
  const [snackbarVisible, setSnackbarVisible] = useState(false); // Snackbar visibility
  const [snackbarMessage, setSnackbarMessage] = useState(''); // Snackbar message

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday','Saturday'];

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true); // Start loading
      const response = await axios.get(`${BASEURL}/collections`);
      setCustomers(response.data);
      setFilteredCustomers(response.data); // Set initial filtered customers
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false); // Stop loading
    }
  };

  // Function to refresh data (for swipe-to-refresh)
  const onRefresh = async () => {
    setRefreshing(true); // Start refreshing
    await fetchCustomers(); // Fetch the updated customer list
    setRefreshing(false); // End refreshing
  };

  const handleFilterDay = (day) => {
    setSelectedDay(day);
    const filtered = customers.filter(customer => customer.garbageCollectionDay === day.toUpperCase());
    setFilteredCustomers(filtered);
    setMenuVisible(false);
  };

  const toggleView = () => {
    setViewType(viewType === 'list' ? 'map' : 'list');
  };

  const handleCustomerPress = (customer) => {
    console.log('Selected customer:', customer); // Debug: log the customer object

    setSelectedCustomer(customer);

    setSmsMessage(''); // Reset SMS message input
    setModalVisible(true); // Open modal
  };

  const handleMarkCollected = async (customerId) => {
    try {
      await axios.patch(`${BASEURL}/collections/${customerId}`, { collected: true });
      // Update customers state to reflect the change
      setCustomers(customers.map(customer => 
        customer.id === customerId ? { ...customer, collected: true } : customer
      ));
      setFilteredCustomers(filteredCustomers.map(customer => 
        customer.id === customerId ? { ...customer, collected: true } : customer
      ));
      setSnackbarMessage('Customer marked as collected!');
      setSnackbarVisible(true); // Show Snackbar
    } catch (error) {
      console.error('Error marking as collected:', error);
    }
  };

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
  

  const handleSendBulkSMS = () => {
    const payload = { day: selectedDay, message: smsMessage };
    axios.post(`${BASEURL}/send-to-group`, payload)
      .then(() => {
        setSnackbarMessage('Bulk SMS sent successfully!');
        setSnackbarVisible(true);
        setSmsMessage(''); // Clear the input after sending
      })
      .catch(error => {
        setSnackbarMessage('Failed to send bulk SMS.');
        setSnackbarVisible(true);
      });
  };

  const handleCall = () => {
    Linking.openURL(`tel:${selectedCustomer.phoneNumber}`);
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" /> // Loading indicator
      ) : (
        <>
          <Text style={styles.title}>{selectedDay || 'All Days'} collection</Text>
          <View style={styles.buttonRow}>
            <Button mode="contained" onPress={() => setMenuVisible(true)}>
              {selectedDay ? `Filter by ${selectedDay}` : 'Filter by Day'}
            </Button>
            <Button mode="contained" onPress={toggleView} style={styles.switchButton}>
              {viewType === 'list' ? 'Switch to Map View' : 'Switch to List View'}
            </Button>
          </View>
          {selectedDay && (
            <Button mode="contained" onPress={() => setBulkSmsModalVisible(true)} style={styles.bulkSmsButton}>
              Send SMS to All {selectedDay} clients
            </Button>
          )}
          <Menu
            visible={menuVisible}
            onDismiss={() => setMenuVisible(false)}
          >
            {daysOfWeek.map((day) => (
              <Menu.Item key={day} onPress={() => handleFilterDay(day)} title={day} />
            ))}
          </Menu>
          <Divider style={styles.divider} />
          <FlatList
            data={filteredCustomers}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.listItem, item.collected ? styles.collected : styles.uncollected]}
                onPress={() => handleCustomerPress(item)}
              >
                <View style={styles.customerInfo}>
                  <Text style={styles.customerText}>{`${item.firstName} ${item.lastName}`}</Text>
                  <Text style={styles.customerText}>{item.phoneNumber}</Text>
                  <Text style={styles.customerText}>{item.location}</Text>
                  <Text style={styles.customerText}>{item.town}</Text>
                </View>
                <View style={styles.buttonContainer}>
                  <Button 
                    mode="contained" 
                    onPress={() => handleMarkCollected(item.id)} 
                    style={styles.markCollectedButton}
                  >
                    {item.collected ? 'Collected' : 'Collect'}
                  </Button>
                </View>
              </TouchableOpacity>
            )}
            onRefresh={onRefresh} // Enable pull-to-refresh
            refreshing={refreshing} // Refreshing state
          />
          {selectedCustomer && modalVisible && (
            <Modal
              visible={modalVisible}
              animationType="slide"
              onRequestClose={() => setModalVisible(false)}
            >
              <View style={styles.modalContainer}>
                <Text style={styles.modalTitle}>Contact {selectedCustomer.firstName}</Text>
                <TextInput
                  style={styles.smsInput}
                  placeholder="Enter your message here..."
                  value={smsMessage}
                  onChangeText={setSmsMessage}
                />
                <View style={styles.buttonContainer}>
                <Button 
  mode="contained" 
  onPress={() => handleSendSMS(selectedCustomer)} 
  style={styles.Button}
>
  Send SMS
</Button>

                  <Button mode="contained" onPress={handleCall} style={styles.Button}>
                    Call
                  </Button>
                </View>
                <Button mode="outlined" onPress={() => setModalVisible(false)}>
                  Close
                </Button>
              </View>
            </Modal>
          )}
          <Modal
            visible={bulkSmsModalVisible}
            animationType="slide"
            onRequestClose={() => setBulkSmsModalVisible(false)}
          >
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>Send Bulk SMS for {selectedDay}</Text>
              <TextInput
                style={styles.smsInput}
                placeholder="Enter your message for all..."
                value={smsMessage}
                onChangeText={setSmsMessage}
              />
              <View style={styles.buttonContainer}>
                <Button mode="contained" onPress={() => { handleSendBulkSMS(); setBulkSmsModalVisible(false); }}>
                  Send Bulk SMS
                </Button>
                <Button mode="outlined" onPress={() => setBulkSmsModalVisible(false)}>
                  Close
                </Button>
              </View>
            </View>
          </Modal>
        </>
      )}
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={Snackbar.DURATION_SHORT}
      >
        {snackbarMessage}
      </Snackbar>
    </View>
  );
};




const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,
    paddingTop:50
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  switchButton: {
    marginLeft: 10,
  },
  bulkSmsButton: {
    marginVertical: 10,
  },
  listItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  customerInfo: {
    flex: 1,
  },
  customerText: {
    fontSize: 16,
  },
  buttonContainer: {
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  markCollectedButton: {
    marginLeft: 10,
  },
  collected: {
    backgroundColor: '#d3d3d3', // Light green for collected
  },
  uncollected: {
    backgroundColor: '#f0f0f0', // Light red for uncollected
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  smsInput: {
    height: 150,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 10,
    padding: 10,
  },
  divider: {
    height: 10,
    backgroundColor: '#ccc',
    marginVertical: 10,
  },
  Button: {
    padding: 10,
    marginBottom: 20,
  },
});

export default CustomerCollectionScreen;
