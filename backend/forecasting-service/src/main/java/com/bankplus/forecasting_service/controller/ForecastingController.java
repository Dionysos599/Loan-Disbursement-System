package com.bankplus.forecasting_service.controller;

import com.bankplus.forecasting_service.dto.ForecastResponse;
import com.bankplus.forecasting_service.model.ForecastData;
import com.bankplus.forecasting_service.service.ForecastingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/forecasting")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class ForecastingController {

    private final ForecastingService forecastingService;

    @PostMapping("/generate")
    public ResponseEntity<ForecastResponse> generateForecast(@RequestBody Map<String, Object> request) {
        log.info("Received forecast generation request");
        
        try {
            String loanNumber = (String) request.get("loanNumber");
            BigDecimal totalLoanAmount = new BigDecimal(request.get("totalLoanAmount").toString());
            BigDecimal currentDrawnAmount = new BigDecimal(request.get("currentDrawnAmount").toString());
            BigDecimal currentCompletion = new BigDecimal(request.get("currentCompletion").toString());
            
            LocalDate startDate = LocalDate.parse(request.get("startDate").toString());
            LocalDate maturityDate = LocalDate.parse(request.get("maturityDate").toString());
            LocalDate forecastStartDate = LocalDate.parse(request.get("forecastStartDate").toString());
            LocalDate forecastEndDate = LocalDate.parse(request.get("forecastEndDate").toString());
            
            String forecastModel = (String) request.getOrDefault("forecastModel", "S-curve");
            
            List<ForecastData> forecastData;
            
            if ("S-curve".equalsIgnoreCase(forecastModel)) {
                double steepness = Double.parseDouble(request.getOrDefault("steepness", "6.0").toString());
                double midpoint = Double.parseDouble(request.getOrDefault("midpoint", "0.4").toString());
                
                forecastData = forecastingService.generateSCurveForecast(
                    loanNumber, totalLoanAmount, currentDrawnAmount, currentCompletion,
                    startDate, maturityDate, forecastStartDate, forecastEndDate, steepness, midpoint
                );
            } else if ("linear".equalsIgnoreCase(forecastModel)) {
                forecastData = forecastingService.generateLinearForecast(
                    loanNumber, totalLoanAmount, currentDrawnAmount, forecastStartDate, forecastEndDate
                );
            } else if ("multiple".equalsIgnoreCase(forecastModel)) {
                forecastData = forecastingService.generateMultipleScenarios(
                    loanNumber, totalLoanAmount, currentDrawnAmount, currentCompletion,
                    startDate, maturityDate, forecastStartDate, forecastEndDate
                );
            } else {
                throw new IllegalArgumentException("Unsupported forecast model: " + forecastModel);
            }
            
            // Calculate summary statistics
            Map<String, Object> summary = calculateSummary(forecastData);
            
            ForecastResponse response = ForecastResponse.builder()
                    .forecastId(forecastingService.generateForecastId())
                    .batchId((String) request.get("batchId"))
                    .status("COMPLETED")
                    .generatedAt(LocalDateTime.now())
                    .forecastStartDate(forecastStartDate.atStartOfDay())
                    .forecastEndDate(forecastEndDate.atStartOfDay())
                    .forecastModel(forecastModel)
                    .forecastData(forecastData)
                    .summary(summary)
                    .message("Forecast generated successfully")
                    .build();
            
            log.info("Generated forecast with {} data points", forecastData.size());
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("Error generating forecast: {}", e.getMessage(), e);
            
            ForecastResponse errorResponse = ForecastResponse.builder()
                    .status("ERROR")
                    .generatedAt(LocalDateTime.now())
                    .message("Failed to generate forecast: " + e.getMessage())
                    .build();
            
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }
    
    private Map<String, Object> calculateSummary(List<ForecastData> forecastData) {
        Map<String, Object> summary = new HashMap<>();
        
        if (forecastData.isEmpty()) {
            return summary;
        }
        
        // Calculate total forecasted amount
        BigDecimal totalForecasted = forecastData.stream()
                .map(ForecastData::getCumulativeAmount)
                .max(BigDecimal::compareTo)
                .orElse(BigDecimal.ZERO);
        
        // Calculate average monthly disbursement
        BigDecimal totalMonthly = forecastData.stream()
                .map(ForecastData::getMonthlyAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        BigDecimal avgMonthly = totalMonthly.divide(BigDecimal.valueOf(forecastData.size()), 2, BigDecimal.ROUND_HALF_UP);
        
        // Calculate peak month
        ForecastData peakMonth = forecastData.stream()
                .max((a, b) -> a.getMonthlyAmount().compareTo(b.getMonthlyAmount()))
                .orElse(null);
        
        summary.put("totalForecastedAmount", totalForecasted);
        summary.put("averageMonthlyDisbursement", avgMonthly);
        summary.put("peakMonth", peakMonth != null ? peakMonth.getDate() : null);
        summary.put("peakAmount", peakMonth != null ? peakMonth.getMonthlyAmount() : BigDecimal.ZERO);
        summary.put("totalDataPoints", forecastData.size());
        
        return summary;
    }
    
    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> healthCheck() {
        return ResponseEntity.ok(Map.of("status", "UP", "service", "forecasting-service"));
    }
} 