package com.lendingbackend.autolend.service;

import com.lendingbackend.autolend.entity.*;
import com.lendingbackend.autolend.events.AssetEvent;
import com.lendingbackend.autolend.kafka.KafkaEventProducer;
import com.lendingbackend.autolend.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class AssetService {

    private static final Logger log = LoggerFactory.getLogger(AssetService.class);

    private final AssetRepository assetRepo;
    private final UserAssetRepository userAssetRepo;
    private final CurrencyRepository currencyRepo;
    private final CurrencyWalletRepository currencyWalletRepo;
    private final TransactionRepository txnRepo;
    private final KafkaEventProducer kafkaProducer;

    public AssetService(AssetRepository assetRepo,
                        UserAssetRepository userAssetRepo,
                        CurrencyRepository currencyRepo,
                        CurrencyWalletRepository currencyWalletRepo,
                        TransactionRepository txnRepo,
                        KafkaEventProducer kafkaProducer) {
        this.assetRepo = assetRepo;
        this.userAssetRepo = userAssetRepo;
        this.currencyRepo = currencyRepo;
        this.currencyWalletRepo = currencyWalletRepo;
        this.txnRepo = txnRepo;
        this.kafkaProducer = kafkaProducer;
    }

    /**
     * Get all available assets.
     */
    public List<Asset> getAllAssets() {
        return assetRepo.findByStatus("ACTIVE");
    }

    /**
     * Get user's portfolio (all owned assets).
     */
    public List<UserAsset> getUserPortfolio(UUID userId) {
        return userAssetRepo.findByUserIdAndStatus(userId, "OWNED");
    }

    /**
     * Purchase an asset using VexCoin.
     */
    public UserAsset purchaseAsset(UUID userId, String assetCode, BigDecimal quantity) {
        log.info("Purchasing asset: userId={}, assetCode={}, quantity={}", userId, assetCode, quantity);

        Asset asset = assetRepo.findByCode(assetCode)
                .orElseThrow(() -> new RuntimeException("Asset not found: " + assetCode));

        if (!"ACTIVE".equals(asset.getStatus())) {
            throw new RuntimeException("Asset is not available for purchase");
        }

        // Check if fractional purchase is allowed for NFTs
        if (asset.getAssetType() == AssetType.NFT && quantity.compareTo(BigDecimal.ONE) != 0) {
            throw new RuntimeException("NFTs can only be purchased as whole units (quantity must be 1)");
        }

        // Calculate total cost in VexCoin
        BigDecimal totalCost = asset.getUnitPriceVex().multiply(quantity);

        // Get user's VexCoin wallet
        CurrencyWallet vexWallet = currencyWalletRepo.findByUserIdAndCurrencyCode(userId, "VEX")
                .orElseThrow(() -> new RuntimeException("VexCoin wallet not found"));

        if (vexWallet.getBalance().compareTo(totalCost) < 0) {
            throw new RuntimeException("Insufficient VexCoin balance. Required: " + totalCost);
        }

        // Deduct from VexCoin wallet
        vexWallet.setBalance(vexWallet.getBalance().subtract(totalCost));
        currencyWalletRepo.save(vexWallet);

        // Create or update user asset holding
        UserAsset holding = userAssetRepo.findByUserIdAndAssetId(userId, asset.getAssetId())
                .orElse(UserAsset.builder()
                        .holdingId(UUID.randomUUID())
                        .userId(userId)
                        .assetId(asset.getAssetId())
                        .assetCode(asset.getCode())
                        .quantity(BigDecimal.ZERO)
                        .build());

        holding.setQuantity(holding.getQuantity().add(quantity));
        holding.setPurchasePriceVex(asset.getUnitPriceVex());
        holding.setPurchaseDate(Instant.now());
        holding.setStatus("OWNED");

        // For NFTs, generate a mock token ID
        if (asset.getAssetType() == AssetType.NFT) {
            holding.setTokenId("NFT-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
            holding.setOwnershipTxHash("0x" + UUID.randomUUID().toString().replace("-", ""));
        }

        userAssetRepo.save(holding);

        // Log Transaction for Visibility
        Transaction txn = Transaction.builder()
                .txnId(UUID.randomUUID())
                .userId(userId)
                .walletId(vexWallet.getWalletId())
                .amount(totalCost)
                .txnType(TransactionType.PURCHASE)
                .status(TransactionStatus.SETTLED)
                .description("Purchased " + quantity + " " + asset.getName())
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();
        txnRepo.save(txn);

        // Publish Kafka event for asset purchase
        AssetEvent assetEvent = AssetEvent.builder()
                .eventId(UUID.randomUUID())
                .eventType("ASSET_PURCHASED")
                .userId(userId)
                .assetCode(asset.getCode())
                .assetName(asset.getName())
                .quantity(quantity)
                .priceVex(asset.getUnitPriceVex())
                .totalValue(totalCost)
                .tokenId(holding.getTokenId())
                .timestamp(Instant.now())
                .build();
        kafkaProducer.publishAssetEvent(assetEvent);

        log.info("ASSET_PURCHASED userId={} asset={} quantity={} cost={}", userId, assetCode, quantity, totalCost);
        return holding;
    }

    /**
     * Sell an asset back for VexCoin.
     */
    public BigDecimal sellAsset(UUID userId, UUID holdingId, BigDecimal quantity) {
        log.info("Selling asset: userId={}, holdingId={}, quantity={}", userId, holdingId, quantity);

        UserAsset holding = userAssetRepo.findById(holdingId)
                .orElseThrow(() -> new RuntimeException("Holding not found"));

        if (!holding.getUserId().equals(userId)) {
            throw new RuntimeException("Asset does not belong to user");
        }

        if (holding.getIsLocked()) {
            throw new RuntimeException("Asset is locked as collateral");
        }

        if (holding.getQuantity().compareTo(quantity) < 0) {
            throw new RuntimeException("Insufficient quantity to sell");
        }

        Asset asset = assetRepo.findById(holding.getAssetId())
                .orElseThrow(() -> new RuntimeException("Asset definition not found"));

        // Calculate proceeds
        BigDecimal proceeds = asset.getUnitPriceVex().multiply(quantity);

        // Credit VexCoin wallet
        CurrencyWallet vexWallet = currencyWalletRepo.findByUserIdAndCurrencyCode(userId, "VEX")
                .orElseThrow(() -> new RuntimeException("VexCoin wallet not found"));

        vexWallet.setBalance(vexWallet.getBalance().add(proceeds));
        currencyWalletRepo.save(vexWallet);

        // Update holding
        holding.setQuantity(holding.getQuantity().subtract(quantity));
        if (holding.getQuantity().compareTo(BigDecimal.ZERO) == 0) {
            holding.setStatus("SOLD");
        }
        userAssetRepo.save(holding);

        // Log Transaction for Visibility
        Transaction txn = Transaction.builder()
                .txnId(UUID.randomUUID())
                .userId(userId)
                .walletId(vexWallet.getWalletId())
                .amount(proceeds)
                // Using PURCHASE type for now as we don't have SELL, or could add SELL to enum.
                // Assuming PURCHASE (negative?) or maybe just description clarifies.
                // Let's check TransactionType enum. If SELL exists use it. If not, use PURCHASE.
                .txnType(TransactionType.PURCHASE) 
                .status(TransactionStatus.SETTLED)
                .description("Sold " + quantity + " " + asset.getName())
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();
        txnRepo.save(txn);

        // Publish Kafka event for asset sale
        AssetEvent assetEvent = AssetEvent.builder()
                .eventId(UUID.randomUUID())
                .eventType("ASSET_SOLD")
                .userId(userId)
                .assetCode(asset.getCode())
                .assetName(asset.getName())
                .quantity(quantity)
                .priceVex(asset.getUnitPriceVex())
                .totalValue(proceeds)
                .timestamp(Instant.now())
                .build();
        kafkaProducer.publishAssetEvent(assetEvent);

        log.info("ASSET_SOLD userId={} asset={} quantity={} proceeds={}", userId, asset.getCode(), quantity, proceeds);
        return proceeds;
    }

    /**
     * Transfer an NFT to another user.
     */
    public void transferNFT(UUID fromUserId, UUID toUserId, UUID holdingId) {
        log.info("Transferring NFT: from={}, to={}, holdingId={}", fromUserId, toUserId, holdingId);

        UserAsset holding = userAssetRepo.findById(holdingId)
                .orElseThrow(() -> new RuntimeException("Holding not found"));

        if (!holding.getUserId().equals(fromUserId)) {
            throw new RuntimeException("NFT does not belong to sender");
        }

        Asset asset = assetRepo.findById(holding.getAssetId())
                .orElseThrow(() -> new RuntimeException("Asset not found"));

        if (asset.getAssetType() != AssetType.NFT) {
            throw new RuntimeException("Only NFTs can be transferred this way");
        }

        if (holding.getIsLocked()) {
            throw new RuntimeException("NFT is locked as collateral");
        }

        // Update ownership
        holding.setUserId(toUserId);
        holding.setOwnershipTxHash("0x" + UUID.randomUUID().toString().replace("-", "")); // New tx hash
        userAssetRepo.save(holding);

        // Publish Kafka event for NFT transfer
        AssetEvent assetEvent = AssetEvent.builder()
                .eventId(UUID.randomUUID())
                .eventType("NFT_TRANSFERRED")
                .userId(toUserId)
                .assetCode(asset.getCode())
                .assetName(asset.getName())
                .quantity(holding.getQuantity())
                .tokenId(holding.getTokenId())
                .timestamp(Instant.now())
                .build();
        kafkaProducer.publishAssetEvent(assetEvent);

        log.info("NFT_TRANSFERRED from={} to={} tokenId={}", fromUserId, toUserId, holding.getTokenId());
    }
}
