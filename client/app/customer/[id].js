import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import axios from 'axios';
import { useRoute } from '@react-navigation/native';
import { useNavigation } from 'expo-router';

const BASEURL = process.env.EXPO_PUBLIC_API_URL;

const CustomerDetailsPage = () => {
  const route = useRoute();
  const { customerId } = route.params;
  const navigation = useNavigation(); // Initialize navigation

  const [customerData, setCustomerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showMoreInvoices, setShowMoreInvoices] = useState(false);
  const [showMoreReceipts, setShowMoreReceipts] = useState(false);
  const [showMorePayments, setShowMorePayments] = useState(false);

  useEffect(() => {
    const fetchCustomerDetails = async () => {
      try {
        const response = await axios.get(`${BASEURL}/customer-details/${customerId}`);

        setCustomerData(response.data);
       navigation.setOptions({ title: customerData?.firstName });
         // Set the title to customer's name


        console.log('Fetched customer data:', response.data);
      } catch (error) {
        console.error('Error fetching customer data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomerDetails();
  }, [customerId]);

  if (loading) {
    return <ActivityIndicator size="large" color="#0000ff" />;
  }

  if (!customerData) {
    return <Text style={styles.message}>No customer data found.</Text>;
  }

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
      <Text style={styles.itemsTitle}>Items:</Text>
      {item?.items.map((invoiceItem) => (
        <Text key={invoiceItem.id}>
          - {invoiceItem.description}: ${invoiceItem.amount} x {invoiceItem.quantity}
        </Text>
      ))}
    </View>
  );


  const renderReceiptItem = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Receipt #: {item.receiptNumber}</Text>
      <Text>Amount: ${item.amount}</Text>
      <Text>Mode of Payment: {item.modeOfPayment}</Text>
      <Text>Created At: {new Date(item.createdAt).toLocaleDateString()}</Text>
  
      {/* Render payment details if available */}
      {item.payment && (
        <View style={styles.paymentDetails}>
          <Text style={styles.cardTitle}>Payment Details:</Text>
          <Text>Payment ID: {item.payment.id}</Text>
          <Text>Payment Amount: ${item.payment.amount}</Text>
          <Text>Transaction ID: {item.payment.TransactionId}</Text>

          <Text>Payment Mode: {item.payment.modeOfPayment}</Text>
          <Text>Payment Created At: {new Date(item.payment.createdAt).toLocaleDateString()}</Text>
        </View>
      )}
    </View>
  );
  


  const renderPaymentItem = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Payment #: {item.payment?.id}</Text>
      <Text>Amount: ${item.payment?.amount}</Text> {/* Accessing payment amount */}
      <Text>Mode of Payment: {item.payment?.modeOfPayment}</Text> {/* Accessing payment mode */}
      <Text>Created At: {new Date(item.payment?.createdAt).toLocaleDateString()}</Text> {/* Accessing payment date */}
    </View>
  );
  

  const renderInvoicesSection = () => (
    <>
      <Text style={styles.sectionTitle}>Invoices</Text>
      <FlatList
        data={showMoreInvoices ? customerData.invoices : customerData.invoices?.slice(0, 5)}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderInvoiceItem}
        style={styles.flatList}
        scrollEnabled={false} // Disable FlatList scrolling
      />
      {customerData.invoices?.length > 5 && (
        <TouchableOpacity style={styles.loadMoreButton} onPress={() => setShowMoreInvoices(!showMoreInvoices)}>
          <Text style={styles.loadMoreText}>{showMoreInvoices ? 'Show Less' : 'Load More'}</Text>
        </TouchableOpacity>
      )}
    </>
  );

  const renderReceiptsSection = () => (
    <>
      <Text style={styles.sectionTitle}>Receipts</Text>
      <FlatList
        data={showMoreReceipts ? customerData.receipts : customerData.receipts?.slice(0, 5)}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderReceiptItem}
        style={styles.flatList}
        scrollEnabled={false} // Disable FlatList scrolling
      />
      {customerData.receipts?.length > 5 && (
        <TouchableOpacity style={styles.loadMoreButton} onPress={() => setShowMoreReceipts(!showMoreReceipts)}>
          <Text style={styles.loadMoreText}>{showMoreReceipts ? 'Show Less' : 'Load More'}</Text>
        </TouchableOpacity>
      )}
    </>
  );

  const renderPaymentsSection = () => (
    <>
      <Text style={styles.sectionTitle}>Payments</Text>
      <FlatList
        data={showMorePayments ? customerData.payments : customerData.payments?.slice(0, 5)}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderPaymentItem}
        style={styles.flatList}
        scrollEnabled={false} // Disable FlatList scrolling
      />
      {customerData.payments?.length > 5 && (
        <TouchableOpacity style={styles.loadMoreButton} onPress={() => setShowMorePayments(!showMorePayments)}>
          <Text style={styles.loadMoreText}>{showMorePayments ? 'Show Less' : 'Load More'}</Text>
        </TouchableOpacity>
      )}
    </>
  );

  const data = [
    { type: 'customerDetails' },
    { type: 'invoices' },
    { type: 'receipts' },
    { type: 'payments' },
  ];

  const renderItem = ({ item }) => {
    switch (item.type) {
      case 'customerDetails':
        return renderCustomerDetails();
      case 'invoices':
        return renderInvoicesSection();
      case 'receipts':
        return renderReceiptsSection();
      case 'payments':
        return renderPaymentsSection();
      default:
        return null;
    }
  };

  return (
    <FlatList
      data={data}
      renderItem={renderItem}
      keyExtractor={(item) => item.type}
      contentContainerStyle={styles.container}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#e0f7fa',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#00796b',
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
  itemsTitle: {
    fontWeight: 'bold',
    marginTop: 8,
  },
  loadMoreButton: {
    padding: 10,
    backgroundColor: '#00796b',
    borderRadius: 5,
    alignItems: 'center',
    marginVertical: 10,
  },
  loadMoreText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  flatList: {
    marginBottom: 20,
  },
  message: {
    textAlign: 'center',
    marginTop: 20,
    color: '#c62828',
  },
});

export default CustomerDetailsPage;
