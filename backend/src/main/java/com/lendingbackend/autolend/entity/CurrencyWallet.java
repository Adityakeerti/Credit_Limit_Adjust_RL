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
 * User's balance in a specific currency.
 */
@Entity
@Table(name = "currency_wallets", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"user_id", "currency_id"})
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CurrencyWallet {

    @Id
    @Column(name = "wallet_id")
    private UUID walletId;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "currency_id", nullable = false)
    private UUID currencyId;

    @Column(name = "currency_code", length = 10)
    private String currencyCode; // VEX, USD

    @Column(nullable = false, precision = 19, scale = 4)
    private BigDecimal balance;

    @Column(name = "locked_balance", precision = 19, scale = 4)
    private BigDecimal lockedBalance;

    @Column(name = "updated_at")
    private Instant updatedAt;

    @PrePersist
    public void prePersist() {
        if (walletId == null) walletId = UUID.randomUUID();
        if (balance == null) balance = BigDecimal.ZERO;
        if (lockedBalance == null) lockedBalance = BigDecimal.ZERO;
        updatedAt = Instant.now();
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = Instant.now();
    }
}
