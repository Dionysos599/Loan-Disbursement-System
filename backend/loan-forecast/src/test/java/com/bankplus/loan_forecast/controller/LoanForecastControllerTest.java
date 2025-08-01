package com.bankplus.loan_forecast.controller;

import com.bankplus.loan_forecast.model.UploadHistory;
import com.bankplus.loan_forecast.repository.UploadHistoryRepository;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;

import java.time.Instant;
import java.util.List;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ContextConfiguration(classes = {LoanForecastController.class, TestConfig.class})
class LoanForecastControllerTest {
    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private UploadHistoryRepository uploadHistoryRepository;

    @Test
    void testPing() throws Exception {
        mockMvc.perform(get("/api/loan-forecast/ping"))
                .andExpect(status().isOk())
                .andExpect(content().string("Pong"));
    }

    @Test
    void testGetUploadHistory_success() throws Exception {
        UploadHistory h = new UploadHistory();
        h.setId(1L);
        h.setBatchId("b1");
        h.setOriginalFilePath("/tmp/file.csv");
        h.setForecastCsvPath(null);
        h.setUploadedAt(Instant.now());
        when(uploadHistoryRepository.findAllByOrderByUploadedAtDesc()).thenReturn(List.of(h));
        // directly depend on the existence of the file, or can touch /tmp/file.csv in advance
        mockMvc.perform(get("/api/loan-forecast/upload-history").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());
    }

    @Test
    void testGetUploadHistory_error() throws Exception {
        when(uploadHistoryRepository.findAllByOrderByUploadedAtDesc()).thenThrow(new RuntimeException("db error"));
        mockMvc.perform(get("/api/loan-forecast/upload-history"))
                .andExpect(status().isInternalServerError());
    }

    @Test
    void testGetLatestSuccessfulUpload_found() throws Exception {
        UploadHistory h = new UploadHistory();
        h.setId(2L);
        h.setBatchId("b2");
        h.setUploadedAt(Instant.now());
        when(uploadHistoryRepository.findFirstByUploadStatusOrderByUploadedAtDesc("SUCCESS")).thenReturn(h);
        mockMvc.perform(get("/api/loan-forecast/upload-history/latest").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.batchId").value("b2"));
    }

    @Test
    void testGetLatestSuccessfulUpload_notFound() throws Exception {
        when(uploadHistoryRepository.findFirstByUploadStatusOrderByUploadedAtDesc("SUCCESS")).thenReturn(null);
        mockMvc.perform(get("/api/loan-forecast/upload-history/latest").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound());
    }

    @Test
    void testGetLatestSuccessfulUpload_error() throws Exception {
        when(uploadHistoryRepository.findFirstByUploadStatusOrderByUploadedAtDesc("SUCCESS")).thenThrow(new RuntimeException("db error"));
        mockMvc.perform(get("/api/loan-forecast/upload-history/latest").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isInternalServerError());
    }
} 