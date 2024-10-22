import React, { useEffect, useState } from 'react';
import { View, StyleSheet, TextInput, ScrollView, RefreshControl } from 'react-native';
import { DataTable, Appbar } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons'; // Import Material Icons
import { router, useNavigation } from 'expo-router'; // Use Expo Router's navigation

const ReceiptsScreen = () => {
    const [receipts, setReceipts] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredReceipts, setFilteredReceipts] = useState([]);
    const [refreshing, setRefreshing] = useState(false); // State for refreshing
    const BASEURL =process.env.EXPO_PUBLIC_API_URL
    const navigation = useNavigation(); // Access navigation from Expo Router

    // Fetch receipts from API
    const fetchReceipts = async () => {
        try {
            const response = await fetch(`${BASEURL}/receipts`);
            const data = await response.json();
            console.log(`Fetched Receipts: ${JSON.stringify(data)}`); // Log the fetched data
            
            // Ensure the data is an array
            if (Array.isArray(data)) {
                setReceipts(data);
                setFilteredReceipts(data);
            } else {
                console.error('Unexpected data format: ', data);
                setReceipts([]);
                setFilteredReceipts([]);
            }
        } catch (error) {
            console.error('Error fetching receipts:', error);
            setReceipts([]);
            setFilteredReceipts([]);
        } finally {
            setRefreshing(false); // Stop the refreshing animation
        }
    };

    useEffect(() => {
        fetchReceipts();
    }, []);

    // Handle search input
    const handleSearch = (query) => {
        setSearchQuery(query);
        const filteredData = receipts.filter(receipt => {
            const receiptNumberMatch = receipt.receiptNumber.toLowerCase().includes(query.toLowerCase());
            const paidByMatch = receipt.paidBy.toLowerCase().includes(query.toLowerCase());
            const phoneNumberMatch = (receipt.customer && receipt.customer.phoneNumber && receipt.customer.phoneNumber.toLowerCase().includes(query.toLowerCase()));
            return receiptNumberMatch || paidByMatch || phoneNumberMatch;
        });
        setFilteredReceipts(filteredData);
    };

    // Handle receipt row click to navigate to the ReceiptScreen
    const handleRowClick = (receipt) => {
        if (receipt.id) {
            router.push(`/receipt/${receipt.id}`); // Navigate to the receipt screen with the receipt ID
        } else {
            console.error('Receipt ID is missing:', receipt);
        }
    };

    // Function to handle pull-to-refresh
    const onRefresh = () => {
        setRefreshing(true); // Start the refreshing animation
        fetchReceipts(); // Re-fetch receipts
    };

    return (
        <View style={styles.container}>
            <Appbar.Header>
                <Appbar.Content title="Receipts" />
            </Appbar.Header>

            <View style={styles.searchContainer}>
                <Icon name="search" size={20} color="#999" style={styles.searchIcon} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Receipt Number, Name, Phone Number"
                    value={searchQuery}
                    onChangeText={handleSearch}
                />
            </View>

            <ScrollView
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} /> // Implement swipe-to-refresh
                }
            >
                <DataTable>
                    <DataTable.Header>
                        <DataTable.Title>Receipt Number</DataTable.Title>
                        <DataTable.Title numeric>Amount (KES)</DataTable.Title>
                        <DataTable.Title>Mode of Payment</DataTable.Title>
                        <DataTable.Title>Status</DataTable.Title>
                        <DataTable.Title>Paid By</DataTable.Title>
                    </DataTable.Header>

                    {/* Ensure filteredReceipts is an array before mapping */}
                    {Array.isArray(filteredReceipts) && filteredReceipts.map(receipt => (
                        <DataTable.Row 
                            key={receipt.id} 
                            onPress={() => handleRowClick(receipt)} 
                            style={!receipt.receipted ? styles.unreceiptedRow : {}}
                        >
                            <DataTable.Cell>{receipt.receiptNumber}</DataTable.Cell>
                            <DataTable.Cell numeric>{receipt.amount}</DataTable.Cell>
                            <DataTable.Cell>{receipt.modeOfPayment}</DataTable.Cell>
                            <DataTable.Cell>{receipt.receipted ? 'Receipted' : 'Not Receipted'}</DataTable.Cell>
                            <DataTable.Cell>{receipt.paidBy}</DataTable.Cell>
                        </DataTable.Row>
                    ))}
                </DataTable>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: '#f5f5f5', // Light gray background
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 25,
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 10,
        shadowOffset: {
            width: 0,
            height: 2,
        },
        elevation: 5, // For Android shadow
    },
    searchInput: {
        height: 50,
        flex: 1,
        paddingHorizontal: 15,
        fontSize: 16, // Larger text for better readability
    },
    searchIcon: {
        padding: 10,
    },
    unreceiptedRow: {
        backgroundColor: '#ffe6e6', // Light red background for unreceipted transactions
    },
});

export default ReceiptsScreen;
