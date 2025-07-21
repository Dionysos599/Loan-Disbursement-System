package com.bankplus.loan_forecast.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DataIngestionResponse {
    private String batchId;
    private String status;
    private int totalRecords;
    private int processedRecords;
    private int failedRecords;
    private List<String> errors;
    private LocalDateTime processedAt;
    private String message;
    private List<LoanForecastData> loanForecasts;
} 