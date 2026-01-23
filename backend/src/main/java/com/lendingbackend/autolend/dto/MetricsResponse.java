package com.lendingbackend.autolend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MetricsResponse {
    private long totalUsers;
    private long activeUsers;
    private long totalTransactions;
    private long pendingTransactions;
    private long settledTransactions;
    private BigDecimal totalTransactionVolume;
    private BigDecimal totalAvailableCredits;
    private BigDecimal totalLockedCredits;
    private Double highRiskUserPercentage;
    private Double averageRiskScore;
    private Double riskTrend;
}
