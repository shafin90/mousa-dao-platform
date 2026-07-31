const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Mousa DAO Transport Management API',
      version: '1.0.0',
      description: `RESTful API for the Mousa DAO Transport Management System.
Provides endpoints for managing tenants, users, authentication, trips, routes,
bookings, payments, tickets, fleet maintenance, real-time GPS tracking,
analytics, notifications, and more.

## Authentication
Most endpoints require a JWT token passed via the \`Authorization: Bearer <token>\` header.
Obtain a token via \`POST /auth/login\` or \`POST /auth/register\`.

## Response Format
All endpoints follow a consistent response envelope:
- **Success (2xx):** \`{ success: true, message: "...", data: ... }\`
- **Paginated:** \`{ success: true, data: [...], pagination: { total, page, limit, pages } }\`
- **Accepted (202):** \`{ success: true, message: "Request accepted and queued", eventId: "...", data: {} }\`
- **Error (4xx/5xx):** \`{ success: false, code: "ERROR_CODE", message: "..." }\`

## Error Codes
| Code | Meaning |
|------|---------|
| VALIDATION_ERROR | Request body failed Joi validation |
| AUTH_REQUIRED | No authentication token provided |
| INVALID_TOKEN | Token is invalid or expired |
| INVALID_CREDENTIALS | Email or password is wrong |
| FORBIDDEN | Insufficient role permissions |
| NOT_FOUND | Resource not found |
| CONFLICT | Duplicate resource or state conflict |
| INTERNAL_ERROR | Unexpected server error |
`,
      contact: {
        name: 'API Support',
        email: 'support@mousadao.com',
      },
    },
    servers: [
      {
        url: 'http://localhost:5000/api/v1',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token from POST /auth/login',
        },
      },
      schemas: {
        // ========================================
        // GENERIC WRAPPERS
        // ========================================
        SuccessResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Success' },
            data: { type: 'object' },
          },
        },
        SuccessArrayResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Success' },
            data: { type: 'array', items: { type: 'object' } },
          },
        },
        PaginatedResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: { type: 'array', items: { type: 'object' } },
            pagination: {
              type: 'object',
              properties: {
                total: { type: 'integer', example: 100 },
                page: { type: 'integer', example: 1 },
                limit: { type: 'integer', example: 10 },
                pages: { type: 'integer', example: 10 },
              },
            },
          },
        },
        AcceptedResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Request accepted and queued for processing' },
            eventId: { type: 'string', example: 'evt_abc123' },
            data: { type: 'object' },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            code: { type: 'string', example: 'VALIDATION_ERROR' },
            message: { type: 'string', example: 'Validation failed' },
          },
        },

        // ========================================
        // AUTH
        // ========================================
        RegisterRequest: {
          type: 'object',
          required: ['name', 'email', 'phone', 'password'],
          properties: {
            name: { type: 'string', example: 'John Doe' },
            email: { type: 'string', format: 'email', example: 'john@example.com' },
            phone: { type: 'string', example: '+1234567890' },
            password: { type: 'string', format: 'password', minLength: 6, example: 'secret123' },
            role: { type: 'string', enum: ['admin', 'manager', 'staff', 'driver', 'customer'], example: 'customer' },
            companyId: { type: 'string', description: 'Tenant ID (optional for self-registration)' },
          },
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email', example: 'john@example.com' },
            password: { type: 'string', format: 'password', example: 'secret123' },
          },
        },
        AuthResponse: {
          type: 'object',
          properties: {
            user: { $ref: '#/components/schemas/User' },
            token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIs...' },
            refreshToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIs...' },
          },
        },
        FirebaseLoginRequest: {
          type: 'object',
          required: ['idToken'],
          properties: {
            idToken: { type: 'string', description: 'Firebase ID token' },
            phone: { type: 'string', example: '+1234567890' },
            name: { type: 'string', example: 'John Doe' },
          },
        },

        // ========================================
        // USER
        // ========================================
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            companyId: { type: 'string', example: '507f1f77bcf86cd799439011' },
            email: { type: 'string', example: 'john@example.com' },
            email2: { type: 'string', example: 'john_alt@example.com' },
            phone: { type: 'string', example: '+1234567890' },
            phone2: { type: 'string', example: '+1234567891' },
            role: { type: 'string', enum: ['admin', 'manager', 'staff', 'driver', 'customer'] },
            dateOfBirth: { type: 'string', format: 'date' },
            employmentStatus: { type: 'string', enum: ['active', 'inactive', 'on_leave', 'terminated'] },
            createdBy: { type: 'string', example: '507f1f77bcf86cd799439011' },
            profile: {
              type: 'object',
              properties: {
                firstName: { type: 'string' },
                lastName: { type: 'string' },
                avatar: { type: 'string' },
              },
            },
            authTracking: {
              type: 'object',
              properties: {
                lastLogin: { type: 'string', format: 'date-time' },
                failedLoginAttempts: { type: 'integer', example: 0 },
                isLocked: { type: 'boolean', example: false },
              },
            },
          },
        },
        CreateUserRequest: {
          type: 'object',
          required: ['email', 'phone', 'password'],
          properties: {
            email: { type: 'string', format: 'email' },
            email2: { type: 'string', format: 'email' },
            phone: { type: 'string' },
            phone2: { type: 'string' },
            password: { type: 'string', format: 'password', minLength: 6 },
            role: { type: 'string', enum: ['admin', 'manager', 'staff', 'driver', 'customer'] },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            dateOfBirth: { type: 'string', format: 'date' },
            employmentStatus: { type: 'string', enum: ['active', 'inactive', 'on_leave', 'terminated'] },
          },
        },
        UpdateProfileRequest: {
          type: 'object',
          minProperties: 1,
          properties: {
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            phone: { type: 'string' },
          },
        },
        UpdateUserRoleRequest: {
          type: 'object',
          required: ['role'],
          properties: {
            role: { type: 'string', enum: ['admin', 'manager', 'staff', 'driver', 'customer'] },
          },
        },
        UpdateUserStatusRequest: {
          type: 'object',
          required: ['isActive'],
          properties: {
            isActive: { type: 'boolean' },
          },
        },

        // ========================================
        // TENANT
        // ========================================
        Tenant: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            name: { type: 'string' },
            email: { type: 'string' },
            phone: { type: 'string' },
            domain: { type: 'string' },
            plan: { type: 'string', enum: ['basic', 'pro', 'enterprise'] },
            status: { type: 'string', enum: ['active', 'suspended'] },
            settings: {
              type: 'object',
              properties: {
                timezone: { type: 'string' },
                currency: { type: 'string' },
                dateFormat: { type: 'string' },
                features: {
                  type: 'object',
                  properties: {
                    enableBooking: { type: 'boolean' },
                    enablePayments: { type: 'boolean' },
                    enableTicketing: { type: 'boolean' },
                    enableTracking: { type: 'boolean' },
                  },
                },
                commission: {
                  type: 'object',
                  properties: {
                    platformPercentage: { type: 'number' },
                    driverPercentage: { type: 'number' },
                  },
                },
                taxPercentage: { type: 'number' },
                pricingRules: {
                  type: 'object',
                  properties: {
                    defaultBaseFareMultiplier: { type: 'number' },
                    vipMultiplier: { type: 'number' },
                  },
                },
              },
            },
          },
        },
        CreateTenantRequest: {
          type: 'object',
          required: ['name', 'email', 'phone'],
          properties: {
            name: { type: 'string' },
            email: { type: 'string', format: 'email' },
            phone: { type: 'string' },
          },
        },

        // ========================================
        // ROUTE (Trip Routes)
        // ========================================
        Route: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            companyId: { type: 'string' },
            fromCity: { type: 'string', description: 'City ID' },
            toCity: { type: 'string', description: 'City ID' },
            fromStations: { type: 'array', items: { type: 'string' }, description: 'Station IDs' },
            toStations: { type: 'array', items: { type: 'string' }, description: 'Station IDs' },
            distanceKm: { type: 'number' },
            estimatedTimeMinutes: { type: 'number' },
            baseRate: { type: 'number' },
            isActive: { type: 'boolean' },
            stops: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  _id: { type: 'string' },
                  cityId: { type: 'string' },
                  stationId: { type: 'string' },
                  name: { type: 'string' },
                  status: { type: 'string', enum: ['confirmed', 'pending', 'cancelled'] },
                },
              },
            },
            createdBy: { type: 'string' },
          },
        },
        CreateRouteRequest: {
          type: 'object',
          required: ['fromCity', 'toCity', 'distanceKm'],
          properties: {
            fromCity: { type: 'string', description: 'City ID' },
            toCity: { type: 'string', description: 'City ID' },
            fromStations: { type: 'array', items: { type: 'string' }, description: 'Station IDs' },
            toStations: { type: 'array', items: { type: 'string' }, description: 'Station IDs' },
            distanceKm: { type: 'number' },
            estimatedTimeMinutes: { type: 'number' },
            baseRate: { type: 'number' },
            isActive: { type: 'boolean' },
            stops: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  cityId: { type: 'string', description: 'City ID (required)' },
                  stationId: { type: 'string' },
                  name: { type: 'string' },
                  status: { type: 'string', enum: ['confirmed', 'pending', 'cancelled'] },
                },
              },
            },
          },
        },

        // ========================================
        // TRIP
        // ========================================
        Trip: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            companyId: { type: 'string' },
            routeId: { type: 'string' },
            fromStation: { type: 'string' },
            toStation: { type: 'string' },
            busId: { type: 'string' },
            departureTime: { type: 'string', example: '08:00' },
            arrivalTime: { type: 'string', example: '12:00' },
            actualDepartureTime: { type: 'string' },
            actualArrivalTime: { type: 'string' },
            delayMinutes: { type: 'number' },
            date: { type: 'string', format: 'date' },
            price: { type: 'number' },
            seatsTotal: { type: 'integer' },
            seatsBooked: { type: 'integer' },
            status: { type: 'string', enum: ['scheduled', 'active', 'completed', 'cancelled'] },
            createdBy: { type: 'string' },
          },
        },
        CreateTripRequest: {
          type: 'object',
          required: ['fromStation', 'toStation', 'busId', 'departureTime', 'arrivalTime', 'date', 'price'],
          properties: {
            routeId: { type: 'string' },
            fromStation: { type: 'string', description: 'Station ID' },
            toStation: { type: 'string', description: 'Station ID' },
            busId: { type: 'string', description: 'Bus ID' },
            departureTime: { type: 'string', example: '08:00' },
            arrivalTime: { type: 'string', example: '12:00' },
            actualDepartureTime: { type: 'string' },
            actualArrivalTime: { type: 'string' },
            delayMinutes: { type: 'number' },
            date: { type: 'string', format: 'date' },
            price: { type: 'number' },
            status: { type: 'string', enum: ['scheduled', 'active', 'completed', 'cancelled'] },
          },
        },
        UpdateTripStatusRequest: {
          type: 'object',
          required: ['status'],
          properties: {
            status: { type: 'string', enum: ['scheduled', 'active', 'completed', 'cancelled'] },
          },
        },

        // ========================================
        // BOOKING
        // ========================================
        Booking: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            companyId: { type: 'string' },
            userId: { type: 'string' },
            tripId: { type: 'string' },
            seats: { type: 'array', items: { type: 'string' }, example: ['1A', '1B'] },
            bookingCode: { type: 'string', example: 'JET-2024-A1B2C' },
            totalAmount: { type: 'number' },
            status: { type: 'string', enum: ['pending', 'confirmed', 'cancelled'] },
            paymentStatus: { type: 'string', enum: ['unpaid', 'paid', 'refunded'] },
          },
        },
        CreateBookingRequest: {
          type: 'object',
          required: ['tripId', 'seats'],
          properties: {
            tripId: { type: 'string', description: 'Trip ID' },
            seats: { type: 'array', items: { type: 'string' }, minItems: 1, example: ['1A', '1B'] },
          },
        },

        // ========================================
        // PAYMENT
        // ========================================
        Payment: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            companyId: { type: 'string' },
            bookingId: { type: 'string' },
            userId: { type: 'string' },
            method: { type: 'string', enum: ['wave', 'orange_money', 'mtn', 'moov', 'flutterwave'] },
            transactionId: { type: 'string' },
            tx_ref: { type: 'string' },
            paymentLink: { type: 'string' },
            amount: { type: 'number' },
            status: { type: 'string', enum: ['pending', 'processing', 'success', 'failed', 'refunded', 'expired'] },
            providerResponse: { type: 'object' },
          },
        },
        InitiatePaymentRequest: {
          type: 'object',
          required: ['bookingId', 'method'],
          properties: {
            bookingId: { type: 'string' },
            method: { type: 'string', enum: ['wave', 'orange_money', 'mtn', 'moov', 'flutterwave'] },
          },
        },

        // ========================================
        // REFUND REQUEST
        // ========================================
        RefundRequest: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            companyId: { type: 'string' },
            bookingId: { type: 'string' },
            userId: { type: 'string' },
            paymentId: { type: 'string' },
            amount: { type: 'number' },
            reason: { type: 'string' },
            status: { type: 'string', enum: ['pending', 'approved', 'rejected'] },
            reviewedBy: { type: 'string' },
            reviewedAt: { type: 'string', format: 'date-time' },
            adminNote: { type: 'string' },
            requestId: { type: 'string' },
          },
        },

        // ========================================
        // TICKET
        // ========================================
        Ticket: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            companyId: { type: 'string' },
            bookingId: { type: 'string' },
            userId: { type: 'string' },
            tripId: { type: 'string' },
            ticketNumber: { type: 'string', example: 'TKT-2024-A1B2C3' },
            qrCode: { type: 'string', description: 'QR code data URL' },
            status: { type: 'string', enum: ['valid', 'used', 'expired'] },
            scannedAt: { type: 'string', format: 'date-time' },
          },
        },

        // ========================================
        // BUS
        // ========================================
        Bus: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            companyId: { type: 'string' },
            busNumber: { type: 'string' },
            name: { type: 'string' },
            capacity: { type: 'integer' },
            seatRows: { type: 'integer' },
            seatsPerRow: { type: 'integer' },
            leftSeats: { type: 'integer' },
            rightSeats: { type: 'integer' },
            type: { type: 'string', enum: ['VIP', 'Premium', 'Mini', 'Standard'] },
            features: { type: 'object' },
            assignedDriver: { type: 'string' },
            status: { type: 'string', enum: ['active', 'maintenance', 'inactive'] },
            busManager: { type: 'string' },
            maintenanceManager: { type: 'string' },
            make: { type: 'string' },
            model: { type: 'string' },
            year: { type: 'integer' },
            color: { type: 'string' },
            plateNumber: { type: 'string' },
            vin: { type: 'string' },
            fuelType: { type: 'string', enum: ['diesel', 'petrol', 'electric', 'hybrid', 'cng'] },
            odometer: { type: 'number' },
            registrationNumber: { type: 'string' },
            registrationExpiry: { type: 'string', format: 'date' },
            insuranceProvider: { type: 'string' },
            insurancePolicyNumber: { type: 'string' },
            insuranceIssueDate: { type: 'string', format: 'date' },
            insuranceExpiry: { type: 'string', format: 'date' },
            fitnessExpiry: { type: 'string', format: 'date' },
            lastInspectionDate: { type: 'string', format: 'date' },
            firstServiceDate: { type: 'string', format: 'date' },
            matriculationDate: { type: 'string', format: 'date' },
            purchaseDate: { type: 'string', format: 'date' },
            purchaseCost: { type: 'number' },
            homeDepot: { type: 'string' },
            photos: { type: 'array', items: { type: 'string' } },
          },
        },
        CreateBusRequest: {
          type: 'object',
          required: ['busNumber', 'name', 'capacity', 'type'],
          properties: {
            busNumber: { type: 'string' },
            name: { type: 'string' },
            capacity: { type: 'integer' },
            seatRows: { type: 'integer' },
            seatsPerRow: { type: 'integer' },
            leftSeats: { type: 'integer' },
            rightSeats: { type: 'integer' },
            type: { type: 'string', enum: ['VIP', 'Premium', 'Mini', 'Standard'] },
            features: { type: 'object' },
            assignedDriver: { type: 'string' },
            status: { type: 'string', enum: ['active', 'maintenance', 'inactive'] },
            busManager: { type: 'string' },
            maintenanceManager: { type: 'string' },
            make: { type: 'string' },
            model: { type: 'string' },
            year: { type: 'integer' },
            color: { type: 'string' },
            plateNumber: { type: 'string' },
            vin: { type: 'string' },
            fuelType: { type: 'string', enum: ['diesel', 'petrol', 'electric', 'hybrid', 'cng'] },
            odometer: { type: 'number' },
            registrationNumber: { type: 'string' },
            registrationExpiry: { type: 'string', format: 'date' },
            insuranceProvider: { type: 'string' },
            insurancePolicyNumber: { type: 'string' },
            insuranceIssueDate: { type: 'string', format: 'date' },
            insuranceExpiry: { type: 'string', format: 'date' },
            fitnessExpiry: { type: 'string', format: 'date' },
            lastInspectionDate: { type: 'string', format: 'date' },
            firstServiceDate: { type: 'string', format: 'date' },
            matriculationDate: { type: 'string', format: 'date' },
            purchaseDate: { type: 'string', format: 'date' },
            purchaseCost: { type: 'number' },
            homeDepot: { type: 'string' },
            photos: { type: 'array', items: { type: 'string' } },
          },
        },
        UpdateBusStatusRequest: {
          type: 'object',
          required: ['status'],
          properties: {
            status: { type: 'string', enum: ['active', 'maintenance', 'inactive'] },
          },
        },
        AssignDriverRequest: {
          type: 'object',
          required: ['driverId'],
          properties: {
            driverId: { type: 'string', description: 'User ID of the driver' },
          },
        },

        // ========================================
        // MAINTENANCE RECORD
        // ========================================
        MaintenanceRecord: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            companyId: { type: 'string' },
            busId: { type: 'string' },
            facilityId: { type: 'string' },
            date: { type: 'string', format: 'date' },
            type: { type: 'string', enum: ['routine', 'repair', 'inspection', 'other'] },
            description: { type: 'string' },
            cost: { type: 'number' },
            odometer: { type: 'number' },
            performedBy: { type: 'string' },
            nextServiceDate: { type: 'string', format: 'date' },
          },
        },
        CreateMaintenanceRecordRequest: {
          type: 'object',
          required: ['busId', 'date', 'description'],
          properties: {
            busId: { type: 'string' },
            facilityId: { type: 'string' },
            date: { type: 'string', format: 'date' },
            type: { type: 'string', enum: ['routine', 'repair', 'inspection', 'other'] },
            description: { type: 'string' },
            cost: { type: 'number', minimum: 0 },
            odometer: { type: 'number', minimum: 0 },
            performedBy: { type: 'string' },
            nextServiceDate: { type: 'string', format: 'date' },
          },
        },
        AddMaintenanceLogRequest: {
          type: 'object',
          required: ['date', 'description'],
          properties: {
            date: { type: 'string', format: 'date' },
            type: { type: 'string', enum: ['routine', 'repair', 'inspection', 'other'] },
            description: { type: 'string' },
            cost: { type: 'number', minimum: 0 },
            odometer: { type: 'number' },
            performedBy: { type: 'string' },
            nextServiceDate: { type: 'string', format: 'date' },
            facilityId: { type: 'string' },
          },
        },

        // ========================================
        // MAINTENANCE FACILITY
        // ========================================
        MaintenanceFacility: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            companyId: { type: 'string' },
            name: { type: 'string' },
            cityId: { type: 'string' },
            address: { type: 'string' },
            phone: { type: 'string' },
            manager: { type: 'string' },
            capacity: { type: 'integer' },
            services: { type: 'array', items: { type: 'string' } },
            notes: { type: 'string' },
            isActive: { type: 'boolean' },
          },
        },
        CreateFacilityRequest: {
          type: 'object',
          required: ['name'],
          properties: {
            name: { type: 'string' },
            cityId: { type: 'string' },
            address: { type: 'string' },
            phone: { type: 'string' },
            manager: { type: 'string' },
            capacity: { type: 'integer', minimum: 0 },
            services: { type: 'array', items: { type: 'string' } },
            notes: { type: 'string' },
            isActive: { type: 'boolean' },
          },
        },

        // ========================================
        // MAINTENANCE STAFF
        // ========================================
        MaintenanceStaff: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            companyId: { type: 'string' },
            name: { type: 'string' },
            phone: { type: 'string' },
            role: { type: 'string' },
            facilityId: { type: 'string' },
            isActive: { type: 'boolean' },
          },
        },
        CreateStaffRequest: {
          type: 'object',
          required: ['name'],
          properties: {
            name: { type: 'string' },
            phone: { type: 'string' },
            role: { type: 'string' },
            facilityId: { type: 'string' },
            isActive: { type: 'boolean' },
          },
        },

        // ========================================
        // MAINTENANCE SCHEDULE
        // ========================================
        MaintenanceSchedule: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            companyId: { type: 'string' },
            busId: { type: 'string' },
            title: { type: 'string' },
            maintenanceType: { type: 'string', enum: ['routine', 'repair', 'inspection', 'other'] },
            intervalType: { type: 'string', enum: ['km', 'months'] },
            intervalValue: { type: 'number' },
            lastServiceOdometer: { type: 'number' },
            lastServiceDate: { type: 'string', format: 'date' },
            isActive: { type: 'boolean' },
            notes: { type: 'string' },
          },
        },
        CreateScheduleRequest: {
          type: 'object',
          required: ['busId', 'intervalType', 'intervalValue'],
          properties: {
            busId: { type: 'string' },
            title: { type: 'string' },
            maintenanceType: { type: 'string', enum: ['routine', 'repair', 'inspection', 'other'] },
            intervalType: { type: 'string', enum: ['km', 'months'] },
            intervalValue: { type: 'number', minimum: 1 },
            lastServiceOdometer: { type: 'number', minimum: 0 },
            lastServiceDate: { type: 'string', format: 'date' },
            isActive: { type: 'boolean' },
            notes: { type: 'string' },
          },
        },

        // ========================================
        // WORK ORDER
        // ========================================
        WorkOrder: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            companyId: { type: 'string' },
            workOrderNumber: { type: 'string' },
            busId: { type: 'string' },
            maintenanceType: { type: 'string', enum: ['routine', 'repair', 'inspection', 'other'] },
            priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'] },
            assignedTechnician: { type: 'string' },
            facilityId: { type: 'string' },
            description: { type: 'string' },
            expectedCompletion: { type: 'string', format: 'date' },
            status: { type: 'string', enum: ['pending', 'in_progress', 'waiting_parts', 'completed', 'cancelled'] },
            cost: { type: 'number' },
            odometer: { type: 'number' },
            completedAt: { type: 'string', format: 'date-time' },
            notes: { type: 'string' },
          },
        },
        CreateWorkOrderRequest: {
          type: 'object',
          required: ['busId'],
          properties: {
            busId: { type: 'string' },
            maintenanceType: { type: 'string', enum: ['routine', 'repair', 'inspection', 'other'] },
            priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'] },
            assignedTechnician: { type: 'string' },
            facilityId: { type: 'string' },
            description: { type: 'string' },
            expectedCompletion: { type: 'string', format: 'date' },
            status: { type: 'string', enum: ['pending', 'in_progress', 'waiting_parts', 'completed', 'cancelled'] },
            cost: { type: 'number', minimum: 0 },
            odometer: { type: 'number', minimum: 0 },
            notes: { type: 'string' },
          },
        },

        // ========================================
        // CITY
        // ========================================
        City: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            companyId: { type: 'string' },
            name: { type: 'string' },
            country: { type: 'string' },
            location: {
              type: 'object',
              properties: {
                lat: { type: 'number' },
                lng: { type: 'number' },
              },
            },
            address1: { type: 'string' },
            address2: { type: 'string' },
            phone1: { type: 'string' },
            phone2: { type: 'string' },
            email1: { type: 'string' },
            email2: { type: 'string' },
            manager1: { type: 'string' },
            manager2: { type: 'string' },
            isActive: { type: 'boolean' },
            createdBy: { type: 'string' },
          },
        },
        CreateCityRequest: {
          type: 'object',
          required: ['name', 'country'],
          properties: {
            name: { type: 'string' },
            country: { type: 'string' },
            location: {
              type: 'object',
              properties: {
                lat: { type: 'number' },
                lng: { type: 'number' },
              },
            },
            address1: { type: 'string' },
            address2: { type: 'string' },
            phone1: { type: 'string' },
            phone2: { type: 'string' },
            email1: { type: 'string' },
            email2: { type: 'string' },
            manager1: { type: 'string' },
            manager2: { type: 'string' },
            isActive: { type: 'boolean' },
          },
        },

        // ========================================
        // STATION
        // ========================================
        Station: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            companyId: { type: 'string' },
            name: { type: 'string' },
            cityId: { type: 'string' },
            address: { type: 'string' },
            address1: { type: 'string' },
            address2: { type: 'string' },
            phone1: { type: 'string' },
            phone2: { type: 'string' },
            email1: { type: 'string' },
            email2: { type: 'string' },
            isActive: { type: 'boolean' },
            location: {
              type: 'object',
              required: ['lat', 'lng'],
              properties: {
                lat: { type: 'number' },
                lng: { type: 'number' },
              },
            },
            manager1: { type: 'string' },
            manager2: { type: 'string' },
            createdBy: { type: 'string' },
          },
        },

        // ========================================
        // TRACKING / GPS
        // ========================================
        BusLocation: {
          type: 'object',
          properties: {
            companyId: { type: 'string' },
            busId: { type: 'string' },
            tripId: { type: 'string' },
            latitude: { type: 'number' },
            longitude: { type: 'number' },
            speed: { type: 'number' },
            heading: { type: 'number' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },

        // ========================================
        // NOTIFICATION
        // ========================================
        Notification: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            companyId: { type: 'string' },
            userId: { type: 'string' },
            type: { type: 'string', enum: ['booking', 'payment', 'system', 'trip'] },
            message: { type: 'string' },
            key: { type: 'string' },
            isRead: { type: 'boolean' },
          },
        },

        // ========================================
        // CONFIG
        // ========================================
        Config: {
          type: 'object',
          properties: {
            companyId: { type: 'string' },
            baseCurrency: { type: 'string', example: 'XOF' },
            timezone: { type: 'string', example: 'UTC' },
            platformCommissionPercentage: { type: 'number', example: 10 },
            driverCommissionPercentage: { type: 'number', example: 80 },
            taxPercentage: { type: 'number', example: 5 },
            maintenanceMode: { type: 'boolean', example: false },
            featureFlags: {
              type: 'object',
              properties: {
                enableBooking: { type: 'boolean' },
                enablePayments: { type: 'boolean' },
                enableTicketing: { type: 'boolean' },
              },
            },
            pricingRules: {
              type: 'object',
              properties: {
                defaultBaseFareMultiplier: { type: 'number', example: 1 },
                vipMultiplier: { type: 'number', example: 1.5 },
              },
            },
          },
        },

        // ========================================
        // AUDIT LOG
        // ========================================
        AuditLog: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            companyId: { type: 'string' },
            userId: { type: 'string' },
            action: { type: 'string' },
            module: { type: 'string' },
            description: { type: 'string' },
            metadata: { type: 'object' },
            ipAddress: { type: 'string' },
            userAgent: { type: 'string' },
            status: { type: 'string', enum: ['success', 'failed'] },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },

        // ========================================
        // UPLOAD
        // ========================================
        UploadResponse: {
          type: 'object',
          properties: {
            urls: { type: 'array', items: { type: 'string' } },
            url: { type: 'string', description: 'Single URL when one file uploaded' },
          },
        },

        // ========================================
        // STAFF ASSIGNMENT
        // ========================================
        StaffAssignment: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            companyId: { type: 'string' },
            staffId: { type: 'string' },
            tripId: { type: 'string' },
            role: { type: 'string', enum: ['checker', 'assistant'] },
          },
        },
      },
      responses: {
        UnauthorizedError: {
          description: 'Missing or invalid authentication token',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              example: { success: false, code: 'AUTH_REQUIRED', message: 'Authentication required' },
            },
          },
        },
        ForbiddenError: {
          description: 'Insufficient role permissions',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              example: { success: false, code: 'FORBIDDEN', message: 'Insufficient permissions' },
            },
          },
        },
        NotFoundError: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              example: { success: false, code: 'NOT_FOUND', message: 'Resource not found' },
            },
          },
        },
        ValidationError: {
          description: 'Request validation failed',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              example: { success: false, code: 'VALIDATION_ERROR', message: '"name" is required' },
            },
          },
        },
      },
    },
    tags: [
      { name: 'Auth', description: 'Authentication and registration' },
      { name: 'Users', description: 'User management' },
      { name: 'Tenants', description: 'Company/tenant management' },
      { name: 'Routes', description: 'Trip route definitions' },
      { name: 'Trips', description: 'Trip scheduling and management' },
      { name: 'Bookings', description: 'Ticket bookings' },
      { name: 'Payments', description: 'Payment processing (mobile money)' },
      { name: 'Stripe', description: 'Stripe payment integration' },
      { name: 'Refund Requests', description: 'Refund request management' },
      { name: 'Tickets', description: 'Digital ticket management and verification' },
      { name: 'Fleet - Buses', description: 'Bus fleet management' },
      { name: 'Fleet - Maintenance Records', description: 'Bus maintenance logs' },
      { name: 'Fleet - Maintenance Facilities', description: 'Maintenance facility management' },
      { name: 'Fleet - Maintenance Staff', description: 'Maintenance staff management' },
      { name: 'Fleet - Maintenance Schedules', description: 'Recurring maintenance schedules' },
      { name: 'Fleet - Work Orders', description: 'Maintenance work orders' },
      { name: 'Fleet - Maintenance Dashboard', description: 'Maintenance overview dashboard' },
      { name: 'Stations', description: 'Bus stations' },
      { name: 'Cities', description: 'City management' },
      { name: 'Tracking', description: 'Real-time GPS bus tracking' },
      { name: 'Analytics', description: 'Business analytics and reports' },
      { name: 'Notifications', description: 'In-app notifications' },
      { name: 'Config', description: 'Tenant configuration settings' },
      { name: 'Audit', description: 'Audit logs' },
      { name: 'Uploads', description: 'File uploads (images)' },
    ],
    paths: {
      // ========================================
      // AUTH
      // ========================================
      '/auth/register': {
        post: {
          tags: ['Auth'],
          summary: 'Register a new user',
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/RegisterRequest' } } },
          },
          responses: {
            '201': { description: 'User registered successfully', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, message: { type: 'string' }, data: { $ref: '#/components/schemas/AuthResponse' } } } } } },
            '400': { $ref: '#/components/responses/ValidationError' },
            '409': { description: 'Email or phone already exists' },
          },
        },
      },
      '/auth/login': {
        post: {
          tags: ['Auth'],
          summary: 'Login with email and password',
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginRequest' } } },
          },
          responses: {
            '200': { description: 'Login successful', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, message: { type: 'string' }, data: { $ref: '#/components/schemas/AuthResponse' } } } } } },
            '400': { $ref: '#/components/responses/ValidationError' },
            '401': { description: 'Invalid credentials' },
          },
        },
      },
      '/auth/me': {
        get: {
          tags: ['Auth'],
          summary: 'Get current authenticated user profile',
          security: [{ bearerAuth: [] }],
          responses: {
            '200': { description: 'Current user data' },
            '401': { $ref: '#/components/responses/UnauthorizedError' },
          },
        },
      },
      '/auth/firebase': {
        post: {
          tags: ['Auth'],
          summary: 'Authenticate via Firebase ID token (mobile app)',
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/FirebaseLoginRequest' } } },
          },
          responses: {
            '200': { description: 'Firebase auth successful' },
            '400': { $ref: '#/components/responses/ValidationError' },
          },
        },
      },

      // ========================================
      // USERS
      // ========================================
      '/users/me': {
        get: {
          tags: ['Users'],
          summary: 'Get own user profile',
          security: [{ bearerAuth: [] }],
          responses: {
            '200': { description: 'User profile' },
            '401': { $ref: '#/components/responses/UnauthorizedError' },
          },
        },
        patch: {
          tags: ['Users'],
          summary: 'Update own profile',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateProfileRequest' } } },
          },
          responses: {
            '200': { description: 'Profile updated' },
            '400': { $ref: '#/components/responses/ValidationError' },
            '401': { $ref: '#/components/responses/UnauthorizedError' },
          },
        },
      },
      '/users': {
        get: {
          tags: ['Users'],
          summary: 'List all users (admin/manager)',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
            { name: 'role', in: 'query', schema: { type: 'string', enum: ['admin', 'manager', 'staff', 'driver', 'customer'] } },
            { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Search by name, email, or phone' },
          ],
          responses: {
            '200': { description: 'Paginated list of users' },
            '401': { $ref: '#/components/responses/UnauthorizedError' },
            '403': { $ref: '#/components/responses/ForbiddenError' },
          },
        },
        post: {
          tags: ['Users'],
          summary: 'Create a new user (admin)',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateUserRequest' } } },
          },
          responses: {
            '201': { description: 'User created' },
            '400': { $ref: '#/components/responses/ValidationError' },
            '401': { $ref: '#/components/responses/UnauthorizedError' },
            '403': { $ref: '#/components/responses/ForbiddenError' },
          },
        },
      },
      '/users/{id}': {
        get: {
          tags: ['Users'],
          summary: 'Get user by ID (admin/manager)',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            '200': { description: 'User data' },
            '401': { $ref: '#/components/responses/UnauthorizedError' },
            '403': { $ref: '#/components/responses/ForbiddenError' },
            '404': { $ref: '#/components/responses/NotFoundError' },
          },
        },
        patch: {
          tags: ['Users'],
          summary: 'Update user (admin/manager)',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } },
          responses: {
            '200': { description: 'User updated' },
            '401': { $ref: '#/components/responses/UnauthorizedError' },
            '403': { $ref: '#/components/responses/ForbiddenError' },
            '404': { $ref: '#/components/responses/NotFoundError' },
          },
        },
        delete: {
          tags: ['Users'],
          summary: 'Delete a user (admin)',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            '200': { description: 'User deleted' },
            '401': { $ref: '#/components/responses/UnauthorizedError' },
            '403': { $ref: '#/components/responses/ForbiddenError' },
            '404': { $ref: '#/components/responses/NotFoundError' },
          },
        },
      },
      '/users/{id}/status': {
        patch: {
          tags: ['Users'],
          summary: 'Update user status (admin)',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateUserStatusRequest' } } },
          },
          responses: {
            '200': { description: 'Status updated' },
            '401': { $ref: '#/components/responses/UnauthorizedError' },
            '403': { $ref: '#/components/responses/ForbiddenError' },
          },
        },
      },
      '/users/{id}/role': {
        patch: {
          tags: ['Users'],
          summary: 'Update user role (admin)',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateUserRoleRequest' } } },
          },
          responses: {
            '200': { description: 'Role updated' },
            '401': { $ref: '#/components/responses/UnauthorizedError' },
            '403': { $ref: '#/components/responses/ForbiddenError' },
          },
        },
      },

      // ========================================
      // TENANTS
      // ========================================
      '/tenants': {
        post: {
          tags: ['Tenants'],
          summary: 'Create a new tenant/company (public)',
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateTenantRequest' } } },
          },
          responses: {
            '201': { description: 'Tenant created' },
            '400': { $ref: '#/components/responses/ValidationError' },
            '409': { description: 'Tenant already exists' },
          },
        },
        get: {
          tags: ['Tenants'],
          summary: 'List all tenants (admin)',
          security: [{ bearerAuth: [] }],
          responses: {
            '200': { description: 'List of tenants' },
            '401': { $ref: '#/components/responses/UnauthorizedError' },
            '403': { $ref: '#/components/responses/ForbiddenError' },
          },
        },
      },
      '/tenants/{id}': {
        get: {
          tags: ['Tenants'],
          summary: 'Get tenant by ID (admin)',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            '200': { description: 'Tenant data' },
            '401': { $ref: '#/components/responses/UnauthorizedError' },
            '403': { $ref: '#/components/responses/ForbiddenError' },
            '404': { $ref: '#/components/responses/NotFoundError' },
          },
        },
        patch: {
          tags: ['Tenants'],
          summary: 'Update tenant (admin)',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            '200': { description: 'Tenant updated' },
            '401': { $ref: '#/components/responses/UnauthorizedError' },
            '403': { $ref: '#/components/responses/ForbiddenError' },
          },
        },
      },
      '/tenants/{id}/suspend': {
        patch: {
          tags: ['Tenants'],
          summary: 'Suspend a tenant (admin)',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            '200': { description: 'Tenant suspended' },
            '401': { $ref: '#/components/responses/UnauthorizedError' },
            '403': { $ref: '#/components/responses/ForbiddenError' },
          },
        },
      },
      '/tenants/{id}/activate': {
        patch: {
          tags: ['Tenants'],
          summary: 'Activate a tenant (admin)',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            '200': { description: 'Tenant activated' },
            '401': { $ref: '#/components/responses/UnauthorizedError' },
            '403': { $ref: '#/components/responses/ForbiddenError' },
          },
        },
      },

      // ========================================
      // ROUTES (Trip Routes)
      // ========================================
      '/routes': {
        post: {
          tags: ['Routes'],
          summary: 'Create a new route (admin)',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateRouteRequest' } } },
          },
          responses: {
            '201': { description: 'Route created' },
            '400': { $ref: '#/components/responses/ValidationError' },
            '401': { $ref: '#/components/responses/UnauthorizedError' },
            '403': { $ref: '#/components/responses/ForbiddenError' },
          },
        },
        get: {
          tags: ['Routes'],
          summary: 'List all routes (admin/manager)',
          security: [{ bearerAuth: [] }],
          responses: {
            '200': { description: 'List of routes' },
            '401': { $ref: '#/components/responses/UnauthorizedError' },
            '403': { $ref: '#/components/responses/ForbiddenError' },
          },
        },
      },
      '/routes/{id}': {
        get: {
          tags: ['Routes'],
          summary: 'Get route by ID (admin/manager)',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            '200': { description: 'Route data' },
            '401': { $ref: '#/components/responses/UnauthorizedError' },
            '403': { $ref: '#/components/responses/ForbiddenError' },
            '404': { $ref: '#/components/responses/NotFoundError' },
          },
        },
        patch: {
          tags: ['Routes'],
          summary: 'Update a route (admin/manager)',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            '200': { description: 'Route updated' },
            '401': { $ref: '#/components/responses/UnauthorizedError' },
            '403': { $ref: '#/components/responses/ForbiddenError' },
            '404': { $ref: '#/components/responses/NotFoundError' },
          },
        },
        delete: {
          tags: ['Routes'],
          summary: 'Delete a route (admin)',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            '200': { description: 'Route deleted' },
            '401': { $ref: '#/components/responses/UnauthorizedError' },
            '403': { $ref: '#/components/responses/ForbiddenError' },
            '404': { $ref: '#/components/responses/NotFoundError' },
          },
        },
      },

      // ========================================
      // TRIPS
      // ========================================
      '/trips': {
        post: {
          tags: ['Trips'],
          summary: 'Create a new trip (admin/staff)',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateTripRequest' } } },
          },
          responses: {
            '201': { description: 'Trip created' },
            '400': { $ref: '#/components/responses/ValidationError' },
            '401': { $ref: '#/components/responses/UnauthorizedError' },
            '403': { $ref: '#/components/responses/ForbiddenError' },
          },
        },
        get: {
          tags: ['Trips'],
          summary: 'List all trips (admin/staff/manager)',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
            { name: 'status', in: 'query', schema: { type: 'string', enum: ['scheduled', 'active', 'completed', 'cancelled'] } },
            { name: 'date', in: 'query', schema: { type: 'string', format: 'date' } },
            { name: 'routeId', in: 'query', schema: { type: 'string' } },
            { name: 'busId', in: 'query', schema: { type: 'string' } },
            { name: 'fromStation', in: 'query', schema: { type: 'string' } },
            { name: 'toStation', in: 'query', schema: { type: 'string' } },
          ],
          responses: {
            '200': { description: 'Paginated list of trips' },
            '401': { $ref: '#/components/responses/UnauthorizedError' },
            '403': { $ref: '#/components/responses/ForbiddenError' },
          },
        },
        delete: {
          tags: ['Trips'],
          summary: 'Delete ALL trips (admin)',
          security: [{ bearerAuth: [] }],
          responses: {
            '200': { description: 'All trips deleted' },
            '401': { $ref: '#/components/responses/UnauthorizedError' },
            '403': { $ref: '#/components/responses/ForbiddenError' },
          },
        },
      },
      '/trips/{id}': {
        get: {
          tags: ['Trips'],
          summary: 'Get trip by ID',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            '200': { description: 'Trip data' },
            '401': { $ref: '#/components/responses/UnauthorizedError' },
            '404': { $ref: '#/components/responses/NotFoundError' },
          },
        },
        patch: {
          tags: ['Trips'],
          summary: 'Update a trip (admin/staff/manager)',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            '200': { description: 'Trip updated' },
            '401': { $ref: '#/components/responses/UnauthorizedError' },
            '403': { $ref: '#/components/responses/ForbiddenError' },
            '404': { $ref: '#/components/responses/NotFoundError' },
          },
        },
        delete: {
          tags: ['Trips'],
          summary: 'Delete a trip (admin)',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            '200': { description: 'Trip deleted' },
            '401': { $ref: '#/components/responses/UnauthorizedError' },
            '403': { $ref: '#/components/responses/ForbiddenError' },
            '404': { $ref: '#/components/responses/NotFoundError' },
          },
        },
      },
      '/trips/{id}/status': {
        patch: {
          tags: ['Trips'],
          summary: 'Update trip status (admin/staff)',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateTripStatusRequest' } } },
          },
          responses: {
            '200': { description: 'Trip status updated' },
            '400': { $ref: '#/components/responses/ValidationError' },
            '401': { $ref: '#/components/responses/UnauthorizedError' },
            '403': { $ref: '#/components/responses/ForbiddenError' },
            '404': { $ref: '#/components/responses/NotFoundError' },
          },
        },
      },

      // ========================================
      // BOOKINGS
      // ========================================
      '/bookings': {
        post: {
          tags: ['Bookings'],
          summary: 'Create a booking (async, queued)',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateBookingRequest' } } },
          },
          responses: {
            '202': { description: 'Booking queued for processing', content: { 'application/json': { schema: { $ref: '#/components/schemas/AcceptedResponse' } } } },
            '400': { $ref: '#/components/responses/ValidationError' },
            '401': { $ref: '#/components/responses/UnauthorizedError' },
          },
        },
        get: {
          tags: ['Bookings'],
          summary: 'List all bookings (admin/manager)',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
            { name: 'status', in: 'query', schema: { type: 'string', enum: ['pending', 'confirmed', 'cancelled'] } },
            { name: 'tripId', in: 'query', schema: { type: 'string' } },
          ],
          responses: {
            '200': { description: 'Paginated list of bookings' },
            '401': { $ref: '#/components/responses/UnauthorizedError' },
            '403': { $ref: '#/components/responses/ForbiddenError' },
          },
        },
      },
      '/bookings/my': {
        get: {
          tags: ['Bookings'],
          summary: 'Get current user\'s bookings',
          security: [{ bearerAuth: [] }],
          responses: {
            '200': { description: 'User bookings' },
            '401': { $ref: '#/components/responses/UnauthorizedError' },
          },
        },
      },
      '/bookings/{id}': {
        get: {
          tags: ['Bookings'],
          summary: 'Get booking by ID',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            '200': { description: 'Booking data' },
            '401': { $ref: '#/components/responses/UnauthorizedError' },
            '404': { $ref: '#/components/responses/NotFoundError' },
          },
        },
      },
      '/bookings/{id}/cancel': {
        patch: {
          tags: ['Bookings'],
          summary: 'Cancel a booking',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            '200': { description: 'Booking cancelled' },
            '401': { $ref: '#/components/responses/UnauthorizedError' },
            '404': { $ref: '#/components/responses/NotFoundError' },
          },
        },
      },

      // ========================================
      // PAYMENTS
      // ========================================
      '/payments/initiate': {
        post: {
          tags: ['Payments'],
          summary: 'Initiate a payment',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/InitiatePaymentRequest' } } },
          },
          responses: {
            '200': { description: 'Payment initiated' },
            '400': { $ref: '#/components/responses/ValidationError' },
            '401': { $ref: '#/components/responses/UnauthorizedError' },
          },
        },
      },
      '/payments/my': {
        get: {
          tags: ['Payments'],
          summary: 'Get current user\'s payments',
          security: [{ bearerAuth: [] }],
          responses: {
            '200': { description: 'User payments' },
            '401': { $ref: '#/components/responses/UnauthorizedError' },
          },
        },
      },
      '/payments': {
        get: {
          tags: ['Payments'],
          summary: 'List all payments (admin/manager)',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
            { name: 'status', in: 'query', schema: { type: 'string', enum: ['pending', 'processing', 'success', 'failed', 'refunded', 'expired'] } },
          ],
          responses: {
            '200': { description: 'Paginated list of payments' },
            '401': { $ref: '#/components/responses/UnauthorizedError' },
            '403': { $ref: '#/components/responses/ForbiddenError' },
          },
        },
      },
      '/payments/webhook': {
        post: {
          tags: ['Payments'],
          summary: 'Flutterwave payment webhook',
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { type: 'object' } } },
          },
          responses: {
            '200': { description: 'Webhook processed' },
          },
        },
      },
      '/payments/{id}': {
        get: {
          tags: ['Payments'],
          summary: 'Get payment by ID or tx_ref',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'Payment ID or tx_ref' }],
          responses: {
            '200': { description: 'Payment data' },
            '401': { $ref: '#/components/responses/UnauthorizedError' },
            '404': { $ref: '#/components/responses/NotFoundError' },
          },
        },
      },

      // ========================================
      // STRIPE
      // ========================================
      '/stripe/webhook': {
        post: {
          tags: ['Stripe'],
          summary: 'Stripe webhook (raw body)',
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { type: 'object' } } },
          },
          responses: {
            '200': { description: 'Webhook processed' },
          },
        },
      },
      '/stripe/create-intent': {
        post: {
          tags: ['Stripe'],
          summary: 'Create a Stripe payment intent',
          security: [{ bearerAuth: [] }],
          responses: {
            '200': { description: 'Payment intent created' },
            '401': { $ref: '#/components/responses/UnauthorizedError' },
          },
        },
      },

      // ========================================
      // REFUND REQUESTS
      // ========================================
      '/refund-requests': {
        get: {
          tags: ['Refund Requests'],
          summary: 'List all refund requests (admin)',
          security: [{ bearerAuth: [] }],
          responses: {
            '200': { description: 'List of refund requests' },
            '401': { $ref: '#/components/responses/UnauthorizedError' },
            '403': { $ref: '#/components/responses/ForbiddenError' },
          },
        },
      },
      '/refund-requests/{id}': {
        get: {
          tags: ['Refund Requests'],
          summary: 'Get refund request by ID (admin)',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            '200': { description: 'Refund request data' },
            '401': { $ref: '#/components/responses/UnauthorizedError' },
            '403': { $ref: '#/components/responses/ForbiddenError' },
            '404': { $ref: '#/components/responses/NotFoundError' },
          },
        },
      },
      '/refund-requests/{id}/approve': {
        patch: {
          tags: ['Refund Requests'],
          summary: 'Approve a refund request (admin)',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            '200': { description: 'Refund approved' },
            '401': { $ref: '#/components/responses/UnauthorizedError' },
            '403': { $ref: '#/components/responses/ForbiddenError' },
            '404': { $ref: '#/components/responses/NotFoundError' },
          },
        },
      },
      '/refund-requests/{id}/reject': {
        patch: {
          tags: ['Refund Requests'],
          summary: 'Reject a refund request (admin)',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            '200': { description: 'Refund rejected' },
            '401': { $ref: '#/components/responses/UnauthorizedError' },
            '403': { $ref: '#/components/responses/ForbiddenError' },
            '404': { $ref: '#/components/responses/NotFoundError' },
          },
        },
      },

      // ========================================
      // TICKETS
      // ========================================
      '/tickets/my': {
        get: {
          tags: ['Tickets'],
          summary: 'Get current user\'s tickets',
          security: [{ bearerAuth: [] }],
          responses: {
            '200': { description: 'User tickets' },
            '401': { $ref: '#/components/responses/UnauthorizedError' },
          },
        },
      },
      '/tickets': {
        get: {
          tags: ['Tickets'],
          summary: 'List all tickets (admin/manager)',
          security: [{ bearerAuth: [] }],
          responses: {
            '200': { description: 'List of tickets' },
            '401': { $ref: '#/components/responses/UnauthorizedError' },
            '403': { $ref: '#/components/responses/ForbiddenError' },
          },
        },
      },
      '/tickets/{id}': {
        get: {
          tags: ['Tickets'],
          summary: 'Get ticket by ID',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            '200': { description: 'Ticket data' },
            '401': { $ref: '#/components/responses/UnauthorizedError' },
            '404': { $ref: '#/components/responses/NotFoundError' },
          },
        },
      },
      '/tickets/verify': {
        post: {
          tags: ['Tickets'],
          summary: 'Verify/scan a ticket (admin/staff)',
          security: [{ bearerAuth: [] }],
          responses: {
            '200': { description: 'Ticket verified' },
            '401': { $ref: '#/components/responses/UnauthorizedError' },
            '403': { $ref: '#/components/responses/ForbiddenError' },
            '404': { $ref: '#/components/responses/NotFoundError' },
          },
        },
      },

      // ========================================
      // FLEET - BUSES
      // ========================================
      '/buses': {
        post: {
          tags: ['Fleet - Buses'],
          summary: 'Create a new bus (admin)',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateBusRequest' } } },
          },
          responses: {
            '201': { description: 'Bus created' },
            '400': { $ref: '#/components/responses/ValidationError' },
            '401': { $ref: '#/components/responses/UnauthorizedError' },
            '403': { $ref: '#/components/responses/ForbiddenError' },
          },
        },
        get: {
          tags: ['Fleet - Buses'],
          summary: 'List all buses (admin/manager)',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
            { name: 'status', in: 'query', schema: { type: 'string', enum: ['active', 'maintenance', 'inactive'] } },
            { name: 'type', in: 'query', schema: { type: 'string', enum: ['VIP', 'Premium', 'Mini', 'Standard'] } },
          ],
          responses: {
            '200': { description: 'Paginated list of buses' },
            '401': { $ref: '#/components/responses/UnauthorizedError' },
            '403': { $ref: '#/components/responses/ForbiddenError' },
          },
        },
      },
      '/buses/{id}': {
        get: {
          tags: ['Fleet - Buses'],
          summary: 'Get bus by ID (admin/manager)',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            '200': { description: 'Bus data' },
            '401': { $ref: '#/components/responses/UnauthorizedError' },
            '403': { $ref: '#/components/responses/ForbiddenError' },
            '404': { $ref: '#/components/responses/NotFoundError' },
          },
        },
        patch: {
          tags: ['Fleet - Buses'],
          summary: 'Update a bus (admin/manager)',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            '200': { description: 'Bus updated' },
            '401': { $ref: '#/components/responses/UnauthorizedError' },
            '403': { $ref: '#/components/responses/ForbiddenError' },
            '404': { $ref: '#/components/responses/NotFoundError' },
          },
        },
        delete: {
          tags: ['Fleet - Buses'],
          summary: 'Delete a bus (admin)',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            '200': { description: 'Bus deleted' },
            '401': { $ref: '#/components/responses/UnauthorizedError' },
            '403': { $ref: '#/components/responses/ForbiddenError' },
            '404': { $ref: '#/components/responses/NotFoundError' },
          },
        },
      },
      '/buses/{id}/status': {
        patch: {
          tags: ['Fleet - Buses'],
          summary: 'Update bus status (admin)',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateBusStatusRequest' } } },
          },
          responses: {
            '200': { description: 'Bus status updated' },
            '401': { $ref: '#/components/responses/UnauthorizedError' },
            '403': { $ref: '#/components/responses/ForbiddenError' },
            '404': { $ref: '#/components/responses/NotFoundError' },
          },
        },
      },
      '/buses/{id}/assign-driver': {
        patch: {
          tags: ['Fleet - Buses'],
          summary: 'Assign a driver to a bus (admin)',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/AssignDriverRequest' } } },
          },
          responses: {
            '200': { description: 'Driver assigned' },
            '401': { $ref: '#/components/responses/UnauthorizedError' },
            '403': { $ref: '#/components/responses/ForbiddenError' },
            '404': { $ref: '#/components/responses/NotFoundError' },
          },
        },
      },
      '/buses/{id}/maintenance': {
        get: {
          tags: ['Fleet - Buses'],
          summary: 'Get maintenance logs for a bus (admin/manager)',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            '200': { description: 'Maintenance logs' },
            '401': { $ref: '#/components/responses/UnauthorizedError' },
            '403': { $ref: '#/components/responses/ForbiddenError' },
            '404': { $ref: '#/components/responses/NotFoundError' },
          },
        },
        post: {
          tags: ['Fleet - Buses'],
          summary: 'Add a maintenance log to a bus (admin)',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/AddMaintenanceLogRequest' } } },
          },
          responses: {
            '201': { description: 'Maintenance log added' },
            '401': { $ref: '#/components/responses/UnauthorizedError' },
            '403': { $ref: '#/components/responses/ForbiddenError' },
            '404': { $ref: '#/components/responses/NotFoundError' },
          },
        },
      },

      // ========================================
      // FLEET - MAINTENANCE RECORDS
      // ========================================
      '/maintenance-records': {
        get: {
          tags: ['Fleet - Maintenance Records'],
          summary: 'List all maintenance records',
          security: [{ bearerAuth: [] }],
          responses: {
            '200': { description: 'List of maintenance records' },
            '401': { $ref: '#/components/responses/UnauthorizedError' },
          },
        },
        post: {
          tags: ['Fleet - Maintenance Records'],
          summary: 'Create a maintenance record (admin)',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateMaintenanceRecordRequest' } } },
          },
          responses: {
            '201': { description: 'Maintenance record created' },
            '400': { $ref: '#/components/responses/ValidationError' },
            '401': { $ref: '#/components/responses/UnauthorizedError' },
            '403': { $ref: '#/components/responses/ForbiddenError' },
          },
        },
      },
      '/maintenance-records/{id}': {
        get: {
          tags: ['Fleet - Maintenance Records'],
          summary: 'Get maintenance record by ID',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            '200': { description: 'Maintenance record' },
            '401': { $ref: '#/components/responses/UnauthorizedError' },
            '404': { $ref: '#/components/responses/NotFoundError' },
          },
        },
        patch: {
          tags: ['Fleet - Maintenance Records'],
          summary: 'Update a maintenance record (admin)',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            '200': { description: 'Record updated' },
            '401': { $ref: '#/components/responses/UnauthorizedError' },
            '403': { $ref: '#/components/responses/ForbiddenError' },
          },
        },
        delete: {
          tags: ['Fleet - Maintenance Records'],
          summary: 'Delete a maintenance record (admin)',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            '200': { description: 'Record deleted' },
            '401': { $ref: '#/components/responses/UnauthorizedError' },
            '403': { $ref: '#/components/responses/ForbiddenError' },
          },
        },
      },

      // ========================================
      // FLEET - MAINTENANCE FACILITIES
      // ========================================
      '/maintenance-facilities': {
        get: {
          tags: ['Fleet - Maintenance Facilities'],
          summary: 'List all maintenance facilities',
          security: [{ bearerAuth: [] }],
          responses: {
            '200': { description: 'List of facilities' },
            '401': { $ref: '#/components/responses/UnauthorizedError' },
          },
        },
        post: {
          tags: ['Fleet - Maintenance Facilities'],
          summary: 'Create a maintenance facility (admin)',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateFacilityRequest' } } },
          },
          responses: {
            '201': { description: 'Facility created' },
            '400': { $ref: '#/components/responses/ValidationError' },
            '401': { $ref: '#/components/responses/UnauthorizedError' },
            '403': { $ref: '#/components/responses/ForbiddenError' },
          },
        },
      },
      '/maintenance-facilities/{id}': {
        get: {
          tags: ['Fleet - Maintenance Facilities'],
          summary: 'Get facility by ID',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            '200': { description: 'Facility data' },
            '401': { $ref: '#/components/responses/UnauthorizedError' },
            '404': { $ref: '#/components/responses/NotFoundError' },
          },
        },
        patch: {
          tags: ['Fleet - Maintenance Facilities'],
          summary: 'Update a facility (admin)',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            '200': { description: 'Facility updated' },
            '401': { $ref: '#/components/responses/UnauthorizedError' },
            '403': { $ref: '#/components/responses/ForbiddenError' },
            '404': { $ref: '#/components/responses/NotFoundError' },
          },
        },
        delete: {
          tags: ['Fleet - Maintenance Facilities'],
          summary: 'Delete a facility (admin)',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            '200': { description: 'Facility deleted' },
            '401': { $ref: '#/components/responses/UnauthorizedError' },
            '403': { $ref: '#/components/responses/ForbiddenError' },
            '404': { $ref: '#/components/responses/NotFoundError' },
          },
        },
      },
      '/maintenance-facilities/{id}/maintenance': {
        get: {
          tags: ['Fleet - Maintenance Facilities'],
          summary: 'Get maintenance records for a facility',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            '200': { description: 'Facility maintenance records' },
            '401': { $ref: '#/components/responses/UnauthorizedError' },
            '404': { $ref: '#/components/responses/NotFoundError' },
          },
        },
      },

      // ========================================
      // FLEET - MAINTENANCE STAFF
      // ========================================
      '/maintenance-staff': {
        get: {
          tags: ['Fleet - Maintenance Staff'],
          summary: 'List all maintenance staff',
          security: [{ bearerAuth: [] }],
          responses: {
            '200': { description: 'List of staff' },
            '401': { $ref: '#/components/responses/UnauthorizedError' },
          },
        },
        post: {
          tags: ['Fleet - Maintenance Staff'],
          summary: 'Create maintenance staff (admin)',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateStaffRequest' } } },
          },
          responses: {
            '201': { description: 'Staff created' },
            '400': { $ref: '#/components/responses/ValidationError' },
            '401': { $ref: '#/components/responses/UnauthorizedError' },
            '403': { $ref: '#/components/responses/ForbiddenError' },
          },
        },
      },
      '/maintenance-staff/{id}': {
        get: {
          tags: ['Fleet - Maintenance Staff'],
          summary: 'Get staff by ID',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            '200': { description: 'Staff data' },
            '401': { $ref: '#/components/responses/UnauthorizedError' },
            '404': { $ref: '#/components/responses/NotFoundError' },
          },
        },
        patch: {
          tags: ['Fleet - Maintenance Staff'],
          summary: 'Update staff (admin)',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            '200': { description: 'Staff updated' },
            '401': { $ref: '#/components/responses/UnauthorizedError' },
            '403': { $ref: '#/components/responses/ForbiddenError' },
          },
        },
        delete: {
          tags: ['Fleet - Maintenance Staff'],
          summary: 'Delete staff (admin)',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            '200': { description: 'Staff deleted' },
            '401': { $ref: '#/components/responses/UnauthorizedError' },
            '403': { $ref: '#/components/responses/ForbiddenError' },
          },
        },
      },

      // ========================================
      // FLEET - MAINTENANCE SCHEDULES
      // ========================================
      '/maintenance-schedules': {
        get: {
          tags: ['Fleet - Maintenance Schedules'],
          summary: 'List all maintenance schedules',
          security: [{ bearerAuth: [] }],
          responses: {
            '200': { description: 'List of schedules' },
            '401': { $ref: '#/components/responses/UnauthorizedError' },
          },
        },
        post: {
          tags: ['Fleet - Maintenance Schedules'],
          summary: 'Create a maintenance schedule (admin)',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateScheduleRequest' } } },
          },
          responses: {
            '201': { description: 'Schedule created' },
            '400': { $ref: '#/components/responses/ValidationError' },
            '401': { $ref: '#/components/responses/UnauthorizedError' },
            '403': { $ref: '#/components/responses/ForbiddenError' },
          },
        },
      },
      '/maintenance-schedules/{id}': {
        get: {
          tags: ['Fleet - Maintenance Schedules'],
          summary: 'Get schedule by ID',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            '200': { description: 'Schedule data' },
            '401': { $ref: '#/components/responses/UnauthorizedError' },
            '404': { $ref: '#/components/responses/NotFoundError' },
          },
        },
        patch: {
          tags: ['Fleet - Maintenance Schedules'],
          summary: 'Update a schedule (admin)',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            '200': { description: 'Schedule updated' },
            '401': { $ref: '#/components/responses/UnauthorizedError' },
            '403': { $ref: '#/components/responses/ForbiddenError' },
          },
        },
        delete: {
          tags: ['Fleet - Maintenance Schedules'],
          summary: 'Delete a schedule (admin)',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            '200': { description: 'Schedule deleted' },
            '401': { $ref: '#/components/responses/UnauthorizedError' },
            '403': { $ref: '#/components/responses/ForbiddenError' },
          },
        },
      },

      // ========================================
      // FLEET - WORK ORDERS
      // ========================================
      '/work-orders': {
        get: {
          tags: ['Fleet - Work Orders'],
          summary: 'List all work orders',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'status', in: 'query', schema: { type: 'string', enum: ['pending', 'in_progress', 'waiting_parts', 'completed', 'cancelled'] } },
            { name: 'busId', in: 'query', schema: { type: 'string' } },
          ],
          responses: {
            '200': { description: 'List of work orders' },
            '401': { $ref: '#/components/responses/UnauthorizedError' },
          },
        },
        post: {
          tags: ['Fleet - Work Orders'],
          summary: 'Create a work order (admin)',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateWorkOrderRequest' } } },
          },
          responses: {
            '201': { description: 'Work order created' },
            '400': { $ref: '#/components/responses/ValidationError' },
            '401': { $ref: '#/components/responses/UnauthorizedError' },
            '403': { $ref: '#/components/responses/ForbiddenError' },
          },
        },
      },
      '/work-orders/{id}': {
        get: {
          tags: ['Fleet - Work Orders'],
          summary: 'Get work order by ID',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            '200': { description: 'Work order data' },
            '401': { $ref: '#/components/responses/UnauthorizedError' },
            '404': { $ref: '#/components/responses/NotFoundError' },
          },
        },
        patch: {
          tags: ['Fleet - Work Orders'],
          summary: 'Update a work order (admin)',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            '200': { description: 'Work order updated' },
            '401': { $ref: '#/components/responses/UnauthorizedError' },
            '403': { $ref: '#/components/responses/ForbiddenError' },
          },
        },
        delete: {
          tags: ['Fleet - Work Orders'],
          summary: 'Delete a work order (admin)',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            '200': { description: 'Work order deleted' },
            '401': { $ref: '#/components/responses/UnauthorizedError' },
            '403': { $ref: '#/components/responses/ForbiddenError' },
          },
        },
      },
      '/work-orders/{id}/status': {
        patch: {
          tags: ['Fleet - Work Orders'],
          summary: 'Update work order status (admin)',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { type: 'object', properties: { status: { type: 'string', enum: ['pending', 'in_progress', 'waiting_parts', 'completed', 'cancelled'] } }, required: ['status'] } } },
          },
          responses: {
            '200': { description: 'Status updated' },
            '401': { $ref: '#/components/responses/UnauthorizedError' },
            '403': { $ref: '#/components/responses/ForbiddenError' },
            '404': { $ref: '#/components/responses/NotFoundError' },
          },
        },
      },

      // ========================================
      // FLEET - MAINTENANCE DASHBOARD
      // ========================================
      '/maintenance-dashboard': {
        get: {
          tags: ['Fleet - Maintenance Dashboard'],
          summary: 'Get maintenance dashboard overview',
          security: [{ bearerAuth: [] }],
          responses: {
            '200': { description: 'Dashboard overview' },
            '401': { $ref: '#/components/responses/UnauthorizedError' },
          },
        },
      },

      // ========================================
      // STATIONS
      // ========================================
      '/stations': {
        get: {
          tags: ['Stations'],
          summary: 'List all stations (admin/manager)',
          security: [{ bearerAuth: [] }],
          responses: {
            '200': { description: 'List of stations' },
            '401': { $ref: '#/components/responses/UnauthorizedError' },
            '403': { $ref: '#/components/responses/ForbiddenError' },
          },
        },
        post: {
          tags: ['Stations'],
          summary: 'Create a station (admin)',
          security: [{ bearerAuth: [] }],
          responses: {
            '201': { description: 'Station created' },
            '400': { $ref: '#/components/responses/ValidationError' },
            '401': { $ref: '#/components/responses/UnauthorizedError' },
            '403': { $ref: '#/components/responses/ForbiddenError' },
          },
        },
      },
      '/stations/distance': {
        get: {
          tags: ['Stations'],
          summary: 'Get distance between stations (admin/manager)',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'from', in: 'query', required: true, schema: { type: 'string' }, description: 'Station ID' },
            { name: 'to', in: 'query', required: true, schema: { type: 'string' }, description: 'Station ID' },
          ],
          responses: {
            '200': { description: 'Distance data' },
            '401': { $ref: '#/components/responses/UnauthorizedError' },
          },
        },
      },
      '/stations/{id}': {
        get: {
          tags: ['Stations'],
          summary: 'Get station by ID (admin/manager)',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            '200': { description: 'Station data' },
            '401': { $ref: '#/components/responses/UnauthorizedError' },
            '404': { $ref: '#/components/responses/NotFoundError' },
          },
        },
        patch: {
          tags: ['Stations'],
          summary: 'Update a station (admin/manager)',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            '200': { description: 'Station updated' },
            '401': { $ref: '#/components/responses/UnauthorizedError' },
            '403': { $ref: '#/components/responses/ForbiddenError' },
          },
        },
        delete: {
          tags: ['Stations'],
          summary: 'Delete a station (admin)',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            '200': { description: 'Station deleted' },
            '401': { $ref: '#/components/responses/UnauthorizedError' },
            '403': { $ref: '#/components/responses/ForbiddenError' },
          },
        },
      },

      // ========================================
      // CITIES
      // ========================================
      '/cities': {
        get: {
          tags: ['Cities'],
          summary: 'List all cities (admin/manager)',
          security: [{ bearerAuth: [] }],
          responses: {
            '200': { description: 'List of cities' },
            '401': { $ref: '#/components/responses/UnauthorizedError' },
            '403': { $ref: '#/components/responses/ForbiddenError' },
          },
        },
        post: {
          tags: ['Cities'],
          summary: 'Create a city (admin)',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateCityRequest' } } },
          },
          responses: {
            '201': { description: 'City created' },
            '400': { $ref: '#/components/responses/ValidationError' },
            '401': { $ref: '#/components/responses/UnauthorizedError' },
            '403': { $ref: '#/components/responses/ForbiddenError' },
          },
        },
      },
      '/cities/distance': {
        get: {
          tags: ['Cities'],
          summary: 'Get distance between cities (admin/manager)',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'from', in: 'query', required: true, schema: { type: 'string' }, description: 'City ID' },
            { name: 'to', in: 'query', required: true, schema: { type: 'string' }, description: 'City ID' },
          ],
          responses: {
            '200': { description: 'Distance data' },
            '401': { $ref: '#/components/responses/UnauthorizedError' },
          },
        },
      },
      '/cities/{id}': {
        get: {
          tags: ['Cities'],
          summary: 'Get city by ID (admin/manager)',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            '200': { description: 'City data' },
            '401': { $ref: '#/components/responses/UnauthorizedError' },
            '404': { $ref: '#/components/responses/NotFoundError' },
          },
        },
        patch: {
          tags: ['Cities'],
          summary: 'Update a city (admin/manager)',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            content: { 'application/json': { schema: { type: 'object' } } },
          },
          responses: {
            '200': { description: 'City updated' },
            '401': { $ref: '#/components/responses/UnauthorizedError' },
            '403': { $ref: '#/components/responses/ForbiddenError' },
          },
        },
        delete: {
          tags: ['Cities'],
          summary: 'Delete a city (admin)',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            '200': { description: 'City deleted' },
            '401': { $ref: '#/components/responses/UnauthorizedError' },
            '403': { $ref: '#/components/responses/ForbiddenError' },
          },
        },
      },
      '/cities/{id}/geocode': {
        post: {
          tags: ['Cities'],
          summary: 'Geocode a city (admin)',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            '200': { description: 'City geocoded' },
            '401': { $ref: '#/components/responses/UnauthorizedError' },
            '403': { $ref: '#/components/responses/ForbiddenError' },
          },
        },
      },

      // ========================================
      // TRACKING
      // ========================================
      '/tracking/live/{tripId}': {
        get: {
          tags: ['Tracking'],
          summary: 'Get live GPS location for a trip (admin)',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'tripId', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            '200': { description: 'Live bus location' },
            '401': { $ref: '#/components/responses/UnauthorizedError' },
            '403': { $ref: '#/components/responses/ForbiddenError' },
            '404': { $ref: '#/components/responses/NotFoundError' },
          },
        },
      },
      '/tracking/bus/{busId}': {
        get: {
          tags: ['Tracking'],
          summary: 'Get current location of a bus (admin)',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'busId', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            '200': { description: 'Bus location' },
            '401': { $ref: '#/components/responses/UnauthorizedError' },
            '403': { $ref: '#/components/responses/ForbiddenError' },
            '404': { $ref: '#/components/responses/NotFoundError' },
          },
        },
      },
      '/tracking/active-buses': {
        get: {
          tags: ['Tracking'],
          summary: 'Get all currently active bus locations (admin)',
          security: [{ bearerAuth: [] }],
          responses: {
            '200': { description: 'List of active bus locations' },
            '401': { $ref: '#/components/responses/UnauthorizedError' },
            '403': { $ref: '#/components/responses/ForbiddenError' },
          },
        },
      },

      // ========================================
      // ANALYTICS
      // ========================================
      '/analytics/dashboard': {
        get: {
          tags: ['Analytics'],
          summary: 'Get dashboard overview (admin/manager)',
          security: [{ bearerAuth: [] }],
          responses: {
            '200': { description: 'Dashboard overview data' },
            '401': { $ref: '#/components/responses/UnauthorizedError' },
            '403': { $ref: '#/components/responses/ForbiddenError' },
          },
        },
      },
      '/analytics/revenue': {
        get: {
          tags: ['Analytics'],
          summary: 'Get revenue analytics (admin/manager)',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'from', in: 'query', schema: { type: 'string', format: 'date' } },
            { name: 'to', in: 'query', schema: { type: 'string', format: 'date' } },
          ],
          responses: {
            '200': { description: 'Revenue analytics' },
            '401': { $ref: '#/components/responses/UnauthorizedError' },
            '403': { $ref: '#/components/responses/ForbiddenError' },
          },
        },
      },
      '/analytics/bookings': {
        get: {
          tags: ['Analytics'],
          summary: 'Get booking analytics (admin/manager)',
          security: [{ bearerAuth: [] }],
          responses: {
            '200': { description: 'Booking analytics' },
            '401': { $ref: '#/components/responses/UnauthorizedError' },
            '403': { $ref: '#/components/responses/ForbiddenError' },
          },
        },
      },
      '/analytics/trips': {
        get: {
          tags: ['Analytics'],
          summary: 'Get trip analytics (admin/manager)',
          security: [{ bearerAuth: [] }],
          responses: {
            '200': { description: 'Trip analytics' },
            '401': { $ref: '#/components/responses/UnauthorizedError' },
            '403': { $ref: '#/components/responses/ForbiddenError' },
          },
        },
      },
      '/analytics/users': {
        get: {
          tags: ['Analytics'],
          summary: 'Get user analytics (admin/manager)',
          security: [{ bearerAuth: [] }],
          responses: {
            '200': { description: 'User analytics' },
            '401': { $ref: '#/components/responses/UnauthorizedError' },
            '403': { $ref: '#/components/responses/ForbiddenError' },
          },
        },
      },
      '/analytics/booking-trends': {
        get: {
          tags: ['Analytics'],
          summary: 'Get booking trends (admin/manager)',
          security: [{ bearerAuth: [] }],
          responses: {
            '200': { description: 'Booking trends' },
            '401': { $ref: '#/components/responses/UnauthorizedError' },
            '403': { $ref: '#/components/responses/ForbiddenError' },
          },
        },
      },
      '/analytics/monthly-revenue': {
        get: {
          tags: ['Analytics'],
          summary: 'Get monthly revenue breakdown (admin/manager)',
          security: [{ bearerAuth: [] }],
          responses: {
            '200': { description: 'Monthly revenue' },
            '401': { $ref: '#/components/responses/UnauthorizedError' },
            '403': { $ref: '#/components/responses/ForbiddenError' },
          },
        },
      },
      '/analytics/route-performance': {
        get: {
          tags: ['Analytics'],
          summary: 'Get route performance metrics (admin/manager)',
          security: [{ bearerAuth: [] }],
          responses: {
            '200': { description: 'Route performance' },
            '401': { $ref: '#/components/responses/UnauthorizedError' },
            '403': { $ref: '#/components/responses/ForbiddenError' },
          },
        },
      },
      '/analytics/bus-utilization': {
        get: {
          tags: ['Analytics'],
          summary: 'Get bus utilization stats (admin/manager)',
          security: [{ bearerAuth: [] }],
          responses: {
            '200': { description: 'Bus utilization' },
            '401': { $ref: '#/components/responses/UnauthorizedError' },
            '403': { $ref: '#/components/responses/ForbiddenError' },
          },
        },
      },
      '/analytics/cancellation-stats': {
        get: {
          tags: ['Analytics'],
          summary: 'Get cancellation statistics (admin/manager)',
          security: [{ bearerAuth: [] }],
          responses: {
            '200': { description: 'Cancellation stats' },
            '401': { $ref: '#/components/responses/UnauthorizedError' },
            '403': { $ref: '#/components/responses/ForbiddenError' },
          },
        },
      },
      '/analytics/peak-times': {
        get: {
          tags: ['Analytics'],
          summary: 'Get peak departure times (admin/manager)',
          security: [{ bearerAuth: [] }],
          responses: {
            '200': { description: 'Peak time data' },
            '401': { $ref: '#/components/responses/UnauthorizedError' },
            '403': { $ref: '#/components/responses/ForbiddenError' },
          },
        },
      },
      '/analytics/live-trips': {
        get: {
          tags: ['Analytics'],
          summary: 'Get currently active/live trips (admin/manager)',
          security: [{ bearerAuth: [] }],
          responses: {
            '200': { description: 'Live trips' },
            '401': { $ref: '#/components/responses/UnauthorizedError' },
            '403': { $ref: '#/components/responses/ForbiddenError' },
          },
        },
      },
      '/analytics/recent-bookings': {
        get: {
          tags: ['Analytics'],
          summary: 'Get recent bookings (admin/manager)',
          security: [{ bearerAuth: [] }],
          responses: {
            '200': { description: 'Recent bookings' },
            '401': { $ref: '#/components/responses/UnauthorizedError' },
            '403': { $ref: '#/components/responses/ForbiddenError' },
          },
        },
      },
      '/analytics/payment-summary': {
        get: {
          tags: ['Analytics'],
          summary: 'Get payment summary (admin/manager)',
          security: [{ bearerAuth: [] }],
          responses: {
            '200': { description: 'Payment summary' },
            '401': { $ref: '#/components/responses/UnauthorizedError' },
            '403': { $ref: '#/components/responses/ForbiddenError' },
          },
        },
      },
      '/analytics/alerts': {
        get: {
          tags: ['Analytics'],
          summary: 'Get system alerts (admin/manager)',
          security: [{ bearerAuth: [] }],
          responses: {
            '200': { description: 'Alerts' },
            '401': { $ref: '#/components/responses/UnauthorizedError' },
            '403': { $ref: '#/components/responses/ForbiddenError' },
          },
        },
      },
      '/analytics/today-stats': {
        get: {
          tags: ['Analytics'],
          summary: 'Get today\'s statistics (admin/manager)',
          security: [{ bearerAuth: [] }],
          responses: {
            '200': { description: 'Today stats' },
            '401': { $ref: '#/components/responses/UnauthorizedError' },
            '403': { $ref: '#/components/responses/ForbiddenError' },
          },
        },
      },
      '/analytics/customer-metrics': {
        get: {
          tags: ['Analytics'],
          summary: 'Get customer analytics (admin/manager)',
          security: [{ bearerAuth: [] }],
          responses: {
            '200': { description: 'Customer metrics' },
            '401': { $ref: '#/components/responses/UnauthorizedError' },
            '403': { $ref: '#/components/responses/ForbiddenError' },
          },
        },
      },
      '/analytics/payment-analytics': {
        get: {
          tags: ['Analytics'],
          summary: 'Get payment analytics (admin/manager)',
          security: [{ bearerAuth: [] }],
          responses: {
            '200': { description: 'Payment analytics' },
            '401': { $ref: '#/components/responses/UnauthorizedError' },
            '403': { $ref: '#/components/responses/ForbiddenError' },
          },
        },
      },

      // ========================================
      // NOTIFICATIONS
      // ========================================
      '/notifications': {
        get: {
          tags: ['Notifications'],
          summary: 'List all notifications (admin/manager)',
          security: [{ bearerAuth: [] }],
          responses: {
            '200': { description: 'List of notifications' },
            '401': { $ref: '#/components/responses/UnauthorizedError' },
            '403': { $ref: '#/components/responses/ForbiddenError' },
          },
        },
      },
      '/notifications/my': {
        get: {
          tags: ['Notifications'],
          summary: 'Get current user\'s notifications',
          security: [{ bearerAuth: [] }],
          responses: {
            '200': { description: 'User notifications' },
            '401': { $ref: '#/components/responses/UnauthorizedError' },
          },
        },
      },
      '/notifications/read-all': {
        patch: {
          tags: ['Notifications'],
          summary: 'Mark all notifications as read',
          security: [{ bearerAuth: [] }],
          responses: {
            '200': { description: 'All marked as read' },
            '401': { $ref: '#/components/responses/UnauthorizedError' },
          },
        },
      },
      '/notifications/{id}/read': {
        patch: {
          tags: ['Notifications'],
          summary: 'Mark a notification as read',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            '200': { description: 'Notification marked as read' },
            '401': { $ref: '#/components/responses/UnauthorizedError' },
            '404': { $ref: '#/components/responses/NotFoundError' },
          },
        },
      },

      // ========================================
      // CONFIG
      // ========================================
      '/config': {
        get: {
          tags: ['Config'],
          summary: 'Get tenant configuration',
          security: [{ bearerAuth: [] }],
          responses: {
            '200': { description: 'Configuration data' },
            '401': { $ref: '#/components/responses/UnauthorizedError' },
          },
        },
        patch: {
          tags: ['Config'],
          summary: 'Update tenant configuration (admin)',
          security: [{ bearerAuth: [] }],
          responses: {
            '200': { description: 'Configuration updated' },
            '401': { $ref: '#/components/responses/UnauthorizedError' },
            '403': { $ref: '#/components/responses/ForbiddenError' },
          },
        },
      },
      '/config/reset': {
        post: {
          tags: ['Config'],
          summary: 'Reset configuration to defaults (admin)',
          security: [{ bearerAuth: [] }],
          responses: {
            '200': { description: 'Configuration reset' },
            '401': { $ref: '#/components/responses/UnauthorizedError' },
            '403': { $ref: '#/components/responses/ForbiddenError' },
          },
        },
      },

      // ========================================
      // AUDIT
      // ========================================
      '/audit': {
        get: {
          tags: ['Audit'],
          summary: 'List all audit logs (admin)',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
            { name: 'module', in: 'query', schema: { type: 'string' } },
            { name: 'action', in: 'query', schema: { type: 'string' } },
            { name: 'userId', in: 'query', schema: { type: 'string' } },
            { name: 'from', in: 'query', schema: { type: 'string', format: 'date' } },
            { name: 'to', in: 'query', schema: { type: 'string', format: 'date' } },
          ],
          responses: {
            '200': { description: 'Paginated audit logs' },
            '401': { $ref: '#/components/responses/UnauthorizedError' },
            '403': { $ref: '#/components/responses/ForbiddenError' },
          },
        },
      },
      '/audit/{id}': {
        get: {
          tags: ['Audit'],
          summary: 'Get audit log by ID (admin)',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            '200': { description: 'Audit log entry' },
            '401': { $ref: '#/components/responses/UnauthorizedError' },
            '403': { $ref: '#/components/responses/ForbiddenError' },
            '404': { $ref: '#/components/responses/NotFoundError' },
          },
        },
      },

      // ========================================
      // UPLOADS
      // ========================================
      '/uploads': {
        post: {
          tags: ['Uploads'],
          summary: 'Upload files (images)',
          description: 'Accepts multipart/form-data with field "files". Supports up to 10 files, max 5MB each. Allowed: jpeg, png, webp, gif.',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  properties: {
                    files: {
                      type: 'array',
                      items: { type: 'string', format: 'binary' },
                      description: 'Image files (max 10, 5MB each)',
                    },
                  },
                },
              },
            },
          },
          responses: {
            '200': { description: 'Files uploaded', content: { 'application/json': { schema: { $ref: '#/components/schemas/UploadResponse' } } } },
            '400': { description: 'Validation error (wrong file type, too large, etc.)' },
            '401': { $ref: '#/components/responses/UnauthorizedError' },
          },
        },
      },
    },
  },
  apis: [],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
