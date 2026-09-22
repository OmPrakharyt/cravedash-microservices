# LinkedIn Article: Architecting Zero-Degradation Food Ordering Engines Using Microservices and Design Thinking (DTI)
**Published By**: Om Prakhar, Mradul Dixit, Abhinav Singh  
**Course Reference**: 24SDCS03A - SOA PROGRAMMING AND MICROSERVICES  
**Project**: PS034 Multi-Restaurant Food Ordering & Delivery Orchestration Engine (CraveDash Mobility Services)  

---

### Headline
🚀 **Orchestrating Mealtime Traffic Surges: How We Engineered a High-Throughput Food Delivery Microservices Engine using Spring Cloud, JWT, and Design Thinking (DTI)**

---

### Introduction
Every evening between 7:30 PM and 9:30 PM, urban food delivery networks face an avalanche of traffic. Thousands of hungry consumers browse dynamic digital menus, customize gourmet orders, and expect instant checkout, while restaurant kitchens scramble to prepare dishes and delivery fleets navigate crowded city streets.

For our coursework in **SOA Programming and Microservices (24SDCS03A)**, our team (**PS34-S-03-02: Om Prakhar, Mradul Dixit, and Abhinav Singh**) set out to design and build **CraveDash Mobility Services**—an enterprise-grade orchestration platform engineered from the ground up for resilience, modularity, and zero performance degradation during peak mealtime surges.

---

### Applying Design Thinking and Innovation (DTI) Concepts
Rather than jumping straight into code, we applied the 5 pillars of the **Design Thinking and Innovation (DTI)** framework:

#### 1. Empathize (Field Survey & Persona Needs)
We surveyed consumers, restaurant managers, and delivery fleet riders. We discovered the primary pain points:
- **Consumers**: Frustration when an order is placed and charged, only to be cancelled 10 minutes later because an ingredient ran out.
- **Kitchen Partners**: Inability to quickly turn off an item that is out of stock without contacting central customer support.
- **Riders**: Lack of transparent milestone tracking between kitchen preparation and dispatch.

#### 2. Define (The Core Problem Statement)
How might we isolate dynamic restaurant inventory, multi-item order execution, and payment transactions so that high browsing traffic never starves transactional processing, while ensuring strict real-time stock validation before payment capture?

#### 3. Ideate (Microservices & SOA Decoupling)
We brainstormed architectural patterns and rejected the monolithic approach in favor of:
- **Service Discovery**: Spring Cloud Netflix Eureka for decentralized service registration.
- **Edge Routing**: Reactive Spring Cloud Gateway for unified ingress and security.
- **Stateless Identity**: Asymmetric/HMAC JWT tokens carrying user claims downstream.
- **Distributed Workflow (Saga Lite)**: Choreographed inter-service communication between Order Service -> Restaurant Service -> Payment Service using OpenFeign and client-side load balancing.

#### 4. Prototype (Implementation Highlights)
- **Eureka Server (`:8761`)**: Acts as the centralized registry for dynamic scale-out.
- **API Gateway (`:8080`)**: Intercepts requests, validates JWT claims via `JwtAuthenticationFilter`, and proxies traffic via `lb://...`.
- **Auth Service (`:8084`)**: Issues HMAC-SHA256 signed JWT tokens with role claims (`CONSUMER`, `RESTAURANT_OWNER`, `DELIVERY_PARTNER`, `ADMIN`).
- **Restaurant Service (`:8081`)**: Features real-time stock toggling and atomic multi-item validation.
- **Order Service (`:8082`)**: Orchestrates the order lifecycle (`PENDING` -> `CONFIRMED` -> `PREPARING` -> `OUT_FOR_DELIVERY` -> `DELIVERED`).
- **Payment Service (`:8083`)**: Provides idempotent payment authorization.
- **Interactive Single-Page Portal**: A glassmorphic dark-mode web application providing marketplace browsing, real-time inventory management, visual 4-step order tracking, and live service mesh topology monitoring.

#### 5. Test & Validation (Unit, Integration & Stress Tests)
We achieved 100% automated test pass rates across all microservices using JUnit 5, Mockito, and Spring Boot Test:
- Verified item stock rejection prevents unauthorized payment captures.
- Tested idempotent payment execution preventing double debits.
- Validated gateway claim propagation across secure headers.

---

### Key Architectural Innovations
1. **Pre-Payment Inventory Lock & Validation**: The Order Service invokes the Restaurant Service Feign client to verify stock availability *before* charging the consumer, eliminating post-payment cancellations.
2. **Client-Side Load Balancing**: Utilizing Spring Cloud LoadBalancer, service instances discover endpoints from Eureka's local cache and balance traffic without relying on costly physical load balancers.
3. **Reactive Gateway Edge**: The API Gateway uses Non-blocking I/O (Netty) to sustain thousands of concurrent connections with sub-15ms hop latency.

---

### Team Contributions & Acknowledgments
- **Om Prakhar (Team Lead, ID: 2400032679)**: Microservice architecture design, Eureka service discovery setup, Spring Cloud Gateway configuration, and distributed Order Orchestration engine.
- **Mradul Dixit (Team Member, ID: 2400032680)**: Restaurant catalog domain, real-time availability toggle engine, and unit testing suite.
- **Abhinav Singh (Team Member, ID: 2400032681)**: Payment transaction processing, JWT security implementation, and live order tracking workflow.

---

### Conclusion & What's Next
This project demonstrated that decoupling complex business domains into autonomous microservices not only resolves high-throughput scalability challenges, but also significantly accelerates developer velocity. The integration of DTI principles ensured that the technical architecture directly solved real human frustrations for both diners and restaurant partners.

*#Microservices #SpringBoot #SpringCloud #SoftwareArchitecture #DesignThinking #DTI #Java #Eureka #APIGateway #JWT #CloudComputing*
