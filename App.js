import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ToastProvider } from './src/components/Toast';
import { Zap } from 'lucide-react-native';

import IssuesScreen from './src/screens/IssuesScreen';
import BoardScreen from './src/screens/BoardScreen';
import NotificationsScreen from './src/screens/NotificationsScreen';
import JetDevScreen from './src/screens/JetDevScreen';
import IssueDetailScreen from './src/screens/IssueDetailScreen';
import ActivityScreen from './src/screens/ActivityScreen';
import KnowledgeBaseScreen from './src/screens/KnowledgeBaseScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function IssuesStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="IssuesList" component={IssuesScreen} />
      <Stack.Screen name="IssueDetail" component={IssueDetailScreen} />
      <Stack.Screen name="Activity" component={ActivityScreen} />
      <Stack.Screen name="KnowledgeBase" component={KnowledgeBaseScreen} />
    </Stack.Navigator>
  );
}

const tabIcons = {
  Issues: { active: 'checkmark-circle', inactive: 'checkmark-circle-outline' },
  Board: { active: 'grid', inactive: 'grid-outline' },
  Notifications: { active: 'notifications', inactive: 'notifications-outline' },
  JetDev: { active: 'flash', inactive: 'flash-outline' },
};

function MainTabs() {
  const insets = useSafeAreaInsets();
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, size }) => {
          const icons = tabIcons[route.name];
          const iconName = focused ? icons.active : icons.inactive;
          const color = route.name === 'JetDev'
            ? (focused ? '#FF318C' : '#ABABAB')
            : (focused ? '#0060FF' : '#ABABAB');
          
          if (route.name === 'JetDev') {
             return <Zap size={22} color={color} strokeWidth={focused ? 2.5 : 2} fill="none" />;
          }
          return <Ionicons name={iconName} size={22} color={color} />;
        },
        tabBarActiveTintColor: '#0060FF',
        tabBarInactiveTintColor: '#ABABAB',
        tabBarLabelStyle: { fontSize: 10, fontWeight: '500' },
        tabBarStyle: {
          height: 50 + insets.bottom,
          paddingTop: 8,
          paddingBottom: insets.bottom,
          borderTopWidth: 1,
          borderTopColor: '#E5E5E5',
          backgroundColor: '#FFFFFF',
        },
      })}
    >
      <Tab.Screen name="Issues" component={IssuesStack} />
      <Tab.Screen name="Board" component={BoardScreen} />
      <Tab.Screen name="Notifications" component={NotificationsScreen} />
      <Tab.Screen
        name="JetDev"
        component={JetDevScreen}
        options={{
          tabBarActiveTintColor: '#FF318C',
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ToastProvider>
        <NavigationContainer>
          <StatusBar style="dark" />
          <MainTabs />
        </NavigationContainer>
      </ToastProvider>
    </SafeAreaProvider>
  );
}
