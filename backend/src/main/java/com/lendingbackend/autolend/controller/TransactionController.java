package com.lendingbackend.autolend.controller;

import com.lendingbackend.autolend.entity.LedgerEntry;
import com.lendingbackend.autolend.entity.Transaction;
import com.lendingbackend.autolend.service.TransactionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/transactions")
public class TransactionController {

    private final TransactionService txnService;

    public TransactionController(TransactionService txnService) {
        this.txnService = txnService;
    }

    /**
     * Create a purchase transaction (locks credits).
     */
    @PostMapping("/purchase")
    public ResponseEntity<Transaction> createPurchase(
            @RequestParam UUID userId,
            @RequestParam UUID walletId,
            @RequestParam BigDecimal amount,
            @RequestParam(required = false) String description) {

        Transaction txn = txnService.createPurchase(userId, walletId, amount, description);
        return ResponseEntity.ok(txn);
    }

    /**
     * Settle an authorized transaction.
     */
    @PostMapping("/{txnId}/settle")
    public ResponseEntity<Transaction> settleTransaction(@PathVariable UUID txnId) {
        Transaction txn = txnService.settleTransaction(txnId);
        return ResponseEntity.ok(txn);
    }

    /**
     * Reverse an authorized transaction.
     */
    @PostMapping("/{txnId}/reverse")
    public ResponseEntity<Transaction> reverseTransaction(@PathVariable UUID txnId) {
        Transaction txn = txnService.reverseTransaction(txnId);
        return ResponseEntity.ok(txn);
    }

    /**
     * Get transaction history for a user.
     */
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Transaction>> getTransactionHistory(@PathVariable UUID userId) {
        List<Transaction> transactions = txnService.getTransactionHistory(userId);
        return ResponseEntity.ok(transactions);
    }

    /**
     * Get ledger entries (audit trail) for a transaction.
     */
    @GetMapping("/{txnId}/ledger")
    public ResponseEntity<List<LedgerEntry>> getLedgerEntries(@PathVariable UUID txnId) {
        List<LedgerEntry> entries = txnService.getLedgerEntries(txnId);
        return ResponseEntity.ok(entries);
    }

    /**
     * Get ALL transactions (Admin only).
     */
    @GetMapping("/all")
    public ResponseEntity<List<Transaction>> getAllTransactions() {
        List<Transaction> transactions = txnService.getAllTransactions();
        return ResponseEntity.ok(transactions);
    }
}
