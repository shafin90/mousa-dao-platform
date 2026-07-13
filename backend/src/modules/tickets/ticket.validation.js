const Joi = require('joi');

const verifyTicketSchema = Joi.object({
  ticketId: Joi.string(),
  qrData: Joi.string()
}).xor('ticketId', 'qrData');

module.exports = { verifyTicketSchema };
