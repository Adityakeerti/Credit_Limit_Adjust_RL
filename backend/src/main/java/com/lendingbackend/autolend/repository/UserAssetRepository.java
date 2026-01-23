package com.lendingbackend.autolend.repository;

import com.lendingbackend.autolend.entity.UserAsset;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserAssetRepository extends JpaRepository<UserAsset, UUID> {
    List<UserAsset> findByUserId(UUID userId);
    List<UserAsset> findByUserIdAndStatus(UUID userId, String status);
    Optional<UserAsset> findByUserIdAndAssetId(UUID userId, UUID assetId);
    
    // For NFTs - find by token ID
    Optional<UserAsset> findByAssetIdAndTokenId(UUID assetId, String tokenId);
    
    @Query("SELECT ua FROM UserAsset ua WHERE ua.userId = :userId AND ua.isLocked = true")
    List<UserAsset> findLockedAssets(@Param("userId") UUID userId);
}
