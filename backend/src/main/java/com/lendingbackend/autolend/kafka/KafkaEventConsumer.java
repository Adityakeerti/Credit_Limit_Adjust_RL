package com.lendingbackend.autolend.kafka;

import com.lendingbackend.autolend.events.AssetEvent;
import com.lendingbackend.autolend.events.TransactionEvent;
import com.lendingbackend.autolend.events.UserEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

@Service
public class KafkaEventConsumer {

    private static final Logger log = LoggerFactory.getLogger(KafkaEventConsumer.class);

    @KafkaListener(topics = KafkaEventProducer.TOPIC_TRANSACTIONS, groupId = "autolend-group")
    public void consumeTransactionEvent(TransactionEvent event) {
        log.info("KAFKA_RECEIVED [transactions] eventType={} txnId={} userId={} amount={} status={}",
                event.getEventType(),
                event.getTransactionId(),
                event.getUserId(),
                event.getAmount(),
                event.getStatus());

        // Process the transaction event
        // This could trigger notifications, update analytics, etc.
        processTransactionEvent(event);
    }

    @KafkaListener(topics = KafkaEventProducer.TOPIC_ASSETS, groupId = "autolend-group")
    public void consumeAssetEvent(AssetEvent event) {
        log.info("KAFKA_RECEIVED [assets] eventType={} userId={} asset={} quantity={} value={}",
                event.getEventType(),
                event.getUserId(),
                event.getAssetCode(),
                event.getQuantity(),
                event.getTotalValue());

        // Process the asset event
        processAssetEvent(event);
    }

    @KafkaListener(topics = KafkaEventProducer.TOPIC_USERS, groupId = "autolend-group")
    public void consumeUserEvent(UserEvent event) {
        log.info("KAFKA_RECEIVED [users] eventType={} userId={} email={} status={}",
                event.getEventType(),
                event.getUserId(),
                event.getEmail(),
                event.getStatus());

        // Process the user event
        processUserEvent(event);
    }

    private void processTransactionEvent(TransactionEvent event) {
        // Add custom processing logic here
        // Examples: Update analytics, send notifications, trigger fraud detection
        switch (event.getEventType()) {
            case "TRANSACTION_CREATED":
                log.debug("Processing new transaction: {}", event.getTransactionId());
                break;
            case "TRANSACTION_COMPLETED":
                log.debug("Transaction completed: {}", event.getTransactionId());
                break;
            case "TRANSACTION_FAILED":
                log.warn("Transaction failed: {}", event.getTransactionId());
                break;
        }
    }

    private void processAssetEvent(AssetEvent event) {
        // Add custom processing logic here
        switch (event.getEventType()) {
            case "ASSET_PURCHASED":
                log.debug("Processing asset purchase: {} by user {}", event.getAssetCode(), event.getUserId());
                break;
            case "ASSET_SOLD":
                log.debug("Processing asset sale: {} by user {}", event.getAssetCode(), event.getUserId());
                break;
            case "NFT_TRANSFERRED":
                log.debug("Processing NFT transfer: tokenId={}", event.getTokenId());
                break;
        }
    }

    private void processUserEvent(UserEvent event) {
        // Add custom processing logic here
        switch (event.getEventType()) {
            case "USER_REGISTERED":
                log.debug("New user registered: {}", event.getEmail());
                break;
            case "USER_UPDATED":
                log.debug("User updated: {}", event.getUserId());
                break;
            case "USER_STATUS_CHANGED":
                log.debug("User status changed: {} -> {}", event.getUserId(), event.getStatus());
                break;
        }
    }
}
