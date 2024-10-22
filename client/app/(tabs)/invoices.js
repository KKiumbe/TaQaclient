import React, { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { TextInput, Button, DataTable, Text, Snackbar, FAB, Portal, Menu, IconButton, useTheme } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import useAuthStore from '../../store/authStore';

const BASEURL =process.env.EXPO_PUBLIC_API_URL
const InvoiceScreen = () => {
  const [invoices, setInvoices] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [offset, setOffset] = useState(0);
  const [fabVisible, setFabVisible] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [menuVisible, setMenuVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false); // Add refreshing state

  const limit = 20;

  const currentUser = useAuthStore((state) => state.currentUser);
  const { colors } = useTheme();

  useEffect(() => {
    const checkToken = async () => {
      const token = await AsyncStorage.getItem('user');
      if (!token) {
        router.push('login');
      }
    };

    checkToken();
  }, []);


  const onRefresh = async () => {
    setRefreshing(true);
    fetchCustomers().then(() => setRefreshing(false));;
   
  };
  const fetchInvoices = async (reset = false) => {
    if (reset) {
      setOffset(0);
      setInvoices([]);
    }

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('user');
      
      if (!token) {
        router.push('login');
        return;
      }

      const response = await axios.get(`${BASEURL}/invoices/all`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        params: {
          status: statusFilter,
          offset: reset ? 0 : offset,
          limit: limit,
        },
      });

      setInvoices((prevInvoices) => [...prevInvoices, ...response.data]);
      setOffset((prevOffset) => prevOffset + limit);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      if (error.response && error.response.status === 401) {
        setSnackbarMessage('You are not authorized. Please log in.');
        setSnackbarOpen(true);
        router.push('login');
      } else {
        setSnackbarMessage('Failed to fetch invoices. Please try again.');
        setSnackbarOpen(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    setIsSearching(true);
    if (!searchTerm.trim()) {
      fetchInvoices(true);
      setIsSearching(false);
      return;
    }

    try {
      const isPhoneNumber = /^\d+$/.test(searchTerm);
      const response = await axios.get(`${BASEURL}/invoices/search`, {
        params: {
          phone: isPhoneNumber ? searchTerm : undefined,
          name: !isPhoneNumber ? searchTerm : undefined,
        },
      });

      setSearchResults(response.data);
    } catch (error) {
      console.error('Error searching invoices:', error);
      setSnackbarMessage('Error searching invoices.');
      setSnackbarOpen(true);
    } finally {
      setIsSearching(false);
    }
  };

  const handleScroll = async (event) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    if (layoutMeasurement.height + contentOffset.y >= contentSize.height - 20) {
      if (!loadingMore && !loading) {
        setLoadingMore(true);
        await fetchInvoices();
        setLoadingMore(false);
      }
    }
  };

  const handleStatusFilter = (status) => {
    setStatusFilter(status);
    fetchInvoices(true);
  };

  const handleMenuToggle = () => {
    setMenuVisible(!menuVisible);
  };

  const handleFetchReports = () => {
    setSnackbarMessage('Fetching invoice reports...');
    setSnackbarOpen(true);
  };

  const handleSendBills = async () => {
    try {
      const response = await axios.post(`${BASEURL}/send-bills`);
      console.log('Bills sent successfully:', response.data);
    } catch (error) {
      console.error('Error sending bills:', error.response ? error.response.data : error.message);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchInvoices(true);
      setFabVisible(true);

      return () => {
        setFabVisible(false);
      };
    }, [])
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <IconButton
          icon="menu"
          color="#007BFF"
          size={30}
          onPress={handleMenuToggle}
          style={styles.menu}
        />
        <Text style={styles.title}>Invoices</Text>
        <Menu
          visible={menuVisible}
          onDismiss={handleMenuToggle}
          anchor={<IconButton icon="dots-vertical" onPress={handleMenuToggle} style={styles.menu} />}
        >
          <Menu.Item onPress={handleFetchReports} title="Fetch Reports" />
          <Menu.Item onPress={handleSendBills} title="SMS Bills" />
        </Menu>
      </View>

      <View style={styles.filterContainer}>
        <Button
          mode="contained"
          onPress={() => handleStatusFilter('UNPAID')}
          style={[styles.filterButton, statusFilter === 'UNPAID' && styles.activeFilter]}
        >
          Unpaid
        </Button>
        <Button
          mode="contained"
          onPress={() => handleStatusFilter('PAID')}
          style={[styles.filterButton, statusFilter === 'PAID' && styles.activeFilter]}
        >
          Paid
        </Button>
        <Button
          mode="contained"
          onPress={() => handleStatusFilter('CANCELLED')}
          style={[styles.filterButton, statusFilter === 'CANCELLED' && styles.activeFilter]}
        >
          Cancelled
        </Button>
      </View>

      <TextInput
        label="Search by Name or Phone Number"
        value={searchTerm}
        onChangeText={(text) => setSearchTerm(text)}
        style={styles.searchInput}
        onSubmitEditing={handleSearch}
      />

      <Button mode="contained" onPress={handleSearch} style={styles.searchButton}>
        {isSearching ? 'Searching...' : 'Search'}
      </Button>

      {loading ? (
        <ActivityIndicator size="large" color="#007BFF" style={styles.loader} />
      ) : (
        <ScrollView onScroll={handleScroll} scrollEventThrottle={16}
        
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
        >
          <DataTable>
            <DataTable.Header>
              <DataTable.Title><Text>Invoice Number</Text></DataTable.Title>
              <DataTable.Title><Text>Name</Text></DataTable.Title>
              <DataTable.Title><Text>Amount</Text></DataTable.Title>
              <DataTable.Title><Text>Status</Text></DataTable.Title>
            </DataTable.Header>

            {/* Render filtered invoices */}
            {invoices
              .filter(invoice => !statusFilter || invoice.status === statusFilter)
              .map((invoice) => {
                // Set row color based on the invoice status
                let rowColor;
                if (invoice.status === 'CANCELLED') {
                  rowColor = colors.secondary; // Grey shade
                } else if (invoice.status === 'UNPAID') {
                  rowColor = colors.primary; // Blue shade
                } else if (invoice.status === 'PAID') {
                  rowColor = colors.success; // Green shade
                }

                return (
                  <DataTable.Row
                    key={invoice.id}
                    onPress={() => router.push(`invoices/${invoice.id}`)}
                    style={[styles.row, { backgroundColor: rowColor }]}
                  >
                    <DataTable.Cell>
                      <Text numberOfLines={1} ellipsizeMode="tail">{invoice.invoiceNumber}</Text>
                    </DataTable.Cell>
                    <DataTable.Cell>
                      <Text numberOfLines={1} ellipsizeMode="tail">{`${invoice.customer.firstName} ${invoice.customer.lastName}`}</Text>
                    </DataTable.Cell>
                    <DataTable.Cell>
                      <Text numberOfLines={1} ellipsizeMode="tail">{invoice.invoiceAmount}</Text>
                    </DataTable.Cell>
                    <DataTable.Cell>
                      <Text numberOfLines={1} ellipsizeMode="tail">{invoice.status}</Text>
                    </DataTable.Cell>
                  </DataTable.Row>
                );
              })}
          </DataTable>
          {loadingMore && <ActivityIndicator size="small" color="#007BFF" style={styles.loader} />}
        </ScrollView>
      )}

      <Snackbar
        visible={snackbarOpen}
        onDismiss={() => setSnackbarOpen(false)}
        duration={3000}
      >
        {snackbarMessage}
      </Snackbar>

      {fabVisible && (
        <Portal>
          <FAB
            style={styles.fab}
            icon="plus"
            onPress={() => router.push('invoices/create')}
          />
        </Portal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007BFF',
    paddingTop:50
  },
  menu: {
    marginRight: 16,
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 16,
  },
  filterButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  activeFilter: {
    backgroundColor: '#007BFF',
  },
  searchInput: {
    marginBottom: 16,
  },
  searchButton: {
    marginBottom: 16,
  },
  loader: {
    marginVertical: 20,
  },
  row: {
    height: 56,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 50,
    backgroundColor: '#007BFF',
  },
});

export default InvoiceScreen;
