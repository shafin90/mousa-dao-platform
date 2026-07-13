import { Bus } from '../types';

export const mockBuses: Bus[] = [
  {
    id: 'bus_1',
    name: 'Delta Express',
    plateNumber: 'ABC 1234',
    capacity: 49,
    amenities: ['AC', 'WiFi', 'USB Charger', 'Reclining Seats'],
    busType: 'luxury',
  },
  {
    id: 'bus_2',
    name: 'Nile Star',
    plateNumber: 'DEF 5678',
    capacity: 45,
    amenities: ['AC', 'WiFi', 'Entertainment Screen'],
    busType: 'luxury',
  },
  {
    id: 'bus_3',
    name: 'Cairo Line',
    plateNumber: 'GHI 9012',
    capacity: 40,
    amenities: ['AC', 'USB Charger'],
    busType: 'standard',
  },
  {
    id: 'bus_4',
    name: 'Alexandria Express',
    plateNumber: 'JKL 3456',
    capacity: 35,
    amenities: ['AC', 'WiFi', 'Snacks'],
    busType: 'sleeper',
  },
  {
    id: 'bus_5',
    name: 'Sinai Bus',
    plateNumber: 'MNO 7890',
    capacity: 49,
    amenities: ['AC', 'WiFi', 'USB Charger', 'Toilet'],
    busType: 'standard',
  },
];
