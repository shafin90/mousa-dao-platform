import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { BusData } from "@/api/busApi";
import { fleetService } from "../services/fleetService";

interface FleetState {
  items: BusData[];
  total: number;
  loading: boolean;
  error: string | null;
}

const initialState: FleetState = { items: [], total: 0, loading: false, error: null };

export const fetchFleet = createAsyncThunk(
  "fleet/fetchAll",
  async (params?: { status?: string; type?: string; page?: number; limit?: number }) => {
    return await fleetService.getAll(params);
  }
);

export const createBus = createAsyncThunk("fleet/create", async (payload: Partial<BusData>) => {
  return await fleetService.create(payload);
});

export const updateBus = createAsyncThunk("fleet/update", async ({ id, payload }: { id: string; payload: Partial<BusData> }) => {
  return await fleetService.update(id, payload);
});

export const updateBusStatus = createAsyncThunk("fleet/updateStatus", async ({ id, status }: { id: string; status: string }) => {
  return await fleetService.updateStatus(id, status);
});

export const deleteBus = createAsyncThunk("fleet/delete", async (id: string) => {
  await fleetService.delete(id);
  return id;
});

const fleetSlice = createSlice({
  name: "fleet",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchFleet.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(fetchFleet.fulfilled, (s, a) => { s.loading = false; s.items = a.payload.buses || []; s.total = a.payload.total || 0; })
      .addCase(fetchFleet.rejected, (s, a) => { s.loading = false; s.error = a.error.message || "Failed"; })
      .addCase(createBus.fulfilled, (s, a) => { s.items.unshift(a.payload); })
      .addCase(updateBus.fulfilled, (s, a) => {
        const idx = s.items.findIndex(b => b._id === a.payload._id);
        if (idx >= 0) s.items[idx] = a.payload;
      })
      .addCase(updateBusStatus.fulfilled, (s, a) => {
        const idx = s.items.findIndex(b => b._id === a.payload._id);
        if (idx >= 0) s.items[idx] = a.payload;
      })
      .addCase(deleteBus.fulfilled, (s, a) => {
        s.items = s.items.filter(b => b._id !== a.payload);
      });
  },
});
export default fleetSlice.reducer;
