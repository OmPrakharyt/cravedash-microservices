# API Gateway Configuration & Routing Engine
**Course**: 24SDCS03A - SOA PROGRAMMING AND MICROSERVICES  
**Project**: PS034 Multi-Restaurant Food Ordering & Delivery Orchestration Engine  
**Team**: PS34-S-03-02 (Om Prakhar, Mradul Dixit, Abhinav Singh)  

---

## 1. Centralized Ingress Pattern
The CraveDash API Gateway serves as the single reverse-proxy entry point (`http://localhost:8080`) protecting internal microservices from direct public exposure, abstracting network topologies, and providing unified cross-cutting concerns:
- **Centralized Routing**: Path-based dynamic dispatching via Eureka service registration (`lb://...`).
- **Global Security**: Inspects JWT tokens prior to request forwarding.
- **Header Enrichment**: Decodes token and propagates authenticated user identity downstream.
- **Cross-Origin Resource Sharing (CORS)**: Centrally configured for seamless web browser access.

---

## 2. Dynamic Route Configuration (`application.yml`)
Routes use the Spring Cloud LoadBalancer prefix `lb://<SERVICE-ID>`:

```yaml
spring:
  cloud:
    gateway:
      discovery:
        locator:
          enabled: true
          lower-case-service-id: true
      routes:
        # Route to Auth & Identity Service
        - id: auth-service
          uri: lb://AUTH-SERVICE
          predicates:
            - Path=/api/v1/auth/**

        # Route to Restaurant & Menu Service
        - id: restaurant-service
          uri: lb://RESTAURANT-SERVICE
          predicates:
            - Path=/api/v1/restaurants/**

        # Route to Order Orchestrator Service
        - id: order-service
          uri: lb://ORDER-SERVICE
          predicates:
            - Path=/api/v1/orders/**

        # Route to Payment Transaction Service
        - id: payment-service
          uri: lb://PAYMENT-SERVICE
          predicates:
            - Path=/api/v1/payments/**
```

---

## 3. Global Filter Execution & Identity Forwarding
The gateway registers a custom `JwtAuthenticationFilter` implementing `GlobalFilter` and `Ordered`:
```java
@Component
public class JwtAuthenticationFilter implements GlobalFilter, Ordered {
    // 1. Whitelist check for public endpoints (login, register, health, public menu GETs)
    // 2. Extracts Bearer token from 'Authorization' HTTP header
    // 3. Validates HMAC signature against shared secret
    // 4. Injects authenticated headers downstream:
    ServerHttpRequest mutatedRequest = request.mutate()
            .header("X-User-Id", String.valueOf(claims.get("userId")))
            .header("X-User-Email", String.valueOf(claims.get("email")))
            .header("X-User-Role", String.valueOf(claims.get("role")))
            .header("X-User-Name", String.valueOf(claims.get("fullName")))
            .build();
    return chain.filter(exchange.mutate().request(mutatedRequest).build());
}
```

---

## 4. Centralized CORS Policy
Web browsers interacting with single-page applications require permissive preflight responses. The Gateway handles all CORS preflight requests (`OPTIONS`) before traffic reaches microservices:
```yaml
spring:
  cloud:
    gateway:
      globalcors:
        cors-configurations:
          '[/**]':
            allowedOrigins: "*"
            allowedMethods:
              - GET
              - POST
              - PUT
              - DELETE
              - OPTIONS
            allowedHeaders: "*"
            exposedHeaders:
              - Authorization
              - X-User-Id
              - X-User-Role
```
