import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { BookingData, BookingFilters } from "@/api/bookingApi";
import { bookingService } from "../services/bookingService";

interface BookingState {
  items: BookingData[];
  total: number;
  loading: boolean;
  error: string | null;
}

const initialState: BookingState = {
  items: [],
  total: 0,
  loading: false,
  error: null,
};

export const fetchBookings = createAsyncThunk(
  "bookings/fetchAll",
  async (params?: BookingFilters) => {
    return await bookingService.getAll(params);
  }
);

const bookingSlice = createSlice({
  name: "bookings",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchBookings.pending, (state) => { state.loading = true; })
      .addCase(fetchBookings.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.bookings;
        state.total = action.payload.total;
      })
      .addCase(fetchBookings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch bookings";
      });
  },
});

export default bookingSlice.reducer;
