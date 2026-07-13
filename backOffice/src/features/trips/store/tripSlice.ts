import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { TripData, TripFilters } from "@/api/tripApi";
import { tripService } from "../services/tripService";

interface TripState {
  items: TripData[];
  loading: boolean;
  error: string | null;
}

const initialState: TripState = { items: [], loading: false, error: null };

export const fetchTrips = createAsyncThunk(
  "trips/fetchAll",
  async (params?: TripFilters) => {
    return await tripService.getAll(params);
  }
);

export const createTrip = createAsyncThunk(
  "trips/create",
  async (payload: Partial<TripData>) => {
    return await tripService.create(payload);
  }
);

export const updateTrip = createAsyncThunk("trips/update", async ({ id, payload }: { id: string; payload: Partial<TripData> }) => {
  return await tripService.update(id, payload);
});

export const updateTripStatus = createAsyncThunk(
  "trips/updateStatus",
  async ({ id, status }: { id: string; status: string }) => {
    return await tripService.updateStatus(id, status);
  }
);

export const deleteTrip = createAsyncThunk("trips/delete", async (id: string) => {
  await tripService.delete(id);
  return id;
});

const tripSlice = createSlice({
  name: "trips",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchTrips.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchTrips.fulfilled, (state, action) => { state.loading = false; state.items = action.payload; })
      .addCase(fetchTrips.rejected, (state, action) => { state.loading = false; state.error = action.error.message || "Failed"; })
      .addCase(createTrip.fulfilled, (state, action) => { state.items.unshift(action.payload); })
      .addCase(updateTrip.fulfilled, (state, action) => {
        const idx = state.items.findIndex(t => t._id === action.payload._id);
        if (idx >= 0) state.items[idx] = action.payload;
      })
      .addCase(updateTripStatus.fulfilled, (state, action) => {
        const idx = state.items.findIndex(t => t._id === action.payload._id);
        if (idx >= 0) state.items[idx] = action.payload;
      })
      .addCase(deleteTrip.fulfilled, (state, action) => {
        state.items = state.items.filter(t => t._id !== action.payload);
      });
  },
});
export default tripSlice.reducer;
