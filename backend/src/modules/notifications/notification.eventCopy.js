const EVENT_COPY = {
  PAYMENT_SUCCESS: {
    type: 'payment', title: 'Paiement réussi',
    message: 'Votre paiement a été accepté.',
  },
  BOOKING_COMPLETED: {
    type: 'booking', title: 'Réservation complétée',
    message: 'Votre réservation est complétée.',
  },
  TICKET_GENERATED: {
    type: 'booking', title: 'Billet disponible',
    message: 'Votre billet est prêt.',
  },
  BOOKING_CANCELLED: {
    type: 'booking', title: 'Réservation annulée',
    message: 'Votre réservation a été annulée.',
  },
  PAYMENT_FAILED: {
    type: 'payment', title: 'Échec du paiement',
    message: "Le paiement n'a pas abouti. Votre réservation a été annulée.",
  },
  TRIP_REMINDER: {
    type: 'trip', title: 'Rappel de trajet',
    message: "Votre trajet approche. Pensez à vous présenter à l'heure.",
  },
  TRIP_UPDATED: {
    type: 'trip_update', title: 'Trajet mis à jour',
    message: 'Un trajet a été mis à jour.',
  },
  BUS_UPDATED: {
    type: 'fleet_update', title: 'Flotte mise à jour',
    message: 'Un bus a été mis à jour.',
  },
  STATION_UPDATED: {
    type: 'station_update', title: 'Gare mise à jour',
    message: 'Une gare a été mise à jour.',
  },
  CITY_UPDATED: {
    type: 'station_update', title: 'Ville mise à jour',
    message: 'Une ville a été mise à jour.',
  },
};

const resolveEventContent = (event) => {
  const { eventType, title, message, type } = event;
  const defaults = EVENT_COPY[eventType] || {
    type: 'system',
    title: eventType.replace(/_/g, ' '),
    message: `${eventType} event received`,
  };
  return {
    type: type || defaults.type,
    title: title || defaults.title,
    message: message || defaults.message,
  };
};

module.exports = { EVENT_COPY, resolveEventContent };
