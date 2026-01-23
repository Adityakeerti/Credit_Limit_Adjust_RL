package com.lendingbackend.autolend.repository;

import com.lendingbackend.autolend.entity.Asset;
import com.lendingbackend.autolend.entity.AssetType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AssetRepository extends JpaRepository<Asset, UUID> {
    Optional<Asset> findByCode(String code);
    List<Asset> findByAssetType(AssetType assetType);
    List<Asset> findByStatus(String status);
    List<Asset> findByIsTradeableTrue();
}
