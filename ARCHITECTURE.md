# Mousa DAO — Transport Management Platform

Multi-tenant বাস/ট্রান্সপোর্ট বুকিং SaaS প্ল্যাটফর্ম। নিচে সিস্টেমের আর্কিটেকচার ও মূল ফ্লো মারমেইড ডায়াগ্রামে দেওয়া হলো।

---

## ১. সিস্টেম আর্কিটেকচার (High-Level)

```mermaid
flowchart TB
    subgraph Clients["Client Apps"]
        MOB["Customer Mobile App<br/>(Expo / React Native)"]
        BO["Back Office Dashboard<br/>(React + Vite, Tenant Operators)"]
        SA["Super Admin Dashboard<br/>(React + Vite, Platform Owner)"]
    end

    subgraph API["Backend API — Node.js / Express 5"]
        GW["REST API + Swagger<br/>CORS · Helmet · Rate Limit"]
        AUTHMW["Auth Middleware<br/>(JWT + RBAC + Tenant scope)"]
        IO["Socket.IO Gateway<br/>(Live Tracking)"]

        subgraph MODS["Domain Modules"]
            AUTH["Auth / Users"]
            TENANTS["Tenants"]
            SUBS["Subscriptions"]
            TRIPS["Trips / Routes / Stations"]
            FLEET["Fleet"]
            BOOK["Bookings"]
            TICK["Tickets"]
            PAY["Payments / Invoices"]
            TRACK["Tracking"]
            NOTIF["Notifications"]
            ANALYTICS["Analytics / Platform Analytics"]
            AUDIT["Audit"]
            IMP["Impersonation"]
            SEARCH["Global Search"]
            HEALTH["System Health / Config"]
        end
    end

    subgraph Async["Event-Driven Layer"]
        MQ["RabbitMQ<br/>(Queues)"]
        CONS["Consumers<br/>(Notifications, Payments)"]
        CRON["Cron Jobs<br/>(Scheduled Tasks)"]
    end

    subgraph Data["Data & Infra"]
        DB[("MongoDB<br/>(Mongoose)")]
        REDIS[("Redis<br/>(Cache / Pub-Sub)")]
    end

    subgraph External["External Services"]
        PGW["Payment Gateway"]
        MAPS["Map Tiles<br/>(Leaflet / MapLibre)"]
    end

    MOB -->|HTTPS| GW
    BO -->|HTTPS| GW
    SA -->|HTTPS| GW
    SA <-->|WebSocket| IO
    MOB <-->|WebSocket| IO

    GW --> AUTHMW --> MODS
    IO --> TRACK

    MODS --> DB
    MODS --> REDIS
    IO --> REDIS

    BOOK -->|publish| MQ
    PAY -->|publish| MQ
    MQ --> CONS
    CONS --> NOTIF
    CONS --> DB
    CRON --> MODS

    PAY <-->|Webhook| PGW
    BO --> MAPS
    SA --> MAPS
```

---

## ২. বুকিং ও পেমেন্ট ফ্লো (Sequence)

```mermaid
sequenceDiagram
    actor C as Customer (Mobile)
    participant API as Backend API
    participant DB as MongoDB
    participant MQ as RabbitMQ
    participant PG as Payment Gateway
    participant N as Notification Consumer

    C->>API: Search trips (route, date)
    API->>DB: Query trips + seat availability
    DB-->>API: Available trips
    API-->>C: Trip list + fares

    C->>API: Create booking (select seats)
    API->>DB: Lock seats + create booking (pending)
    API->>PG: Initiate payment
    PG-->>C: Payment page / redirect

    C->>PG: Complete payment
    PG-->>API: Payment webhook (success)
    API->>DB: Confirm booking + generate ticket (QR)
    API->>MQ: Publish booking.confirmed event
    MQ->>N: Consume event
    N-->>C: Push booking confirmation
    API-->>C: Ticket with QR code
```

---

## ৩. লাইভ ট্র্যাকিং ফ্লো (Real-Time)

```mermaid
flowchart LR
    DRV["Driver Device / GPS"] -->|location update| IO["Socket.IO Gateway"]
    IO -->|store latest| REDIS[("Redis")]
    IO -->|persist trail| DB[("MongoDB")]
    IO -->|broadcast| SA["Super Admin Dashboard<br/>(Live Map)"]
    IO -->|broadcast| MOB["Customer App<br/>(Track my bus)"]
```

---

## ৪. মাল্টি-টেন্যান্ট মডেল

```mermaid
flowchart TB
    PLATFORM["Platform (Super Admin)"]
    PLATFORM --> T1["Tenant A<br/>(Bus Operator)"]
    PLATFORM --> T2["Tenant B<br/>(Bus Operator)"]

    T1 --> T1F["Fleet · Routes · Trips"]
    T1 --> T1U["Staff / Drivers"]
    T1 --> T1B["Bookings · Tickets"]

    T2 --> T2F["Fleet · Routes · Trips"]
    T2 --> T2U["Staff / Drivers"]
    T2 --> T2B["Bookings · Tickets"]

    PLATFORM -.->|Subscriptions & Billing| SUB["Subscription Plans"]
    PLATFORM -.->|Impersonation| T1
    PLATFORM -.->|Platform Analytics| PA["Cross-Tenant Reports"]
```
