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
  const [smsBalance, setSmsBalance] = useState(null);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [currentCategory, setCurrentCategory] = useState(null); // New state to track the current category

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
    } catch (error) {
      console.error('Error fetching SMS balance:', error);
      Alert.alert('Error', 'Could not fetch SMS balance.');
    }
  };

  useEffect(() => {
    fetchDashboardStats();
    fetchSmsBalance();
  }, []);

  const sendSms = async (endpoint) => {
    setSendingModalVisible(true);
    setSending(true);
    setConfirmModalVisible(false);

    try {
      await axios.post(`${BASEURL}/${endpoint}`, { message: smsMessage });
      Alert.alert('Success', 'SMS sent successfully.');
    } catch (error) {
      console.error(`Failed to send SMS to ${endpoint} customers:`, error);
      Alert.alert('Error', `Failed to send SMS to ${endpoint} customers.`);
    } finally {
      setSending(false);
      setSendingModalVisible(false);
      setSmsMessage('');
    }
  };

  const sendToAll = async () => {
    if (!smsMessage.trim()) {
      Alert.alert('Error', 'Please enter a message to send.');
      return;
    }

    setModalVisible(false);
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
      setSmsMessage('');
    }
  };

  const confirmSend = (category) => {
    setCurrentCategory(category); // Store the current category
    setConfirmModalVisible(true); // Show the confirmation modal
    setModalVisible(false); // Close the message input modal
  };

  const handleSendConfirmation = () => {
    setConfirmModalVisible(false);
    const endpointMap = {
      unpaid: 'send-sms-unpaid',
      lowBalance: 'send-sms-low-balance',
      highBalance: 'send-sms-high-balance',
    };
    const endpoint = endpointMap[currentCategory];
    if (endpoint) {
      sendSms(endpoint); // Call the sendSms function with the correct endpoint
    } else {
      Alert.alert('Error', 'Invalid category selected.');
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
                      } else {
                        confirmSend(stat.category); // Confirm send for the selected category
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

      <Modal
        visible={confirmModalVisible}
        animationType="slide"
        onRequestClose={() => setConfirmModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Confirm Send SMS</Text>
          <Text>Are you sure you want to send this SMS to the selected customers?</Text>
          <View style={styles.buttonContainer}>
            <Button
              mode="contained"
              onPress={handleSendConfirmation} // Correctly call the send confirmation
              style={styles.sendButton}
              disabled={sending}
            >
              Confirm
            </Button>
            <Button
              mode="outlined"
              onPress={() => setConfirmModalVisible(false)}
              style={styles.cancelButton}
            >
              Cancel
            </Button>
          </View>
        </View>
      </Modal>

      <Modal
        visible={modalVisible}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Send SMS</Text>
          <TextInput
            placeholder="Enter your message here"
            style={styles.textInput}
            value={smsMessage}
            onChangeText={setSmsMessage}
            multiline
            numberOfLines={4}
          />
          <View style={styles.buttonContainer}>
            <Button
              mode="contained"
              onPress={sendToAll} // Option to send to all directly
              style={styles.sendButton}
              disabled={sending || !smsMessage.trim()}
            >
              Send to All
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

      <Modal
        visible={sendingModalVisible}
        animationType="slide"
        onRequestClose={() => setSendingModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <ActivityIndicator size="large" color="#007BFF" />
          <Text>{sending ? 'Sending SMS...' : 'Done!'}</Text>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeMessage: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    marginTop:50
  },
  updateProfileButton: {
    marginBottom: 16,
  },
  smsBalanceButton: {
    marginBottom: 16,
  },
  card: {
    borderWidth: 2,
    borderRadius: 8,
    marginBottom: 16,
  },
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  cardValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  smsButton: {
    marginLeft: 8,
  },
  downloadButton: {
    marginTop: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#ccc',
    marginVertical: 8,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  textInput: {
    width: '100%',
    height: 100,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  sendButton: {
    flex: 1,
    marginRight: 8,
  },
  cancelButton: {
    flex: 1,
    marginLeft: 8,
  },
});

export default HomeScreen;
