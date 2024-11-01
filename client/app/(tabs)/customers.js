import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Linking } from 'react-native';
import { DataTable, TextInput, Modal, Button, Text, Portal, FAB, IconButton, Snackbar, ActivityIndicator, Divider, Checkbox } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import * as Location from 'expo-location';
import { FlatList } from 'react-native';
import axios from 'axios';
import { router } from 'expo-router';
import useAuthStore from '../../store/authStore';
import { Picker } from '@react-native-picker/picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';


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
  const [refreshing, setRefreshing] = useState(false);
  const [gender, setGender] = useState('male');
  const [building, setBuilding] = useState('');
  const [houseNumber, setHouseNumber] = useState('');
  const [estate, setEstate] = useState('');
  const [category, setCategory] = useState(''); 
  const [monthlyCharge, setMonthlyCharge] = useState('');
  const [status, setStatus] = useState('ACTIVE');
  const [collected, setCollected] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [garbageCollectionDay, setGarbageCollectionDay] = useState('MONDAY');
  const [closingBalance, setClosingBalance] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState(customers);
  const [secondaryPhoneNumber, setSecondaryPhoneNumber] = useState('');

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
    setCategory(customer?.category || '');
    setBuilding(customer?.building || '');
    setHouseNumber(customer?.houseNumber || '');
    setEstate(customer?.estate || '');
    setClosingBalance(customer?.closingBalance || 0);
    setSecondaryPhoneNumber(customer?.secondaryPhoneNumber || '');
  };

  const openAddModal = () => {
    setSelectedCustomer(null); // Clear selected customer for new entry
    setMonthlyCharge('');
    setStatus('ACTIVE');
    setCollected(false);
    setGarbageCollectionDay('MONDAY');
    setBuilding('');
    setHouseNumber('');
    setEstate('');
    setClosingBalance(0);
    setEditModalVisible(true);
    setSecondaryPhoneNumber('');
    // Open modal for adding a new customer
  };

  const handleSaveCustomer = async () => {
    setLoading(true);
    try {
      const url = selectedCustomer?.id
        ? `${BASEURL}/customers/${selectedCustomer.id}`
        : `${BASEURL}/customers`;
      const method = selectedCustomer?.id ? 'put' : 'post';
  
      // Start with an empty object for customerData
      const customerData = {};
  
      // Only include fields that are either new or updated
      if (selectedCustomer?.firstName) customerData.firstName = selectedCustomer.firstName;
      if (selectedCustomer?.lastName) customerData.lastName = selectedCustomer.lastName;
      if (selectedCustomer?.email) customerData.email = selectedCustomer.email;
      if (selectedCustomer?.phone) customerData.phoneNumber = selectedCustomer.phone;
      if (gender) customerData.gender = gender; // Use current state value
      if (selectedCustomer?.county) customerData.county = selectedCustomer.county;
      if (selectedCustomer?.town) customerData.town = selectedCustomer.town;
      if (selectedCustomer?.location) {
        customerData.location = `${selectedCustomer.location.latitude},${selectedCustomer.location.longitude}`;
      }
      if (category) customerData.category = category; // Use current state value
      if (monthlyCharge) customerData.monthlyCharge = Number(monthlyCharge);
      if (status) customerData.status = status; // Use current state value
      if (garbageCollectionDay) customerData.garbageCollectionDay = garbageCollectionDay; // Use current state value
      if (collected !== null) customerData.collected = collected; // Handle boolean
      if (building) customerData.building = building; // Use current state value
      if (houseNumber) customerData.houseNumber = houseNumber; // Use current state value
      if (estate) customerData.estate = estate; // Use current state value
      if (closingBalance || closingBalance === 0) customerData.closingBalance = closingBalance; // Handle numeric
      if (secondaryPhoneNumber) customerData.secondaryPhoneNumber = secondaryPhoneNumber; // Use current state value
  
      console.log("Customer data being sent to backend:", customerData);
  
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
        } else if (error.response.status === 401 && error.response.data.message === "Not Authenticated") {
          // Redirect to login on "Not Authenticated"
          router.push('login');
          return;
        } else if (error.code === 'P2002') {
          setErrorMessage('A customer with this email already exists.');
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
  


  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };


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
    <DataTable.Row key={customer.id} style={styles.row}>
      <DataTable.Cell onPress={() => openViewModal(customer)}>{customer.firstName}</DataTable.Cell>
      <DataTable.Cell onPress={() => openViewModal(customer)}>{customer.lastName}</DataTable.Cell>
      <DataTable.Cell onPress={() => openViewModal(customer)}>{customer.location || 'N/A'}</DataTable.Cell>
      <DataTable.Cell onPress={() => openViewModal(customer)}>{customer.phoneNumber}</DataTable.Cell>
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

      <DataTable.Cell>
        <IconButton
          icon="account"
          color="#3b82f6"
          size={20}
          onPress={() => router.push({ pathname: `customer/${customer.id}`, params: { customerId: customer.id } })}

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
        style={styles.searchInput}
      />
      <Button mode="contained" onPress={handleSearch} style={styles.searchButton}>
        Search
      </Button>

      {isSearching && ( // Conditionally render the spinner
      <ActivityIndicator size="large" color="#6200ee" style={styles.spinner} />
    )}


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
          data={searchQuery ? searchResults : customers} // Render searchResults if searchQuery exists
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
            <Text style={styles.modalTitle}>{selectedCustomer ? 'Edit Customer' : 'Add Customer'}</Text>

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
            <TextInput
           label="Secondary Phone Number"
           mode="outlined"
           value={secondaryPhoneNumber}
           onChangeText={setSecondaryPhoneNumber}
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
              label="Building"
              mode="outlined"
              value={building}
              onChangeText={setBuilding}
              style={styles.input}
            />
            <TextInput
              label="House Number"
              mode="outlined"
              value={houseNumber}
              onChangeText={setHouseNumber}
              keyboardType='text'
              style={styles.input}
            />
            <TextInput
              label="Estate"
              mode="outlined"
              value={estate}
              onChangeText={setEstate}
              style={styles.input}
            />
            <Picker
              selectedValue={category}
              onValueChange={(itemValue) => setCategory(itemValue)}
              style={styles.input}
            >
              <Picker.Item label="Residential" value="residential" />
              <Picker.Item label="Commercial" value="commercial" />
              <Picker.Item label="Industrial" value="industrial" />
            </Picker>
            <TextInput
              label="Monthly Charge"
              mode="outlined"
              value={monthlyCharge}
              onChangeText={setMonthlyCharge}
              keyboardType='numeric'
              style={styles.input}
            />
            <TextInput
              label="Closing Balance"
              mode="outlined"
              value={closingBalance.toString()}
              onChangeText={(text) => setClosingBalance(Number(text))}
              keyboardType='numeric'
              style={styles.input}
            />
            <Picker
              selectedValue={status}
              onValueChange={(itemValue) => setStatus(itemValue)}
              style={styles.input}
            >
              <Picker.Item label="ACTIVE" value="ACTIVE" />
              <Picker.Item label="INACTIVE" value="INACTIVE" />
            </Picker>
            <View style={styles.checkboxContainer}>
              <Checkbox
                status={collected ? 'checked' : 'unchecked'}
                onPress={() => setCollected(!collected)}
              />
              <Text>Collected</Text>
            </View>
            <Text>Collection Day</Text>
            <Picker
              selectedValue={garbageCollectionDay}
              onValueChange={(itemValue) => setGarbageCollectionDay(itemValue)}
              style={styles.input}
            >
              <Picker.Item label="Monday" value="MONDAY" />
              <Picker.Item label="Tuesday" value="TUESDAY" />
              <Picker.Item label="Wednesday" value="WEDNESDAY" />
              <Picker.Item label="Thursday" value="THURSDAY" />
              <Picker.Item label="Friday" value="FRIDAY" />
              <Picker.Item label="Saturday" value="SATURDAY" />
            </Picker>
            <TextInput
  label="Closing Balance"
  mode="outlined"
  value={selectedCustomer?.closingBalance?.toString() || '0'}
  onChangeText={(text) => setSelectedCustomer(prev => ({ ...prev, closingBalance: text }))}
  keyboardType="numeric"
  style={styles.modalInput}
/>
            {selectedCustomer?.location && (
              <Text style={styles.locationOutput}>
                Coordinates: {selectedCustomer.location.latitude}, {selectedCustomer.location.longitude}
              </Text>
            )}
          <Button mode="outlined" onPress={captureLocation} style={styles.captureLocationButton}>
            Capture Location
          </Button>
            <Button mode="contained" onPress={handleSaveCustomer} loading={loading} style={styles.saveCancel} >
              Save
            </Button>

            <Button mode="text" onPress={() => setEditModalVisible(false)}>
            Cancel
          </Button>
          </ScrollView>
        </Modal>

        <Modal visible={viewModalVisible} onDismiss={() => setViewModalVisible(false)} contentContainerStyle={styles.modal}>
          <ScrollView contentContainerStyle={styles.scrollView}>
            <Text style={styles.modalTitle}>Customer Details</Text>
            {selectedCustomer && (
              <>
                <Text>First Name: {selectedCustomer.firstName}</Text>
                <Text>Last Name: {selectedCustomer.lastName}</Text>
                <Text>Email: {selectedCustomer.email}</Text>
                <Text style={styles.phoneContainer}>
         
          <Text 
            style={styles.phoneLink}
            onPress={() => Linking.openURL(`tel:${selectedCustomer.phoneNumber}`)}
          >
           Call Customer: {selectedCustomer.phoneNumber}
          </Text>
          <MaterialCommunityIcons name="phone" size={20} color="#3b82f6"  style={styles.rotatedIcon} />
        </Text>


          
                <Text>Location: {selectedCustomer.location || 'N/A'}</Text>
                <Text>Category: {selectedCustomer.category}</Text>
                <Text>Status: {selectedCustomer.status}</Text>
                <Text>Monthly Charge: {selectedCustomer.monthlyCharge}</Text>
                <Text  style={styles.closingBalance}>Closing Balance: {selectedCustomer.closingBalance}</Text>
                <Text>Collected: {selectedCustomer.collected ? 'Yes' : 'No'}</Text>
                <Text>Garbage Collection Day: {selectedCustomer.garbageCollectionDay}</Text>
                <Text>Building: {selectedCustomer.building}</Text>
                <Text>House Number: {selectedCustomer.houseNumber}</Text>
                <Text>Estate: {selectedCustomer.estate}</Text>


                <Text style={styles.phoneContainer}>
         
          <Text 
            style={styles.phoneLink}
            onPress={() => Linking.openURL(`tel:${selectedCustomer.secondaryPhoneNumber}`)}
          >
           Call Alternative contact person : {selectedCustomer.secondaryPhoneNumber}
          </Text>
          <MaterialCommunityIcons name="phone" size={20} color="#3b82f6"  style={styles.rotatedIcon} />
        </Text>
              </>
            )}
            <Button mode="contained" onPress={() => setViewModalVisible(false)}>
              Close
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
    marginBottom: 20,
    paddingTop:30
  },
  row: {
    cursor: 'pointer',
  },
  searchInput: {
    marginBottom: 10,
  },
  searchButton: {
    marginBottom: 20,
    marginTop:20
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
    maxHeight: '90%', // Allow the modal to take up more vertical space
    width: '90%', // Set the width of the modal
    alignSelf: 'center', // Center the modal horizontally
  },
  
  scrollView: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    marginBottom: 10,
    width: '100%',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  phoneContainer: {
    flexDirection: 'row', // Aligns the icon and text horizontally
    alignItems: 'center', // Centers the icon vertically with the text
    margin: 10,
  },
  phoneLink: {
    fontWeight: 'bold', // Makes the text bolder
    color: '#3b82f6', // Matches the color of the icon
    marginLeft: 5, // Adds some space between the icon and the text
  },
  closingBalance:{
    color:'red'
  },
  saveCancel:{
    margin:20
  }
  ,
  rotatedIcon: {
    transform: [{ rotate: '90 deg' }],
  }

});

export default Customers;
