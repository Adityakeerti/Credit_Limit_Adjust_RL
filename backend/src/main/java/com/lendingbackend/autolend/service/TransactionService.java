package com.lendingbackend.autolend.service;

import com.lendingbackend.autolend.entity.*;
import com.lendingbackend.autolend.repository.LedgerEntryRepository;
import com.lendingbackend.autolend.repository.TransactionRepository;
import com.lendingbackend.autolend.repository.WalletRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Transaction Service - Orchestrates all financial transactions with double-entry ledger.
 * 
 * Flow for PURCHASE:
 * 1. Create Transaction (PENDING)
 * 2. Validate: Check available credits >= amount
 * 3. Lock credits: available -= amount, locked += amount
 * 4. Create ledger entries (DEBIT available, CREDIT locked)
 * 5. Update Transaction (AUTHORIZED)
 * 
 * Flow for SETTLEMENT:
 * 1. Find AUTHORIZED transaction
 * 2. Move locked to utilized (external billing)
 * 3. Create ledger entries
 * 4. Update Transaction (SETTLED)
 */
@Service
@Transactional
public class TransactionService {

    private static final Logger log = LoggerFactory.getLogger(TransactionService.class);

    private final TransactionRepository txnRepo;
    private final LedgerEntryRepository ledgerRepo;
    private final WalletRepository walletRepo;

    public TransactionService(TransactionRepository txnRepo,
                               LedgerEntryRepository ledgerRepo,
                               WalletRepository walletRepo) {
        this.txnRepo = txnRepo;
        this.ledgerRepo = ledgerRepo;
        this.walletRepo = walletRepo;
    }

    /**
     * Create and authorize a purchase transaction.
     * This locks credits from available to locked.
     */
    public Transaction createPurchase(UUID userId, UUID walletId, BigDecimal amount, String description) {
        log.info("Creating purchase: userId={}, walletId={}, amount={}", userId, walletId, amount);

        // 1. Validate wallet and balance
        Wallet wallet = walletRepo.findById(walletId)
                .orElseThrow(() -> new RuntimeException("Wallet not found: " + walletId));

        if (!wallet.getUserId().equals(userId)) {
            throw new RuntimeException("Wallet does not belong to user");
        }

        if (wallet.getAvailableCredits().compareTo(amount) < 0) {
            throw new RuntimeException("Insufficient credits. Available: " + wallet.getAvailableCredits());
        }

        // 2. Create transaction (PENDING -> AUTHORIZED)
        Transaction txn = Transaction.builder()
                .txnId(UUID.randomUUID())
                .userId(userId)
                .walletId(walletId)
                .amount(amount)
                .txnType(TransactionType.PURCHASE)
                .status(TransactionStatus.PENDING)
                .description(description)
                .build();
        txn.prePersist();

        // 3. Lock credits
        BigDecimal newAvailable = wallet.getAvailableCredits().subtract(amount);
        BigDecimal newLocked = wallet.getLockedCredits().add(amount);

        wallet.setAvailableCredits(newAvailable);
        wallet.setLockedCredits(newLocked);
        wallet.setUpdatedAt(Instant.now());
        walletRepo.save(wallet);

        // 4. Create ledger entries (double-entry)
        LedgerEntry debitEntry = LedgerEntry.builder()
                .entryId(UUID.randomUUID())
                .txnId(txn.getTxnId())
                .walletId(walletId)
                .entryType(LedgerEntryType.DEBIT)
                .accountType(LedgerAccountType.AVAILABLE_CREDITS)
                .amount(amount)
                .balanceAfter(newAvailable)
                .description("Purchase authorization - debit available")
                .build();

        LedgerEntry creditEntry = LedgerEntry.builder()
                .entryId(UUID.randomUUID())
                .txnId(txn.getTxnId())
                .walletId(walletId)
                .entryType(LedgerEntryType.CREDIT)
                .accountType(LedgerAccountType.LOCKED_CREDITS)
                .amount(amount)
                .balanceAfter(newLocked)
                .description("Purchase authorization - credit locked")
                .build();

        ledgerRepo.save(debitEntry);
        ledgerRepo.save(creditEntry);

        // 5. Update transaction status
        txn.setStatus(TransactionStatus.AUTHORIZED);
        txnRepo.save(txn);

        log.info("PURCHASE_AUTHORIZED txnId={} userId={} amount={}", txn.getTxnId(), userId, amount);
        return txn;
    }

    /**
     * Settle an authorized transaction.
     * Moves credits from locked to utilized (external settlement).
     */
    public Transaction settleTransaction(UUID txnId) {
        log.info("Settling transaction: txnId={}", txnId);

        Transaction txn = txnRepo.findById(txnId)
                .orElseThrow(() -> new RuntimeException("Transaction not found: " + txnId));

        if (txn.getStatus() != TransactionStatus.AUTHORIZED) {
            throw new RuntimeException("Transaction not in AUTHORIZED state: " + txn.getStatus());
        }

        Wallet wallet = walletRepo.findById(txn.getWalletId())
                .orElseThrow(() -> new RuntimeException("Wallet not found"));

        // Move from locked to utilized (reduce locked)
        BigDecimal newLocked = wallet.getLockedCredits().subtract(txn.getAmount());
        wallet.setLockedCredits(newLocked);
        wallet.setUpdatedAt(Instant.now());
        walletRepo.save(wallet);

        // Create settlement ledger entries
        LedgerEntry debitLocked = LedgerEntry.builder()
                .entryId(UUID.randomUUID())
                .txnId(txnId)
                .walletId(wallet.getWalletId())
                .entryType(LedgerEntryType.DEBIT)
                .accountType(LedgerAccountType.LOCKED_CREDITS)
                .amount(txn.getAmount())
                .balanceAfter(newLocked)
                .description("Settlement - debit locked credits")
                .build();

        LedgerEntry creditExternal = LedgerEntry.builder()
                .entryId(UUID.randomUUID())
                .txnId(txnId)
                .walletId(wallet.getWalletId())
                .entryType(LedgerEntryType.CREDIT)
                .accountType(LedgerAccountType.EXTERNAL)
                .amount(txn.getAmount())
                .balanceAfter(BigDecimal.ZERO) // External doesn't track balance
                .description("Settlement - credit to merchant/external")
                .build();

        ledgerRepo.save(debitLocked);
        ledgerRepo.save(creditExternal);

        txn.setStatus(TransactionStatus.SETTLED);
        txnRepo.save(txn);

        log.info("TRANSACTION_SETTLED txnId={} amount={}", txnId, txn.getAmount());
        return txn;
    }

    /**
     * Reverse an authorized transaction (before settlement).
     * Returns locked credits back to available.
     */
    public Transaction reverseTransaction(UUID txnId) {
        log.info("Reversing transaction: txnId={}", txnId);

        Transaction txn = txnRepo.findById(txnId)
                .orElseThrow(() -> new RuntimeException("Transaction not found: " + txnId));

        if (txn.getStatus() != TransactionStatus.AUTHORIZED) {
            throw new RuntimeException("Can only reverse AUTHORIZED transactions");
        }

        Wallet wallet = walletRepo.findById(txn.getWalletId())
                .orElseThrow(() -> new RuntimeException("Wallet not found"));

        // Move from locked back to available
        BigDecimal newLocked = wallet.getLockedCredits().subtract(txn.getAmount());
        BigDecimal newAvailable = wallet.getAvailableCredits().add(txn.getAmount());

        wallet.setLockedCredits(newLocked);
        wallet.setAvailableCredits(newAvailable);
        wallet.setUpdatedAt(Instant.now());
        walletRepo.save(wallet);

        // Create reversal ledger entries
        LedgerEntry debitLocked = LedgerEntry.builder()
                .entryId(UUID.randomUUID())
                .txnId(txnId)
                .walletId(wallet.getWalletId())
                .entryType(LedgerEntryType.DEBIT)
                .accountType(LedgerAccountType.LOCKED_CREDITS)
                .amount(txn.getAmount())
                .balanceAfter(newLocked)
                .description("Reversal - debit locked")
                .build();

        LedgerEntry creditAvailable = LedgerEntry.builder()
                .entryId(UUID.randomUUID())
                .txnId(txnId)
                .walletId(wallet.getWalletId())
                .entryType(LedgerEntryType.CREDIT)
                .accountType(LedgerAccountType.AVAILABLE_CREDITS)
                .amount(txn.getAmount())
                .balanceAfter(newAvailable)
                .description("Reversal - credit available")
                .build();

        ledgerRepo.save(debitLocked);
        ledgerRepo.save(creditAvailable);

        txn.setStatus(TransactionStatus.REVERSED);
        txnRepo.save(txn);

        log.info("TRANSACTION_REVERSED txnId={} amount={}", txnId, txn.getAmount());
        return txn;
    }

    /**
     * Get transaction history for a user.
     */
    public List<Transaction> getTransactionHistory(UUID userId) {
        return txnRepo.findByUserIdOrderByCreatedAtDesc(userId);
    }

    /**
     * Get ledger entries for audit trail.
     */
    public List<LedgerEntry> getLedgerEntries(UUID txnId) {
        return ledgerRepo.findByTxnIdOrderByCreatedAt(txnId);
    }

    /**
     * Get all transactions (for admin/banker).
     */
     public List<Transaction> getAllTransactions() {
        return txnRepo.findAllByOrderByCreatedAtDesc();
    }
}
