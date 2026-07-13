import dayjs from 'dayjs';

export function formatDate(date: string): string {
  return dayjs(date).format('MMM D, YYYY');
}

export function formatTime(time: string): string {
  return dayjs(`2000-01-01 ${time}`).format('h:mm A');
}

export function formatCurrency(amount: number): string {
  return `CFA ${amount.toLocaleString()}`;
}

export function formatDateTime(date: string): string {
  return dayjs(date).format('MMM D, YYYY h:mm A');
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'active':
    case 'confirmed':
    case 'completed':
      return '#34C759';
    case 'pending':
      return '#FF9500';
    case 'cancelled':
    case 'expired':
      return '#FF3B30';
    case 'refunded':
      return '#8E8E93';
    default:
      return '#8E8E93';
  }
}

export function getStatusLabel(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ');
}

export function getTripDuration(departure: string, arrival: string): string {
  const dep = dayjs(`2000-01-01 ${departure}`);
  const arr = dayjs(`2000-01-01 ${arrival}`);
  let diffMinutes = arr.diff(dep, 'minute');
  if (diffMinutes < 0) diffMinutes += 1440;

  const hours = Math.floor(diffMinutes / 60);
  const minutes = diffMinutes % 60;
  return `${hours}h ${minutes}m`;
}

export function generateQRCode(bookingId: string, seatNumber: string): string {
  return `BUS-TKT-${bookingId}-${seatNumber}-${Date.now()}`;
}
