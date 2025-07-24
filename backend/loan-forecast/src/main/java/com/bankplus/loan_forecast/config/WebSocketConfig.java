package com.bankplus.loan_forecast.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;
import org.springframework.beans.factory.annotation.Autowired;
import com.bankplus.loan_forecast.websocket.ProgressWebSocketHandler;
import org.springframework.lang.NonNull;

@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {
    @Autowired
    private ProgressWebSocketHandler progressWebSocketHandler;

    @Override
    public void registerWebSocketHandlers(@NonNull WebSocketHandlerRegistry registry) {
        registry.addHandler(progressWebSocketHandler, "/ws/progress").setAllowedOrigins("*");
    }
} 