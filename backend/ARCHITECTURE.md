# Mousa DAO — Backend Architecture

Node.js / Express 5 ভিত্তিক transport management API। MongoDB (Mongoose), Redis (ioredis), RabbitMQ (amqplib), Socket.IO ও JWT ব্যবহার করে। নিচে ব্যাকএন্ডের বিস্তারিত মারমেইড ডায়াগ্রাম দেওয়া হলো।

---

## ১. লেয়ারড আর্কিটেকচার ও রিকোয়েস্ট লাইফসাইকেল

```mermaid
flowchart TB
    CLIENT["Client (Mobile / Dashboards)"]

    subgraph APP["Express App (app.js)"]
        direction TB
        MW["Global Middleware<br/>helmet · cors · compression · morgan · json · rateLimit"]
        SWAGGER["/api-docs (Swagger UI)"]
        ROUTES["Routers /api/v1/*<br/>auth · users · trips · routes · stations<br/>bookings · tickets · payments · refund-requests<br/>buses(fleet) · tracking · tenants · analytics<br/>notifications · audit · config"]
    end

    subgraph MODULE["Per-Module Layers"]
        direction TB
        VAL["Validator<br/>(Joi validate.middleware)"]
        CTRL["Controller"]
        SVC["Service<br/>(business logic)"]
        REPO["Repository"]
        MODEL["Mongoose Model"]
    end

    ERR["error.middleware (centralized)"]

    CLIENT -->|HTTP /api/v1| MW
    MW --> ROUTES
    ROUTES --> VAL --> CTRL --> SVC --> REPO --> MODEL
    MODEL --> DB[("MongoDB")]
    SVC --> REDIS[("Redis cache")]
    SVC -->|publish events| MQ["RabbitMQ"]
    CTRL -. errors .-> ERR
    ERR --> CLIENT
```

---

## ২. অ্যাপ্লিকেশন বুটস্ট্র্যাপ (server.js)

```mermaid
flowchart LR
    START["start()"] --> ENV["dotenv config"]
    ENV --> MONGO["mongoose.connect(MONGODB_URI)"]
    MONGO --> CONS["loadConsumers()<br/>(RabbitMQ consumers)"]
    CONS --> RED{"getRedisClient()"}
    RED -->|success| ROK["Redis connected"]
    RED -->|fail| RFB["in-memory fallback"]
    ROK --> SOCK["initSocket(server)"]
    RFB --> SOCK
    SOCK --> LISTEN["http server.listen(PORT)"]
```

---

## ৩. ইভেন্ট-ড্রিভেন / কিউ আর্কিটেকচার (RabbitMQ)

```mermaid
flowchart TB
    subgraph PUB["Publishers (Services)"]
        BOOKPUB["Booking Service"]
        PAYPUB["Payment Service"]
        PGW["Payment Gateway Webhook"]
    end

    subgraph BROKER["RabbitMQ (queue/connection · channel)"]
        BQ(["booking.queue"])
        PQ(["payment.queue"])
        PWQ(["payment_webhook.queue"])
        TQ(["ticket.queue"])
        NQ(["notification.queue"])
        PDLQ(["payment.dlq"])
        WDLQ(["webhook.dlq"])
        TDLQ(["ticket.dlq"])
    end

    subgraph CONS["Consumers (consumer.loader)"]
        BCONS["booking.consumer"]
        PCONS["payment.consumer"]
        PWCONS["payment-webhook.consumer"]
        TCONS["ticket.consumer"]
    end

    BOOKPUB --> BQ --> BCONS
    PAYPUB --> PQ --> PCONS
    PGW --> PWQ --> PWCONS
    BCONS --> TQ --> TCONS
    TCONS --> NQ

    PCONS -. failure .-> PDLQ
    PWCONS -. failure .-> WDLQ
    TCONS -. failure .-> TDLQ

    BCONS --> DB[("MongoDB")]
    TCONS --> DB
    NQ --> NOTIFY["Notification delivery"]
```

---

## ৪. রিয়েল-টাইম ট্র্যাকিং (Socket.IO + Redis)

```mermaid
flowchart LR
    DRV["Driver / GPS source"] -->|emit location| IO["Socket.IO Gateway<br/>(socket/index.js)"]
    IO -->|cache latest| REDIS[("Redis")]
    IO -->|persist trail| TRACK["Tracking Module → MongoDB"]
    IO -->|broadcast room: trip| SUB1["Super Admin Live Map"]
    IO -->|broadcast room: trip| SUB2["Customer 'Track my bus'"]
```

---

## ৫. মূল ডোমেইন মডিউলসমূহ

```mermaid
flowchart TB
    subgraph CORE["Core Booking Domain"]
        AUTH["auth / users<br/>(JWT + RBAC)"]
        TRIPS["trips / routes / stations"]
        FLEET["fleet (buses)"]
        BOOK["bookings"]
        TICK["tickets (QR)"]
        PAY["payments / invoices / refunds"]
        TRACK["tracking"]
        NOTIF["notifications"]
    end

    subgraph PLATFORM["Platform / SaaS"]
        TENANTS["tenants"]
        SUBS["subscriptions"]
        IMP["impersonation"]
        PCFG["platform-config / config"]
        PANALYTICS["platform-analytics"]
        HEALTH["system-health"]
    end

    subgraph CROSS["Cross-Cutting"]
        ANALYTICS["analytics"]
        AUDIT["audit"]
        SEARCH["global-search"]
    end

    TRIPS --> FLEET
    BOOK --> TRIPS
    BOOK --> PAY
    BOOK --> TICK
    TICK --> NOTIF
    TRACK --> TRIPS
    TENANTS --> SUBS
```
