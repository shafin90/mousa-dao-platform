import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { AnalyticsData } from "@/api/analyticsApi";
import { analyticsService } from "../services/analyticsService";

interface AnalyticsState {
  data: AnalyticsData | null;
  loading: boolean;
  error: string | null;
}

const initialState: AnalyticsState = {
  data: null,
  loading: false,
  error: null,
};

export const fetchAllAnalytics = createAsyncThunk(
  "analytics/fetchAll",
  async () => {
    return await analyticsService.getAll();
  }
);

const analyticsSlice = createSlice({
  name: "analytics",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllAnalytics.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchAllAnalytics.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchAllAnalytics.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch analytics";
      });
  },
});

export default analyticsSlice.reducer;
