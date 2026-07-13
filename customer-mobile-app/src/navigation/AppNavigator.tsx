import React, { memo, useMemo } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '../hooks/useAuth';
import { useColors } from '../hooks/useColors';
import { FONT_SIZE } from '../utils/constants';

import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import HomeScreen from '../screens/home/HomeScreen';
import TripListScreen from '../screens/trips/TripListScreen';
import TripDetailsScreen from '../screens/trips/TripDetailsScreen';
import BookingScreen from '../screens/booking/BookingScreen';
import PaymentScreen from '../screens/booking/PaymentScreen';
import TicketListScreen from '../screens/tickets/TicketListScreen';
import TicketDetailsScreen from '../screens/tickets/TicketDetailsScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import BookingsScreen from '../screens/profile/BookingsScreen';
import PaymentHistoryScreen from '../screens/profile/PaymentHistoryScreen';
import InfoScreen from '../screens/profile/InfoScreen';

type RootStackParamList = {
  Auth: undefined;
  MainTabs: undefined;
  Booking: { tripId: string };
  Payment: { bookingId: string };
  TicketDetails: { ticketId: string };
};

type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

type HomeStackParamList = {
  Home: undefined;
  TripList: { origin?: string; destination?: string; date?: string } | undefined;
  TripDetails: { tripId: string };
};

type TicketStackParamList = {
  TicketList: undefined;
  TicketDetails: { ticketId: string };
};

type ProfileStackParamList = {
  ProfileMain: undefined;
  Bookings: undefined;
  PaymentHistory: undefined;
  Info: { title: string; content: string };
};

type MainTabParamList = {
  HomeTab: undefined;
  TicketsTab: undefined;
  ProfileTab: undefined;
};

const RootStack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const TicketStack = createNativeStackNavigator<TicketStackParamList>();
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const COLORS = useColors();
  return (
    <Ionicons
      name={focused ? name : (`${name}-outline` as any)}
      size={24}
      color={focused ? COLORS.primary : COLORS.textSecondary}
    />
  );
}

const MemoizedTabIcon = memo(TabIcon);

function HomeStackScreen() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="Home" component={HomeScreen} />
      <HomeStack.Screen name="TripList" component={TripListScreen} />
      <HomeStack.Screen name="TripDetails" component={TripDetailsScreen} />
    </HomeStack.Navigator>
  );
}

function TicketStackScreen() {
  return (
    <TicketStack.Navigator screenOptions={{ headerShown: false }}>
      <TicketStack.Screen name="TicketList" component={TicketListScreen} />
      <TicketStack.Screen name="TicketDetails" component={TicketDetailsScreen} />
    </TicketStack.Navigator>
  );
}

function ProfileStackScreen() {
  return (
    <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStack.Screen name="ProfileMain" component={ProfileScreen} />
      <ProfileStack.Screen name="Bookings" component={BookingsScreen} />
      <ProfileStack.Screen name="PaymentHistory" component={PaymentHistoryScreen} />
      <ProfileStack.Screen name="Info" component={InfoScreen} />
    </ProfileStack.Navigator>
  );
}

function MainTabs() {
  const insets = useSafeAreaInsets();
  const COLORS = useColors();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarStyle: [styles.tabBar, { paddingBottom: insets.bottom + insets.bottom + 10}],
        tabBarLabelStyle: styles.tabBarLabel,
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeStackScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ focused }) => <MemoizedTabIcon name="home" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="TicketsTab"
        component={TicketStackScreen}
        options={{
          tabBarLabel: 'Tickets',
          tabBarIcon: ({ focused }) => <MemoizedTabIcon name="ticket" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStackScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ focused }) => <MemoizedTabIcon name="person" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}

function AuthScreens() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
    </AuthStack.Navigator>
  );
}

function AppNavigator() {
  const { isAuthenticated } = useAuth();

  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <>
            <RootStack.Screen name="MainTabs" component={MainTabs} />
            <RootStack.Screen
              name="Booking"
              component={BookingScreen}
              options={{ presentation: 'modal' }}
            />
            <RootStack.Screen
              name="Payment"
              component={PaymentScreen}
              options={{ presentation: 'modal' }}
            />
          </>
        ) : (
          <RootStack.Screen name="Auth" component={AuthScreens} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}

function createStyles(COLORS: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    tabBar: {
      backgroundColor: COLORS.white,
      borderTopColor: COLORS.cardBorder,
      borderTopWidth: 1,
      height: 60,
      paddingBottom: 8,
      paddingTop: 4,
    },
    tabBarLabel: {
      fontSize: FONT_SIZE.caption,
      fontWeight: '600',
    },
  });
}

export default memo(AppNavigator);
