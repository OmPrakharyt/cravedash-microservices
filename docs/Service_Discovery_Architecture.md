# Microservice Identification & Service Discovery Architecture
**Course**: 24SDCS03A - SOA PROGRAMMING AND MICROSERVICES  
**Project**: PS034 Multi-Restaurant Food Ordering & Delivery Orchestration Engine  
**Team**: PS34-S-03-02 (Om Prakhar, Mradul Dixit, Abhinav Singh)  

---

## 1. Microservice Domain Boundaries & Decomposition
Applying Domain-Driven Design (DDD) bounded contexts, CraveDash decomposes the food delivery platform into 6 specialized microservices:

```
                           +-------------------------------------+
                           |   Spring Cloud Netflix Eureka        |
                           |   Service Discovery Registry (:8761)|
                           +-------------------------------------+
                                 ^           ^           ^
                                 |           |           |  Heartbeat & Registration
                                 v           v           v
+-------------------+      +-------------+ +-------------+ +-------------+
|   API Gateway     |----->| Auth Service| | Restaurant  | |   Payment   |
|   Routing (:8080) |      |   (:8084)   | |   (:8081)   | |   (:8083)   |
+-------------------+      +-------------+ +-------------+ +-------------+
         |                                        ^               ^
         |                                        |               |
         +-------------------------------->+-------------+        |
                                           |Order Service|--------+
                                           |   (:8082)   | OpenFeign
                                           +-------------+ LoadBalanced
```

### Microservice Identification Matrix
| Service Identifier | Port | Bounded Context | Database Domain | Communication Protocols |
| :--- | :--- | :--- | :--- | :--- |
| `EUREKA-SERVER` | 8761 | Service Discovery & Registry | In-Memory Instance Table | HTTP REST (Eureka Protocol) |
| `API-GATEWAY` | 8080 | Central Ingress & Security Edge | Stateless (Reactive Netty) | Reactive HTTP, Global JWT Filter |
| `AUTH-SERVICE` | 8084 | Identity & Credential Management | `users` table (BCrypt passwords) | REST, JJWT 0.11.5 |
| `RESTAURANT-SERVICE` | 8081 | Catalog, Menus & Stock | `restaurants`, `menu_items` | REST, OpenFeign Target |
| `ORDER-SERVICE` | 8082 | Workflow State Orchestration | `orders`, `order_items` | REST, OpenFeign Client |
| `PAYMENT-SERVICE` | 8083 | Transaction Ledger & Settlements | `payment_transactions` | REST, OpenFeign Target |

---

## 2. Eureka Service Discovery Implementation
Eureka acts as the dynamic phonebook for all microservices in CraveDash. Rather than hardcoding IP addresses or container ports, services find each other using logical names registered in Eureka.

### Eureka Server Configuration (`eureka-server/src/main/resources/application.yml`)
```yaml
server:
  port: 8761

spring:
  application:
    name: eureka-server

eureka:
  instance:
    hostname: localhost
  client:
    register-with-eureka: false   # Standalone server does not register with itself
    fetch-registry: false
    service-url:
      defaultZone: http://${eureka.instance.hostname}:${server.port}/eureka/
  server:
    enable-self-preservation: false # Instant eviction of defunct instances in dev/demo
    eviction-interval-timer-in-ms: 4000
```

### Eureka Client Registration (e.g. Order Service, Restaurant Service)
Every microservice includes `spring-cloud-starter-netflix-eureka-client` and `@EnableDiscoveryClient`:
```yaml
eureka:
  client:
    service-url:
      defaultZone: http://localhost:8761/eureka/
  instance:
    prefer-ip-address: true
    lease-renewal-interval-in-seconds: 10
    lease-expiration-duration-in-seconds: 20
```

---

## 3. High-Traffic Mealtime Load Balancing
During peak meal surges, multiple instances of `ORDER-SERVICE` or `RESTAURANT-SERVICE` can be spun up (e.g., ports 8082, 8085, 8086).

### Client-Side Load Balancing with Spring Cloud LoadBalancer
When `order-service` calls `restaurant-service`:
```java
@FeignClient(name = "restaurant-service")
public interface RestaurantClient {
    @PostMapping("/api/v1/restaurants/validate-items")
    ValidateItemsResponse validateOrderItems(@RequestBody ValidateItemsRequest request);
}
```
1. Spring Cloud OpenFeign queries the local Eureka cache for healthy instances of `RESTAURANT-SERVICE`.
2. `Spring Cloud LoadBalancer` applies Round-Robin / Weighted Response Time selection.
3. The HTTP request is routed directly to the chosen instance without bottlenecking at an intermediate physical hardware load balancer.
4. If an instance fails, Eureka's heartbeat mechanism evicts the dead instance and traffic automatically re-routes with zero service disruption.
