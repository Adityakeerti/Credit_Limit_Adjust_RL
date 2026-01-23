package com.lendingbackend.autolend.kafka;

import com.lendingbackend.autolend.events.AssetEvent;
import com.lendingbackend.autolend.events.TransactionEvent;
import com.lendingbackend.autolend.events.UserEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.SendResult;
import org.springframework.stereotype.Service;

import java.util.concurrent.CompletableFuture;

@Service
public class KafkaEventProducer {

    private static final Logger log = LoggerFactory.getLogger(KafkaEventProducer.class);

    public static final String TOPIC_TRANSACTIONS = "transactions";
    public static final String TOPIC_ASSETS = "assets";
    public static final String TOPIC_USERS = "users";
    public static final String TOPIC_NOTIFICATIONS = "notifications";

    private final KafkaTemplate<String, Object> kafkaTemplate;

    public KafkaEventProducer(KafkaTemplate<String, Object> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
    }

    public void publishTransactionEvent(TransactionEvent event) {
        log.info("Publishing transaction event: {} for txnId={}", event.getEventType(), event.getTransactionId());
        sendMessage(TOPIC_TRANSACTIONS, event.getTransactionId().toString(), event);
    }

    public void publishAssetEvent(AssetEvent event) {
        log.info("Publishing asset event: {} for userId={} asset={}", event.getEventType(), event.getUserId(), event.getAssetCode());
        sendMessage(TOPIC_ASSETS, event.getUserId().toString(), event);
    }

    public void publishUserEvent(UserEvent event) {
        log.info("Publishing user event: {} for userId={}", event.getEventType(), event.getUserId());
        sendMessage(TOPIC_USERS, event.getUserId().toString(), event);
    }

    public void publishNotification(String key, Object message) {
        log.info("Publishing notification: key={}", key);
        sendMessage(TOPIC_NOTIFICATIONS, key, message);
    }

    private void sendMessage(String topic, String key, Object message) {
        try {
            CompletableFuture<SendResult<String, Object>> future = kafkaTemplate.send(topic, key, message);
            future.whenComplete((result, ex) -> {
                if (ex == null) {
                    log.debug("Kafka message sent successfully to topic={} partition={} offset={}",
                            topic, result.getRecordMetadata().partition(), result.getRecordMetadata().offset());
                } else {
                    log.error("Failed to send Kafka message to topic={}: {}", topic, ex.getMessage());
                }
            });
        } catch (Exception e) {
            log.error("Error publishing to Kafka topic={}: {}", topic, e.getMessage());
        }
    }
}
