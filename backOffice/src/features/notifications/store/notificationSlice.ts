import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { NotificationData } from "@/api/notificationApi";
import { notificationService } from "../services/notificationService";

interface NotificationState {
  items: NotificationData[];
  loading: boolean;
  error: string | null;
}

const initialState: NotificationState = { items: [], loading: false, error: null };

export const fetchNotifications = createAsyncThunk("notifications/fetch", async () => {
  return await notificationService.getMy();
});

export const markAsRead = createAsyncThunk("notifications/markRead", async (id: string) => {
  return await notificationService.markAsRead(id);
});

export const markAllAsRead = createAsyncThunk("notifications/markAllRead", async () => {
  await notificationService.markAllAsRead();
});

const notificationSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(fetchNotifications.fulfilled, (s, a) => { s.loading = false; s.items = a.payload; })
      .addCase(fetchNotifications.rejected, (s, a) => { s.loading = false; s.error = a.error.message || "Failed"; })
      .addCase(markAsRead.fulfilled, (s, a) => {
        const idx = s.items.findIndex(n => n._id === a.payload._id);
        if (idx >= 0) s.items[idx] = a.payload;
      })
      .addCase(markAllAsRead.fulfilled, (s) => { s.items.forEach(n => { n.isRead = true; }); });
  },
});
export default notificationSlice.reducer;
