const getSeatLayout = (bus, bookedSeats = []) => {
  const rows = bus.seatRows || Math.ceil(bus.capacity / (bus.seatsPerRow || 4));
  const left = bus.leftSeats || 2;
  const right = bus.rightSeats || 2;
  const seatsPerRow = left + right;

  const layout = [];
  for (let row = 1; row <= rows; row++) {
    const rowSeats = [];
    for (let col = 1; col <= seatsPerRow; col++) {
      const seatLabel = String.fromCharCode(64 + col) + row;
      rowSeats.push({
        label: seatLabel,
        side: col <= left ? 'left' : 'right',
        row,
        col,
        isBooked: bookedSeats.includes(seatLabel),
        isAvailable: !bookedSeats.includes(seatLabel),
      });
    }
    layout.push(rowSeats);
  }
  return layout;
};

module.exports = { getSeatLayout };
