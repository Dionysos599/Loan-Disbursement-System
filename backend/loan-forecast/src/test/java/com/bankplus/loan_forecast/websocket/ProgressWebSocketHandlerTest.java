package com.bankplus.loan_forecast.websocket;

import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.WebSocketMessage;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.WebSocketExtension;

import java.net.InetSocketAddress;
import java.net.URI;
import java.security.Principal;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ContextConfiguration(classes = {ProgressWebSocketHandlerTest.TestConfig.class, ProgressWebSocketHandler.class})
class ProgressWebSocketHandlerTest {
    @Autowired
    private ProgressWebSocketHandler handler;

    @Test
    void testBroadcast() throws Exception {
        // use anonymous inner class to mock WebSocketSession
        class FakeSession implements WebSocketSession {
            private String lastMsg;
            @Override
            public void sendMessage(WebSocketMessage<?> message) {
                if (message instanceof TextMessage) {
                    lastMsg = ((TextMessage) message).getPayload();
                } else {
                    throw new UnsupportedOperationException();
                }
            }
            public String getLastMsg() { return lastMsg; }
            // implement all methods, but throw exception for unsupported methods
            @Override public String getId() { return "fake-session-id"; }
            @Override public URI getUri() { throw new UnsupportedOperationException(); }
            @Override public org.springframework.http.HttpHeaders getHandshakeHeaders() { throw new UnsupportedOperationException(); }
            @Override public Map<String, Object> getAttributes() { throw new UnsupportedOperationException(); }
            @Override public Principal getPrincipal() { throw new UnsupportedOperationException(); }
            @Override public InetSocketAddress getLocalAddress() { throw new UnsupportedOperationException(); }
            @Override public InetSocketAddress getRemoteAddress() { throw new UnsupportedOperationException(); }
            @Override public String getAcceptedProtocol() { throw new UnsupportedOperationException(); }
            @Override public void setTextMessageSizeLimit(int messageSizeLimit) { throw new UnsupportedOperationException(); }
            @Override public int getTextMessageSizeLimit() { throw new UnsupportedOperationException(); }
            @Override public void setBinaryMessageSizeLimit(int messageSizeLimit) { throw new UnsupportedOperationException(); }
            @Override public int getBinaryMessageSizeLimit() { throw new UnsupportedOperationException(); }
            @Override public List<WebSocketExtension> getExtensions() { throw new UnsupportedOperationException(); }
            @Override public boolean isOpen() { return true; }
            @Override public void close() { }
            @Override public void close(CloseStatus status) { }
        }
        FakeSession session = new FakeSession();
        handler.afterConnectionEstablished(session);
        handler.broadcast("{\"status\":\"SUCCESS\"}");
        assertEquals("{\"status\":\"SUCCESS\"}", session.getLastMsg());
        handler.afterConnectionClosed(session, null);
    }

    @Configuration
    static class TestConfig {
        @Bean
        public ProgressWebSocketHandler handler() {
            ProgressWebSocketHandler h = new ProgressWebSocketHandler();
            h.getClass().getDeclaredFields(); // force init
            return h;
        }
    }
} 