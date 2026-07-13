import { User } from '../types';

export const mockUsers: User[] = [
  {
    id: 'usr_1',
    email: 'ahmed@example.com',
    name: 'Ahmed Hassan',
    phone: '+201001234567',
    createdAt: '2026-01-15T08:00:00Z',
  },
  {
    id: 'usr_2',
    email: 'mariam@example.com',
    name: 'Mariam Ali',
    phone: '+201009876543',
    createdAt: '2026-02-20T10:30:00Z',
  },
];

export const mockCurrentUser: User = mockUsers[0];
