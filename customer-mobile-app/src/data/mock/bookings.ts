import { Booking } from '../types';

// trip_1 = Cairo→Alexandria 06:00
// trip_3 = Cairo→Alexandria 07:00
// trip_5 = Cairo→Alexandria 08:00
// trip_59 = Cairo→Luxor 07:00
// trip_87 = Cairo→Sharm 07:00
// trip_95 = Cairo→Aswan 21:00
// trip_99 = Alexandria→Hurghada 22:00
// trip_104 = Cairo→Tanta 06:00
// trip_133 = Cairo→Port Said 07:00

export const mockBookings: Booking[] = [
  {
    id: 'bkg_1',
    userId: 'usr_1',
    tripId: 'trip_1',
    seats: ['A1', 'A2'],
    totalPrice: 360,
    status: 'confirmed',
    bookingDate: '2026-06-05T14:30:00Z',
    paymentId: 'pay_1',
  },
  {
    id: 'bkg_2',
    userId: 'usr_1',
    tripId: 'trip_59',
    seats: ['B3'],
    totalPrice: 350,
    status: 'confirmed',
    bookingDate: '2026-06-06T09:15:00Z',
    paymentId: 'pay_2',
  },
  {
    id: 'bkg_3',
    userId: 'usr_1',
    tripId: 'trip_87',
    seats: ['C1', 'C2', 'C3'],
    totalPrice: 840,
    status: 'cancelled',
    bookingDate: '2026-05-20T11:00:00Z',
    paymentId: 'pay_3',
  },
  {
    id: 'bkg_4',
    userId: 'usr_2',
    tripId: 'trip_3',
    seats: ['A5'],
    totalPrice: 200,
    status: 'confirmed',
    bookingDate: '2026-06-07T16:45:00Z',
    paymentId: 'pay_4',
  },
  {
    id: 'bkg_5',
    userId: 'usr_2',
    tripId: 'trip_5',
    seats: ['D2', 'D3'],
    totalPrice: 370,
    status: 'completed',
    bookingDate: '2026-06-01T08:00:00Z',
    paymentId: 'pay_5',
  },
  {
    id: 'bkg_6',
    userId: 'usr_1',
    tripId: 'trip_95',
    seats: ['A10'],
    totalPrice: 380,
    status: 'completed',
    bookingDate: '2026-05-28T13:20:00Z',
    paymentId: 'pay_6',
  },
  {
    id: 'bkg_7',
    userId: 'usr_2',
    tripId: 'trip_30',
    seats: ['B1'],
    totalPrice: 190,
    status: 'pending',
    bookingDate: '2026-06-08T10:00:00Z',
  },
  {
    id: 'bkg_8',
    userId: 'usr_1',
    tripId: 'trip_99',
    seats: ['C5', 'C6'],
    totalPrice: 840,
    status: 'confirmed',
    bookingDate: '2026-06-08T12:00:00Z',
    paymentId: 'pay_7',
  },
  {
    id: 'bkg_9',
    userId: 'usr_2',
    tripId: 'trip_45',
    seats: ['A3'],
    totalPrice: 195,
    status: 'cancelled',
    bookingDate: '2026-06-02T15:30:00Z',
    paymentId: 'pay_8',
  },
  {
    id: 'bkg_10',
    userId: 'usr_1',
    tripId: 'trip_1',
    seats: ['A7'],
    totalPrice: 180,
    status: 'completed',
    bookingDate: '2026-05-15T09:00:00Z',
    paymentId: 'pay_9',
  },
];
