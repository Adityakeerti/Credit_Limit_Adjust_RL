package com.lendingbackend.autolend.repository;

import com.lendingbackend.autolend.entity.Currency;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface CurrencyRepository extends JpaRepository<Currency, UUID> {
    Optional<Currency> findByCode(String code);
    Optional<Currency> findByIsAppCurrencyTrue();
}
