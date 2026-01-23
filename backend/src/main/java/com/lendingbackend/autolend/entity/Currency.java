package com.lendingbackend.autolend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * In-app currency like VexCoin.
 * Behaves like real-world currency with exchange rates.
 */
@Entity
@Table(name = "currencies")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Currency {

    @Id
    @Column(name = "currency_id")
    private UUID currencyId;

    @Column(nullable = false, unique = true, length = 10)
    private String code; // VEX, USD, INR

    @Column(nullable = false, length = 50)
    private String name; // VexCoin, US Dollar

    @Column(length = 5)
    private String symbol; // ₿, $, ₹

    @Column(name = "exchange_rate_to_inr", precision = 19, scale = 6)
    private BigDecimal exchangeRateToInr; // 1 VEX = X INR

    @Column(name = "is_app_currency")
    private Boolean isAppCurrency; // true for VexCoin

    private String status; // ACTIVE, INACTIVE

    @Column(name = "created_at")
    private Instant createdAt;

    @PrePersist
    public void prePersist() {
        if (currencyId == null) currencyId = UUID.randomUUID();
        if (createdAt == null) createdAt = Instant.now();
    }
}
