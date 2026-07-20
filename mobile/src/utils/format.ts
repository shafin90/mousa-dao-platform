export const formatCurrency = (amount: number, currency = 'XOF'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatDate = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const formatTime = (time: string): string => {
  const [h, m] = time.split(':');
  return `${h}:${m}`;
};

export const formatDateTime = (date: string, time: string): string => {
  return `${formatDate(date)} at ${formatTime(time)}`;
};

export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'confirmed':
    case 'paid':
    case 'valid':
    case 'success':
    case 'active':
    case 'scheduled':
      return '#28a745';
    case 'pending':
    case 'processing':
      return '#ffc107';
    case 'cancelled':
    case 'failed':
    case 'expired':
    case 'refunded':
      return '#dc3545';
    case 'used':
      return '#17a2b8';
    default:
      return '#6c757d';
  }
};

export const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    pending: 'Pending',
    confirmed: 'Confirmed',
    cancelled: 'Cancelled',
    paid: 'Paid',
    unpaid: 'Unpaid',
    refunded: 'Refunded',
    valid: 'Valid',
    used: 'Used',
    expired: 'Expired',
    scheduled: 'Scheduled',
    active: 'Active',
    completed: 'Completed',
    processing: 'Processing',
    success: 'Success',
    failed: 'Failed',
  };
  return labels[status] || status;
};

export const getAvailableSeats = (total: number, booked: number): number => {
  return total - booked;
};
