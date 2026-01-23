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
public class AssetEvent {
    private UUID eventId;
    private String eventType; // ASSET_PURCHASED, ASSET_SOLD, NFT_TRANSFERRED
    private UUID userId;
    private String assetCode;
    private String assetName;
    private BigDecimal quantity;
    private BigDecimal priceVex;
    private BigDecimal totalValue;
    private String tokenId; // For NFTs
    private Instant timestamp;
}
