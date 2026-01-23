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
 * Asset definition - can be commodity, NFT, token, or fund.
 */
@Entity
@Table(name = "assets")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Asset {

    @Id
    @Column(name = "asset_id")
    private UUID assetId;

    @Column(nullable = false, unique = true, length = 50)
    private String code; // EGOLD, ESILVER, BAPE, QTOKEN, GEF

    @Column(nullable = false, length = 100)
    private String name; // eGold, eSilver, Board Ape NFT

    @Column(length = 500)
    private String description;

    @Column(name = "asset_type", nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    private AssetType assetType;

    @Column(name = "unit_price_vex", precision = 19, scale = 4)
    private BigDecimal unitPriceVex; // Price per unit in VexCoin

    @Column(name = "total_supply", precision = 19, scale = 4)
    private BigDecimal totalSupply; // Total available (null for unlimited)

    @Column(name = "is_tradeable")
    private Boolean isTradeable;

    @Column(name = "is_fractional")
    private Boolean isFractional; // Can buy 0.5 units?

    // NFT-specific fields
    @Column(name = "blockchain_network", length = 50)
    private String blockchainNetwork; // Ethereum, Polygon, etc.

    @Column(name = "contract_address", length = 100)
    private String contractAddress; // Smart contract address

    @Column(name = "metadata_uri", length = 500)
    private String metadataUri; // IPFS or other metadata URL

    @Column(name = "image_url", length = 500)
    private String imageUrl;

    private String status; // ACTIVE, INACTIVE, SOLD_OUT

    @Column(name = "created_at")
    private Instant createdAt;

    @PrePersist
    public void prePersist() {
        if (assetId == null) assetId = UUID.randomUUID();
        if (createdAt == null) createdAt = Instant.now();
        if (status == null) status = "ACTIVE";
    }
}
