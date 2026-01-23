package com.lendingbackend.autolend.controller;

import com.lendingbackend.autolend.entity.Asset;
import com.lendingbackend.autolend.entity.CurrencyWallet;
import com.lendingbackend.autolend.entity.UserAsset;
import com.lendingbackend.autolend.repository.AssetRepository;
import com.lendingbackend.autolend.repository.CurrencyWalletRepository;
import com.lendingbackend.autolend.service.AssetService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/assets")
public class AssetController {

    private final AssetService assetService;
    private final AssetRepository assetRepo;
    private final CurrencyWalletRepository currencyWalletRepo;

    public AssetController(AssetService assetService,
                           AssetRepository assetRepo,
                           CurrencyWalletRepository currencyWalletRepo) {
        this.assetService = assetService;
        this.assetRepo = assetRepo;
        this.currencyWalletRepo = currencyWalletRepo;
    }

    /**
     * Get all available assets.
     */
    @GetMapping
    public ResponseEntity<List<Asset>> getAllAssets() {
        return ResponseEntity.ok(assetService.getAllAssets());
    }

    /**
     * Get asset by code.
     */
    @GetMapping("/{code}")
    public ResponseEntity<Asset> getAsset(@PathVariable String code) {
        Asset asset = assetRepo.findByCode(code.toUpperCase())
                .orElseThrow(() -> new RuntimeException("Asset not found"));
        return ResponseEntity.ok(asset);
    }

    /**
     * Get user's portfolio.
     */
    @GetMapping("/portfolio/{userId}")
    public ResponseEntity<List<UserAsset>> getPortfolio(@PathVariable UUID userId) {
        return ResponseEntity.ok(assetService.getUserPortfolio(userId));
    }

    /**
     * Get user's VexCoin balance.
     */
    @GetMapping("/wallet/{userId}/vex")
    public ResponseEntity<CurrencyWallet> getVexBalance(@PathVariable UUID userId) {
        CurrencyWallet wallet = currencyWalletRepo.findByUserIdAndCurrencyCode(userId, "VEX")
                .orElseThrow(() -> new RuntimeException("VexCoin wallet not found"));
        return ResponseEntity.ok(wallet);
    }

    /**
     * Purchase an asset.
     */
    @PostMapping("/purchase")
    public ResponseEntity<UserAsset> purchaseAsset(
            @RequestParam UUID userId,
            @RequestParam String assetCode,
            @RequestParam BigDecimal quantity) {
        UserAsset holding = assetService.purchaseAsset(userId, assetCode.toUpperCase(), quantity);
        return ResponseEntity.ok(holding);
    }

    /**
     * Sell an asset.
     */
    @PostMapping("/sell")
    public ResponseEntity<Map<String, Object>> sellAsset(
            @RequestParam UUID userId,
            @RequestParam UUID holdingId,
            @RequestParam BigDecimal quantity) {
        BigDecimal proceeds = assetService.sellAsset(userId, holdingId, quantity);
        return ResponseEntity.ok(Map.of(
                "success", true,
                "proceeds", proceeds,
                "currency", "VEX"
        ));
    }

    /**
     * Transfer an NFT to another user.
     */
    @PostMapping("/transfer-nft")
    public ResponseEntity<Map<String, String>> transferNFT(
            @RequestParam UUID fromUserId,
            @RequestParam UUID toUserId,
            @RequestParam UUID holdingId) {
        assetService.transferNFT(fromUserId, toUserId, holdingId);
        return ResponseEntity.ok(Map.of(
                "status", "TRANSFERRED",
                "message", "NFT successfully transferred"
        ));
    }
}
