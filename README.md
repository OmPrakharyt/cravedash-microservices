<<<<<<< HEAD
# CraveDash Mobility Services: Multi-Restaurant Orchestration Engine (PS034)
**Course Mapped**: 24SDCS03A - SOA PROGRAMMING AND MICROSERVICES  
**Project ID**: PS034  
**Team**: PS34-S-03-02  
- **Om Prakhar** (Team Lead, Student ID: 2400032679)
- **Mradul Dixit** (Team Member, Student ID: 2400032680)
- **Abhinav Singh** (Team Member, Student ID: 2400032681)

---

## 🌟 Executive Summary
CraveDash Mobility Services is a high-throughput, fault-tolerant food ordering and delivery fulfillment engine. The system isolates restaurant menu management, distributed order workflow state execution, and payment transaction processing into decoupled microservices, unified by **JWT security**, **Spring Cloud Gateway routing**, **PostgreSQL database persistence**, and **Netflix Eureka discovery** with client-side load balancing.

> **Note**: This project runs 100% natively on Windows using Java and Maven. Docker is completely removed and NOT required.

---

## 🏗️ Architecture & Component Overview
```
Client (Web UI) --> [Spring Cloud API Gateway :8080] (Global JWT Filter + Routing)
                          |               |                 |
                          v               v                 v
            [Auth Service :8084]  [Restaurant :8081]  [Order Service :8082]
                                                            |
                                        OpenFeign FeignClient
                                        + LoadBalancer      v
                                                  [Payment Service :8083]

All microservices register with [Netflix Eureka Discovery Server :8761]
All microservices connect to PostgreSQL [localhost:5432 / cravedash]
```

### Microservice Directory
| Microservice | Port | Primary Responsibilities |
| :--- | :--- | :--- |
| **`eureka-server`** | `8761` | Netflix Eureka Service Registry & dynamic service discovery. |
| **`api-gateway`** | `8080` | Spring Cloud Gateway, JWT verification, and load-balanced routing. |
| **`auth-service`** | `8084` | User identity, BCrypt password hashing, and HMAC-SHA256 JWT generation. |
| **`restaurant-service`** | `8081` | Dynamic menus, real-time availability toggle, and item validation. |
| **`order-service`** | `8082` | Distributed order lifecycle orchestration via OpenFeign clients. |
| **`payment-service`** | `8083` | Payment processing, transaction ledgers, and idempotency checks. |
| **`frontend`** | Browser | Modern glassmorphism SPA dashboard (Customer + Partner + Admin + Topology). |

---

## 🗄️ PostgreSQL Database Configuration
All microservices connect to the same central PostgreSQL database instance:
- **Host**: `localhost`
- **Port**: `5432`
- **Database**: `cravedash`
- **Username**: `postgres`
- **Password**: `root`

### Exact Command to Verify / Start PostgreSQL on Windows:
In an Administrator PowerShell prompt:
```powershell
# Check service status
Get-Service *postgres*

# Start PostgreSQL service if stopped
Start-Service postgresql-x64-18
```

Or using Command Prompt:
```cmd
net start postgresql-x64-18
```

To create the `cravedash` database if not already created:
```powershell
$env:PGPASSWORD='root'
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -h localhost -p 5432 -c "CREATE DATABASE cravedash;"
```

---

## 🚀 Running the Project on Windows (Without Docker)

### Option 1: One-Click Interactive Launcher
Simply double-click:
```cmd
run-all.bat
```
or run in PowerShell:
```powershell
.\run-all.ps1
```
This script ensures PostgreSQL is running, launches Eureka Server, starts each backend service in its own console window, and opens the frontend in your browser.

---

### Option 2: Step-by-Step Manual Startup (Individual Terminal Tabs)

Open a separate terminal window for each service from the project root `c:\Users\prakh\OneDrive\Desktop\snapscore\cravedash`:

#### 1. Start Eureka Discovery Server (Port 8761)
```powershell
cd eureka-server
mvn spring-boot:run
```
*Wait ~10 seconds until Eureka is available at `http://localhost:8761`.*

#### 2. Start Auth and Identity Service (Port 8084)
```powershell
cd auth-service
mvn spring-boot:run
```

#### 3. Start Restaurant Catalog Service (Port 8081)
```powershell
cd restaurant-service
mvn spring-boot:run
```

#### 4. Start Payment Transaction Service (Port 8083)
```powershell
cd payment-service
mvn spring-boot:run
```

#### 5. Start Order Orchestration Service (Port 8082)
```powershell
cd order-service
mvn spring-boot:run
```

#### 6. Start Spring Cloud API Gateway (Port 8080)
```powershell
cd api-gateway
mvn spring-boot:run
```

#### 7. Open the Frontend Web Portal
Double-click `frontend\index.html` or open in any web browser:
```powershell
Start-Process "frontend\index.html"
```

---

## 🧪 Running Automated Unit & Integration Tests
Execute the full test suite across all 7 projects with Maven:
```powershell
mvn clean test
```

---

## 📁 Academic Deliverables & Rubrics
All rubric documentation is available in `docs/`:
1. [Rubric 1: Problem Analysis & SRS](docs/SRS_Problem_Analysis.md)
2. [Rubric 2: Microservice Identification & Eureka Discovery](docs/Service_Discovery_Architecture.md)
3. [Rubric 3: JWT Authentication & Security](docs/Security_JWT_Specification.md)
4. [Rubric 4: API Gateway Configuration & Load Balancing](docs/API_Gateway_Design.md)
5. [Rubric 5: LinkedIn Article with DTI Concepts & Review](docs/LinkedIn_Article_DTI_Concepts.md)
6. [Rubric 6: MOOC Progress Record](docs/MOOC_Progress_Report.md)
=======
# cravedash-microservices
Multi-Restaurant Food Ordering &amp; Delivery Orchestration Engine built using Spring Boot, Spring Cloud, Eureka, API Gateway and JWT.
>>>>>>> 183cc5f1ff24a2725d3282e8d8e8f9e75c54af8d
