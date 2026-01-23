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
 * User's holding of an asset.
 * For NFTs: quantity = 1 (unique ownership)
 * For commodities/tokens: quantity = fractional amount
 */
@Entity
@Table(name = "user_assets", indexes = {
    @Index(name = "idx_user_assets_user", columnList = "user_id"),
    @Index(name = "idx_user_assets_asset", columnList = "asset_id")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserAsset {

    @Id
    @Column(name = "holding_id")
    private UUID holdingId;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "asset_id", nullable = false)
    private UUID assetId;

    @ManyToOne
    @JoinColumn(name = "asset_id", insertable = false, updatable = false)
    private Asset asset;

    @Column(name = "asset_code", length = 50)
    private String assetCode;

    @Column(nullable = false, precision = 19, scale = 8)
    private BigDecimal quantity; // 1 for NFT, fractional for others

    @Column(name = "purchase_price_vex", precision = 19, scale = 4)
    private BigDecimal purchasePriceVex; // Cost basis

    @Column(name = "purchase_date")
    private Instant purchaseDate;

    // NFT-specific fields
    @Column(name = "token_id", length = 100)
    private String tokenId; // Blockchain token ID for NFTs

    @Column(name = "ownership_tx_hash", length = 100)
    private String ownershipTxHash; // Blockchain transaction hash

    @Column(name = "is_locked")
    private Boolean isLocked; // Locked as collateral?

    private String status; // OWNED, SOLD, TRANSFERRED

    @Column(name = "acquired_at")
    private Instant acquiredAt;

    @PrePersist
    public void prePersist() {
        if (holdingId == null) holdingId = UUID.randomUUID();
        if (acquiredAt == null) acquiredAt = Instant.now();
        if (isLocked == null) isLocked = false;
        if (status == null) status = "OWNED";
    }
}
