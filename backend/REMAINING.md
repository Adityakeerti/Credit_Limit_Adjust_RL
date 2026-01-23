# Autolend Backend - Remaining Work

> This document outlines features that are conceptualized but not yet implemented.
> Use this as a reference when continuing development.

---

## 🔴 Kafka Event-Driven Architecture

### What to Implement
Event-driven communication for async processing of:
- Credit decisions
- Transaction settlements
- Wallet updates
- Audit logging

### Suggested Approach

#### 1. Add Kafka Dependency
```xml
<dependency>
    <groupId>org.springframework.kafka</groupId>
    <artifactId>spring-kafka</artifactId>
</dependency>
```

#### 2. Configuration (application.yaml)
```yaml
spring:
  kafka:
    bootstrap-servers: localhost:9092
    consumer:
      group-id: autolend-group
      auto-offset-reset: earliest
    producer:
      key-serializer: org.apache.kafka.common.serialization.StringSerializer
      value-serializer: org.springframework.kafka.support.serializer.JsonSerializer
```

#### 3. Create Event Classes
```
src/main/java/com/lendingbackend/autolend/event/
├── CreditLockedEvent.java
├── TransactionSettledEvent.java
├── WalletUpdatedEvent.java
└── AssetPurchasedEvent.java
```

#### 4. Create Producer Service
```java
@Service
public class EventPublisher {
    private final KafkaTemplate<String, Object> kafkaTemplate;
    
    public void publishCreditLocked(UUID userId, BigDecimal amount) {
        kafkaTemplate.send("credit-events", new CreditLockedEvent(userId, amount));
    }
}
```

#### 5. Create Consumer Service
```java
@Service
public class EventConsumer {
    @KafkaListener(topics = "credit-events", groupId = "autolend-group")
    public void handleCreditEvent(CreditLockedEvent event) {
        // Process event
    }
}
```

#### 6. Topics to Create
- `credit-events` - Credit locking/releasing
- `transaction-events` - Transaction lifecycle
- `wallet-events` - Balance changes
- `audit-events` - All operations for audit trail

---

## 🟡 RL Credit Decision Logic

### Status
✅ **Implemented** in `backend/ai_service/` (Python/FastAPI)
- Uses Double DQN Agent
- Cox Proportional Hazards Model for risk
- Endpoint: `POST /v1/predict` coverage


### Integration Points
When ready, integrate with:

#### 1. Create Decision Service Interface
```java
public interface CreditDecisionService {
    CreditDecision evaluateCredit(UUID userId, BigDecimal requestedAmount);
}
```

#### 2. Expected Response
```java
public class CreditDecision {
    private boolean approved;
    private BigDecimal approvedAmount;
    private Double riskScore;
    private String reason;
    private List<String> factors;
}
```

#### 3. Integration Location
- Call from `TransactionService.createPurchase()` before locking credits
- Store decision in `credit_decisions` table for audit

#### 4. Suggested Table Schema
```sql
CREATE TABLE credit_decisions (
    decision_id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    requested_amount DECIMAL(19,4),
    approved_amount DECIMAL(19,4),
    risk_score DOUBLE,
    approved BOOLEAN,
    reason TEXT,
    factors JSONB,
    created_at TIMESTAMP
);
```

---

## 🟡 Second Database (arthacore_risk)

### Current Status
- Configuration exists in `application.yaml` under `risk.datasource`
- No entities created yet

### What to Implement

#### 1. Create Risk Datasource Config
```java
@Configuration
@EnableJpaRepositories(
    basePackages = "com.lendingbackend.autolend.risk.repository",
    entityManagerFactoryRef = "riskEntityManagerFactory"
)
public class RiskDatasourceConfig {
    // Configure separate EntityManager for risk DB
}
```

#### 2. Risk Domain Entities (in arthacore_risk DB)
```
src/main/java/com/lendingbackend/autolend/risk/entity/
├── RiskProfile.java      - User risk assessment
├── RiskEvent.java        - Risk-related events
├── RiskFactor.java       - Individual risk factors
└── CreditDecision.java   - RL model decisions
```

#### 3. Suggested Schema
```sql
-- In arthacore_risk database
CREATE TABLE risk_profiles (
    profile_id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    overall_score DOUBLE,
    payment_history_score DOUBLE,
    credit_utilization DOUBLE,
    account_age_days INTEGER,
    last_updated TIMESTAMP
);

CREATE TABLE risk_events (
    event_id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    event_type VARCHAR(50),
    severity VARCHAR(20),
    description TEXT,
    created_at TIMESTAMP
);
```

---

## 🟡 AWS Deployment

### Architecture Overview
```
┌─────────────────────────────────────────────────────────────┐
│                         AWS Cloud                           │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                      VPC                             │   │
│  │  ┌─────────────┐    ┌─────────────┐                 │   │
│  │  │     ALB     │───▶│   ECS/EC2   │                 │   │
│  │  │  (HTTPS)    │    │ Spring Boot │                 │   │
│  │  └─────────────┘    └──────┬──────┘                 │   │
│  │                            │                         │   │
│  │         ┌──────────────────┼──────────────────┐     │   │
│  │         ▼                  ▼                  ▼     │   │
│  │  ┌─────────────┐   ┌─────────────┐   ┌──────────┐  │   │
│  │  │     RDS     │   │ ElastiCache │   │   MSK    │  │   │
│  │  │ PostgreSQL  │   │   Redis     │   │  Kafka   │  │   │
│  │  └─────────────┘   └─────────────┘   └──────────┘  │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Step-by-Step Deployment

#### 1. RDS PostgreSQL
```
- Create RDS instance (PostgreSQL 15)
- Instance: db.t3.medium (or larger for production)
- Enable Multi-AZ for production
- Create databases: arthacore_bank, arthacore_risk
- Note endpoint URL for application config
```

#### 2. ElastiCache Redis
```
- Create ElastiCache cluster (Redis 7.x)
- Node type: cache.t3.medium
- Enable encryption in-transit
- Note endpoint for application config
```

#### 3. Application Deployment (ECS Fargate)
```
# Build Docker image
docker build -t autolend-backend .

# Push to ECR
aws ecr create-repository --repository-name autolend-backend
docker tag autolend-backend:latest <account>.dkr.ecr.<region>.amazonaws.com/autolend-backend
docker push <account>.dkr.ecr.<region>.amazonaws.com/autolend-backend

# Create ECS Cluster, Task Definition, Service
```

#### 4. Application Load Balancer
```
- Create ALB in public subnets
- Configure HTTPS listener (port 443)
- Add ACM certificate for SSL
- Target group pointing to ECS service
```

#### 5. Environment Variables (via Secrets Manager)
```
SPRING_DATASOURCE_URL=jdbc:postgresql://<rds-endpoint>:5432/arthacore_bank
SPRING_DATASOURCE_PASSWORD=<from-secrets-manager>
SPRING_DATA_REDIS_HOST=<elasticache-endpoint>
JWT_SECRET=<from-secrets-manager>
```

#### 6. Dockerfile (create in project root)
```dockerfile
FROM eclipse-temurin:17-jdk-alpine
WORKDIR /app
COPY target/autolend-0.0.1-SNAPSHOT.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

---

## 📁 Current Project Structure

```
src/main/java/com/lendingbackend/autolend/
├── AutolendApplication.java
├── config/
│   ├── DataSeeder.java
│   ├── JacksonConfig.java
│   ├── RedisConfig.java
│   └── SecurityConfig.java
├── controller/
│   ├── AdminController.java
│   ├── AssetController.java
│   ├── AuthController.java
│   ├── TransactionController.java
│   └── WalletController.java
├── dto/
│   ├── AuthResponse.java
│   ├── LoginRequest.java
│   └── MetricsResponse.java
├── entity/
│   ├── Asset.java
│   ├── AssetType.java
│   ├── Currency.java
│   ├── CurrencyWallet.java
│   ├── LedgerAccountType.java
│   ├── LedgerEntry.java
│   ├── LedgerEntryType.java
│   ├── Transaction.java
│   ├── TransactionStatus.java
│   ├── TransactionType.java
│   ├── User.java
│   ├── UserAsset.java
│   └── Wallet.java
├── exception/
│   └── GlobalExceptionHandler.java
├── repository/
│   ├── AssetRepository.java
│   ├── CurrencyRepository.java
│   ├── CurrencyWalletRepository.java
│   ├── LedgerEntryRepository.java
│   ├── TransactionRepository.java
│   ├── UserAssetRepository.java
│   ├── UserRepository.java
│   └── WalletRepository.java
├── security/
│   ├── JwtAuthenticationFilter.java
│   └── JwtTokenProvider.java
└── service/
    ├── AssetService.java
    ├── TransactionService.java
    └── WalletService.java
```

---

## 🔑 Test Credentials

| Role | Email | Password |
|------|-------|----------|
| ADMIN | admin@arthacore.ai | admin123 |
| USER | demo@arthacore.ai | demo123 |
| USER | test@arthacore.ai | test123 |

---

## 📡 API Endpoints Summary

### Auth (Public)
- `POST /auth/login` - Get JWT token
- `POST /auth/register` - Create user + wallet
- `GET /auth/validate` - Validate token

### Wallet
- `GET /api/wallet/{userId}` - Get credit wallet
- `POST /api/wallet/{userId}/lock` - Lock credits

### Transactions
- `POST /api/transactions/purchase` - Create purchase
- `POST /api/transactions/{txnId}/settle` - Settle
- `POST /api/transactions/{txnId}/reverse` - Reverse
- `GET /api/transactions/user/{userId}` - History
- `GET /api/transactions/{txnId}/ledger` - Audit trail

### Assets
- `GET /api/assets` - List all assets
- `GET /api/assets/portfolio/{userId}` - User holdings
- `GET /api/assets/wallet/{userId}/vex` - VexCoin balance
- `POST /api/assets/purchase` - Buy asset
- `POST /api/assets/sell` - Sell asset
- `POST /api/assets/transfer-nft` - Transfer NFT

### Admin (ADMIN role required)
- `GET /admin/users` - List users
- `GET /admin/transactions` - List transactions
- `GET /admin/metrics` - Dashboard metrics
- `PUT /admin/users/{id}/status` - Update user status
