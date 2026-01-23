package com.lendingbackend.autolend.events;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TransactionEvent {
    private UUID eventId;
    private String eventType; // TRANSACTION_CREATED, TRANSACTION_COMPLETED, TRANSACTION_FAILED
    private UUID transactionId;
    private UUID userId;
    private UUID walletId;
    private BigDecimal amount;
    private String transactionType; // PURCHASE, REFUND, etc.
    private String status;
    private String description;
    private Instant timestamp;
}
