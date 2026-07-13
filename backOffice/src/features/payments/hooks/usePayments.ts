import { useCallback } from "react";
import { useAppDispatch, useAppSelector } from "@/app/store";
import {
  fetchPayments as fetchPaymentsAction,
  fetchRefunds as fetchRefundsAction,
  approveRefund as approveRefundAction,
  rejectRefund as rejectRefundAction,
} from "../store/paymentSlice";

export const usePayments = () => {
  const dispatch = useAppDispatch();
  const { payments, paymentsTotal, paymentsLoading, refunds, refundsLoading, error } = useAppSelector((state) => state.payments);

  const fetchPayments = useCallback(
    (params?: { page?: number; limit?: number; status?: string }) => dispatch(fetchPaymentsAction(params)),
    [dispatch]
  );

  const fetchRefunds = useCallback(
    (params?: { page?: number; limit?: number }) => dispatch(fetchRefundsAction(params)),
    [dispatch]
  );

  const approveRefund = useCallback(
    (id: string, adminNote?: string) => dispatch(approveRefundAction({ id, adminNote })),
    [dispatch]
  );

  const rejectRefund = useCallback(
    (id: string, adminNote?: string) => dispatch(rejectRefundAction({ id, adminNote })),
    [dispatch]
  );

  return {
    payments,
    paymentsTotal,
    paymentsLoading,
    refunds,
    refundsLoading,
    error,
    fetchPayments,
    fetchRefunds,
    approveRefund,
    rejectRefund,
  };
};
