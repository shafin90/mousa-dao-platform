import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { StationData } from "@/api/stationApi";
import { stationService } from "../services/stationService";

interface StationState {
  stations: StationData[];
  loading: boolean;
  error: string | null;
}

const initialState: StationState = { stations: [], loading: false, error: null };

export const fetchStations = createAsyncThunk("stations/fetchStations", async () => {
  return await stationService.getAll();
});

export const createStation = createAsyncThunk("stations/create", async (payload: Partial<StationData>) => {
  return await stationService.create(payload);
});

export const updateStation = createAsyncThunk("stations/update", async ({ id, payload }: { id: string; payload: Partial<StationData> }) => {
  return await stationService.update(id, payload);
});

export const deleteStation = createAsyncThunk("stations/delete", async (id: string) => {
  await stationService.delete(id);
  return id;
});

const stationSlice = createSlice({
  name: "stations",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchStations.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(fetchStations.fulfilled, (s, a) => { s.loading = false; s.stations = a.payload; })
      .addCase(fetchStations.rejected, (s, a) => { s.loading = false; s.error = a.error.message || "Failed"; })
      .addCase(createStation.fulfilled, (s, a) => { s.stations.push(a.payload); })
      .addCase(updateStation.fulfilled, (s, a) => {
        const idx = s.stations.findIndex(r => r._id === a.payload._id);
        if (idx >= 0) s.stations[idx] = a.payload;
      })
      .addCase(deleteStation.fulfilled, (s, a) => {
        s.stations = s.stations.filter(r => r._id !== a.payload);
      });
  },
});
export default stationSlice.reducer;
