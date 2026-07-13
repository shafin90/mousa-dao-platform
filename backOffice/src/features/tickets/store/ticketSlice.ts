import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { TicketData } from "@/api/ticketApi";
import { ticketService } from "../services/ticketService";

interface TicketState {
  tickets: TicketData[];
  total: number;
  loading: boolean;
  error: string | null;
}

const initialState: TicketState = {
  tickets: [],
  total: 0,
  loading: false,
  error: null,
};

export const fetchTickets = createAsyncThunk(
  "tickets/fetchTickets",
  async (params?: { page?: number; limit?: number; status?: string; search?: string }) => {
    return await ticketService.getAll(params);
  }
);

const ticketSlice = createSlice({
  name: "tickets",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchTickets.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(fetchTickets.fulfilled, (s, a) => {
        s.loading = false;
        s.tickets = a.payload.tickets || [];
        s.total = a.payload.total || 0;
      })
      .addCase(fetchTickets.rejected, (s, a) => { s.loading = false; s.error = a.error.message || "Failed"; });
  },
});
export default ticketSlice.reducer;
