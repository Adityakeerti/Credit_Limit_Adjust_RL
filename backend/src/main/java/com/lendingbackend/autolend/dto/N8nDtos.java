package com.lendingbackend.autolend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

public class N8nDtos {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BuyRequest {
        private String userId;
        private String assetCode;
        private BigDecimal quantity;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SellRequest {
        private String userId;
        private String holdingId;
        private BigDecimal quantity;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreditAdjustRequest {
        private String userId;
        private BigDecimal newLimit;
        private String reason;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AutoTradeConfig {
        private String userId;
        private String assetCode;
        private BigDecimal buyThreshold;  // Buy if price falls below this
        private BigDecimal sellThreshold; // Sell if price rises above this
        private BigDecimal quantity;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class WebhookResponse {
        private boolean success;
        private String message;
        private Object data;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AssetSummary {
        private String code;
        private String name;
        private BigDecimal priceVex;
        private String status;
        private String assetType;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserSummary {
        private UUID userId;
        private String name;
        private String email;
        private String status;
        private Double riskScore;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TransactionSummary {
        private UUID transactionId;
        private UUID userId;
        private BigDecimal amount;
        private String type;
        private String status;
        private String description;
        private String createdAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PlatformMetrics {
        private long totalUsers;
        private long activeUsers;
        private long totalTransactions;
        private BigDecimal totalVolume;
        private Double averageRiskScore;
    }
}
