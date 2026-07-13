import { NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type HomeStackParamList = {
  Home: undefined;
  TripList: { origin?: string; destination?: string; date?: string } | undefined;
  TripDetails: { tripId: string };
};

export type BookingStackParamList = {
  Booking: { tripId: string };
  Payment: { bookingId: string };
};

export type TicketStackParamList = {
  TicketList: undefined;
  TicketDetails: { ticketId: string };
};

export type ProfileStackParamList = {
  Profile: undefined;
};

export type RootTabParamList = {
  HomeTab: NavigatorScreenParams<HomeStackParamList>;
  TicketsTab: NavigatorScreenParams<TicketStackParamList>;
  ProfileTab: NavigatorScreenParams<ProfileStackParamList>;
};
