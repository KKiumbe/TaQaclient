import { router, Tabs, usePathname } from 'expo-router'; // Import usePathname
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { TabBarIcon } from '@/components/navigation/TabBarIcon';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Provider as PaperProvider } from 'react-native-paper';
import useAuthStore from '../../store/authStore';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const currentUser = useAuthStore((state) => state.currentUser);
  const isLoading = useAuthStore((state) => state.isLoading);
  const [isInitialized, setIsInitialized] = useState(false);
  const [lastRoute, setLastRoute] = useState(null); // Store the last route
  const pathname = usePathname(); // Get the current route pathname


  useEffect(() => {
    const loadUser = async () => {
      await useAuthStore.getState().loadUser();
      setIsInitialized(true);
    };
    loadUser();
  }, []);

  useEffect(() => {
    // Set the current route
    setLastRoute(pathname);

    // Navigate to the login screen if the user is not logged in
    if (isInitialized && !isLoading && !currentUser) {
      router.replace('/login', { from: lastRoute }); // Pass lastRoute as a parameter
    }
  }, [currentUser, isLoading, isInitialized, pathname]);

  // Show loading spinner while checking the user state
  if (isLoading || !isInitialized) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors[colorScheme ?? 'light'].tint} />
      </View>
    );
  }

  return (
    <PaperProvider>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
          headerShown: false,
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, focused }) => (
              <TabBarIcon name={focused ? 'home' : 'home-outline'} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="collection"
          options={{title: 'Collection',
          tabBarIcon: ({ color, focused }) => (
          <Ionicons name={focused ? 'trash' : 'trash-outline'} color={color} size={24} />
         ),
         }}
        />


<Tabs.Screen
  name="customers"
  options={{
    title: 'Customers',
    tabBarIcon: ({ color, focused }) => (
      <Ionicons name={focused ? 'people' : 'people-outline'} color={color} size={24} />
    ),
  }}
/>
<Tabs.Screen
  name="invoices"
  options={{
    title: 'Invoices',
    tabBarIcon: ({ color, focused }) => (
      <Ionicons name={focused ? 'document-text' : 'document-text-outline'} color={color} size={24} />
    ),
  }}
/>
<Tabs.Screen
  name="payments"
  options={{
    title: 'Payments',
    tabBarIcon: ({ color, focused }) => (
      <Ionicons name={focused ? 'card' : 'card-outline'} color={color} size={24} />
    ),
  }}
/>

<Tabs.Screen
  name="receipting"
  options={{
    title: 'Receipts',
    tabBarIcon: ({ color, focused }) => (
      <Ionicons name={focused ? 'receipt' : 'receipt-outline'} color={color} size={24} />
    ),
  }}
/>






        
      </Tabs>
    </PaperProvider>
  );
}

// Styles for the loading spinner
const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
