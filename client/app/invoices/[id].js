import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Text, DataTable, Snackbar, Button } from 'react-native-paper';
import { useRoute } from '@react-navigation/native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useNavigation } from '@react-navigation/native';

const BASEURL = "http://212.47.74.158:5000/api";

const InvoiceDetails = () => {
  const route = useRoute();
  const navigation = useNavigation();

  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  const { id } = route.params;

  const fetchInvoiceDetails = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('user');
      if (!token) {
        throw new Error('No token found');
      }

      const response = await axios.get(`${BASEURL}/invoices/${id}/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setInvoice(response.data);
      console.log(response.data);
    } catch (error) {
      console.error('Error fetching invoice details:', error);
      setSnackbarMessage('Failed to fetch invoice details. Please try again.');
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoiceDetails();
  }, [id]);

  useEffect(() => {
    if (invoice) {
      const title = `${invoice.customer.firstName}`;
      navigation.setOptions({ title });
    }
  }, [invoice]);

  const handleDownloadInvoice = async () => {
    const token = await AsyncStorage.getItem('user');
    try {
      const downloadPath = FileSystem.documentDirectory + `invoice-${id}.pdf`;
  
      const response = await axios.get(`${BASEURL}/download-invoice/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        responseType: 'blob',
      });
  
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(response.data);
      });
  
      await FileSystem.writeAsStringAsync(downloadPath, base64.split(',')[1], {
        encoding: FileSystem.EncodingType.Base64,
      });
  
      setSnackbarMessage('Invoice downloaded successfully.');
      setSnackbarOpen(true);
      console.log('Invoice saved to:', downloadPath);
      
      await Sharing.shareAsync(downloadPath); // Open the downloaded PDF

    } catch (error) {
      console.error('Error downloading invoice:', error);
      setSnackbarMessage('Failed to download invoice. Please try again.');
      setSnackbarOpen(true);
    }
  };

  const handleCancelInvoice = async () => {
    const token = await AsyncStorage.getItem('user');
    try {
      const response = await axios.put(`${BASEURL}/invoices/cancel/${id}/`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSnackbarMessage(response.data.message);
      setSnackbarOpen(true);
      fetchInvoiceDetails();
    } catch (error) {
      setSnackbarMessage('Failed to cancel invoice. Please try again.');
      setSnackbarOpen(true);
    }
  };

  if (loading) {
    return <ActivityIndicator size="large" color="#007BFF" style={styles.loader} />;
  }

  if (!invoice) {
    return (
      <View style={styles.container}>
        <Text>No invoice found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Invoice Details</Text>
        
        {/* Download Invoice Button */}
        <Button 
          mode="outlined" 
          onPress={handleDownloadInvoice} 
          style={styles.downloadButton}
          disabled={invoice.status === "CANCELLED"} // Disable button if invoice is cancelled
        >
          Download PDF
        </Button>
      </View>
      
      {/* Invoice Info */}
      <Text style={styles.subtitle}>Invoice Number: {invoice.invoiceNumber}</Text>
      <Text style={[styles.status, invoice.status === "CANCELLED" && styles.cancelledStatus]}>
        Status: {invoice.status}
      </Text>
      <Text>Invoice Amount: {invoice.invoiceAmount}</Text>
      <Text>Closing Balance: {invoice.closingBalance}</Text>
      <Text>Created At: {new Date(invoice.createdAt).toLocaleDateString()}</Text>
      <Text>Invoice Period: {new Date(invoice.invoicePeriod).toLocaleDateString()}</Text>
      
      <Text style={styles.subtitle}>
        Type: {invoice.isSystemGenerated ? 'System Generated' : 'User Generated'}
      </Text>

      {/* Customer Info */}
      <Text style={styles.subtitle}>Customer Info</Text>
      <Text>Name: {invoice.customer.firstName} {invoice.customer.lastName}</Text>
      <Text>Email: {invoice.customer.email}</Text>
      <Text>Phone Number: {invoice.customer.phoneNumber}</Text>
      <Text>Monthly Charge: {invoice.customer.monthlyCharge}</Text>
      <Text>Status: {invoice.customer.status}</Text>

      {/* Invoice Items */}
      <Text style={styles.subtitle}>Invoice Items</Text>
      <DataTable>
        <DataTable.Header>
          <DataTable.Title>Description</DataTable.Title>
          <DataTable.Title>Quantity</DataTable.Title>
          <DataTable.Title>Amount</DataTable.Title>
        </DataTable.Header>

        {invoice.items.map(item => (
          <DataTable.Row key={item.id}>
            <DataTable.Cell>{item.description}</DataTable.Cell>
            <DataTable.Cell>{item.quantity}</DataTable.Cell>
            <DataTable.Cell>{item.amount}</DataTable.Cell>
          </DataTable.Row>
        ))}
      </DataTable>

      {/* Snackbar for error messages */}
      <Snackbar
        visible={snackbarOpen}
        onDismiss={() => setSnackbarOpen(false)}
        duration={3000}
      >
        {snackbarMessage}
      </Snackbar>

      {/* Buttons for canceling the current invoice */}
      <Button 
        mode="contained" 
        onPress={handleCancelInvoice} 
        style={[styles.button, styles.cancelButton]}
        color="#f50057"
        disabled={invoice.status === "CANCELLED"}
      >
        Cancel Invoice
      </Button>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#673ab7',
  },
  downloadButton: {
    marginLeft: 'auto',
  },
  subtitle: {
    fontSize: 15,
    fontWeight: 'light',
    marginVertical: 10,
  },
  status: {
    fontSize: 16,
  },
  cancelledStatus: {
    color: 'red',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
  },
  button: {
    marginVertical: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  cancelButton: {
    marginTop: 16,
  },
});

export default InvoiceDetails;
