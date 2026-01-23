package com.lendingbackend.autolend.config;

import com.lendingbackend.autolend.entity.*;
import com.lendingbackend.autolend.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Configuration
public class DataSeeder {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);

    @Bean
    public CommandLineRunner seedAssetsAndCurrency(
            CurrencyRepository currencyRepo,
            AssetRepository assetRepo,
            CurrencyWalletRepository currencyWalletRepo,
            UserRepository userRepo) {

        return args -> {
            // Seed VexCoin currency
            if (currencyRepo.findByCode("VEX").isEmpty()) {
                Currency vexCoin = Currency.builder()
                        .currencyId(UUID.randomUUID())
                        .code("VEX")
                        .name("VexCoin")
                        .symbol("Ѵ")
                        .exchangeRateToInr(new BigDecimal("10.00")) // 1 VEX = 10 INR
                        .isAppCurrency(true)
                        .status("ACTIVE")
                        .build();
                currencyRepo.save(vexCoin);
                log.info("=== SEEDED CURRENCY: VexCoin (VEX) ===");
            }

            // Seed INR currency
            if (currencyRepo.findByCode("INR").isEmpty()) {
                Currency inr = Currency.builder()
                        .currencyId(UUID.randomUUID())
                        .code("INR")
                        .name("Indian Rupee")
                        .symbol("₹")
                        .exchangeRateToInr(BigDecimal.ONE)
                        .isAppCurrency(false)
                        .status("ACTIVE")
                        .build();
                currencyRepo.save(inr);
                log.info("=== SEEDED CURRENCY: INR ===");
            }

            // Seed Assets
            seedAsset(assetRepo, "EGOLD", "eGold", AssetType.COMMODITY,
                    "Digital gold backed by physical gold reserves",
                    new BigDecimal("500.00"), null, true, true);

            seedAsset(assetRepo, "ESILVER", "eSilver", AssetType.COMMODITY,
                    "Digital silver backed by physical silver reserves",
                    new BigDecimal("50.00"), null, true, true);

            seedAsset(assetRepo, "BAPE", "Board Ape NFT", AssetType.NFT,
                    "Exclusive digital collectible from the Board Ape collection",
                    new BigDecimal("5000.00"), new BigDecimal("100"),
                    true, false,
                    "Ethereum", "0x1a2b3c4d5e6f7890abcdef1234567890abcdef12",
                    "ipfs://QmBoardApeMetadata", "https://example.com/board-ape.png");

            seedAsset(assetRepo, "QTOKEN", "Quantum Token", AssetType.TOKEN,
                    "Utility token for quantum computing services",
                    new BigDecimal("25.00"), new BigDecimal("1000000"), true, true);

            seedAsset(assetRepo, "GEF", "Green Energy Fund", AssetType.FUND,
                    "Investment fund focused on renewable energy projects",
                    new BigDecimal("1000.00"), null, true, true);

            // Give existing users VexCoin wallets
            userRepo.findAll().forEach(user -> {
                if (currencyWalletRepo.findByUserIdAndCurrencyCode(user.getUserId(), "VEX").isEmpty()) {
                    Currency vex = currencyRepo.findByCode("VEX").orElseThrow();
                    CurrencyWallet wallet = CurrencyWallet.builder()
                            .walletId(UUID.randomUUID())
                            .userId(user.getUserId())
                            .currencyId(vex.getCurrencyId())
                            .currencyCode("VEX")
                            .balance(new BigDecimal("10000.00")) // Starting balance
                            .lockedBalance(BigDecimal.ZERO)
                            .build();
                    currencyWalletRepo.save(wallet);
                    log.info("Created VexCoin wallet for user: {}", user.getEmail());
                }
            });
        };
    }

    private void seedAsset(AssetRepository repo, String code, String name, 
                           AssetType type, String description,
                           BigDecimal price, BigDecimal supply,
                           boolean tradeable, boolean fractional) {
        seedAsset(repo, code, name, type, description, price, supply, tradeable, fractional,
                null, null, null, null);
    }

    private void seedAsset(AssetRepository repo, String code, String name,
                           AssetType type, String description,
                           BigDecimal price, BigDecimal supply,
                           boolean tradeable, boolean fractional,
                           String blockchain, String contract,
                           String metadataUri, String imageUrl) {
        if (repo.findByCode(code).isEmpty()) {
            Asset asset = Asset.builder()
                    .assetId(UUID.randomUUID())
                    .code(code)
                    .name(name)
                    .description(description)
                    .assetType(type)
                    .unitPriceVex(price)
                    .totalSupply(supply)
                    .isTradeable(tradeable)
                    .isFractional(fractional)
                    .blockchainNetwork(blockchain)
                    .contractAddress(contract)
                    .metadataUri(metadataUri)
                    .imageUrl(imageUrl)
                    .status("ACTIVE")
                    .build();
            repo.save(asset);
            log.info("=== SEEDED ASSET: {} ({}) - {} VEX ===", name, code, price);
        }
    }
}
