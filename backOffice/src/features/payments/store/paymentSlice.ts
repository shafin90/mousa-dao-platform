import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { PaymentData, RefundRequestData } from "@/api/paymentApi";
import { paymentService } from "../services/paymentService";

interface PaymentState {
  payments: PaymentData[];
  paymentsTotal: number;
  paymentsLoading: boolean;
  refunds: RefundRequestData[];
  refundsLoading: boolean;
  error: string | null;
}

const initialState: PaymentState = {
  payments: [],
  paymentsTotal: 0,
  paymentsLoading: false,
  refunds: [],
  refundsLoading: false,
  error: null,
};

export const fetchPayments = createAsyncThunk(
  "payments/fetchPayments",
  async (params?: { page?: number; limit?: number; status?: string }) => {
    return await paymentService.getPayments(params);
  }
);

export const fetchRefunds = createAsyncThunk(
  "payments/fetchRefunds",
  async (params?: { page?: number; limit?: number }) => {
    return await paymentService.getRefunds(params);
  }
);

export const approveRefund = createAsyncThunk(
  "payments/approveRefund",
  async ({ id, adminNote }: { id: string; adminNote?: string }) => {
    return await paymentService.approveRefund(id, adminNote);
  }
);

export const rejectRefund = createAsyncThunk(
  "payments/rejectRefund",
  async ({ id, adminNote }: { id: string; adminNote?: string }) => {
    return await paymentService.rejectRefund(id, adminNote);
  }
);

const paymentSlice = createSlice({
  name: "payments",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchPayments.pending, (s) => { s.paymentsLoading = true; s.error = null; })
      .addCase(fetchPayments.fulfilled, (s, a) => {
        s.paymentsLoading = false;
        s.payments = a.payload.payments || [];
        s.paymentsTotal = a.payload.total || 0;
      })
      .addCase(fetchPayments.rejected, (s, a) => {
        s.paymentsLoading = false;
        s.error = a.error.message || "Failed to load payments";
      })
      .addCase(fetchRefunds.pending, (s) => { s.refundsLoading = true; s.error = null; })
      .addCase(fetchRefunds.fulfilled, (s, a) => {
        s.refundsLoading = false;
        s.refunds = a.payload.refunds || [];
      })
      .addCase(fetchRefunds.rejected, (s, a) => {
        s.refundsLoading = false;
        s.error = a.error.message || "Failed to load refunds";
      })
      .addCase(approveRefund.fulfilled, (s, a) => {
        const idx = s.refunds.findIndex((r) => r._id === a.payload._id);
        if (idx >= 0) s.refunds[idx] = a.payload;
      })
      .addCase(rejectRefund.fulfilled, (s, a) => {
        const idx = s.refunds.findIndex((r) => r._id === a.payload._id);
        if (idx >= 0) s.refunds[idx] = a.payload;
      });
  },
});

export default paymentSlice.reducer;
