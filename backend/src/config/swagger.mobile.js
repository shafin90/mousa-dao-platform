const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Mousa DAO Transport — Customer Mobile App API',
      version: '1.0.0',
      description: 'Endpoints for the customer-facing mobile application.',
    },
    servers: [
      { url: 'http://localhost:3000/api/v1', description: 'Development server' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            email: { type: 'string' },
            phone: { type: 'string' },
            role: { type: 'string', enum: ['customer'] },
            companyId: { type: 'string' },
            profile: {
              type: 'object',
              properties: {
                firstName: { type: 'string' },
                lastName: { type: 'string' },
                avatar: { type: 'string' },
              },
            },
          },
        },
        Trip: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            date: { type: 'string', format: 'date' },
            departureTime: { type: 'string' },
            arrivalTime: { type: 'string' },
            price: { type: 'number' },
            seatsTotal: { type: 'integer' },
            seatsBooked: { type: 'integer' },
            status: { type: 'string', enum: ['scheduled', 'active', 'completed', 'cancelled'] },
            busId: {
              type: 'object',
              properties: { busNumber: { type: 'string' }, name: { type: 'string' }, capacity: { type: 'integer' }, type: { type: 'string' } },
            },
            routeId: {
              type: 'object',
              properties: {
                fromCity: { type: 'object', properties: { name: { type: 'string' } } },
                toCity: { type: 'object', properties: { name: { type: 'string' } } },
              },
            },
            fromStation: { type: 'object', properties: { name: { type: 'string' } } },
            toStation: { type: 'object', properties: { name: { type: 'string' } } },
          },
        },
        Booking: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            bookingCode: { type: 'string' },
            seats: { type: 'array', items: { type: 'string' } },
            totalAmount: { type: 'number' },
            status: { type: 'string', enum: ['pending', 'confirmed', 'cancelled'] },
            paymentStatus: { type: 'string', enum: ['unpaid', 'paid', 'refunded'] },
            tripId: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Ticket: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            ticketNumber: { type: 'string' },
            qrCode: { type: 'string', description: 'QR code as base64 data URL' },
            status: { type: 'string', enum: ['valid', 'used', 'expired'] },
            tripId: { type: 'string' },
            bookingId: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Payment: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            tx_ref: { type: 'string' },
            amount: { type: 'number' },
            currency: { type: 'string' },
            method: { type: 'string' },
            status: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Notification: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            title: { type: 'string' },
            message: { type: 'string' },
            type: { type: 'string' },
            read: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Route: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            fromCity: { type: 'object', properties: { name: { type: 'string' } } },
            toCity: { type: 'object', properties: { name: { type: 'string' } } },
            distanceKm: { type: 'number' },
            estimatedTimeMinutes: { type: 'number' },
          },
        },
        Bus: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            busNumber: { type: 'string' },
            name: { type: 'string' },
            capacity: { type: 'integer' },
            type: { type: 'string' },
            status: { type: 'string' },
          },
        },
        Station: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            name: { type: 'string' },
            cityId: { type: 'object', properties: { name: { type: 'string' } } },
            address: { type: 'string' },
          },
        },
        City: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            name: { type: 'string' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string' },
          },
        },
      },
    },
    tags: [
      { name: 'Auth', description: 'Authentication' },
      { name: 'Profile', description: 'User profile management' },
      { name: 'Trips', description: 'Browse and search trips' },
      { name: 'Routes', description: 'Browse routes' },
      { name: 'Buses', description: 'Browse buses' },
      { name: 'Stations & Cities', description: 'Browse stations and cities' },
      { name: 'Bookings', description: 'Booking management' },
      { name: 'Payments', description: 'Payment processing' },
      { name: 'Tickets', description: 'Digital tickets' },
      { name: 'Notifications', description: 'Push and in-app notifications' },
      { name: 'Devices', description: 'FCM device token registration' },
      { name: 'Passengers', description: 'Manage frequent passengers' },
      { name: 'Payment Methods', description: 'Saved payment methods' },
      { name: 'Refunds', description: 'Refund requests and tracking' },
      { name: 'Config', description: 'App configuration' },
      { name: 'Uploads', description: 'File uploads' },
    ],
    paths: {
      // ─── AUTH ────────────────────────────────────────────
      '/auth/firebase': {
        post: {
          tags: ['Auth'],
          summary: 'Sign in / sign up with Firebase phone OTP',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['idToken', 'phone'],
                  properties: {
                    idToken: { type: 'string', description: 'Firebase ID token' },
                    phone: { type: 'string', description: 'Phone number' },
                    name: { type: 'string', description: 'Full name (used on first sign-up)' },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: 'Authenticated',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      data: {
                        type: 'object',
                        properties: {
                          user: { $ref: '#/components/schemas/User' },
                          token: { type: 'string' },
                          isNewUser: { type: 'boolean', description: 'True if account was just created' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/auth/set-password': {
        post: {
          tags: ['Auth'],
          summary: 'Set password after Firebase sign-up',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['password', 'passwordConfirm'],
                  properties: {
                    password: { type: 'string', minLength: 6 },
                    passwordConfirm: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: 'Password set successfully' },
          },
        },
      },
      '/auth/login': {
        post: {
          tags: ['Auth'],
          summary: 'Login with phone + password or email + password',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['password'],
                  properties: {
                    email: { type: 'string', format: 'email' },
                    phone: { type: 'string' },
                    password: { type: 'string' },
                  },
                  description: 'Provide either email or phone (but not both)',
                },
              },
            },
          },
          responses: {
            200: {
              description: 'Login successful',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      data: {
                        type: 'object',
                        properties: {
                          user: { $ref: '#/components/schemas/User' },
                          token: { type: 'string' },
                        },
                      },
                    },
                  },
                },
              },
            },
            401: { description: 'Invalid credentials' },
          },
        },
      },
      '/auth/me': {
        get: {
          tags: ['Auth'],
          summary: 'Get current authenticated user',
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: 'User profile', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { $ref: '#/components/schemas/User' } } } } } },
          },
        },
      },

      // ─── PROFILE ─────────────────────────────────────────
      '/users/me': {
        get: {
          tags: ['Profile'],
          summary: 'Get own profile',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'Profile data' } },
        },
        patch: {
          tags: ['Profile'],
          summary: 'Update own profile',
          security: [{ bearerAuth: [] }],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    email: { type: 'string', format: 'email' },
                  },
                },
              },
            },
          },
          responses: { 200: { description: 'Profile updated' } },
        },
      },

      // ─── TRIPS ───────────────────────────────────────────
      '/trips': {
        get: {
          tags: ['Trips'],
          summary: 'Search trips',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Search by bus number/name or station name' },
            { name: 'date', in: 'query', schema: { type: 'string', format: 'date' }, description: 'Filter by date (YYYY-MM-DD)' },
            { name: 'fromStation', in: 'query', schema: { type: 'string' }, description: 'Departure station ID' },
            { name: 'toStation', in: 'query', schema: { type: 'string' }, description: 'Arrival station ID' },
            { name: 'cityId', in: 'query', schema: { type: 'string' }, description: 'Filter by city' },
            { name: 'priceMin', in: 'query', schema: { type: 'number' } },
            { name: 'priceMax', in: 'query', schema: { type: 'number' } },
            { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
          ],
          responses: {
            200: {
              description: 'Paginated trip list',
              content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { type: 'array', items: { $ref: '#/components/schemas/Trip' } }, pagination: { type: 'object', properties: { total: { type: 'integer' }, page: { type: 'integer' }, limit: { type: 'integer' }, pages: { type: 'integer' } } } } } } },
            },
          },
        },
      },
      '/trips/{id}': {
        get: {
          tags: ['Trips'],
          summary: 'Get trip details',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Trip details' } },
        },
      },

      // ─── ROUTES ──────────────────────────────────────────
      '/routes': {
        get: {
          tags: ['Routes'],
          summary: 'List routes',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'cityId', in: 'query', schema: { type: 'string' }, description: 'Filter by city' }],
          responses: { 200: { description: 'Route list', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { type: 'array', items: { $ref: '#/components/schemas/Route' } } } } } } } },
        },
      },
      '/routes/{id}': {
        get: {
          tags: ['Routes'],
          summary: 'Get route details',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Route details' } },
        },
      },

      // ─── BUSES ───────────────────────────────────────────
      '/buses': {
        get: {
          tags: ['Buses'],
          summary: 'List buses',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'Bus list', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { type: 'array', items: { $ref: '#/components/schemas/Bus' } } } } } } } },
        },
      },
      '/buses/{id}': {
        get: {
          tags: ['Buses'],
          summary: 'Get bus details',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Bus details' } },
        },
      },

      // ─── STATIONS & CITIES ───────────────────────────────
      '/stations': {
        get: {
          tags: ['Stations & Cities'],
          summary: 'List stations',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'Station list', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { type: 'array', items: { $ref: '#/components/schemas/Station' } } } } } } } },
        },
      },
      '/cities': {
        get: {
          tags: ['Stations & Cities'],
          summary: 'List cities',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'City list', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { type: 'array', items: { $ref: '#/components/schemas/City' } } } } } } } },
        },
      },

      // ─── BOOKINGS ────────────────────────────────────────
      '/bookings': {
        post: {
          tags: ['Bookings'],
          summary: 'Create a booking (async — queued)',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['tripId', 'seats'],
                  properties: {
                    tripId: { type: 'string' },
                    seats: { type: 'array', items: { type: 'string' }, description: 'Seat identifiers, e.g. ["A1", "A2"]' },
                  },
                },
              },
            },
          },
          responses: {
            202: { description: 'Booking queued — returns eventId to poll status' },
          },
        },
      },
      '/bookings/my': {
        get: {
          tags: ['Bookings'],
          summary: 'Get my bookings',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'Booking list', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { type: 'array', items: { $ref: '#/components/schemas/Booking' } } } } } } } },
        },
      },
      '/bookings/{id}': {
        get: {
          tags: ['Bookings'],
          summary: 'Get booking details',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Booking details' } },
        },
        patch: {
          tags: ['Bookings'],
          summary: 'Cancel a booking',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Booking cancelled' } },
        },
      },
      '/bookings/{id}/cancel': {
        patch: {
          tags: ['Bookings'],
          summary: 'Cancel a booking',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Booking cancelled' } },
        },
      },

      // ─── PAYMENTS ────────────────────────────────────────
      '/payments/initiate': {
        post: {
          tags: ['Payments'],
          summary: 'Initiate a payment (async — queued)',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['bookingId', 'method'],
                  properties: {
                    bookingId: { type: 'string' },
                    method: { type: 'string', enum: ['mobile_money', 'stripe', 'card'] },
                  },
                },
              },
            },
          },
          responses: {
            202: { description: 'Payment initiated — returns tx_ref for tracking' },
          },
        },
      },
      '/payments/my': {
        get: {
          tags: ['Payments'],
          summary: 'Get my payments',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'Payment list', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { type: 'array', items: { $ref: '#/components/schemas/Payment' } } } } } } } },
        },
      },

      // ─── TICKETS ─────────────────────────────────────────
      '/tickets/my': {
        get: {
          tags: ['Tickets'],
          summary: 'Get my tickets',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'Ticket list', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { type: 'array', items: { $ref: '#/components/schemas/Ticket' } } } } } } } },
        },
      },
      '/tickets/{id}': {
        get: {
          tags: ['Tickets'],
          summary: 'Get ticket details',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Ticket details' } },
        },
      },
      '/tickets/{id}/download': {
        get: {
          tags: ['Tickets'],
          summary: 'Download ticket as PDF',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            200: {
              description: 'PDF file',
              content: { 'application/pdf': { schema: { type: 'string', format: 'binary' } } },
            },
          },
        },
      },

      // ─── NOTIFICATIONS ───────────────────────────────────
      '/notifications/my': {
        get: {
          tags: ['Notifications'],
          summary: 'Get my notifications',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'Notification list', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { type: 'array', items: { $ref: '#/components/schemas/Notification' } } } } } } } },
        },
      },
      '/notifications/read-all': {
        patch: {
          tags: ['Notifications'],
          summary: 'Mark all notifications as read',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'All marked as read' } },
        },
      },
      '/notifications/{id}/read': {
        patch: {
          tags: ['Notifications'],
          summary: 'Mark a notification as read',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Notification marked as read' } },
        },
      },

      // ─── CONFIG ──────────────────────────────────────────
      '/config': {
        get: {
          tags: ['Config'],
          summary: 'Get app configuration',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'Tenant configuration' } },
        },
      },

      // ─── DEVICES ─────────────────────────────────────────
      '/devices/register': {
        post: {
          tags: ['Devices'],
          summary: 'Register FCM device token for push notifications',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['fcmToken'],
                  properties: {
                    fcmToken: { type: 'string', description: 'Firebase Cloud Messaging token from the mobile device' },
                  },
                },
              },
            },
          },
          responses: { 200: { description: 'Device registered' } },
        },
      },
      '/devices/unregister': {
        post: {
          tags: ['Devices'],
          summary: 'Unregister FCM device token',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['fcmToken'],
                  properties: {
                    fcmToken: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: { 200: { description: 'Device unregistered' } },
        },
      },

      // ─── PASSENGERS ─────────────────────────────────────
      '/passengers': {
        get: {
          tags: ['Passengers'],
          summary: 'Get my saved passengers',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'Passenger list' } },
        },
        post: {
          tags: ['Passengers'],
          summary: 'Add a passenger',
          security: [{ bearerAuth: [] }],
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['firstName', 'lastName'], properties: { firstName: { type: 'string' }, lastName: { type: 'string' }, phone: { type: 'string' }, email: { type: 'string' }, dateOfBirth: { type: 'string', format: 'date' }, idType: { type: 'string', enum: ['national_id', 'passport', 'driver_license'] }, idNumber: { type: 'string' } } } } } },
          responses: { 201: { description: 'Passenger created' } },
        },
      },
      '/passengers/{id}': {
        patch: {
          tags: ['Passengers'],
          summary: 'Update a passenger',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Passenger updated' } },
        },
        delete: {
          tags: ['Passengers'],
          summary: 'Delete a passenger',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Passenger deleted' } },
        },
      },

      // ─── PAYMENT METHODS ─────────────────────────────────
      '/payment-methods/my': {
        get: {
          tags: ['Payment Methods'],
          summary: 'Get my saved payment methods',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'Payment method list' } },
        },
      },
      '/payment-methods': {
        post: {
          tags: ['Payment Methods'],
          summary: 'Add a payment method',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'Payment method saved' } },
        },
      },
      '/payment-methods/{id}': {
        delete: {
          tags: ['Payment Methods'],
          summary: 'Delete a payment method',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Payment method deleted' } },
        },
      },
      '/payment-methods/{id}/default': {
        patch: {
          tags: ['Payment Methods'],
          summary: 'Set payment method as default',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Default payment method updated' } },
        },
      },

      // ─── REFUNDS ─────────────────────────────────────────
      '/refunds/my': {
        get: {
          tags: ['Refunds'],
          summary: 'Get my refund requests',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'Refund list' } },
        },
      },
      '/refunds': {
        post: {
          tags: ['Refunds'],
          summary: 'Request a refund for a booking',
          security: [{ bearerAuth: [] }],
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['bookingId'], properties: { bookingId: { type: 'string' }, reason: { type: 'string' } } } } } },
          responses: { 201: { description: 'Refund requested' } },
        },
      },

      // ─── ADDITIONAL AUTH ENDPOINTS ──────────────────────
      '/auth/logout': {
        post: {
          tags: ['Auth'],
          summary: 'Logout (blacklist current token)',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'Logged out' } },
        },
      },
      '/auth/refresh-token': {
        post: {
          tags: ['Auth'],
          summary: 'Refresh access token',
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['refreshToken'], properties: { refreshToken: { type: 'string' } } } } } },
          responses: { 200: { description: 'New tokens issued' } },
        },
      },
      '/auth/forgot-password': {
        post: {
          tags: ['Auth'],
          summary: 'Request password reset',
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['email'], properties: { email: { type: 'string', format: 'email' } } } } } },
          responses: { 200: { description: 'Reset token sent' } },
        },
      },
      '/auth/reset-password': {
        post: {
          tags: ['Auth'],
          summary: 'Reset password with token',
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['token', 'password', 'passwordConfirm'], properties: { token: { type: 'string' }, password: { type: 'string', minLength: 6 }, passwordConfirm: { type: 'string' } } } } } },
          responses: { 200: { description: 'Password reset successfully' } },
        },
      },
      '/auth/change-password': {
        post: {
          tags: ['Auth'],
          summary: 'Change password (authenticated)',
          security: [{ bearerAuth: [] }],
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['currentPassword', 'newPassword', 'newPasswordConfirm'], properties: { currentPassword: { type: 'string' }, newPassword: { type: 'string', minLength: 6 }, newPasswordConfirm: { type: 'string' } } } } } },
          responses: { 200: { description: 'Password changed' } },
        },
      },

      // ─── ADDITIONAL BOOKING ENDPOINTS ────────────────────
      '/bookings/cancellation-policy': {
        get: {
          tags: ['Bookings'],
          summary: 'Get cancellation policy',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'Cancellation policy' } },
        },
      },
      '/bookings/{id}/refundable-amount': {
        get: {
          tags: ['Bookings'],
          summary: 'Calculate refundable amount for a booking',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Refund calculation' } },
        },
      },

      // ─── SEAT LAYOUT ─────────────────────────────────────
      '/buses/{id}/seats': {
        get: {
          tags: ['Buses'],
          summary: 'Get seat layout with availability',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Seat layout matrix' } },
        },
      },

      // ─── TICKET SHARE ────────────────────────────────────
      '/tickets/{id}/share': {
        get: {
          tags: ['Tickets'],
          summary: 'Generate a shareable link for a ticket',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Share URL' } },
        },
      },

      // ─── PAYMENT RETRY ───────────────────────────────────
      '/payments/retry': {
        post: {
          tags: ['Payments'],
          summary: 'Retry a failed payment',
          security: [{ bearerAuth: [] }],
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['bookingId'], properties: { bookingId: { type: 'string' } } } } } },
          responses: { 202: { description: 'Payment retry queued' } },
        },
      },

      // ─── UPLOADS ─────────────────────────────────────────
      '/uploads': {
        post: {
          tags: ['Uploads'],
          summary: 'Upload files (images)',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  properties: {
                    files: { type: 'array', items: { type: 'string', format: 'binary' }, description: 'Up to 10 files, max 5MB each' },
                  },
                },
              },
            },
          },
          responses: { 200: { description: 'Files uploaded' } },
        },
      },
    },
  },
  apis: [],
};

module.exports = swaggerJsdoc(options);
