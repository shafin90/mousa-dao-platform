const getCancellationPolicy = () => ({
  policies: [
    { beforeHours: 48, refundPercent: 100, description: 'Full refund up to 48 hours before departure' },
    { beforeHours: 24, refundPercent: 75, description: '75% refund between 24-48 hours before departure' },
    { beforeHours: 2, refundPercent: 50, description: '50% refund between 2-24 hours before departure' },
    { beforeHours: 0, refundPercent: 0, description: 'No refund within 2 hours of departure' },
  ],
});

const calculateRefundableAmount = (booking, tripDate, departureTime) => {
  const [hours, minutes] = (departureTime || '00:00').split(':').map(Number);
  const departure = new Date(tripDate);
  departure.setHours(hours, minutes, 0, 0);
  const hoursUntil = (departure - new Date()) / (1000 * 60 * 60);

  let refundPercent = 0;
  if (hoursUntil >= 48) refundPercent = 100;
  else if (hoursUntil >= 24) refundPercent = 75;
  else if (hoursUntil >= 2) refundPercent = 50;

  return {
    totalPaid: booking.totalAmount,
    refundPercent,
    refundAmount: Math.round(booking.totalAmount * refundPercent / 100),
    cancellationFee: booking.totalAmount - Math.round(booking.totalAmount * refundPercent / 100),
    hoursUntilDeparture: Math.round(hoursUntil * 10) / 10,
  };
};

module.exports = { getCancellationPolicy, calculateRefundableAmount };
