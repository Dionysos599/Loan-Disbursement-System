package com.bankplus.forecasting_service.dto;

import com.bankplus.forecasting_service.model.ForecastData;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ForecastResponse {
    private String forecastId;
    private String batchId;
    private String status;
    private LocalDateTime generatedAt;
    private LocalDateTime forecastStartDate;
    private LocalDateTime forecastEndDate;
    private String forecastModel;
    private List<ForecastData> forecastData;
    private Map<String, Object> summary;
    private String message;
} 