import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator, Modal, TextInput, Alert } from 'react-native';
import { Text, Button, Card, Divider } from 'react-native-paper';
import { router } from 'expo-router';
import useAuthStore from '../../store/authStore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const BASEURL = process.env.EXPO_PUBLIC_API_URL;

const HomeScreen = () => {
  const [dashboardStats, setDashboardStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [sendingModalVisible, setSendingModalVisible] = useState(false);
  const [sending, setSending] = useState(false);
  const [smsMessage, setSmsMessage] = useState('');
  const [smsBalance, setSmsBalance] = useState(null); // New state for SMS balance

  const { currentUser } = useAuthStore();

  useEffect(() => {
    const checkToken = async () => {
      const token = await AsyncStorage.getItem('user');
      if (!token) {
        router.push('login');
      }
    };
    checkToken();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const token = await AsyncStorage.getItem('user');
      const response = await axios.get(`${BASEURL}/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDashboardStats(response.data.data);
    } catch (error) {
      if (error.response?.status === 401) {
        console.warn('Unauthorized! Redirecting to login.');
        await AsyncStorage.removeItem('user');
        router.push('login');
      } else {
        console.error('Error fetching dashboard stats:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchSmsBalance = async () => {
    try {
      const token = await AsyncStorage.getItem('user');
      const response = await axios.get(`${BASEURL}/get-sms-balance`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSmsBalance(response.data.credit);
      console.log(response.data);
      // Assuming API response contains a 'balance' field
    } catch (error) {
      console.error('Error fetching SMS balance:', error);
      Alert.alert('Error', 'Could not fetch SMS balance.');
    }
  };

  useEffect(() => {
    fetchDashboardStats();
    fetchSmsBalance()
  }, []);

  // Function to send SMS to all customers
  const sendToAll = async () => {
    if (!smsMessage.trim()) {
      Alert.alert('Error', 'Please enter a message to send.');
      return;
    }

    setModalVisible(false); // Close the message input modal
    setSendingModalVisible(true);
    setSending(true);
    try {
      await axios.post(`${BASEURL}/send-to-all`, { message: smsMessage });
      Alert.alert('Success', `SMS sent to all customers.`);
    } catch (error) {
      console.error('Failed to send SMS to all customers:', error);
      Alert.alert('Error', `Failed to send SMS to all customers.`);
    } finally {
      setSending(false);
      setSendingModalVisible(false);
      setSmsMessage(''); // Clear message input after sending
    }
  };

  // Function to send SMS to unpaid customers
  const sendToUnpaid = async () => {
    setSending(true);
    setSendingModalVisible(true);
    try {
      await axios.post(`${BASEURL}/send-sms-unpaid`);
      Alert.alert('Success', 'SMS sent to unpaid customers.');
    } catch (error) {
      console.error('Failed to send SMS to unpaid customers:', error);
      Alert.alert('Error', 'Failed to send SMS to unpaid customers.');
    } finally {
      setSending(false);
      setSendingModalVisible(false);
    }
  };

  // Function to send SMS to low balance customers
  const sendLowBalance = async () => {
    setSending(true);
    setSendingModalVisible(true);
    try {
      await axios.post(`${BASEURL}/send-sms-low-balance`);
      Alert.alert('Success', 'SMS sent to low balance customers.');
    } catch (error) {
      console.error('Failed to send SMS to low balance customers:', error);
      Alert.alert('Error', 'Failed to send SMS to low balance customers.');
    } finally {
      setSending(false);
      setSendingModalVisible(false);
    }
  };

  // Function to send SMS to high balance customers
  const sendHighBalance = async () => {
    setSending(true);
    setSendingModalVisible(true);
    try {
      await axios.post(`${BASEURL}/send-sms-high-balance`);
      Alert.alert('Success', 'SMS sent to high balance customers.');
    } catch (error) {
      console.error('Failed to send SMS to high balance customers:', error);
      Alert.alert('Error', 'Failed to send SMS to high balance customers.');
    } finally {
      setSending(false);
      setSendingModalVisible(false);
    }
  };

  const handleDownloadReport = () => {
    console.log('Download report');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007BFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.welcomeMessage}>
          Welcome {currentUser?.firstName || 'User'}!
        </Text>

        <Button
          mode="outlined"
          onPress={() => router.navigate('/profile')}
          style={styles.updateProfileButton}
        >
          Update Profile
        </Button>


        <Button
          mode="text"
          onPress={fetchSmsBalance}
          style={styles.smsBalanceButton}
        >
          {smsBalance !== null ? `SMS Balance: ${smsBalance}` : 'Check SMS Balance'}
        </Button>

        {[
          { title: 'Total Customers', value: dashboardStats?.totalCustomers, color: '#2196f3', category: 'all' },
          { title: 'Unpaid', value: dashboardStats?.unpaidCustomers, color: '#f44336', category: 'unpaid' },
          { title: 'Low Balance', value: dashboardStats?.lowBalanceCustomers, color: '#ffeb3b', category: 'lowBalance' },
          { title: 'High Balance', value: dashboardStats?.highBalanceCustomers, color: '#3f51b5', category: 'highBalance' },
        ].map((stat, index) => (
          <View key={index}>
            <Card style={[styles.card, { borderColor: stat.color }]}>
              <Card.Content>
                <View style={styles.cardContent}>
                  <View style={styles.cardText}>
                    <Text style={styles.cardTitle}>{stat.title}</Text>
                    <Text style={styles.cardValue}>{stat.value}</Text>
                  </View>
                  <Button
                    mode="outlined"
                    icon="message"
                    onPress={() => {
                      if (stat.category === 'all') {
                        setModalVisible(true);
                      } else if (stat.category === 'unpaid') {
                        sendToUnpaid();
                      } else if (stat.category === 'lowBalance') {
                        sendLowBalance();
                      } else if (stat.category === 'highBalance') {
                        sendHighBalance();
                      }
                    }}
                    style={styles.smsButton}
                  >
                    Send SMS
                  </Button>
                </View>
                <Button
                  mode="outlined"
                  icon="download"
                  onPress={handleDownloadReport}
                  style={styles.downloadButton}
                />
              </Card.Content>
            </Card>
            <Divider style={styles.divider} />
          </View>
        ))}
      </ScrollView>

      {/* Modal for "SMS All Customers" with input */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Send SMS to All Customers</Text>
          <TextInput
            style={styles.smsInput}
            placeholder="Enter your message here..."
            value={smsMessage}
            onChangeText={setSmsMessage}
            multiline={true}
          />
          <View style={styles.buttonContainer}>
            <Button
              mode="contained"
              onPress={sendToAll} // Call the sendToAll function directly
              style={styles.sendButton}
              disabled={sending}
            >
              {sending ? <ActivityIndicator size="small" color="#FFFFFF" /> : 'Send SMS'}
            </Button>
            <Button
              mode="outlined"
              onPress={() => setModalVisible(false)}
              style={styles.cancelButton}
            >
              Cancel
            </Button>
          </View>
        </View>
      </Modal>

      {/* Sending modal to indicate processing */}
      <Modal
        visible={sendingModalVisible}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.sendingModalContainer}>
          <View style={styles.sendingModalContent}>
            <ActivityIndicator size="large" color="#007BFF" />
            <Text style={styles.sendingText}>Messages are being generated and sent to customers...</Text>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  welcomeMessage: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#007BFF',
    padding: 30,
  },
  updateProfileButton: {
    marginBottom: 20,
    alignSelf: 'center',
  },
  card: {
    marginVertical: 10,
    borderWidth: 2,
    borderRadius: 12,
    elevation: 4,
    backgroundColor: '#FFFFFF',
    padding: 15,
  },
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    color: '#555555',
  },
  cardValue: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 10,
    color: '#333333',
  },
  smsButton: {
    marginTop: -30,
    marginLeft: 10,
    position: 'absolute',
    right: -10,
    top: 10,
  },
  downloadButton: {
    marginTop: 10,
    position: 'absolute',
    right: 0,
    bottom: 10,
  },
  divider: {
    marginVertical: 10,
    backgroundColor: '#CCCCCC',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  smsInput: {
    height: 100,
    borderColor: '#CCCCCC',
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sendButton: {
    flex: 1,
    marginRight: 10,
  },
  cancelButton: {
    flex: 1,
  },
  sendingModalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // semi-transparent background
  },
  sendingModalContent: {
    width: 300,
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    alignItems: 'center',
  },
  sendingText: {
    marginTop: 10,
    textAlign: 'center',
    color: '#333333',
  },
});

export default HomeScreen;
