import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { DataTable, TextInput, Modal, Button, Text, Portal, FAB, IconButton, Snackbar, ActivityIndicator, Divider, Checkbox } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import * as Location from 'expo-location';
import { FlatList } from 'react-native';
import axios from 'axios';
import { router } from 'expo-router';
import useAuthStore from '../../store/authStore';
import { Picker } from '@react-native-picker/picker';

const BASEURL = process.env.EXPO_PUBLIC_API_URL;

const Customers = React.memo(() => {
  const [customers, setCustomers] = useState([]);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [garbageCollectionDay, setGarbageCollectionDay] = useState('MONDAY');
  const [monthlyCharge, setMonthlyCharge] = useState('');
  const [status, setStatus] = useState('ACTIVE');
  const [collected, setCollected] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [gender, setGender] = useState('male');
  const [category, setCategory] = useState(''); // Initialize category state
  // State to track add/edit mode

  const navigation = useNavigation();
  const currentUser = useAuthStore(state => state.currentUser);

  useEffect(() => {
    if (!currentUser) {
      router.push('login');
    } else {
      fetchCustomers();
    }
  }, [currentUser]);

  const fetchCustomers = async () => {
    try {
      const response = await axios.get(`${BASEURL}/customers`);
      setCustomers(response.data);
    } catch (error) {
      console.error('Error fetching customers:', error);
      setSnackbarMessage('Error fetching customers.');
      setSnackbarOpen(true);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    fetchCustomers().then(() => setRefreshing(false));
  };

  const handleSearch = async () => {
    setIsSearching(true);
    if (!searchQuery.trim()) {
      setSearchResults(customers);
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
      console.error('Error searching customers:', error);
      setSnackbarMessage('Error searching customers.');
      setSnackbarOpen(true);
    } finally {
      setIsSearching(false);
    }
  };

  const openViewModal = (customer) => {
    setSelectedCustomer(customer);
    setViewModalVisible(true);
  };

  const openEditModal = (customer) => {
    setSelectedCustomer(customer);
    setEditModalVisible(true);
    setMonthlyCharge(customer?.monthlyCharge || '');
    setStatus(customer?.status || 'ACTIVE');
    setCollected(customer?.collected || false);
    setGarbageCollectionDay(customer?.garbageCollectionDay || 'MONDAY');
    setIsEditMode(true); 
    setCategory(customer?.category || '');
    // Set to true for editing

  };

  const openAddModal = () => {
    setSelectedCustomer(null); // Clear selected customer for new entry
    setMonthlyCharge('');
    setStatus('ACTIVE');
    setCollected(false);
    setGarbageCollectionDay('MONDAY');
   
    setEditModalVisible(true); // Open modal for adding a new customer
    setIsEditMode(false); // Set to false for adding
  };

  const handleSaveCustomer = async () => {
    setLoading(true);
    try {
      const url = selectedCustomer?.id
        ? `${BASEURL}/customers/${selectedCustomer.id}`
        : `${BASEURL}/customers`;
      const method = selectedCustomer?.id ? 'put' : 'post';

      const customerData = {
        firstName: selectedCustomer?.firstName || '',
        lastName: selectedCustomer?.lastName || '',
        email: selectedCustomer?.email || null,
        phoneNumber: selectedCustomer?.phone || '',
        gender: gender, // This should come from state, not from selectedCustomer
        county: selectedCustomer?.county || null,
        town: selectedCustomer?.town || null,
        location: selectedCustomer?.location
          ? `${selectedCustomer.location.latitude},${selectedCustomer.location.longitude}`
          : null,
        category: category || 'residential', // Use state
        monthlyCharge: Number(monthlyCharge),
        status: status || 'ACTIVE', // Use state
        garbageCollectionDay: garbageCollectionDay,
        collected: collected,
      };
      

      await axios[method](url, customerData);

      setSnackbarMessage(`Customer ${selectedCustomer?.id ? 'updated' : 'saved'} successfully!`);
      setSnackbarOpen(true);
      setSelectedCustomer(null);
      setEditModalVisible(false);
      const updatedCustomers = await axios.get(`${BASEURL}/customers`);
      setCustomers(updatedCustomers.data);
    } catch (error) {
      console.error('Error saving customer:', error.response ? error.response.data : error.message);
      // Handle errors
      if (error.response) {
        if (error.response.status === 500) {
          setErrorMessage("Oops! Something went wrong on our end. Please try again later.");
          setSnackbarMessage("Error saving customer. Please try again.");
        } else if (error.code === 'P2002') {
          setErrorMessage('A customer with this email already exists.');
        } else if (error.response.data.message === "Not Authenticated") {
          router.push('login');
          return;
        } else {
          setErrorMessage("An unexpected error occurred. Please try again.");
        }
      } else {
        setErrorMessage("Network error. Please check your connection.");
      }
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const sendBillToCustomer = async () => {
    if (!selectedCustomer || !selectedCustomer.id) {
      setSnackbarMessage('No customer selected.');
      setSnackbarOpen(true);
      return;
    }

    try {
      const response = await axios.post(`${BASEURL}/send-bill`, {
        customerId: selectedCustomer.id,
      });
      setSnackbarMessage(response.data.message || 'Bill sent successfully!');
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Error sending bill:', error);
      setSnackbarMessage('Error sending bill.');
      setSnackbarOpen(true);
    }
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  const filteredCustomers = searchQuery.trim() ? searchResults : customers;

  const captureLocation = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      alert('Permission to access location was denied');
      return;
    }

    let location = await Location.getCurrentPositionAsync({});
    const formattedLocation = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };

    setSelectedCustomer((prev) => ({
      ...prev,
      location: formattedLocation,
    }));
  };

  const formatLocation = (latitude, longitude) => {
    return `Latitude: ${latitude}, Longitude: ${longitude}`;
  };

  const renderItem = ({ item: customer }) => (
    <DataTable.Row key={customer.id}>
      <DataTable.Cell onPress={() => openViewModal(customer)}>{customer.firstName}</DataTable.Cell>
      <DataTable.Cell onPress={() => openViewModal(customer)}>{customer.lastName}</DataTable.Cell>
      <DataTable.Cell onPress={() => openViewModal(customer)}>{customer.location || 'N/A'}</DataTable.Cell>
      <DataTable.Cell onPress={() => openViewModal(customer)}>{customer.phone}</DataTable.Cell>
      <DataTable.Cell onPress={() => openViewModal(customer)}>{customer.category}</DataTable.Cell>
      <DataTable.Cell onPress={() => openViewModal(customer)}>{customer.status}</DataTable.Cell>
      <DataTable.Cell>
        <IconButton
          icon="pencil"
          color="#3b82f6"
          size={20}
          onPress={() => openEditModal(customer)}
        />
      </DataTable.Cell>
    </DataTable.Row>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Customer Accounts</Text>

      <TextInput
        label="Search by Name or Phone"
        mode="outlined"
        value={searchQuery}
        onChangeText={setSearchQuery}
        onSubmitEditing={handleSearch}
        style={styles.searchInput}
      />
      <Button mode="contained" onPress={handleSearch} style={styles.searchButton}>
        Search
      </Button>

      <DataTable>
        <DataTable.Header>
          <DataTable.Title>First Name</DataTable.Title>
          <DataTable.Title>Last Name</DataTable.Title>
          <DataTable.Title>Location</DataTable.Title>
          <DataTable.Title>Phone</DataTable.Title>
          <DataTable.Title>Category</DataTable.Title>
          <DataTable.Title>Status</DataTable.Title>
          <DataTable.Title>Actions</DataTable.Title>
        </DataTable.Header>

        <FlatList
          data={filteredCustomers}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        />
      </DataTable>

      <FAB
        style={styles.fab}
        icon="plus"
        onPress={openAddModal}
      />

      <Snackbar
        visible={snackbarOpen}
        onDismiss={handleSnackbarClose}
        duration={3000}
      >
        {snackbarMessage}
      </Snackbar>

    


      <Portal>
        <Modal visible={editModalVisible} onDismiss={() => setEditModalVisible(false)} contentContainerStyle={styles.modal}>
         
        <ScrollView contentContainerStyle={styles.scrollView}>
          <Text style={styles.modalTitle}>{isEditMode ? 'Edit Customer' : 'Add Customer'}</Text>
          
          
          <TextInput
  label="First Name"
  mode="outlined"
  value={selectedCustomer?.firstName || ''}
  onChangeText={(text) => setSelectedCustomer(prev => ({ ...prev, firstName: text }))}
  style={styles.input}
/>
<TextInput
  label="Last Name"
  mode="outlined"
  value={selectedCustomer?.lastName || ''}
  onChangeText={(text) => setSelectedCustomer(prev => ({ ...prev, lastName: text }))}
  style={styles.input}
/>

            <TextInput
              label="Email Address"
              mode="outlined"
              value={selectedCustomer?.email || ''}
              onChangeText={(text) => setSelectedCustomer(prev => ({ ...prev, email: text }))}
              keyboardType='email-address'
              style={styles.input}
            />
            <TextInput
              label="Phone Number"
              mode="outlined"
              value={selectedCustomer?.phone || ''}
              onChangeText={(text) => setSelectedCustomer(prev => ({ ...prev, phone: text }))}
              keyboardType='numeric'
              style={styles.input}
            />

        <Text>Gender</Text>

<     Picker selectedValue={gender} style={styles.picker} onValueChange={(itemValue) => setGender(itemValue)}>
              <Picker.Item label="Male" value="male" />
              <Picker.Item label="Female" value="female" />
            </Picker>
            <TextInput
              label="County"
              mode="outlined"
              value={selectedCustomer?.county || ''}
              onChangeText={(text) => setSelectedCustomer(prev => ({ ...prev, county: text }))}
              style={styles.input}
            />
            <TextInput
              label="Town"
              mode="outlined"
              value={selectedCustomer?.town || ''}
              onChangeText={(text) => setSelectedCustomer(prev => ({ ...prev, town: text }))}
              style={styles.input}
            />
          
          
          <TextInput
            label="Monthly Charge"
            mode="outlined"
            value={monthlyCharge}
            onChangeText={setMonthlyCharge}
            keyboardType="numeric"
            style={styles.modalInput}
          />

<Text>Customer Category</Text>
<Picker
  selectedValue={category}
  style={styles.picker}
  onValueChange={(itemValue) => setCategory(itemValue)} // Set category state
>
  <Picker.Item label="Residential" value="residential" />
  <Picker.Item label="Commercial" value="commercial" />

  <Picker.Item label="Apartment" value="apartment" />
</Picker>
        
<Text>Customer Status</Text>
<Picker
  selectedValue={status}
  style={styles.picker}
  onValueChange={(itemValue) => setStatus(itemValue)} // Set status state
>
  <Picker.Item label="Active" value="ACTIVE" />
  <Picker.Item label="Inactive" value="INACTIVE" />
</Picker>


        <View style={styles.checkboxContainer}>
              <Checkbox
                status={collected ? 'checked' : 'unchecked'}
                onPress={() => setCollected(!collected)}
              />
              <Text style={styles.checkboxLabel}>Collected</Text>
            </View>
          <Text>Garbage Collection Day</Text>
          <Picker
            selectedValue={garbageCollectionDay}
            onValueChange={(itemValue) => setGarbageCollectionDay(itemValue)}
            style={styles.picker}
          >
            <Picker.Item label="Monday" value="MONDAY" />
            <Picker.Item label="Tuesday" value="TUESDAY" />
            <Picker.Item label="Wednesday" value="WEDNESDAY" />
            <Picker.Item label="Thursday" value="THURSDAY" />
            <Picker.Item label="Friday" value="FRIDAY" />
            <Picker.Item label="Saturday" value="SATURDAY" />
            <Picker.Item label="Sunday" value="SUNDAY" />
          </Picker>

          {selectedCustomer?.location && (
              <Text style={styles.locationOutput}>
                Coordinates: {selectedCustomer.location.latitude}, {selectedCustomer.location.longitude}
              </Text>
            )}
          <Button mode="outlined" onPress={captureLocation} style={styles.captureLocationButton}>
            Capture Location
          </Button>

          <Button mode="contained" onPress={handleSaveCustomer} loading={loading}>
            {isEditMode ? 'Update' : 'Save Customer'}
          </Button>

          <Button mode="text" onPress={() => setEditModalVisible(false)}>
            Cancel
          </Button>

          </ScrollView>
        </Modal>
      </Portal>


    

    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  searchInput: {
    marginBottom: 8,
  },
  searchButton: {
    marginBottom: 16,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  modal: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 10,
  },
  modalTitle: {
    fontSize: 20,
    marginBottom: 16,
    textAlign: 'center',
  },
  modalInput: {
    marginBottom: 16,
  },
  picker: {
    height: 50,
    width: '100%',
  },
  captureLocationButton: {
    marginTop: 16,
    marginBottom:15
  },

  modal: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 10,
    maxHeight: '80%', // Ensure modal does not exceed a reasonable height
  },
  scrollView: {
    flexGrow: 1, // Allow ScrollView to grow and fill the space
  },
});

export default Customers;
