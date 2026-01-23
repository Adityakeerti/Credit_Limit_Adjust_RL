package com.lendingbackend.autolend.controller;

import com.lendingbackend.autolend.dto.MetricsResponse;
import com.lendingbackend.autolend.entity.Transaction;
import com.lendingbackend.autolend.entity.TransactionStatus;
import com.lendingbackend.autolend.entity.TransactionType;
import com.lendingbackend.autolend.entity.User;
import com.lendingbackend.autolend.entity.Wallet;
import com.lendingbackend.autolend.repository.TransactionRepository;
import com.lendingbackend.autolend.repository.UserRepository;
import com.lendingbackend.autolend.repository.WalletRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final UserRepository userRepo;
    private final WalletRepository walletRepo;
    private final TransactionRepository txnRepo;

    public AdminController(UserRepository userRepo,
                           WalletRepository walletRepo,
                           TransactionRepository txnRepo) {
        this.userRepo = userRepo;
        this.walletRepo = walletRepo;
        this.txnRepo = txnRepo;
    }

    /**
     * Get all users (paginated).
     */
    @GetMapping("/users")
    public ResponseEntity<Page<User>> getUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {

        Sort sort = sortDir.equalsIgnoreCase("asc") 
                ? Sort.by(sortBy).ascending() 
                : Sort.by(sortBy).descending();

        Page<User> users = userRepo.findAll(PageRequest.of(page, size, sort));
        return ResponseEntity.ok(users);
    }

    /**
     * Get single user details.
     */
    @GetMapping("/users/{userId}")
    public ResponseEntity<User> getUser(@PathVariable UUID userId) {
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return ResponseEntity.ok(user);
    }

    /**
     * Update user status (ACTIVE, SUSPENDED, etc.).
     */
    @PutMapping("/users/{userId}/status")
    public ResponseEntity<User> updateUserStatus(
            @PathVariable UUID userId,
            @RequestBody Map<String, String> request) {

        User user = userRepo.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        String newStatus = request.get("status");
        user.setStatus(newStatus);
        userRepo.save(user);

        return ResponseEntity.ok(user);
    }

    /**
     * Get all wallets.
     */
    @GetMapping("/wallets")
    public ResponseEntity<List<Wallet>> getWallets() {
        List<Wallet> wallets = walletRepo.findAll();
        return ResponseEntity.ok(wallets);
    }

    /**
     * Get all transactions (paginated).
     */
    @GetMapping("/transactions")
    public ResponseEntity<Page<Transaction>> getTransactions(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) TransactionStatus status) {

        PageRequest pageRequest = PageRequest.of(page, size, Sort.by("createdAt").descending());

        Page<Transaction> transactions;
        if (status != null) {
            transactions = txnRepo.findByStatus(status, pageRequest);
        } else {
            transactions = txnRepo.findAll(pageRequest);
        }

        return ResponseEntity.ok(transactions);
    }

    /**
     * Get aggregated metrics for dashboard.
     */
    @GetMapping("/metrics")
    public ResponseEntity<MetricsResponse> getMetrics() {
        long totalUsers = userRepo.count();
        long activeUsers = userRepo.countByStatus("ACTIVE");

        long totalTxns = txnRepo.count();
        long pendingTxns = txnRepo.countByStatus(TransactionStatus.PENDING);
        long settledTxns = txnRepo.countByStatus(TransactionStatus.SETTLED);

        BigDecimal totalVolume = txnRepo.sumAmountByTypeAndStatus(
                TransactionType.PURCHASE, TransactionStatus.SETTLED);

        // Calculate total credits
        List<Wallet> wallets = walletRepo.findAll();
        BigDecimal totalAvailable = wallets.stream()
                .map(Wallet::getAvailableCredits)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalLocked = wallets.stream()
                .map(Wallet::getLockedCredits)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return ResponseEntity.ok(MetricsResponse.builder()
                .totalUsers(totalUsers)
                .activeUsers(activeUsers)
                .totalTransactions(totalTxns)
                .pendingTransactions(pendingTxns)
                .settledTransactions(settledTxns)
                .totalTransactionVolume(totalVolume != null ? totalVolume : BigDecimal.ZERO)
                .totalAvailableCredits(totalAvailable)
                .totalLockedCredits(totalLocked)
                .highRiskUserPercentage(totalUsers > 0 
                        ? (double) userRepo.countByRiskScoreGreaterThan(0.7) / totalUsers * 100 
                        : 0.0)
                .averageRiskScore(userRepo.findAll().stream()
                        .mapToDouble(u -> u.getRiskScore() != null ? u.getRiskScore() : 0.5)
                        .average().orElse(0.5))
                .riskTrend(Math.random() * 10 - 5) // Simulated trend between -5% and +5%
                .build());
    }

    /**
     * Adjust user credit limit.
     */
    @PostMapping("/wallets/{walletId}/adjust-limit")
    public ResponseEntity<Wallet> adjustCreditLimit(
            @PathVariable UUID walletId,
            @RequestBody Map<String, BigDecimal> request) {

        Wallet wallet = walletRepo.findById(walletId)
                .orElseThrow(() -> new RuntimeException("Wallet not found"));

        BigDecimal adjustment = request.get("adjustment");
        wallet.setAvailableCredits(wallet.getAvailableCredits().add(adjustment));
        walletRepo.save(wallet);

        return ResponseEntity.ok(wallet);
    }
}
