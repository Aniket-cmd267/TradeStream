# System Architecture Document

## Asynchronous Real-Time Trade Ingestion Engine

This document details the architectural decisions, non-blocking asynchronous processing design, and real-time push mechanism designed to handle long-running BSE exchange pulls without browser HTTP timeouts.

---

## 1. System Architecture Diagram

```mermaid
flowchart TD
    subgraph Browser Client [React Dashboard (Browser)]
        UI[Dashboard UI]
        WSClient[Native WebSocket Client]
        HTTPClient[Fetch REST Client]
    end

    subgraph Backend Server [Node.js / Express Server]
        HTTPRouter[Express REST API]
        WSServer[WebSocket Server (ws)]
        TradeService[Trade Pull Coordinator]
        TradeStore[(In-Memory Trade Store)]
    end

    subgraph External System [Mock BSE Exchange]
        BSEEndpoint[GET /getTrades]
    end

    %% Initial load
    HTTPClient -->|1. GET /api/trades| HTTPRouter
    HTTPRouter -->|Read existing| TradeStore
    HTTPRouter -->|200 OK + Seeded Trades| HTTPClient

    %% WebSocket connect
    WSClient <-->|Persistent WebSocket connection| WSServer

    %% Trigger pull
    HTTPClient -->|2. POST /api/trades/pull| HTTPRouter
    HTTPRouter -->|Start background async task| TradeService
    HTTPRouter -.->|3. Immediate HTTP 202 Accepted (<10ms)| HTTPClient

    %% Background worker
    TradeService -->|4. Async Non-Blocking Fetch| BSEEndpoint
    BSEEndpoint -.->|5. Delayed Response (10s - 15m)| TradeService

    %% Persistence & Broadcast
    TradeService -->|6. Append & Deduplicate| TradeStore
    TradeService -->|7. Broadcast TRADES_UPDATED| WSServer
    WSServer -->|8. Push Payload to All Connected Tabs| WSClient
    WSClient -->|Direct State Injection| UI
```

---

## 2. Component Responsibilities

### 1. React Dashboard (Frontend)
- **Initial Hydration:** Performs a fast `GET /api/trades` upon mounting to render already pulled trades immediately.
- **Persistent Duplex Stream:** Maintains a native WebSocket connection to `/ws` with automatic reconnection logic.
- **Trigger Pull:** Dispatches `POST /api/trades/pull` with user-selected delay and failure simulation options.
- **Non-blocking State:** Remains completely responsive during background pulls; users can search, filter, and inspect trades without waiting on a loading screen.
- **Event-Driven Reconciliation:** Directly inserts incoming trade batches from WebSocket payloads into table state without secondary network calls.

### 2. Express Server (HTTP Boundary)
- **Immediate Handshake:** Acknowledges trigger requests with `HTTP 202 Accepted` in `<10ms`, severing the HTTP connection immediately.
- **Decoupled Architecture:** Acts as an orchestration boundary between user actions and long-running external I/O.

### 3. Trade Service & Background Worker
- **Async Execution:** Launches an unawaited background promise in the Node.js event loop.
- **Concurrency Guard:** Prevents duplicate concurrent pulls by checking `isPulling()` and rejecting overlapping requests with `HTTP 409 Conflict`.
- **Fault Tolerance:** Catches upstream failures (network errors, 500s) and translates them into `PULL_FAILED` WebSocket events.

### 4. WebSocket Server (`ws`)
- **Connection Management:** Tracks active browser sockets in a `Set<WebSocket>`.
- **Multi-Tab Broadcast:** Emits incoming batches to all active sessions simultaneously.
- **Zero Polling Overhead:** Eliminates HTTP polling headers, cookies, and repetitive connection setups.

### 5. Mock BSE API (`/getTrades`)
- **Latency Emulation:** Uses asynchronous timers (`setTimeout`) to simulate heavy exchange operations ranging from 5 seconds to 15 minutes.
- **Data Generation:** Produces realistic Indian market equity records (RELIANCE, TCS, INFY, HDFCBANK, etc.) with unique trade IDs, lot sizes, and timestamps.

---

## 3. The 30-Second HTTP Timeout Problem & Solution

### The Constraint
In enterprise networks, cloud platforms (e.g. Google Cloud Run, AWS ALB, Cloudflare), and corporate proxies, HTTP connections are configured with strict idle socket timeouts—typically **30 to 60 seconds**. If a request exceeds this window without sending response headers, the intermediate proxy terminates the connection with:
`504 Gateway Timeout` or `ERR_CONNECTION_RESET`.

### Why Synchronous Architectures Fail
```
Browser ─────────────────► GET /api/trades/pull ────────► Backend
   │                                                         │
   │                                                         ▼
   │                                                   BSE (Up to 15m)
   │  ... 30 seconds elapse ...                              │
   X ◄── Proxy 504 Gateway Timeout! ── (Connection killed)   │
                                                             ▼
                                                       BSE finishes (Data lost to client)
```

### The Asynchronous + WebSocket Solution
```
Browser ─────► POST /api/trades/pull ──────► Backend
Browser ◄──── HTTP 202 Accepted (<10ms) ─── Backend (Socket closed safely!)
   │
   │ [Dashboard remains open. No timer. No open socket. No timeout risk.]
   │
   ▼
[Background: Backend waits 60s or 15m for BSE in Node.js event loop]
   │
   ▼
BSE responds ──► Backend stores data ──► WS Broadcast ──► Browser updates
```

---

## 4. Why Polling & Schedulers Are Prohibited

| Approach | Drawbacks & Failure Points |
|---|---|
| **Short Polling (`setInterval`)** | Sends hundreds of empty HTTP requests every few seconds. Wastes server bandwidth, overwhelms connection pools, and introduces latency between poll intervals. |
| **Long Polling** | Still susceptible to the 30-second proxy timeout; requires complex reconnect and timeout re-establishment logic. |
| **Page Refresh** | Destroys client-side search/filter state, causes UI flicker, and provides a terrible user experience. |
| **Cron / Schedulers** | Runs on arbitrary fixed clock intervals rather than reacting immediately to exchange completion events. |
| **Native WebSocket (Selected)** | Single persistent TCP handshake. Event-driven push as soon as data arrives. Sub-millisecond delivery with zero wasted requests. |

---

## 5. Architectural Trade-offs & Production Roadmap

### Current Implementation (Assessment Scope)
- **Trade Storage:** In-Memory Array (`tradeStore`).
  - *Pros:* Ultra-fast, zero external infrastructure dependencies, trivial setup for evaluation.
  - *Cons:* Data resets if server restarts.
- **Worker Execution:** Node.js In-Process Event Loop.
  - *Pros:* Simple to inspect and debug, no Redis requirement.
  - *Cons:* Limited to single-server scale.

### Production Evolution
1. **Durable Message Queue (BullMQ / RabbitMQ / SQS):**
   - Enqueue pull jobs with persistent idempotency keys.
   - Separate web-tier servers from worker-tier background processes.
2. **Distributed WebSocket State (Redis Pub/Sub):**
   - Connect multiple backend containers behind a load balancer with WebSocket sticky sessions and Redis pub/sub backplane.
3. **Relational Database with Indexing (PostgreSQL):**
   - Store historical trades with composite index on `(symbol, timestamp)`.
   - Batch insert (`COPY` or bulk `INSERT INTO ... ON CONFLICT DO NOTHING`).
