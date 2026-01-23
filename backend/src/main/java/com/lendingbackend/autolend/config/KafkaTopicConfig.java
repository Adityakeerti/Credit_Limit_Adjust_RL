package com.lendingbackend.autolend.config;

import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.TopicBuilder;

@Configuration
public class KafkaTopicConfig {

    public static final String TOPIC_TRANSACTIONS = "transactions";
    public static final String TOPIC_ASSETS = "assets";
    public static final String TOPIC_USERS = "users";
    public static final String TOPIC_NOTIFICATIONS = "notifications";

    @Bean
    public NewTopic transactionsTopic() {
        return TopicBuilder.name(TOPIC_TRANSACTIONS)
                .partitions(3)
                .replicas(1)
                .build();
    }

    @Bean
    public NewTopic assetsTopic() {
        return TopicBuilder.name(TOPIC_ASSETS)
                .partitions(3)
                .replicas(1)
                .build();
    }

    @Bean
    public NewTopic usersTopic() {
        return TopicBuilder.name(TOPIC_USERS)
                .partitions(3)
                .replicas(1)
                .build();
    }

    @Bean
    public NewTopic notificationsTopic() {
        return TopicBuilder.name(TOPIC_NOTIFICATIONS)
                .partitions(3)
                .replicas(1)
                .build();
    }
}
