import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Pressable, FlatList, Modal, Button, Alert } from 'react-native';
import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import axios from 'axios';
import { Searchbar } from 'react-native-paper';
import { Picker } from '@react-native-picker/picker';

const EditPaymentScreen = () => {
    const { id: paymentId } = useLocalSearchParams();
    const [payment, setPayment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [receiptingError, setReceiptingError] = useState('');
    const [modeOfPayment, setModeOfPayment] = useState('');
    const [receiptLoading, setReceiptLoading] = useState(false);
    const [receiptDetails, setReceiptDetails] = useState(null);

    const BASEURL =process.env.EXPO_PUBLIC_API_URL

    const navigation = useNavigation();


    useEffect(() => {
        if (!paymentId) {
            setError('Payment ID is missing.');
            return;
        }

        const fetchPayment = async () => {
            try {
                const response = await axios.get(`${BASEURL}/payments/${paymentId}`);
                setPayment(response.data);
            } catch (err) {
                setError('Failed to load payment details.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchPayment();
    }, [paymentId]);


    useEffect(() => {
        if (payment) {
          const title = `${payment?.TransactionId}`; // Customize this based on your logic
          navigation.setOptions({ title }); // Set the title using the navigation object
        }
      }, [payment]);

    const handleSearch = async () => {
        setSearchLoading(true);
        try {
            const isPhoneNumber = /^\d+$/.test(searchQuery);
            const response = await axios.get(`${BASEURL}/search-customers`, {
                params: {
                    phone: isPhoneNumber ? searchQuery : undefined,
                    name: !isPhoneNumber ? searchQuery : undefined,
                },
            });

            setSearchResults(response.data);
        } catch (error) {
            console.error('Error searching customers:', error);
        } finally {
            setSearchLoading(false);
        }
    };

    const handleManualReceipt = async () => {
        // Check if payment is already receipted
        if (payment?.receipted) {
            Alert.alert('Info', 'This payment has already been receipted.');
            return;
        }
        
        if (!selectedCustomer) {
            setReceiptingError('No customer selected');
            return;
        }
        if (!modeOfPayment) {
            setReceiptingError('Please select a mode of payment');
            return;
        }
    
        const receiptPayload = {
            paymentId: paymentId, // Include payment ID in the payload
            customerId: selectedCustomer.id,
            totalAmount: payment.amount,
            modeOfPayment,
            paidBy: `${selectedCustomer.firstName}`,
        };

        console.log(`this is payment payload ${JSON.stringify(receiptPayload)}`);
    
        setReceiptLoading(true);
        try {
            const response = await axios.post(`${BASEURL}/manual-receipt`, receiptPayload);
    
            const receiptId = response.data.receipts[0]?.id;
    
            if (!receiptId) {
                setReceiptingError('No receipt ID returned.');
                return;
            }
    
            setModalVisible(false);
            setReceiptDetails(receiptId); // Save the receipt ID in state
    
            Alert.alert('Success', 'Payment receipted successfully!', [
                {
                    text: 'OK',
                    onPress: () => {
                        // Reset state to allow receipting again
                        setPayment((prev) => ({ ...prev, receipted: true })); // Update payment status
                        router.push(`/receipt/${receiptId}`); // Navigate to the receipt using the ID
                    },
                },
            ]);
        } catch (error) {
            console.error('Error receipting payment:', error);
            setReceiptingError('Error receipting payment. Please try again.');
        } finally {
            setReceiptLoading(false);
        }
    };

    const resetState = () => {
        setReceiptingError('');
        setSelectedCustomer(null);
        setModeOfPayment('');
        setReceiptDetails(null);
    };

    useEffect(() => {
        resetState(); // Reset state on component mount or when returning to the screen
    }, [paymentId]);

    if (loading) {
        return <ActivityIndicator size="large" color="#0000ff" />;
    }

    if (error) {
        return <Text>{error}</Text>;
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Receipting Payment</Text>
            {payment && (
                <>
                    <Text>Transaction ID: {payment.TransactionId}</Text>
                    <Text>Amount: KES {payment.amount}</Text>
                    <Text>Status: {payment.receipted ? 'Receipted' : 'Not Receipted'}</Text>
                    <Text>Time Paid: {payment.createdAt}</Text>

                    <Text>Payment Reference: {payment?.Ref}</Text>

                </>
            )}

            {receiptDetails && (
                <View style={styles.receiptDetails}>
                    <Text style={styles.receiptTitle}>Receipt Details:</Text>
                    <Text>Receipt ID: {receiptDetails}</Text>
                </View>
            )}

            <Searchbar
                placeholder="Search customer by name or phone number"
                onChangeText={setSearchQuery}
                value={searchQuery}
                onIconPress={handleSearch}
                style={styles.searchBar}
            />

            {searchLoading ? (
                <ActivityIndicator size="small" color="#0000ff" style={{ marginVertical: 20 }} />
            ) : (
                <FlatList
                    data={searchResults}
                    keyExtractor={(customer) => customer.id.toString()}
                    renderItem={({ item: customer }) => (
                        <Pressable
                            onPress={() => {
                                setSelectedCustomer(customer);
                                setModalVisible(true);
                            }}
                            style={styles.customerItem}
                        >
                            <Text>{customer.firstName} {customer.lastName}</Text>
                            <Text>{customer.phoneNumber}</Text>
                        </Pressable>
                    )}
                    style={styles.resultList}
                />
            )}

            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalView}>
                        <Text style={styles.modalTitle}>Confirm Receipt for {selectedCustomer?.firstName} {selectedCustomer?.lastName}</Text>
                        
                        <Text style={styles.modalSubtitle}>Mode of Payment:</Text>
                        <Picker
                            selectedValue={modeOfPayment}
                            onValueChange={(itemValue) => setModeOfPayment(itemValue)}
                            style={styles.picker}
                        >
                            <Picker.Item label="Select Payment Mode" value="" />
                            <Picker.Item label="CASH" value="CASH" />
                            <Picker.Item label="MPESA" value="MPESA" />
                            <Picker.Item label="BANK" value="BANK" />
                        </Picker>

                        {receiptingError ? <Text style={styles.errorText}>{receiptingError}</Text> : null}

                        {receiptLoading ? (
                            <ActivityIndicator size="small" color="#0000ff" />
                        ) : (
                            <Button title="Confirm Receipt" onPress={handleManualReceipt} />
                        )}

                        <Pressable style={styles.closeButton} onPress={() => setModalVisible(false)}>
                            <Text style={styles.closeButtonText}>Close</Text>
                        </Pressable>
                    </View>
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
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 16,
        textAlign: 'center',
    },
    searchBar: {
        marginVertical: 20,
    },
    resultList: {
        maxHeight: 200,
        width: '100%',
    },
    customerItem: {
        padding: 10,
        borderBottomWidth: 1,
        borderColor: '#ccc',
    },
    receiptDetails: {
        marginVertical: 20,
        padding: 10,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 10,
        backgroundColor: '#f9f9f9',
    },
    receiptTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalView: {
        width: '80%',
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 15,
    },
    modalSubtitle: {
        fontSize: 16,
        marginBottom: 10,
    },
    picker: {
        height: 50,
        width: '100%',
        marginBottom: 15,
    },
    errorText: {
        color: 'red',
        marginVertical: 10,
    },
    closeButton: {
        backgroundColor: '#2196F3',
        borderRadius: 20,
        padding: 10,
        elevation: 2,
    },
    closeButtonText: {
        color: 'white',
        fontWeight: 'bold',
        textAlign: 'center',
    },
});

export default EditPaymentScreen;
