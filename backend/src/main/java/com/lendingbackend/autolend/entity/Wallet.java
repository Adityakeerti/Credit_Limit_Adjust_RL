package com.lendingbackend.autolend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "wallets")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Wallet {

    @Id
    @Column(name = "wallet_id")
    private UUID walletId;

    @Column(name = "user_id")
    private UUID userId;

    // Usable credit limit
    @Column(name = "available_credits")
    private BigDecimal availableCredits;

    // Credits locked during pending txn
    @Column(name = "locked_credits")
    private BigDecimal lockedCredits;

    private String currency; // INR_APP
    private Instant updatedAt;
}
