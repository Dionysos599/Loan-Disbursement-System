package com.bankplus.data_ingestion.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ForecastRequest {
    private String batchId;
    private LocalDate forecastStartDate;
    private LocalDate forecastEndDate;
    private String forecastModel; // "S-curve", "linear", "custom"
    private List<String> selectedLoanNumbers; // Optional: specific loans to forecast
    private ForecastParameters parameters;
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ForecastParameters {
        private Double sCurveSteepness;
        private Double sCurveMidpoint;
        private Double completionRate;
        private Double riskAdjustment;
    }
} 