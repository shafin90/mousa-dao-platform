import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { RouteData } from "@/api/routeApi";
import { routeService } from "../services/routeService";

interface RouteState {
  routes: RouteData[];
  loading: boolean;
  error: string | null;
}

const initialState: RouteState = { routes: [], loading: false, error: null };

export const fetchRoutes = createAsyncThunk("routes/fetchRoutes", async () => {
  return await routeService.getAll();
});

export const createRoute = createAsyncThunk("routes/create", async (payload: Partial<RouteData>) => {
  return await routeService.create(payload);
});

export const updateRoute = createAsyncThunk("routes/update", async ({ id, payload }: { id: string; payload: Partial<RouteData> }) => {
  return await routeService.update(id, payload);
});

export const deleteRoute = createAsyncThunk("routes/delete", async (id: string) => {
  await routeService.delete(id);
  return id;
});

const routeSlice = createSlice({
  name: "routes",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchRoutes.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(fetchRoutes.fulfilled, (s, a) => { s.loading = false; s.routes = a.payload; })
      .addCase(fetchRoutes.rejected, (s, a) => { s.loading = false; s.error = a.error.message || "Failed"; })
      .addCase(createRoute.fulfilled, (s, a) => { s.routes.push(a.payload); })
      .addCase(updateRoute.fulfilled, (s, a) => {
        const idx = s.routes.findIndex(r => r._id === a.payload._id);
        if (idx >= 0) s.routes[idx] = a.payload;
      })
      .addCase(deleteRoute.fulfilled, (s, a) => {
        s.routes = s.routes.filter(r => r._id !== a.payload);
      });
  },
});
export default routeSlice.reducer;
