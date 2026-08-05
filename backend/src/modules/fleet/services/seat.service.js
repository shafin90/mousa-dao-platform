const getSeatLayout = (bus, bookedSeats = [], blockedSeats = []) => {
  const rows = bus.seatRows || Math.ceil(bus.capacity / (bus.seatsPerRow || 4));
  const left = bus.leftSeats || 2;
  const right = bus.rightSeats || 2;
  const seatsPerRow = left + right;

  const layout = [];
  for (let row = 1; row <= rows; row++) {
    const rowSeats = [];
    for (let col = 1; col <= seatsPerRow; col++) {
      const seatLabel = String.fromCharCode(64 + col) + row;
      const isBooked = bookedSeats.includes(seatLabel);
      const isBlocked = blockedSeats.includes(seatLabel);
      rowSeats.push({
        label: seatLabel,
        side: col <= left ? 'left' : 'right',
        row,
        col,
        isBooked,
        isBlocked,
        isAvailable: !isBooked && !isBlocked,
      });
    }
    layout.push(rowSeats);
  }
  return layout;
};

module.exports = { getSeatLayout };
