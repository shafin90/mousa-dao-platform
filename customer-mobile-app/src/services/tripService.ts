import { tripApi } from './api/tripApi';
import { TripSearchParams, Trip, Seat } from '../data/types';
import { useTripStore } from '../store/tripStore';

export const tripService = {
  async getTrips(params?: TripSearchParams): Promise<Trip[]> {
    const trips = await tripApi.getAll(params);
    useTripStore.getState().setTrips(trips);
    return trips;
  },

  async getTripById(id: string): Promise<Trip | undefined> {
    const trip = await tripApi.getById(id);
    useTripStore.getState().setSelectedTrip(trip);
    return trip;
  },

  async getPopularTrips(): Promise<Trip[]> {
    const trips = await tripApi.getAll();
    const popular = trips
      .filter(t => t.availableSeats < 15)
      .slice(0, 5);
    useTripStore.getState().setPopularTrips(popular);
    return popular;
  },

  async getSeatsForTrip(tripId: string): Promise<Seat[]> {
    const trip = await tripApi.getById(tripId);
    const totalSeats = trip.seatsTotal || 40;
    const bookedCount = trip.seatsBooked || 0;
    const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
    const seats: Seat[] = [];
    let seatIndex = 0;
    for (const row of rows) {
      for (let n = 1; n <= 4; n++) {
        const seatNum = `${row}${n}`;
        seatIndex++;
        seats.push({
          id: seatNum,
          number: seatNum,
          isBooked: seatIndex <= bookedCount,
          isSelected: false,
        });
        if (seatIndex >= totalSeats) break;
      }
      if (seatIndex >= totalSeats) break;
    }
    return seats;
  },
};
