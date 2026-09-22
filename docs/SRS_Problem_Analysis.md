# Software Requirements Specification (SRS) & Problem Analysis
**Event Name**: 24SDCS03A - SOA PROGRAMMING AND MICROSERVICES  
**Course Code**: 24SDCS03A - SOA PROGRAMMING AND MICROSERVICES  
**Project**: PS034 : Multi-Restaurant Food Ordering & Delivery Orchestration Engine  
**Client Organization**: CraveDash Mobility Services  
**Team**: PS34-S-03-02  
- **Om Prakhar** (Team Lead, Student ID: 2400032679)
- **Mradul Dixit** (Team Member, Student ID: 2400032680)
- **Abhinav Singh** (Team Member, Student ID: 2400032681)

---

## 1. Problem Statement & Executive Summary
CraveDash Mobility Services connects hundreds of restaurant partner kitchens with millions of hungry consumers and on-demand delivery fleets across urban zones. During peak meal times (lunch 12:30–2:30 PM, dinner 7:30–10:30 PM), order volume surges exponentially by up to 15x normal load.

Under a monolithic architecture, severe problems arise:
1. **Catalog Lockup**: High volume of browsing users locking menu database tables slows order payment processing.
2. **Cascading Failures**: When payment gateways encounter latency, thread pool starvation halts menu exploration and order dispatching.
3. **Inventory Race Conditions**: Diners placing orders for items that run out of stock during kitchen preparation causes customer dissatisfaction and expensive manual refunds.
4. **Tight Coupling**: Deploying a pricing change requires building and testing the entire application.

### The Microservices Solution
To overcome these systemic bottlenecks, CraveDash mandates a Service-Oriented Architecture (SOA) and Microservices model where menu management, order workflow orchestration, and payment execution are completely isolated into independent, fault-tolerant services.

---

## 2. Stakeholders & User Personas
| Persona | User Type | Core Responsibilities & Workflow |
| :--- | :--- | :--- |
| **Om Prakhar** | Consumer (End User) | Explores digital menus, adds items to multi-item basket, authorizes digital payments, tracks delivery progress in real time. |
| **Mradul Dixit** | Restaurant Partner | Manages menu listings, updates dish pricing, toggles stock availability in real-time to avoid cancellations. |
| **Abhinav Singh** | Delivery Fleet Partner | Receives dispatch notifications once orders are confirmed and kitchen preparation begins, executes doorstep delivery. |
| **System Admin** | Operations / DevOps | Monitors service registry, checks health probes, analyzes gateway routing metrics, inspects security logs. |

---

## 3. Functional Requirements
### FR1: Dynamic Catalog & Inventory Management (Restaurant Service)
- The system must provide restaurant catalog discovery with filtering by cuisine, rating, and location.
- Restaurants must be able to toggle item availability (`isAvailable: true/false`) with zero-downtime, propagating changes immediately.
- The service must provide an atomic validation endpoint (`/api/v1/restaurants/validate-items`) to verify price consistency and stock availability for checkout.

### FR2: Order State Orchestration (Order Service)
- Consumers can place multi-item orders referencing specific menu items from an active restaurant.
- The Order Service must orchestrate the distributed saga:
  1. Validate item existence and stock with Restaurant Service.
  2. Create order record in `PENDING` state.
  3. Initiate synchronous/asynchronous payment authorization with Payment Service.
  4. Advance order state to `CONFIRMED` upon payment capture, or `CANCELLED` upon failure.
- The service must maintain order lifecycle progression: `PENDING` -> `CONFIRMED` -> `PREPARING` -> `OUT_FOR_DELIVERY` -> `DELIVERED`.
- Provides an order tracking API returning live step progression, courier details, and estimated ETA.

### FR3: Payment Authorization & Transaction Ledger (Payment Service)
- Supports multi-modal payments (UPI Instant, Credit/Debit Cards, CraveWallet).
- Ensures strict transaction idempotency via reference IDs (`TXN-XXXX`) to avoid duplicate debits.
- Stores comprehensive audit ledgers linking orders, users, amounts, and gateway trace IDs.

### FR4: Centralized Ingress Routing & Identity (API Gateway & Auth Service)
- Single entry point (`http://localhost:8080`) routing traffic to downstream microservices using Eureka service IDs.
- Validates cryptographically signed JWT tokens on protected endpoints, extracting claims (`userId`, `role`, `email`) and injecting downstream HTTP headers (`X-User-Id`, `X-User-Role`, `X-User-Email`).
- Provides CORS handling for cross-origin web client interactions.

---

## 4. Non-Functional Requirements (NFRs)
- **High Throughput & Low Latency**: Ingress gateway processing overhead under 15ms.
- **Fault Isolation**: Failure of payment provider must not bring down restaurant catalog browsing.
- **Horizontal Scalability**: Stateless microservices capable of scaling multiple instances behind Eureka client-side load balancing.
- **Security & RBAC**: HMAC-SHA256 JWT tokens with role-based access control (CONSUMER, RESTAURANT_OWNER, DELIVERY_PARTNER, ADMIN).
- **Testability**: Comprehensive unit and integration test coverage across all workflow states.
