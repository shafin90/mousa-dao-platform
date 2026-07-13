import { bookingApi } from "@/api/bookingApi";
import type { BookingData, BookingFilters } from "@/api/bookingApi";

export const bookingService = {
  getAll: async (params?: BookingFilters) => {
    const result = await bookingApi.getAll(params);
    return result;
  },
  getById: async (id: string): Promise<BookingData> => {
    return bookingApi.getById(id);
  },
  cancel: async (id: string): Promise<BookingData> => {
    return bookingApi.cancel(id);
  },
};
