import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { ConfigData } from "@/api/configApi";
import { configService } from "../services/configService";

interface ConfigState {
  config: ConfigData | null;
  loading: boolean;
  error: string | null;
}

const initialState: ConfigState = { config: null, loading: false, error: null };

export const fetchConfig = createAsyncThunk("config/fetch", async () => {
  return await configService.get();
});

export const updateConfig = createAsyncThunk("config/update", async (payload: Partial<ConfigData>) => {
  return await configService.update(payload);
});

export const resetConfig = createAsyncThunk("config/reset", async () => {
  return await configService.reset();
});

const configSlice = createSlice({
  name: "config",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchConfig.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(fetchConfig.fulfilled, (s, a) => { s.loading = false; s.config = a.payload; })
      .addCase(fetchConfig.rejected, (s, a) => { s.loading = false; s.error = a.error.message || "Failed"; })
      .addCase(updateConfig.fulfilled, (s, a) => { s.config = a.payload; })
      .addCase(resetConfig.fulfilled, (s, a) => { s.config = a.payload; });
  },
});
export default configSlice.reducer;
