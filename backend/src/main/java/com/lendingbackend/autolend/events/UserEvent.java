package com.lendingbackend.autolend.events;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserEvent {
    private UUID eventId;
    private String eventType; // USER_REGISTERED, USER_UPDATED, USER_STATUS_CHANGED
    private UUID userId;
    private String email;
    private String name;
    private String role;
    private String status;
    private Instant timestamp;
}
