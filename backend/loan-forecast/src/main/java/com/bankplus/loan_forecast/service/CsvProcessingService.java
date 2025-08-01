package com.bankplus.loan_forecast.service;

import com.bankplus.loan_forecast.dto.LoanForecastData;
import com.bankplus.loan_forecast.model.CsvLoanData;
import com.bankplus.loan_forecast.service.algorithm.AlgorithmFactory;
import com.bankplus.loan_forecast.service.algorithm.ForecastAlgorithmInterface;
import com.opencsv.CSVReader;
import com.opencsv.CSVWriter;
import com.opencsv.exceptions.CsvValidationException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.*;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.Locale;
import io.micrometer.core.instrument.Timer;
import org.springframework.beans.factory.annotation.Autowired;

@Service
@Slf4j
public class CsvProcessingService {
    private final LoanProcessingMetrics metrics;
    private final AlgorithmFactory algorithmFactory;

    @Autowired
    public CsvProcessingService(LoanProcessingMetrics metrics, AlgorithmFactory algorithmFactory) {
        this.metrics = metrics;
        this.algorithmFactory = algorithmFactory;
    }

    public List<CsvLoanData> processCsvFile(MultipartFile file) throws IOException {
        log.info("Processing CSV file: {}", file.getOriginalFilename());
        metrics.onProcessingStart();
        Timer.Sample sample = metrics.startTimer();
        
        try {
            List<CsvLoanData> result = processCsvData(new InputStreamReader(file.getInputStream()));
            BigDecimal totalAmount = calculateTotalAmount(result);
            long durationMs = sample.stop(metrics.getProcessingTimer());
            metrics.onProcessingComplete(durationMs, result.size(), totalAmount);
            return result;
        } catch (IOException e) {
            metrics.onProcessingError("io_error", 1);
            throw new RuntimeException(e);
        }
    }

    public List<LoanForecastData> processCsvFileFromPath(String filePath, String startMonth) throws IOException {
        log.info("Processing CSV file from path: {}", filePath);
        metrics.onProcessingStart();
        Timer.Sample sample = metrics.startTimer();
        
        try (Reader reader = new FileReader(filePath)) {
            List<CsvLoanData> loanDataList = processCsvData(reader);
            BigDecimal totalAmount = calculateTotalAmount(loanDataList);
            long durationMs = sample.stop(metrics.getProcessingTimer());
            metrics.onProcessingComplete(durationMs, loanDataList.size(), totalAmount);
            log.info("Successfully parsed {} loan records from CSV file", loanDataList.size());
            return convertToLoanForecastData(loanDataList, startMonth);
        } catch (IOException e) {
            metrics.onProcessingError("io_error", 1);
            throw new RuntimeException(e);
        }
    }
    
    private BigDecimal calculateTotalAmount(List<CsvLoanData> loanDataList) {
        return loanDataList.stream()
            .map(data -> {
                if (data.getLoanAmount() != null && !data.getLoanAmount().isEmpty()) {
                    try {
                        return new BigDecimal(data.getLoanAmount());
                    } catch (NumberFormatException e) {
                        return BigDecimal.ZERO;
                    }
                }
                return BigDecimal.ZERO;
            })
            .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    /**
     * Only extract the required columns, ignore all other columns
     */
    public List<CsvLoanData> processCsvData(Reader reader) throws IOException {
        List<CsvLoanData> loanDataList = new ArrayList<>();
        
        try (CSVReader csvReader = new CSVReader(reader)) {
            String[] headers;
            try {
                headers = csvReader.readNext();
                if (headers == null) {
                    throw new IOException("CSV file is empty or has no headers");
                }
            } catch (CsvValidationException e) {
                throw new IOException("Invalid CSV format: " + e.getMessage(), e);
            }
            
            // Find the index of the required columns
            Map<String, Integer> columnIndexes = findRequiredColumnIndexes(headers);
            log.info("Found required columns at indexes: {}", columnIndexes);
            
            // Verify that all required columns exist
            String[] criticalColumns = {"Loan Number", "Loan Amount", "Maturity Date", "Extended Date", 
                                      "Outstanding Balance", "Undisbursed Amount", "% of Completion"};
            for (String col : criticalColumns) {
                if (!columnIndexes.containsKey(col)) {
                    throw new IOException("Required column missing: " + col);
                }
            }
            
            String[] row;
            int rowNum = 1;
            try {
                while ((row = csvReader.readNext()) != null) {
                    rowNum++;
                    try {
                        CsvLoanData loanData = extractRequiredFields(row, columnIndexes);
                        if (loanData != null) {
                            loanDataList.add(loanData);
                        }
                    } catch (Exception e) {
                        log.warn("Skipping row {} due to parsing error: {}", rowNum, e.getMessage());
                    }
                }
            } catch (CsvValidationException e) {
                throw new IOException("CSV validation error at row " + rowNum + ": " + e.getMessage(), e);
            }
        }
        
        log.info("Successfully extracted {} valid loan records from CSV", loanDataList.size());
        return loanDataList;
    }
    
    /**
     * Find the index of the required columns in the CSV
     */
    private Map<String, Integer> findRequiredColumnIndexes(String[] headers) {
        Map<String, Integer> indexes = new HashMap<>();
        String[] requiredColumns = {"Loan Number", "Customer Name", "Loan Amount", "Maturity Date", "Extended Date", 
                                  "Outstanding Balance", "Undisbursed Amount", "% of Loan Drawn", "% of Completion"};
        
        // Debug: Print all headers for troubleshooting
        log.info("CSV Headers found: {}", Arrays.toString(headers));
        
        for (String requiredCol : requiredColumns) {
            for (int i = 0; i < headers.length; i++) {
                // More aggressive cleaning: remove quotes, trim, normalize whitespace, remove BOM
                String header = headers[i]
                    .trim()
                    .replaceAll("\"", "")
                    .replaceAll("\\s+", " ")  // normalize whitespace
                    .replaceAll("^\\uFEFF", "");  // remove BOM if present
                
                log.debug("Comparing '{}' with '{}'", requiredCol, header);
                
                if (requiredCol.equals(header)) {
                    indexes.put(requiredCol, i);
                    log.debug("Found column '{}' at index {}", requiredCol, i);
                    break;
                }
            }
        }
        
        // Debug: Show what columns were found
        log.info("Column mapping result: {}", indexes);
        
        return indexes;
    }
    
    /**
     * Extract the required fields from the CSV row and create a CsvLoanData object
     */
    private CsvLoanData extractRequiredFields(String[] row, Map<String, Integer> columnIndexes) {
        try {
            String loanNumber = getColumnValue(row, columnIndexes, "Loan Number");
            String customerName = getColumnValue(row, columnIndexes, "Customer Name");
            String loanAmount = getColumnValue(row, columnIndexes, "Loan Amount");
            String maturityDate = getColumnValue(row, columnIndexes, "Maturity Date");
            String extendedDate = getColumnValue(row, columnIndexes, "Extended Date");
            String outstandingBalance = getColumnValue(row, columnIndexes, "Outstanding Balance");
            String undisbursedAmount = getColumnValue(row, columnIndexes, "Undisbursed Amount");
            String percentOfLoanDrawn = getColumnValue(row, columnIndexes, "% of Loan Drawn");
            String percentOfCompletion = getColumnValue(row, columnIndexes, "% of Completion");
            
            if (isEmpty(loanNumber) || isEmpty(loanAmount) || isEmpty(maturityDate) 
                || isEmpty(extendedDate) || isEmpty(outstandingBalance) 
                || isEmpty(undisbursedAmount) || isEmpty(percentOfCompletion)) {
                return null; // Skip invalid rows
            }
            
            CsvLoanData loanData = new CsvLoanData();
            loanData.setLoanNumber(loanNumber);
            loanData.setCustomerName(customerName);
            loanData.setLoanAmount(loanAmount);
            loanData.setMaturityDate(maturityDate);
            loanData.setExtendedDate(extendedDate);
            loanData.setOutstandingBalance(outstandingBalance);
            loanData.setUndisbursedAmount(undisbursedAmount);
            loanData.setPercentOfLoanDrawn(percentOfLoanDrawn);
            loanData.setPercentOfCompletion(percentOfCompletion);
            
            return loanData;
        } catch (Exception e) {
            log.error("Error extracting fields from row: {}", e.getMessage());
            return null;
        }
    }
    
    private String getColumnValue(String[] row, Map<String, Integer> columnIndexes, String columnName) {
        Integer index = columnIndexes.get(columnName);
        if (index == null || index >= row.length) {
            return "";
        }
        String value = row[index];
        return value != null ? value.trim() : "";
    }
    
    private boolean isEmpty(String s) {
        return s == null || s.trim().isEmpty() || "N/A".equalsIgnoreCase(s.trim());
    }

    /**
     * Generate forecast data
     */
    public List<LoanForecastData> convertToLoanForecastData(List<CsvLoanData> csvDataList, String startMonthStr) {
        log.info("Converting {} CSV records to forecast data using local algorithms", csvDataList.size());
        
        try {
            LocalDate forecastStartDate;
            if (startMonthStr.matches("\\d{4}-\\d{2}")) {
                // Handle yyyy-MM format
                forecastStartDate = LocalDate.parse(startMonthStr + "-01");
            } else {
                // Handle yyyy-MM-dd format
                forecastStartDate = LocalDate.parse(startMonthStr);
            }
            
            // Convert CSV data to Map
            List<Map<String, Object>> loanDataList = new ArrayList<>();
            for (CsvLoanData csvData : csvDataList) {
                Map<String, Object> loanData = convertCsvToMap(csvData);
                if (loanData != null) {
                    loanDataList.add(loanData);
                }
            }
            
            // Calculate forecasts (slow-fast-slow curve)
            List<Map<String, Object>> loanForecasts = calculateForecastsLocally(loanDataList, forecastStartDate);
            
            List<LoanForecastData> result = new ArrayList<>();
            for (Map<String, Object> forecast : loanForecasts) {
                LoanForecastData loanForecastData = convertMapToLoanForecastData(forecast);
                if (loanForecastData != null) {
                    result.add(loanForecastData);
                }
            }
            
            log.info("Successfully converted {} records to forecast data", result.size());
            return result;
            
        } catch (Exception e) {
            log.error("Error generating forecast data: {}", e.getMessage(), e);
            return new ArrayList<>();
        }
    }
    
    /**
     * Calculate forecasts
     */
    private List<Map<String, Object>> calculateForecastsLocally(List<Map<String, Object>> loanDataList, LocalDate forecastStartDate) {
        List<Map<String, Object>> results = new ArrayList<>();
        
        for (Map<String, Object> loanData : loanDataList) {
            try {
                Map<String, Object> forecast = calculateSingleLoanForecastLocally(loanData, forecastStartDate);
                if (forecast != null) {
                    results.add(forecast);
                }
            } catch (Exception e) {
                log.error("Error calculating local forecast for loan: {}", loanData.get("loanNumber"), e);
            }
        }
        
        return results;
    }
    
    /**
     * Calculate forecasts for a single loan
     */
    private Map<String, Object> calculateSingleLoanForecastLocally(Map<String, Object> loanData, LocalDate forecastStartDate) {
        String loanNumber = (String) loanData.get("loanNumber");
        log.debug("Processing loan: {}", loanNumber);
        
        String customerName = (String) loanData.get("customerName");
        BigDecimal loanAmount = (BigDecimal) loanData.get("loanAmount");
        BigDecimal outstandingBalance = (BigDecimal) loanData.get("outstandingBalance");
        BigDecimal undisbursedAmount = (BigDecimal) loanData.get("undisbursedAmount");
        Integer percentOfCompletion = (Integer) loanData.get("percentOfCompletion");
        LocalDate extendedDate = (LocalDate) loanData.get("extendedDate");
        
        log.debug("Loan {}: loanAmount={}, outstandingBalance={}, undisbursedAmount={}, percentOfCompletion={}, extendedDate={}", 
                 loanNumber, loanAmount, outstandingBalance, undisbursedAmount, percentOfCompletion, extendedDate);
        
        // Validate parameters
        if (outstandingBalance.compareTo(BigDecimal.ZERO) < 0 || 
            undisbursedAmount.compareTo(BigDecimal.ZERO) < 0 ||
            percentOfCompletion < 0 || percentOfCompletion > 100) {
            log.warn("Invalid parameters for loan {}", loanNumber);
            log.warn("  outstandingBalance: {}, undisbursedAmount: {}, percentOfCompletion: {}", 
                     outstandingBalance, undisbursedAmount, percentOfCompletion);
            return null;
        }
        
        log.debug("Loan {} passed validation, generating forecasts...", loanNumber);
        
        LocalDate projectStartDate = calculateProjectStartDate(percentOfCompletion / 100.0, forecastStartDate, extendedDate);
        LocalDate cutoffDate = extendedDate.plusMonths(6);
        LocalDate forecastEndDate = cutoffDate.withDayOfMonth(1).plusMonths(1);
        
        // Generate monthly forecasts
        Map<String, BigDecimal> monthlyForecasts = new HashMap<>();
        LocalDate currentDate = forecastStartDate;
        BigDecimal totalForecastedAmount = BigDecimal.ZERO;
        int forecastMonths = 0;
        
        while (!currentDate.isAfter(forecastEndDate)) {
            BigDecimal forecastOutstandingBalance;
            
            // If the current date is after the month of Extended Date + 180 days, the forecast value is 0
            if (currentDate.isAfter(cutoffDate.withDayOfMonth(1).minusMonths(1))) {
                forecastOutstandingBalance = BigDecimal.ZERO;
            } else {
                forecastOutstandingBalance = calculateForecastOutstandingBalance(
                    outstandingBalance, undisbursedAmount, percentOfCompletion / 100.0,
                    projectStartDate, currentDate, extendedDate
                );
            }
            
            // Formatting: MMM-yy
            String monthKey = currentDate.format(DateTimeFormatter.ofPattern("MMM-yy", Locale.ENGLISH));
            log.debug("Generating forecast for month: {} (currentDate: {})", monthKey, currentDate);
            monthlyForecasts.put(monthKey, forecastOutstandingBalance.setScale(2, RoundingMode.HALF_UP));
            totalForecastedAmount = totalForecastedAmount.add(forecastOutstandingBalance);
            forecastMonths++;
            
            currentDate = currentDate.plusMonths(1);
        }
        
        Map<String, Object> result = new HashMap<>();
        result.put("loanNumber", loanNumber);
        result.put("customerName", customerName);
        result.put("loanAmount", loanAmount);
        result.put("outstandingBalance", outstandingBalance);
        result.put("undisbursedAmount", undisbursedAmount);
        result.put("percentOfCompletion", BigDecimal.valueOf(percentOfCompletion));
        result.put("maturityDate", loanData.get("maturityDate"));
        result.put("extendedDate", extendedDate.toString());
        result.put("percentOfLoanDrawn", loanData.get("percentOfLoanDrawn") != null ? loanData.get("percentOfLoanDrawn") : BigDecimal.ZERO);
        result.put("forecastData", monthlyForecasts);
        result.put("totalForecastedAmount", totalForecastedAmount.setScale(2, RoundingMode.HALF_UP));
        result.put("forecastMonths", forecastMonths);
        
        return result;
    }
    
    private LocalDate calculateProjectStartDate(double percentOfCompletion, LocalDate forecastStartDate, LocalDate extendedDate) {
        long daysFromForecastToExtended = ChronoUnit.DAYS.between(forecastStartDate, extendedDate);
        double targetTotalProgressAtStart = 0.125;
        
        if (targetTotalProgressAtStart < percentOfCompletion) {
            targetTotalProgressAtStart = percentOfCompletion + 0.01;
        }
        
        double timeProgressRatio = (targetTotalProgressAtStart - percentOfCompletion) / (1.0 - percentOfCompletion);
        
        if (timeProgressRatio >= 1.0) {
            timeProgressRatio = 0.1;
        }
        
        long daysFromProjectStartToForecastStart = Math.round(daysFromForecastToExtended * timeProgressRatio / (1.0 - timeProgressRatio));
        return forecastStartDate.minusDays(daysFromProjectStartToForecastStart);
    }
    
    private BigDecimal calculateForecastOutstandingBalance(
            BigDecimal outstandingBalance, 
            BigDecimal undisbursedAmount, 
            double percentOfCompletion,
            LocalDate projectStartDate, 
            LocalDate forecastDate, 
            LocalDate extendedDate) {
        
        ForecastAlgorithmInterface algorithm = algorithmFactory.getActiveAlgorithm();
        return algorithm.calculateForecastOutstandingBalance(
                outstandingBalance, 
                undisbursedAmount, 
                percentOfCompletion,
                projectStartDate, 
                forecastDate, 
                extendedDate);
    }
    
    private Map<String, Object> convertCsvToMap(CsvLoanData csvData) {
        try {
            // Only depend on the following fields
            String loanNumber = csvData.getLoanNumber();
            String loanAmount = csvData.getLoanAmount();
            String maturityDate = csvData.getMaturityDate();
            String extendedDate = csvData.getExtendedDate();
            String outstandingBalance = csvData.getOutstandingBalance();
            String undisbursedAmount = csvData.getUndisbursedAmount();
            String percentOfCompletion = csvData.getPercentOfCompletion();
            String percentOfLoanDrawn = csvData.getPercentOfLoanDrawn();

            // Validate critical fields, discard if any is empty
            if (isEmpty(loanNumber) || isEmpty(loanAmount) || isEmpty(maturityDate)
                || isEmpty(extendedDate) || isEmpty(outstandingBalance)
                || isEmpty(undisbursedAmount) || isEmpty(percentOfCompletion)) {
                return null;
            }

            Map<String, Object> loanData = new HashMap<>();
            loanData.put("loanNumber", loanNumber);
            loanData.put("customerName", csvData.getCustomerName());
            loanData.put("loanAmount", parseBigDecimal(loanAmount));
            loanData.put("maturityDate", parseDate(maturityDate));
            loanData.put("extendedDate", parseDate(extendedDate));
            loanData.put("outstandingBalance", parseBigDecimal(outstandingBalance));
            loanData.put("undisbursedAmount", parseBigDecimal(undisbursedAmount));
            loanData.put("percentOfCompletion", parseInteger(percentOfCompletion));
            loanData.put("percentOfLoanDrawn", parseBigDecimal(percentOfLoanDrawn));
            return loanData;
        } catch (Exception e) {
            log.error("Error converting CSV data to map for loan: {}", csvData.getLoanNumber(), e);
            return null;
        }
    }
    
    private LoanForecastData convertMapToLoanForecastData(Map<String, Object> forecast) {
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> forecastDataMap = (Map<String, Object>) forecast.get("forecastData");
            
            // Convert forecastData format
            Map<String, BigDecimal> forecastData = new HashMap<>();
            for (Map.Entry<String, Object> entry : forecastDataMap.entrySet()) {
                forecastData.put(entry.getKey(), new BigDecimal(entry.getValue().toString()));
            }
            
            return LoanForecastData.builder()
                    .loanNumber((String) forecast.get("loanNumber"))
                    .customerName((String) forecast.get("customerName"))
                    .loanAmount(new BigDecimal(forecast.get("loanAmount").toString()))
                    .outstandingBalance(new BigDecimal(forecast.get("outstandingBalance").toString()))
                    .undisbursedAmount(new BigDecimal(forecast.get("undisbursedAmount").toString()))
                    .percentOfCompletion(new BigDecimal(forecast.get("percentOfCompletion").toString()))
                    .extendedDate(LocalDate.parse(forecast.get("extendedDate").toString()))
                    .maturityDate(LocalDate.parse(forecast.get("maturityDate").toString()))
                    .percentOfLoanDrawn(new BigDecimal(forecast.get("percentOfLoanDrawn").toString()))
                    .forecastData(forecastData)
                    .totalForecastedAmount(new BigDecimal(forecast.get("totalForecastedAmount").toString()))
                    .forecastMonths((Integer) forecast.get("forecastMonths"))
                    .build();
        } catch (Exception e) {
            log.error("Error converting forecast map to LoanForecastData: {}", e.getMessage(), e);
            return null;
        }
    }
    
    private BigDecimal parseBigDecimal(String value) {
        try {
            if (value == null || value.trim().isEmpty() || "N/A".equals(value)) {
                return BigDecimal.ZERO;
            }
            String cleanValue = value.replaceAll("[$,%\\s]", "");
            return new BigDecimal(cleanValue);
        } catch (NumberFormatException e) {
            log.warn("Could not parse BigDecimal from value: {}", value);
            return BigDecimal.ZERO;
        }
    }
    
    private Integer parseInteger(String value) {
        try {
            if (value == null || value.trim().isEmpty() || "N/A".equals(value)) {
                return 0;
            }
            String cleanValue = value.replaceAll("[%\\s]", "");
            return Integer.parseInt(cleanValue);
        } catch (NumberFormatException e) {
            log.warn("Could not parse Integer from value: {}", value);
            return 0;
        }
    }
    
    private LocalDate parseDate(String dateStr) {
        if (dateStr == null || dateStr.trim().isEmpty() || "N/A".equals(dateStr)) {
            return LocalDate.now();
        }
        
        try {
            // Handle M/d/yy or MM/dd/yyyy format
            if (dateStr.contains("/")) {
                String[] parts = dateStr.split("/");
                if (parts.length == 3) {
                    int month = Integer.parseInt(parts[0]);
                    int day = Integer.parseInt(parts[1]);
                    int year = Integer.parseInt(parts[2]);
                    
                    // Handle two-digit years
                    if (year < 100) {
                        if (year < 50) {
                            year += 2000;
                        } else {
                            year += 1900;
                        }
                    }
                    
                    return LocalDate.of(year, month, day);
                }
            }
            
            // Try standard format
            try {
                return LocalDate.parse(dateStr);
            } catch (Exception ignored) {
                // Continue trying other formats
            }
            
            log.warn("Could not parse date: {}, using current date", dateStr);
            return LocalDate.now();
        } catch (Exception e) {
            log.error("Error parsing date: {}", dateStr, e);
            return LocalDate.now();
        }
    }
    
    // Write forecast results to Output directory CSV
    public void writeForecastToCsv(List<LoanForecastData> forecastDataList, String outputFileName) {
        String outputDir = "backend/data/Output/";
        try {
            Files.createDirectories(Paths.get(outputDir));
            String filePath = outputDir + outputFileName;
            try (CSVWriter writer = new CSVWriter(new FileWriter(filePath))) {
                if (!forecastDataList.isEmpty()) {
                    LoanForecastData first = forecastDataList.get(0);
                    java.util.List<String> headers = new java.util.ArrayList<>();
                    headers.add("Loan Number");
                    headers.add("Customer Name");
                    headers.add("Loan Amount");
                    headers.add("Maturity Date");
                    headers.add("Extended Date");
                    headers.add("Outstanding Balance");
                    headers.add("Undisbursed Amount");
                    headers.add("% of Loan Drawn");
                    headers.add("% of Completion");
                    // Forecast months
                    headers.addAll(first.getForecastData().keySet());
                    writer.writeNext(headers.toArray(new String[0]));
                }

                for (LoanForecastData data : forecastDataList) {
                    java.util.List<String> row = new java.util.ArrayList<>();
                    row.add(data.getLoanNumber());
                    row.add(data.getCustomerName());
                    row.add(data.getLoanAmount() != null ? data.getLoanAmount().toString() : "");
                    row.add(data.getMaturityDate() != null ? data.getMaturityDate().toString() : "");
                    row.add(data.getExtendedDate() != null ? data.getExtendedDate().toString() : "");
                    row.add(data.getOutstandingBalance() != null ? data.getOutstandingBalance().toString() : "");
                    row.add(data.getUndisbursedAmount() != null ? data.getUndisbursedAmount().toString() : "");
                    row.add(data.getPercentOfLoanDrawn() != null ? data.getPercentOfLoanDrawn().toString() : "");
                    row.add(data.getPercentOfCompletion() != null ? data.getPercentOfCompletion().toString() : "");
                    for (BigDecimal v : data.getForecastData().values()) {
                        row.add(v != null ? v.toString() : "");
                    }
                    writer.writeNext(row.toArray(new String[0]));
                }
            }
            log.info("Forecast results written to {}", filePath);
        } catch (Exception e) {
            log.error("Failed to write forecast CSV: {}", e.getMessage());
        }
    }
    
    // Generate forecast CSV file to forecast directory
    public void generateForecastCsv(List<LoanForecastData> forecastDataList, String inputFileName) {
        log.info("Starting generateForecastCsv with {} records and input file: {}", forecastDataList.size(), inputFileName);
        String forecastDir = "backend/data/forecast/";
        try {
            Files.createDirectories(Paths.get(forecastDir));
            
            // <original_file_name>_forecast.csv
            String baseName = inputFileName.replaceAll("\\.[^.]*$", ""); // Remove extension
            String outputFileName = baseName + "_forecast.csv";
            String filePath = forecastDir + outputFileName;
            
            try (CSVWriter writer = new CSVWriter(new FileWriter(filePath))) {
                java.util.List<String> headers = new java.util.ArrayList<>();
                headers.add("Loan Number");
                headers.add("Customer Name");
                headers.add("Property Type");
                headers.add("Loan Amount");
                headers.add("Outstanding Balance");
                headers.add("Undisbursed Amount");
                headers.add("Percent Of Loan Drawn");
                headers.add("Maturity Date");
                headers.add("Extended Date");
                headers.add("Total Forecasted Amount");
                headers.add("Forecast Months");
                headers.add("Forecast Start Date");
                headers.add("Forecast End Date");
                
                // Add all month columns (based on the first loan's forecast data)
                if (!forecastDataList.isEmpty() && forecastDataList.get(0).getForecastData() != null) {
                    headers.addAll(forecastDataList.get(0).getForecastData().keySet());
                }
                
                writer.writeNext(headers.toArray(new String[0]));
                
                for (LoanForecastData data : forecastDataList) {
                    java.util.List<String> row = new java.util.ArrayList<>();
                    row.add(data.getLoanNumber());
                    row.add(data.getCustomerName());
                    row.add(data.getPropertyType());
                    row.add(data.getLoanAmount() != null ? data.getLoanAmount().toString() : "");
                    row.add(data.getOutstandingBalance() != null ? data.getOutstandingBalance().toString() : "");
                    row.add(data.getUndisbursedAmount() != null ? data.getUndisbursedAmount().toString() : "");
                    row.add(data.getPercentOfLoanDrawn() != null ? data.getPercentOfLoanDrawn().toString() : "");
                    row.add(data.getMaturityDate() != null ? data.getMaturityDate().toString() : "");
                    row.add(data.getExtendedDate() != null ? data.getExtendedDate().toString() : "");
                    row.add(data.getTotalForecastedAmount() != null ? data.getTotalForecastedAmount().toString() : "");
                    row.add(String.valueOf(data.getForecastMonths()));

                    if (data.getForecastData() != null && !data.getForecastData().isEmpty()) {
                        java.util.List<String> dates = new java.util.ArrayList<>(data.getForecastData().keySet());
                        dates.sort((a, b) -> a.compareTo(b));
                        row.add(dates.get(0)); // Start date
                        row.add(dates.get(dates.size() - 1)); // End date
                    } else {
                        row.add("");
                        row.add("");
                    }
                    
                    if (data.getForecastData() != null) {
                        for (String month : forecastDataList.get(0).getForecastData().keySet()) {
                            BigDecimal amount = data.getForecastData().get(month);
                            row.add(amount != null ? amount.toString() : "0");
                        }
                    }
                    
                    writer.writeNext(row.toArray(new String[0]));
                }
            }
            log.info("Forecast CSV generated successfully: {}", filePath);
        } catch (Exception e) {
            log.error("Failed to generate forecast CSV: {}", e.getMessage());
        }
    }
    
    // Generate forecast CSV with custom format, headers are the same as the original csv, and the forecast data is appended after it
    public String generateForecastCsvWithOriginalFormat(List<CsvLoanData> originalList, List<LoanForecastData> forecastList, String inputFileName, String startMonth) {
        String forecastDir = "backend/data/forecast/";
        try {
            Files.createDirectories(Paths.get(forecastDir));
            String baseName = inputFileName.replaceAll("\\.[^.]*$", "");
            String outputFileName = baseName + "_forecast.csv";
            String filePath = forecastDir + outputFileName;

            try (CSVWriter writer = new CSVWriter(new FileWriter(filePath))) {
                String[] baseHeaders = new String[] {
                    "Loan Number", "Loan Amount", "Maturity Date", "Extended Date",
                    "Outstanding Balance", "Undisbursed Amount", "% of Completion"
                };
                
                // Dynamically get all months from the forecast data
                Set<String> allMonths = new TreeSet<>(new MonthComparator());
                for (LoanForecastData forecast : forecastList) {
                    if (forecast.getForecastData() != null) {
                        allMonths.addAll(forecast.getForecastData().keySet());
                    }
                }
                
                String[] months = allMonths.toArray(new String[0]);
                String[] headers = new String[baseHeaders.length + months.length];
                System.arraycopy(baseHeaders, 0, headers, 0, baseHeaders.length);
                System.arraycopy(months, 0, headers, baseHeaders.length, months.length);
                writer.writeNext(headers);

                // Calculate column sums for forecast data
                Map<String, BigDecimal> columnSums = new HashMap<>();
                for (String month : months) {
                    columnSums.put(month, BigDecimal.ZERO);
                }

                // Only iterate forecastList, and only output valid rows
                for (LoanForecastData forecast : forecastList) {
                    if (forecast == null || forecast.getLoanNumber() == null || forecast.getLoanNumber().trim().isEmpty()) {
                        continue;
                    }
                    java.util.List<String> row = new java.util.ArrayList<>();
                    row.add(forecast.getLoanNumber());
                    row.add(forecast.getLoanAmount() != null ? forecast.getLoanAmount().toString() : "");
                    row.add(forecast.getMaturityDate() != null ? forecast.getMaturityDate().toString() : "");
                    row.add(forecast.getExtendedDate() != null ? forecast.getExtendedDate().toString() : "");
                    row.add(forecast.getOutstandingBalance() != null ? forecast.getOutstandingBalance().toString() : "");
                    row.add(forecast.getUndisbursedAmount() != null ? forecast.getUndisbursedAmount().toString() : "");
                    row.add(forecast.getPercentOfCompletion() != null ? forecast.getPercentOfCompletion().toString() : "");

                    for (String m : months) {
                        if (forecast.getForecastData() != null && forecast.getForecastData().containsKey(m)) {
                            BigDecimal amount = forecast.getForecastData().get(m);
                            if (amount != null) {
                                row.add(amount.toString());
                                // Add to column sum
                                columnSums.put(m, columnSums.get(m).add(amount));
                            } else {
                                row.add("");
                            }
                        } else {
                            row.add("");
                        }
                    }
                    writer.writeNext(row.toArray(new String[0]));
                }

                // Add SUM OF FORECAST row
                java.util.List<String> sumRow = new java.util.ArrayList<>();
                sumRow.add("SUM OF FORECAST");
                // Add empty values for base columns (Loan Amount, Maturity Date, etc.)
                for (int i = 1; i < baseHeaders.length; i++) {
                    sumRow.add("");
                }
                
                // Add sum values for forecast columns
                for (String m : months) {
                    BigDecimal sum = columnSums.get(m);
                    if (sum != null && sum.compareTo(BigDecimal.ZERO) > 0) {
                        sumRow.add(sum.toString());
                    } else {
                        sumRow.add("");
                    }
                }
                
                writer.writeNext(sumRow.toArray(new String[0]));
            }
            log.info("Custom forecast CSV generated with sum row: {}", filePath);
            return filePath;
        } catch (Exception e) {
            log.error("Failed to generate custom forecast CSV: {}", e.getMessage());
            return null;
        }
    }
    
    public String generateBatchId() {
        return "BATCH_" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }
    
    /**
     * Custom month comparator, used to correctly sort month strings ("MMM-yy")
     */
    private static class MonthComparator implements Comparator<String> {
        @Override
        public int compare(String month1, String month2) {
            try {
                // Parse month string to LocalDate, then compare
                LocalDate date1 = parseMonthString(month1);
                LocalDate date2 = parseMonthString(month2);
                return date1.compareTo(date2);
            } catch (Exception e) {
                return month1.compareTo(month2);
            }
        }
        
        private LocalDate parseMonthString(String monthStr) {
            return LocalDate.parse("01-" + monthStr, DateTimeFormatter.ofPattern("dd-MMM-yy", Locale.ENGLISH));
        }
    }
} 