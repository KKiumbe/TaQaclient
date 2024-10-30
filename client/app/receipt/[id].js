import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import axios from 'axios';

const ReceiptScreen = () => {
    const { id: receiptId } = useLocalSearchParams(); // Extract receipt ID from route params
    const [receipt, setReceipt] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const BASEURL =process.env.EXPO_PUBLIC_API_URL


    // Fetch receipt details when the screen loads
    useEffect(() => {
        if (!receiptId) {
            setError('Receipt ID is missing.');
            return;
        }

        const fetchReceipt = async () => {
            try {
                const response = await axios.get(`${BASEURL}/receipts/${receiptId}`);
                setReceipt(response.data);

                console.log(`this is receipt data ${JSON.stringify(response.data)}`); // Log the fetched data
            } catch (err) {
                setError('Failed to load receipt details.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchReceipt();
    }, [receiptId]);

    if (loading) {
        return <ActivityIndicator size="large" color="#0000ff" />;
    }

    if (error) {
        return <Text>{error}</Text>;
    }

    if (!receipt) {
        return <Text>No receipt found.</Text>;
    }

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>Receipt Details</Text>
            <Text style={styles.label}>Receipt Number: {receipt?.receiptNumber}</Text>
            <Text style={styles.label}>Paid By: {receipt.customer?.firstName} {receipt.customer?.lastName}</Text>
            <Text style={styles.label}>Phone Number: {receipt.customer?.phoneNumber}</Text>
            <Text style={styles.label}>Total Amount: KES {receipt?.amount}</Text>
            <Text style={styles.label}>Payment Method: {receipt?.modeOfPayment}</Text>
            <Text style={styles.label}>Transaction ID: {receipt.payment?.mpesaTransactionId}</Text>
            <Text style={styles.label}>Date: {new Date(receipt.payment?.createdAt).toLocaleString()}</Text>
            <Text style={styles.label}>Customer Closing Balance: KES {receipt.customer?.closingBalance}</Text> 


            <Text style={styles.sectionTitle}>Invoices</Text>
            {receipt.receiptInvoices && receipt.receiptInvoices.length > 0 ? (
                receipt.receiptInvoices.map((receiptInvoice) => (
                    <View key={receiptInvoice.id} style={styles.invoiceContainer}>
                        <Text style={styles.invoiceText}>Invoice ID: {receiptInvoice?.invoice.id}</Text>
                        <Text style={styles.invoiceText}>Invoice Number: {receiptInvoice.invoice?.invoiceNumber}</Text>
                        <Text style={styles.invoiceText}>Invoice Amount: KES {receiptInvoice.invoice?.invoiceAmount}</Text>
                        <Text style={styles.invoiceText}>Status: {receiptInvoice.invoice?.status}</Text>
                        <Text style={styles.invoiceText}>Amount Paid: KES {receiptInvoice.invoice?.amountPaid}</Text>
                        <Text style={styles.invoiceText}>Created At: {new Date(receiptInvoice.invoice?.createdAt).toLocaleString()}</Text>

                    </View>
                ))
            ) : (
                <Text>No invoices available.</Text> // Message if no invoices are present
            )}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 16,
        backgroundColor: '#fff',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 16,
        textAlign: 'center',
    },
    label: {
        fontSize: 16,
        marginBottom: 8,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginTop: 16,
        marginBottom: 8,
    },
    invoiceContainer: {
        padding: 10,
        backgroundColor: '#f9f9f9',
        marginBottom: 8,
        borderRadius: 5,
    },
    invoiceText: {
        fontSize: 14,
        color: '#333',
    },
});

export default ReceiptScreen;
