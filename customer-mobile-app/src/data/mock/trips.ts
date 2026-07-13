import { Trip } from '../types';

function generateTrips(): Trip[] {
  const trips: Trip[] = [];
  let id = 1;

  function pad(n: number): string {
    return n.toString().padStart(2, '0');
  }

  // Helper: generate every 30 min on a route
  function addRoute(
    origin: string,
    destination: string,
    date: string,
    startHour: number,
    endHour: number,
    durationHours: number,
    busName: string,
    busId: string,
    basePrice: number,
  ) {
    for (let h = startHour; h < endHour; h++) {
      for (let m = 0; m < 60; m += 30) {
        const depHour = h;
        const depMin = m;

        let arrHour = depHour + Math.floor(durationHours);
        let arrMin = depMin + (durationHours % 1) * 60;
        if (arrMin >= 60) {
          arrHour += 1;
          arrMin -= 60;
        }

        const depStr = `${pad(depHour)}:${pad(depMin)}`;
        const arrStr = `${pad(arrHour % 24)}:${pad(arrMin)}`;

        const seats = 49;
        const booked = Math.floor(Math.random() * (seats - 1)) + 1;
        const available = seats - booked;

        trips.push({
          id: `trip_${id++}`,
          busId,
          busName,
          origin,
          destination,
          departureTime: depStr,
          arrivalTime: arrStr,
          date,
          price: basePrice + (depHour < 12 ? 0 : depHour < 17 ? 15 : 10),
          availableSeats: Math.max(available, 0),
          totalSeats: seats,
          status: 'scheduled',
        });
      }
    }
  }

  // --- High frequency: Cairo ↔ Alexandria (3h30m), every 30 min 06:00-20:00 ---
  addRoute('Cairo', 'Alexandria', '2026-06-10', 6, 20, 3.5, 'Delta Express', 'bus_1', 180);
  addRoute('Alexandria', 'Cairo', '2026-06-10', 6, 20, 3.5, 'Nile Star', 'bus_2', 185);

  // --- Mid frequency routes ---
  addRoute('Cairo', 'Luxor', '2026-06-10', 7, 11, 8, 'Cairo Line', 'bus_3', 350);
  addRoute('Luxor', 'Cairo', '2026-06-10', 16, 20, 8, 'Cairo Line', 'bus_3', 340);

  addRoute('Cairo', 'Sharm El Sheikh', '2026-06-10', 7, 10, 6, 'Sinai Bus', 'bus_5', 280);
  addRoute('Sharm El Sheikh', 'Cairo', '2026-06-10', 14, 17, 6, 'Sinai Bus', 'bus_5', 270);

  addRoute('Cairo', 'Aswan', '2026-06-10', 21, 23, 11, 'Cairo Line', 'bus_3', 380);

  addRoute('Alexandria', 'Hurghada', '2026-06-10', 22, 23, 8.5, 'Alexandria Express', 'bus_4', 420);

  addRoute('Cairo', 'Tanta', '2026-06-11', 6, 20, 2, 'Delta Express', 'bus_1', 120);
  addRoute('Tanta', 'Alexandria', '2026-06-11', 7, 19, 2.5, 'Nile Star', 'bus_2', 110);

  addRoute('Cairo', 'Port Said', '2026-06-11', 7, 19, 3, 'Sinai Bus', 'bus_5', 150);
  addRoute('Port Said', 'Cairo', '2026-06-11', 8, 18, 3, 'Delta Express', 'bus_1', 155);

  return trips;
}

export const mockTrips: Trip[] = generateTrips();
