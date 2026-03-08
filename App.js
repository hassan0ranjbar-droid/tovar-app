import 'react-native-gesture-handler';
import React from 'react';
import { View, ActivityIndicator, Text, TouchableOpacity } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { AuthProvider, useAuth } from './src/context/AuthContext';
import { WSProvider } from './src/context/WebSocketContext';

import LoginScreen from './src/screens/LoginScreen';
import ChatsScreen from './src/screens/ChatsScreen';
import ChatScreen from './src/screens/ChatScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import AdminScreen from './src/screens/AdminScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const HEADER = {
  headerStyle: { backgroundColor: '#128C7E' },
  headerTintColor: '#fff',
  headerTitleStyle: { fontWeight: '700', fontSize: 17 },
  headerTitleAlign: 'center',
  headerBackTitle: 'برگشت',
};

function ChatsStack() {
  return (
    <Stack.Navigator screenOptions={HEADER}>
      <Stack.Screen name="ChatsHome" component={ChatsScreen} options={{ title: 'توار 💬' }} />
      <Stack.Screen name="Chat" component={ChatScreen} options={({ route }) => ({ title: route.params?.name || 'چت' })} />
    </Stack.Navigator>
  );
}

function AdminStack() {
  return (
    <Stack.Navigator screenOptions={HEADER}>
      <Stack.Screen name="AdminHome" component={AdminScreen} options={{ title: '⚙️ مدیریت' }} />
    </Stack.Navigator>
  );
}

function MainTabs() {
  const { user } = useAuth();
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#25D366',
        tabBarInactiveTintColor: '#888',
        tabBarStyle: { backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#E9EDEF', height: 60, paddingBottom: 8 },
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="ChatsTab"
        component={ChatsStack}
        options={{ title: 'پیام‌ها', tabBarIcon: ({ color }) => <Text style={{ fontSize: 22 }}>💬</Text> }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          title: 'پروفایل',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 22 }}>👤</Text>,
          headerShown: true,
          ...HEADER,
          headerTitle: 'پروفایل',
        }}
      />
      {user?.role === 'admin' && (
        <Tab.Screen
          name="AdminTab"
          component={AdminStack}
          options={{ title: 'مدیریت', tabBarIcon: () => <Text style={{ fontSize: 22 }}>⚙️</Text> }}
        />
      )}
    </Tab.Navigator>
  );
}

function RootNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#128C7E', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color="#fff" size="large" />
        <Text style={{ color: '#fff', marginTop: 16, fontSize: 18, fontWeight: '700' }}>توار</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar style="light" backgroundColor="#128C7E" />
      {user ? (
        <WSProvider user={user}>
          <MainTabs />
        </WSProvider>
      ) : (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login" component={LoginScreen} />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
