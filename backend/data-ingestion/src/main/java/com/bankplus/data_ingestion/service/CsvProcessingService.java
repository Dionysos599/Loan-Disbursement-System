package com.bankplus.data_ingestion.service;

import com.bankplus.data_ingestion.dto.LoanForecastData;
import com.bankplus.data_ingestion.model.CsvLoanData;
import com.opencsv.bean.CsvToBean;
import com.opencsv.bean.CsvToBeanBuilder;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.Reader;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@Slf4j
public class CsvProcessingService {

    public List<CsvLoanData> processCsvFile(MultipartFile file) throws IOException {
        log.info("Processing CSV file: {}", file.getOriginalFilename());
        
        try (Reader reader = new BufferedReader(new InputStreamReader(file.getInputStream()))) {
            CsvToBean<CsvLoanData> csvToBean = new CsvToBeanBuilder<CsvLoanData>(reader)
                    .withType(CsvLoanData.class)
                    .withIgnoreLeadingWhiteSpace(true)
                    .withIgnoreEmptyLine(true)
                    .build();
            
            List<CsvLoanData> loanDataList = csvToBean.parse();
            log.info("Successfully parsed {} records from CSV file", loanDataList.size());
            
            return loanDataList;
        }
    }
    
    public List<LoanForecastData> convertToLoanForecastData(List<CsvLoanData> csvDataList) {
        List<LoanForecastData> forecastDataList = new ArrayList<>();
        
        for (CsvLoanData csvData : csvDataList) {
            try {
                Map<String, BigDecimal> forecastValues = csvData.getForecastValues();
                BigDecimal totalForecastedAmount = forecastValues.values().stream()
                        .reduce(BigDecimal.ZERO, BigDecimal::add);
                
                LoanForecastData forecastData = LoanForecastData.builder()
                        .loanNumber(csvData.getLoanNumber())
                        .customerName(csvData.getCustomerName())
                        .loanAmount(parseBigDecimal(csvData.getLoanAmount()))
                        .maturityDate(parseDate(csvData.getMaturityDate()))
                        .extendedDate(parseDate(csvData.getExtendedDate()))
                        .propertyType(csvData.getPropertyType())
                        .jobAddress(csvData.getJobAddress())
                        .city(csvData.getCity())
                        .ltcRatio(parseBigDecimal(csvData.getLtcRatio()))
                        .ltvRatio(parseBigDecimal(csvData.getLtvRatio()))
                        .landDraw(parseBigDecimal(csvData.getLandDraw()))
                        .interestRate(parseBigDecimal(csvData.getInterestRate()))
                        .outstandingBalance(parseBigDecimal(csvData.getOutstandingBalance()))
                        .undisbursedAmount(parseBigDecimal(csvData.getUndisbursedAmount()))
                        .percentOfLoanDrawn(parseBigDecimal(csvData.getPercentOfLoanDrawn()))
                        .percentOfCompletion(parseBigDecimal(csvData.getPercentOfCompletion()))
                        .forecastData(forecastValues)
                        .totalForecastedAmount(totalForecastedAmount)
                        .forecastMonths(forecastValues.size())
                        .build();
                
                forecastDataList.add(forecastData);
                log.debug("Converted loan data for: {}", csvData.getCustomerName());
                
            } catch (Exception e) {
                log.error("Error converting CSV data for loan {}: {}", csvData.getLoanNumber(), e.getMessage());
            }
        }
        
        log.info("Successfully converted {} records to forecast data", forecastDataList.size());
        return forecastDataList;
    }
    
    public String generateBatchId() {
        return "BATCH_" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }
    
    private BigDecimal parseBigDecimal(String value) {
        try {
            if (value == null || value.trim().isEmpty()) {
                return BigDecimal.ZERO;
            }
            // Remove currency symbols, commas, and spaces
            String cleanValue = value.replaceAll("[$,%\\s]", "");
            return new BigDecimal(cleanValue);
        } catch (NumberFormatException e) {
            log.warn("Could not parse BigDecimal from value: {}", value);
            return BigDecimal.ZERO;
        }
    }
    
    private LocalDate parseDate(String dateStr) {
        try {
            if (dateStr == null || dateStr.trim().isEmpty()) {
                return null;
            }
            // Try different date formats
            String[] formats = {"M/d/yy", "M/d/yyyy", "MM/dd/yy", "MM/dd/yyyy"};
            for (String format : formats) {
                try {
                    DateTimeFormatter formatter = DateTimeFormatter.ofPattern(format);
                    return LocalDate.parse(dateStr.trim(), formatter);
                } catch (Exception e) {
                    // Continue to next format
                }
            }
            log.warn("Could not parse date: {}", dateStr);
            return null;
        } catch (Exception e) {
            log.warn("Error parsing date {}: {}", dateStr, e.getMessage());
            return null;
        }
    }
} 