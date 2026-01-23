package com.lendingbackend.autolend.service;

import com.lendingbackend.autolend.dto.N8nDtos.*;
import com.lendingbackend.autolend.entity.*;
import com.lendingbackend.autolend.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
public class N8nService {

    private static final Logger log = LoggerFactory.getLogger(N8nService.class);

    private final AssetService assetService;
    private final AssetRepository assetRepo;
    private final UserRepository userRepo;
    private final TransactionRepository txnRepo;
    private final CurrencyWalletRepository walletRepo;
    private final UserAssetRepository userAssetRepo;

    public N8nService(AssetService assetService,
                      AssetRepository assetRepo,
                      UserRepository userRepo,
                      TransactionRepository txnRepo,
                      CurrencyWalletRepository walletRepo,
                      UserAssetRepository userAssetRepo) {
        this.assetService = assetService;
        this.assetRepo = assetRepo;
        this.userRepo = userRepo;
        this.txnRepo = txnRepo;
        this.walletRepo = walletRepo;
        this.userAssetRepo = userAssetRepo;
    }

    public WebhookResponse executeBuy(BuyRequest request) {
        try {
            log.info("N8N_AUTO_BUY userId={} asset={} qty={}", request.getUserId(), request.getAssetCode(), request.getQuantity());
            
            UUID userId = UUID.fromString(request.getUserId());
            UserAsset holding = assetService.purchaseAsset(userId, request.getAssetCode(), request.getQuantity());
            
            return WebhookResponse.builder()
                    .success(true)
                    .message("Purchase successful")
                    .data(holding)
                    .build();
        } catch (Exception e) {
            log.error("N8N_AUTO_BUY_FAILED: {}", e.getMessage());
            return WebhookResponse.builder()
                    .success(false)
                    .message("Purchase failed: " + e.getMessage())
                    .build();
        }
    }

    public WebhookResponse executeSell(SellRequest request) {
        try {
            log.info("N8N_AUTO_SELL userId={} holding={} qty={}", request.getUserId(), request.getHoldingId(), request.getQuantity());
            
            UUID userId = UUID.fromString(request.getUserId());
            UUID holdingId = UUID.fromString(request.getHoldingId());
            BigDecimal proceeds = assetService.sellAsset(userId, holdingId, request.getQuantity());
            
            return WebhookResponse.builder()
                    .success(true)
                    .message("Sale successful. Proceeds: " + proceeds)
                    .data(proceeds)
                    .build();
        } catch (Exception e) {
            log.error("N8N_AUTO_SELL_FAILED: {}", e.getMessage());
            return WebhookResponse.builder()
                    .success(false)
                    .message("Sale failed: " + e.getMessage())
                    .build();
        }
    }

    public WebhookResponse adjustCreditLimit(CreditAdjustRequest request) {
        try {
            log.info("N8N_CREDIT_ADJUST userId={} newLimit={} reason={}", 
                    request.getUserId(), request.getNewLimit(), request.getReason());
            
            UUID userId = UUID.fromString(request.getUserId());
            Optional<CurrencyWallet> walletOpt = walletRepo.findByUserIdAndCurrencyCode(userId, "VEX");
            
            if (walletOpt.isEmpty()) {
                return WebhookResponse.builder()
                        .success(false)
                        .message("User wallet not found")
                        .build();
            }
            
            CurrencyWallet wallet = walletOpt.get();
            // Credit limit adjusting locked balance as demo
            wallet.setLockedBalance(request.getNewLimit());
            walletRepo.save(wallet);
            
            return WebhookResponse.builder()
                    .success(true)
                    .message("Credit limit adjusted to " + request.getNewLimit())
                    .data(wallet)
                    .build();
        } catch (Exception e) {
            log.error("N8N_CREDIT_ADJUST_FAILED: {}", e.getMessage());
            return WebhookResponse.builder()
                    .success(false)
                    .message("Credit adjustment failed: " + e.getMessage())
                    .build();
        }
    }

    public List<AssetSummary> getAllAssets() {
        log.debug("Fetching all assets");
        return assetRepo.findAll().stream()
                .map(a -> AssetSummary.builder()
                        .code(a.getCode())
                        .name(a.getName())
                        .priceVex(a.getUnitPriceVex())
                        .status(a.getStatus())
                        .assetType(a.getAssetType().name())
                        .build())
                .collect(Collectors.toList());
    }

    public List<UserSummary> getAllUsers() {
        log.debug("Fetching all users");
        return userRepo.findAll().stream()
                .map(u -> UserSummary.builder()
                        .userId(u.getUserId())
                        .name(u.getName())
                        .email(u.getEmail())
                        .status(u.getStatus())
                        .riskScore(u.getRiskScore())
                        .build())
                .collect(Collectors.toList());
    }

    public List<TransactionSummary> getRecentTransactions(int limit) {
        log.debug("Fetching recent transactions limit={}", limit);
        return txnRepo.findAllByOrderByCreatedAtDesc().stream()
                .limit(limit)
                .map(t -> TransactionSummary.builder()
                        .transactionId(t.getTxnId())
                        .userId(t.getUserId())
                        .amount(t.getAmount())
                        .type(t.getTxnType().name())
                        .status(t.getStatus().name())
                        .description(t.getDescription())
                        .createdAt(t.getCreatedAt() != null ? t.getCreatedAt().toString() : null)
                        .build())
                .collect(Collectors.toList());
    }

    public PlatformMetrics getPlatformMetrics() {
        log.debug("Calculating platform metrics");
        
        long totalUsers = userRepo.count();
        long activeUsers = userRepo.countByStatus("ACTIVE"); // Ensure "ACTIVE" matches actual status string
        long totalTransactions = txnRepo.count();
        
        // Sum settled transaction volume
        BigDecimal totalVolume = txnRepo.sumAmountByTypeAndStatus(TransactionType.SETTLEMENT, TransactionStatus.SETTLED);
        if (totalVolume == null) {
            totalVolume = BigDecimal.ZERO;
        }

        // Calculate Average Risk Score
        Double averageRiskScore = userRepo.findAll().stream()
                .mapToDouble(u -> u.getRiskScore() != null ? u.getRiskScore() : 0.0)
                .average()
                .orElse(0.0);

        return PlatformMetrics.builder()
                .totalUsers(totalUsers)
                .activeUsers(activeUsers)
                .totalTransactions(totalTransactions)
                .totalVolume(totalVolume)
                .averageRiskScore(averageRiskScore)
                .build();
    }

    public WebhookResponse checkAutoTradeConditions(AutoTradeConfig config) {
        log.info("Checking auto-trade conditions for userId={} asset={}", config.getUserId(), config.getAssetCode());
        // Placeholder logic - for hackathon, we can just say conditions met if price < threshold
        return WebhookResponse.builder().success(true).message("Conditions checked").build();
    }
}
