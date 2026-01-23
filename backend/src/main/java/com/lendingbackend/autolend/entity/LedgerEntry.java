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
 * Double-entry ledger. Every financial movement creates 2 entries:
 * - DEBIT: Decrease in source account
 * - CREDIT: Increase in destination account
 * 
 * For credit card-style wallet:
 * - PURCHASE: DEBIT available_credits, CREDIT locked_credits
 * - SETTLEMENT: DEBIT locked_credits, CREDIT utilized (external)
 * - PAYMENT: CREDIT available_credits (refund from payment)
 */
@Entity
@Table(name = "ledger_entries", indexes = {
    @Index(name = "idx_ledger_txn", columnList = "txn_id"),
    @Index(name = "idx_ledger_wallet", columnList = "wallet_id"),
    @Index(name = "idx_ledger_created", columnList = "created_at")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LedgerEntry {

    @Id
    @Column(name = "entry_id")
    private UUID entryId;

    @Column(name = "txn_id", nullable = false)
    private UUID txnId;

    @Column(name = "wallet_id", nullable = false)
    private UUID walletId;

    @Column(name = "entry_type", nullable = false, length = 10)
    @Enumerated(EnumType.STRING)
    private LedgerEntryType entryType;

    @Column(name = "account_type", nullable = false, length = 30)
    @Enumerated(EnumType.STRING)
    private LedgerAccountType accountType;

    @Column(nullable = false, precision = 19, scale = 4)
    private BigDecimal amount;

    @Column(name = "balance_after", nullable = false, precision = 19, scale = 4)
    private BigDecimal balanceAfter;

    @Column(length = 255)
    private String description;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @PrePersist
    public void prePersist() {
        if (entryId == null) entryId = UUID.randomUUID();
        if (createdAt == null) createdAt = Instant.now();
    }
}
