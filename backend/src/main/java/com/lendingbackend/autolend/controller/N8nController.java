package com.lendingbackend.autolend.controller;

import com.lendingbackend.autolend.dto.N8nDtos.*;
import com.lendingbackend.autolend.service.N8nService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/n8n")
@RequiredArgsConstructor
public class N8nController {

    private static final Logger log = LoggerFactory.getLogger(N8nController.class);
    private final N8nService n8nService;

    @GetMapping("/health")
    public ResponseEntity<WebhookResponse> checkHealth() {
        log.info("REST_REQ: /health");
        log.info("REST_RES: /health | status=UP");
        return ResponseEntity.ok(WebhookResponse.builder()
                .success(true)
                .message("n8n integration is healthy")
                .build());
    }

    @PostMapping("/webhook/buy")
    public ResponseEntity<WebhookResponse> triggerAutoBuy(@RequestBody BuyRequest request) {
        log.info("REST_REQ: /webhook/buy | userId={} asset={} qty={}", request.getUserId(), request.getAssetCode(), request.getQuantity());
        WebhookResponse response = n8nService.executeBuy(request);
        log.info("REST_RES: /webhook/buy | success={} msg={}", response.isSuccess(), response.getMessage());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/webhook/sell")
    public ResponseEntity<WebhookResponse> triggerAutoSell(@RequestBody SellRequest request) {
        log.info("REST_REQ: /webhook/sell | userId={} holding={} qty={}", request.getUserId(), request.getHoldingId(), request.getQuantity());
        WebhookResponse response = n8nService.executeSell(request);
        log.info("REST_RES: /webhook/sell | success={} msg={}", response.isSuccess(), response.getMessage());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/webhook/credit/adjust")
    public ResponseEntity<WebhookResponse> adjustCreditLimit(@RequestBody CreditAdjustRequest request) {
        log.info("REST_REQ: /webhook/credit/adjust | userId={} limit={}", request.getUserId(), request.getNewLimit());
        WebhookResponse response = n8nService.adjustCreditLimit(request);
        log.info("REST_RES: /webhook/credit/adjust | success={} msg={}", response.isSuccess(), response.getMessage());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/webhook/check-trade")
    public ResponseEntity<WebhookResponse> checkAutoTrade(@RequestBody AutoTradeConfig config) {
        log.info("REST_REQ: /webhook/check-trade | userId={} asset={}", config.getUserId(), config.getAssetCode());
        WebhookResponse response = n8nService.checkAutoTradeConditions(config);
        log.info("REST_RES: /webhook/check-trade | success={}", response.isSuccess());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/assets")
    public ResponseEntity<List<AssetSummary>> getAssets() {
        log.info("REST_REQ: /assets");
        List<AssetSummary> assets = n8nService.getAllAssets();
        log.info("REST_RES: /assets | count={}", assets.size());
        return ResponseEntity.ok(assets);
    }

    @GetMapping("/users")
    public ResponseEntity<List<UserSummary>> getUsers() {
        log.info("REST_REQ: /users");
        List<UserSummary> users = n8nService.getAllUsers();
        log.info("REST_RES: /users | count={}", users.size());
        return ResponseEntity.ok(users);
    }

    @GetMapping("/transactions")
    public ResponseEntity<List<TransactionSummary>> getTransactions(@RequestParam(defaultValue = "10") int limit) {
        log.info("REST_REQ: /transactions | limit={}", limit);
        List<TransactionSummary> txns = n8nService.getRecentTransactions(limit);
        log.info("REST_RES: /transactions | count={}", txns.size());
        return ResponseEntity.ok(txns);
    }

    @GetMapping("/metrics")
    public ResponseEntity<PlatformMetrics> getMetrics() {
        log.info("REST_REQ: /metrics");
        PlatformMetrics metrics = n8nService.getPlatformMetrics();
        log.info("REST_RES: /metrics | totalTxns={} totalUsers={}", metrics.getTotalTransactions(), metrics.getTotalUsers());
        return ResponseEntity.ok(metrics);
    }
}
