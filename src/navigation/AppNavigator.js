// src/navigation/AppNavigator.js
import React, { useState, useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../Database/firebaseConfig';
import { Ionicons } from '@expo/vector-icons';

// Importar pantallas
import OnboardingScreen from '../screens/OnboardingScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import JobDetailScreen from '../screens/JobDetailScreen';
import PublishJobScreen from '../screens/PublishJobScreen';
import ProfileScreen from '../screens/ProfileScreen';
import MyPostsScreen from '../screens/MyPostsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import ConversationsScreen from '../screens/ConversationsScreen';
import ChatScreen from '../screens/ChatScreen';
import RateWorkerScreen from '../screens/RateWorkerScreen';
import StatisticsScreen from '../screens/StatisticsScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function HomeTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Inicio') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Buscar') {
            iconName = focused ? 'search' : 'search-outline';
          } else if (route.name === 'Publicar') {
            iconName = focused ? 'add-circle' : 'add-circle-outline';
          } else if (route.name === 'Mensajes') {
            iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
          } else if (route.name === 'Perfil') {
            iconName = focused ? 'person' : 'person-outline';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#0066CC',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen name="Inicio" component={HomeScreen} />
      <Tab.Screen name="Buscar" component={HomeScreen} />
      <Tab.Screen name="Publicar" component={PublishJobScreen} />
      <Tab.Screen name="Mensajes" component={ConversationsScreen} />
      <Tab.Screen name="Perfil" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  if (loading) {
    return null; // Puedes agregar un splash screen aquí
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!user ? (
        <>
          {showOnboarding && (
            <Stack.Screen name="Onboarding">
              {props => <OnboardingScreen {...props} onFinish={() => setShowOnboarding(false)} />}
            </Stack.Screen>
          )}
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="HomeTabs" component={HomeTabs} />
          <Stack.Screen name="JobDetail" component={JobDetailScreen} />
          <Stack.Screen name="Chat" component={ChatScreen} />
          <Stack.Screen name="RateWorker" component={RateWorkerScreen} />
          <Stack.Screen name="MyPosts" component={MyPostsScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
          <Stack.Screen name="Statistics" component={StatisticsScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}