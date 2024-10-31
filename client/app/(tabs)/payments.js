import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, Modal, Pressable, ScrollView, TextInput, RefreshControl, FlatList } from 'react-native';
import { DataTable, Searchbar, Snackbar, ActivityIndicator } from 'react-native-paper';
import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import axios from 'axios';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';


const PaymentScreen = () => {
    const [payments, setPayments] = useState([]);
    const [originalPayments, setOriginalPayments] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [modalVisible, setModalVisible] = useState(false);
    const [detailModalVisible, setDetailModalVisible] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [searchResults, setSearchResults] = useState([]);
    const [totalAmount, setTotalAmount] = useState('');
    const [modeOfPayment, setModeOfPayment] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedPayment, setSelectedPayment] = useState(null);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const BASEURL =process.env.EXPO_PUBLIC_API_URL

    const fetchPayments = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${BASEURL}/payments`);
            const data = await response.json();
            if (Array.isArray(data)) {
                setPayments(data);
                setOriginalPayments(data);
            }
        } catch (error) {
            console.error('Error fetching payments:', error);
            setSnackbarMessage('Error fetching payments.');
            setSnackbarOpen(true);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPayments();
    }, []);

    const handleRefresh = () => {
        setRefreshing(true);
        fetchPayments().then(() => setRefreshing(false));
    };

    const handleSearch = async () => {
        setIsSearching(true);
        if (!searchQuery.trim()) {
            setPayments(originalPayments);
            setIsSearching(false);
            return;
        }

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
            console.error('Error searching payments:', error);
            setSnackbarMessage('Error searching payments.');
            setSnackbarOpen(true);
        } finally {
            setIsSearching(false);
        }
    };

    const openModal = () => {
        setModalVisible(true);
    };

    const closeModal = () => {
        setModalVisible(false);
        resetModalState();
    };

    const resetModalState = () => {
        setSelectedCustomer(null);
        setTotalAmount('');
        setModeOfPayment('');
        setSearchQuery('');
        setSearchResults([]);
    };

    const handleCustomerSelect = (customer) => {
        setSelectedCustomer(customer);
        setSearchResults([]);
        setSearchQuery('');
    };

    const handlePaymentSubmit = async () => {
        if (!selectedCustomer || !totalAmount || !modeOfPayment) {
            setSnackbarMessage('Please fill all payment details.');
            setSnackbarOpen(true);
            return;
        }

        const payload = {
            customerId: selectedCustomer.id,
            totalAmount: parseFloat(totalAmount),
            modeOfPayment,
            paidBy: selectedCustomer.firstName,
        };
       
        

        try {
            await axios.post(`${BASEURL}/manual-cash-payment`, payload);
            fetchPayments();
            closeModal();
        } catch (error) {
            console.error('Error creating payment:', error);
            setSnackbarMessage('Error creating payment.');
            setSnackbarOpen(true);
        }
    };

    const handleEditPress = (id) => {
        router.push(`payment/${id}`);
    };

    const openDetailModal = (payment) => {
        setSelectedPayment(payment);
        setDetailModalVisible(true);
    };

    const closeDetailModal = () => {
        setDetailModalVisible(false);
        setSelectedPayment(null);
    };


    const RenderPaymentItem = ({ item }) => (
        <DataTable.Row key={item.id}>
            <DataTable.Cell>KES {item.amount}</DataTable.Cell>
            <DataTable.Cell>{item.modeOfPayment}</DataTable.Cell>
            <DataTable.Cell>{item.mpesaTransactionId}</DataTable.Cell>
            <DataTable.Cell>{item.receipted ? 'Receipted' : 'Not Receipted'}</DataTable.Cell>
            <DataTable.Cell>{item.receipt?.receiptNumber || 'N/A'}</DataTable.Cell>
            <DataTable.Cell>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        {!item.receipted && (
            <Pressable onPress={() => handleEditPress(item.id)} style={{ marginRight: 16 }}>
                <Icon name="pencil" size={24} color="blue" />
            </Pressable>
        )}
        <Pressable onPress={() => openDetailModal(item)}>
            <Icon name="eye" size={24} color="green" />
        </Pressable>
    </View>
</DataTable.Cell>

        </DataTable.Row>
    );

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Payments</Text>
            <Searchbar
                placeholder="Search payments by Mpesa code, name, or phone number"
                onChangeText={setSearchQuery}
                onSubmitEditing={handleSearch}
                value={searchQuery}
                style={styles.searchbar}
            />

            {loading && <ActivityIndicator size="large" color="blue" />}

            <ScrollView
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
                }
            >
                <DataTable>
                    <DataTable.Header>
                        <DataTable.Title>Amount</DataTable.Title>
                        <DataTable.Title>Mode of Payment</DataTable.Title>
                        <DataTable.Title>Transaction ID</DataTable.Title>
                        <DataTable.Title>Status</DataTable.Title>
                        <DataTable.Title>Receipt Number</DataTable.Title>
                        <DataTable.Title>Edit</DataTable.Title>
                    </DataTable.Header>


                    <FlatList
                    data={searchQuery ? searchResults : payments}
                    renderItem={RenderPaymentItem}
                    keyExtractor={(item) => item.id.toString()}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
                />



                </DataTable>
            </ScrollView>

            <Pressable style={styles.fab} onPress={openModal}>
                <Icon name="plus" size={24} color="white" />
            </Pressable>

            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={closeModal}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalView}>
                        <Text style={styles.modalTitle}>Add Manual Payment</Text>

                        <Searchbar
                            placeholder="Name or phone number"
                            onChangeText={setSearchQuery}
                            onSubmitEditing={handleSearch}
                            value={searchQuery}
                            style={styles.searchbar}
                        />

                        <ScrollView style={styles.customerList}>
                            {searchResults.slice(0, 5).map(customer => (
                                <Pressable
                                    key={customer.id}
                                    style={[
                                        styles.customerItem,
                                        selectedCustomer && selectedCustomer.id === customer.id ? styles.selectedCustomer : null,
                                    ]}
                                    onPress={() => handleCustomerSelect(customer)}
                                >
                                    <Text>{`${customer.firstName} ${customer.lastName}`}</Text>
                                </Pressable>
                            ))}
                        </ScrollView>

                        {selectedCustomer && (
                            <>
                                <Text style={styles.customerInfo}>
                                    First Name: {selectedCustomer.firstName}
                                </Text>
                                <Text style={styles.customerInfo}>
                                    Last Name: {selectedCustomer.lastName}
                                </Text>
                                <Text style={styles.customerInfo}>
                                    Phone Number: {selectedCustomer.phoneNumber}
                                </Text>
                                <Text style={styles.customerInfo}>
                                    Closing Balance: KES {selectedCustomer.closingBalance}
                                </Text>

                                <TextInput
                                    placeholder="Total Amount"
                                    keyboardType="numeric"
                                    value={totalAmount}
                                    onChangeText={setTotalAmount}
                                    style={styles.input}
                                />

                                <Picker
                                    selectedValue={modeOfPayment}
                                    style={styles.picker}
                                    onValueChange={(itemValue) => setModeOfPayment(itemValue)}
                                >
                                    <Picker.Item label="Select Mode of Payment" value="" />
                                    <Picker.Item label="MPESA" value="MPESA" />
                                    <Picker.Item label="CASH" value="CASH" />
                                    <Picker.Item label="BANK" value="BANK" />
                                </Picker>
                            </>
                        )}

                        <Pressable style={styles.submitButton} onPress={handlePaymentSubmit}>
                            <Text style={styles.submitButtonText}>Submit Payment</Text>
                        </Pressable>

                        <Pressable style={styles.closeButton} onPress={closeModal}>
                            <Text style={styles.closeButtonText}>Close</Text>
                        </Pressable>
                    </View>
                </View>
            </Modal>

            <Modal
                animationType="slide"
                transparent={true}
                visible={detailModalVisible}
                onRequestClose={closeDetailModal}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalView}>
                        {selectedPayment && (
                            <>
                                <Text style={styles.modalTitle}>Payment Details</Text>
                                <Text>Amount: KES {selectedPayment.amount}</Text>
                                <Text>Transaction ID: {selectedPayment.mpesaTransactionId}</Text>
                                <Text>Mode of Payment: {selectedPayment.modeOfPayment}</Text>
                                <Text>Status: {selectedPayment.receipted ? 'Receipted' : 'Not Receipted'}</Text>
                                <Text>Receipt Number: {selectedPayment.receipt?.receiptNumber || 'N/A'}</Text>
                            </>
                        )}

                        <Pressable style={styles.closeButton} onPress={closeDetailModal}>
                            <Text style={styles.closeButtonText}>Close</Text>
                        </Pressable>
                    </View>
                </View>
            </Modal>

            <Snackbar
                visible={snackbarOpen}
                onDismiss={() => setSnackbarOpen(false)}
                duration={6000}
            >
                {snackbarMessage}
            </Snackbar>
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
        paddingTop: 50,
    },
    searchbar: {
        marginBottom: 16,
    },
    fab: {
        position: 'absolute',
        right: 16,
        bottom: 16,
        backgroundColor: 'blue',
        borderRadius: 50,
        padding: 16,
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalView: {
        width: '80%',
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 20,
        shadowColor: '#000',
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    customerList: {
        maxHeight: 100,
        marginBottom: 10,
    },
    customerItem: {
        padding: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
    },
    selectedCustomer: {
        backgroundColor: '#e6e6e6',
    },
    customerInfo: {
        marginBottom: 5,
    },
    input: {
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        padding: 10,
    },
    picker: {
        marginBottom: 10,
    },
    submitButton: {
        backgroundColor: 'green',
        padding: 10,
        borderRadius: 5,
        marginBottom: 10,
    },
    submitButtonText: {
        color: 'white',
        textAlign: 'center',
        fontWeight: 'bold',
    },
    closeButton: {
        backgroundColor: 'red',
        padding: 10,
        borderRadius: 5,
    },
    closeButtonText: {
        color: 'white',
        textAlign: 'center',
        fontWeight: 'bold',
    },
});

export default PaymentScreen;
