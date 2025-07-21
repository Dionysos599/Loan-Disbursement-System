package com.bankplus.loan_forecast.service;

import com.bankplus.loan_forecast.dto.LoanForecastData;
import com.bankplus.loan_forecast.model.CsvLoanData;
import com.opencsv.CSVReader;
import com.opencsv.CSVWriter;
import com.opencsv.bean.CsvToBean;
import com.opencsv.bean.CsvToBeanBuilder;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.*;
import java.math.BigDecimal;
import java.math.MathContext;
import java.math.RoundingMode;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.Locale;

@Service
@Slf4j
public class CsvProcessingService {

    public List<CsvLoanData> processCsvFile(MultipartFile file) throws IOException {
        log.info("Processing CSV file: {}", file.getOriginalFilename());
        
        try (Reader reader = new InputStreamReader(file.getInputStream())) {
            CsvToBean<CsvLoanData> csvToBean = new CsvToBeanBuilder<CsvLoanData>(reader)
                    .withType(CsvLoanData.class)
                    .withIgnoreLeadingWhiteSpace(true)
                    .build();
            
            List<CsvLoanData> loanDataList = csvToBean.parse();
            log.info("Successfully parsed {} loan records from CSV", loanDataList.size());
            return loanDataList;
        }
    }

    public List<LoanForecastData> processCsvFileFromPath(String filePath, String startMonth) throws IOException {
        log.info("Processing CSV file from path: {}", filePath);
        
        try (Reader reader = new FileReader(filePath)) {
            CsvToBean<CsvLoanData> csvToBean = new CsvToBeanBuilder<CsvLoanData>(reader)
                    .withType(CsvLoanData.class)
                    .withIgnoreLeadingWhiteSpace(true)
                    .build();
            
            List<CsvLoanData> loanDataList = csvToBean.parse();
            log.info("Successfully parsed {} loan records from CSV file", loanDataList.size());
            
            // 转换为预测数据
            return convertToLoanForecastData(loanDataList, startMonth);
        }
    }

    /**
     * 生成预测数据（使用本地算法）
     */
    public List<LoanForecastData> convertToLoanForecastData(List<CsvLoanData> csvDataList, String startMonthStr) {
        log.info("Converting {} CSV records to forecast data using local algorithms", csvDataList.size());
        
        try {
            LocalDate forecastStartDate = LocalDate.parse(startMonthStr);
            
            // 转换CSV数据为内部处理格式
            List<Map<String, Object>> loanDataList = new ArrayList<>();
            for (CsvLoanData csvData : csvDataList) {
                Map<String, Object> loanData = convertCsvToMap(csvData);
                if (loanData != null) {
                    loanDataList.add(loanData);
                }
            }
            
            // 使用本地算法计算预测
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
     * 本地计算预测数据
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
     * 本地计算单个贷款的预测
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
        
        // 验证参数
        if (outstandingBalance.compareTo(BigDecimal.ZERO) < 0 || 
            undisbursedAmount.compareTo(BigDecimal.ZERO) < 0 ||
            percentOfCompletion < 0 || percentOfCompletion > 100) {
            log.warn("Invalid parameters for loan {}", loanNumber);
            log.warn("  outstandingBalance: {}, undisbursedAmount: {}, percentOfCompletion: {}", 
                     outstandingBalance, undisbursedAmount, percentOfCompletion);
            return null;
        }
        
        log.debug("Loan {} passed validation, generating forecasts...", loanNumber);
        
        // 计算项目开始日期（使用验证过的算法）
        LocalDate projectStartDate = calculateProjectStartDate(percentOfCompletion / 100.0, forecastStartDate, extendedDate);
        
        // 计算预测结束日期 - 6个月后清零
        LocalDate cutoffDate = extendedDate.plusMonths(6);
        // 预测应该继续到cutoff date之后的下一个月初，以确保包含所有应该为0的月份
        LocalDate forecastEndDate = cutoffDate.withDayOfMonth(1).plusMonths(1);
        
        // 生成月度预测
        Map<String, BigDecimal> monthlyForecasts = new HashMap<>();
        LocalDate currentDate = forecastStartDate;
        BigDecimal totalForecastedAmount = BigDecimal.ZERO;
        int forecastMonths = 0;
        
        while (!currentDate.isAfter(forecastEndDate)) {
            BigDecimal forecastOutstandingBalance;
            
            // 如果当前日期在Extended Date + 180天之前的那个月或之后，预测值为0
            if (currentDate.isAfter(cutoffDate.withDayOfMonth(1).minusMonths(1))) {
                forecastOutstandingBalance = BigDecimal.ZERO;
            } else {
                forecastOutstandingBalance = calculateForecastOutstandingBalance(
                    outstandingBalance, undisbursedAmount, percentOfCompletion / 100.0,
                    projectStartDate, currentDate, extendedDate
                );
            }
            
            // 转换日期格式为CSV表头兼容的格式 (如 Nov-24)
            String monthKey = currentDate.format(DateTimeFormatter.ofPattern("MMM-yy", Locale.ENGLISH));
            log.debug("Generating forecast for month: {} (currentDate: {})", monthKey, currentDate);
            monthlyForecasts.put(monthKey, forecastOutstandingBalance.setScale(2, RoundingMode.HALF_UP));
            totalForecastedAmount = totalForecastedAmount.add(forecastOutstandingBalance);
            forecastMonths++;
            
            currentDate = currentDate.plusMonths(1);
        }
        
        // 构建结果
        Map<String, Object> result = new HashMap<>();
        result.put("loanNumber", loanNumber);
        result.put("customerName", customerName);
        result.put("loanAmount", loanAmount);
        result.put("outstandingBalance", outstandingBalance);
        result.put("undisbursedAmount", undisbursedAmount);
        result.put("percentOfCompletion", BigDecimal.valueOf(percentOfCompletion));
        result.put("extendedDate", extendedDate.toString());
        result.put("forecastData", monthlyForecasts);
        result.put("totalForecastedAmount", totalForecastedAmount.setScale(2, RoundingMode.HALF_UP));
        result.put("forecastMonths", forecastMonths);
        
        // 复制其他字段
        result.put("propertyType", loanData.get("propertyType"));
        result.put("jobAddress", loanData.get("jobAddress"));
        result.put("city", loanData.get("city"));
        result.put("maturityDate", loanData.get("maturityDate"));
        result.put("ltcRatio", loanData.get("ltcRatio"));
        result.put("ltvRatio", loanData.get("ltvRatio"));
        result.put("landDraw", loanData.get("landDraw"));
        result.put("interestRate", loanData.get("interestRate"));
        result.put("percentOfLoanDrawn", loanData.get("percentOfLoanDrawn"));
        
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
        
        // 计算时间进度
        long daysBetweenStartAndForecast = ChronoUnit.DAYS.between(projectStartDate, forecastDate);
        long daysBetweenStartAndExtended = ChronoUnit.DAYS.between(projectStartDate, extendedDate);
        
        double timeProgress = daysBetweenStartAndExtended > 0 ? 
            (double) daysBetweenStartAndForecast / daysBetweenStartAndExtended : 0;
        
        // 计算总进度
        double totalProgress = percentOfCompletion + timeProgress * (1 - percentOfCompletion);
        
        // 确保total progress在[0, 1]范围内
        if (totalProgress < 0) totalProgress = 0;
        if (totalProgress > 1) totalProgress = 1;
        
        // 计算S-curve值
        double sCurveValue = 1.0 / (1.0 + Math.exp(-12.0 * (totalProgress - 0.5)));
        
        // 计算预测的Outstanding Balance
        BigDecimal additionalDisbursement = undisbursedAmount.multiply(BigDecimal.valueOf(sCurveValue));
        return outstandingBalance.add(additionalDisbursement);
    }
    
    private Map<String, Object> convertCsvToMap(CsvLoanData csvData) {
        try {
            Map<String, Object> loanData = new HashMap<>();
            loanData.put("loanNumber", csvData.getLoanNumber());
            loanData.put("customerName", csvData.getCustomerName());
            loanData.put("loanAmount", parseBigDecimal(csvData.getLoanAmount()));
            loanData.put("outstandingBalance", parseBigDecimal(csvData.getOutstandingBalance()));
            loanData.put("undisbursedAmount", parseBigDecimal(csvData.getUndisbursedAmount()));
            loanData.put("percentOfCompletion", parseInteger(csvData.getPercentOfCompletion()));
            loanData.put("extendedDate", parseDate(csvData.getExtendedDate()));
            loanData.put("maturityDate", parseDate(csvData.getMaturityDate()));
            loanData.put("propertyType", csvData.getPropertyType());
            loanData.put("jobAddress", csvData.getJobAddress());
            loanData.put("city", csvData.getCity());
            loanData.put("ltcRatio", parseInteger(csvData.getLtcRatio()));
            loanData.put("ltvRatio", parseInteger(csvData.getLtvRatio()));
            loanData.put("landDraw", parseBigDecimal(csvData.getLandDraw()));
            loanData.put("interestRate", parseBigDecimal(csvData.getInterestRate()));
            loanData.put("percentOfLoanDrawn", parseBigDecimal(csvData.getPercentOfLoanDrawn()));
            
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
            
            // 转换forecastData格式
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
                    .propertyType((String) forecast.get("propertyType"))
                    .jobAddress((String) forecast.get("jobAddress"))
                    .city((String) forecast.get("city"))
                                         .ltcRatio(new BigDecimal(forecast.get("ltcRatio").toString()))
                     .ltvRatio(new BigDecimal(forecast.get("ltvRatio").toString()))
                    .landDraw(forecast.get("landDraw") != null ? new BigDecimal(forecast.get("landDraw").toString()) : BigDecimal.ZERO)
                    .interestRate(new BigDecimal(forecast.get("interestRate").toString()))
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
            // 处理M/d/yy或MM/dd/yyyy格式
            if (dateStr.contains("/")) {
                String[] parts = dateStr.split("/");
                if (parts.length == 3) {
                    int month = Integer.parseInt(parts[0]);
                    int day = Integer.parseInt(parts[1]);
                    int year = Integer.parseInt(parts[2]);
                    
                    // 处理两位年份
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
            
            // 尝试标准格式
            try {
                return LocalDate.parse(dateStr);
            } catch (Exception ignored) {
                // 继续尝试其他格式
            }
            
            // 如果所有格式都失败，返回当前日期
            log.warn("Could not parse date: {}, using current date", dateStr);
            return LocalDate.now();
        } catch (Exception e) {
            log.error("Error parsing date: {}", dateStr, e);
            return LocalDate.now();
        }
    }
    
    // 写入预测结果到Output目录CSV
    public void writeForecastToCsv(List<LoanForecastData> forecastDataList, String outputFileName) {
        String outputDir = "backend/data/Output/";
        try {
            Files.createDirectories(Paths.get(outputDir));
            String filePath = outputDir + outputFileName;
            try (CSVWriter writer = new CSVWriter(new FileWriter(filePath))) {
                // 写表头
                if (!forecastDataList.isEmpty()) {
                    LoanForecastData first = forecastDataList.get(0);
                    // 原始字段
                    java.util.List<String> headers = new java.util.ArrayList<>();
                    headers.add("Loan Number");
                    headers.add("Customer Name");
                    headers.add("Loan Amount");
                    headers.add("Maturity Date");
                    headers.add("Extended Date");
                    headers.add("Property Type");
                    headers.add("Job Address");
                    headers.add("City");
                    headers.add("LTC Ratio");
                    headers.add("LTV Ratio");
                    headers.add("Land Draw");
                    headers.add("Interest Rate");
                    headers.add("Outstanding Balance");
                    headers.add("Undisbursed Amount");
                    headers.add("% of Loan Drawn");
                    headers.add("% of Completion");
                    // 预测月份列
                    headers.addAll(first.getForecastData().keySet());
                    writer.writeNext(headers.toArray(new String[0]));
                }
                // 写数据
                for (LoanForecastData data : forecastDataList) {
                    java.util.List<String> row = new java.util.ArrayList<>();
                    row.add(data.getLoanNumber());
                    row.add(data.getCustomerName());
                    row.add(data.getLoanAmount() != null ? data.getLoanAmount().toString() : "");
                    row.add(data.getMaturityDate() != null ? data.getMaturityDate().toString() : "");
                    row.add(data.getExtendedDate() != null ? data.getExtendedDate().toString() : "");
                    row.add(data.getPropertyType());
                    row.add(data.getJobAddress());
                    row.add(data.getCity());
                    row.add(data.getLtcRatio() != null ? data.getLtcRatio().toString() : "");
                    row.add(data.getLtvRatio() != null ? data.getLtvRatio().toString() : "");
                    row.add(data.getLandDraw() != null ? data.getLandDraw().toString() : "");
                    row.add(data.getInterestRate() != null ? data.getInterestRate().toString() : "");
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
    
    // 生成预测CSV文件到forecast目录
    public void generateForecastCsv(List<LoanForecastData> forecastDataList, String inputFileName) {
        log.info("Starting generateForecastCsv with {} records and input file: {}", forecastDataList.size(), inputFileName);
        String forecastDir = "backend/data/forecast/";
        try {
            Files.createDirectories(Paths.get(forecastDir));
            
            // 从输入文件名生成输出文件名
            String baseName = inputFileName.replaceAll("\\.[^.]*$", ""); // 去掉扩展名
            String outputFileName = baseName + "_forecast.csv";
            String filePath = forecastDir + outputFileName;
            
            try (CSVWriter writer = new CSVWriter(new FileWriter(filePath))) {
                // 写表头
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
                
                // 添加所有月份列（基于第一个loan的预测数据）
                if (!forecastDataList.isEmpty() && forecastDataList.get(0).getForecastData() != null) {
                    headers.addAll(forecastDataList.get(0).getForecastData().keySet());
                }
                
                writer.writeNext(headers.toArray(new String[0]));
                
                // 写数据
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
                    
                    // 添加预测起始和结束日期
                    if (data.getForecastData() != null && !data.getForecastData().isEmpty()) {
                        java.util.List<String> dates = new java.util.ArrayList<>(data.getForecastData().keySet());
                        dates.sort((a, b) -> a.compareTo(b));
                        row.add(dates.get(0)); // 起始日期
                        row.add(dates.get(dates.size() - 1)); // 结束日期
                    } else {
                        row.add("");
                        row.add("");
                    }
                    
                    // 添加每月预测值
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
    
    // 生成自定义格式的forecast CSV，表头与原始csv一致，后面追加预测数据
    public String generateForecastCsvWithOriginalFormat(List<CsvLoanData> originalList, List<LoanForecastData> forecastList, String inputFileName) {
        String forecastDir = "backend/data/forecast/";
        try {
            Files.createDirectories(Paths.get(forecastDir));
            String baseName = inputFileName.replaceAll("\\.[^.]*$", "");
            String outputFileName = baseName + "_forecast.csv";
            String filePath = forecastDir + outputFileName;

            try (CSVWriter writer = new CSVWriter(new FileWriter(filePath))) {
                // 写表头
                String[] headers = new String[] {
                    "Loan Number","Customer Name","Loan Amount","Maturity Date","Extended Date","Property Type","Job Address","City","LTC Ratio","LTV Ratio","Land Draw","Interest Rate","Outstanding Balance","Undisbursed Amount","% of Loan Drawn","% of Completion",
                    "Nov-24","Dec-24","Jan-25","Feb-25","Mar-25","Apr-25","May-25","Jun-25","Jul-25","Aug-25","Sep-25","Oct-25","Nov-25","Dec-25","Jan-26","Feb-26","Mar-26","Apr-26","May-26","Jun-26","Jul-26","Aug-26","Sep-26","Oct-26","Nov-26","Dec-26","Jan-27","Feb-27","Mar-27","Apr-27","May-27","Jun-27"
                };
                writer.writeNext(headers);

                // 写每一行
                for (int i = 0; i < originalList.size(); i++) {
                    CsvLoanData orig = originalList.get(i);
                    LoanForecastData forecast = (forecastList != null && forecastList.size() > i) ? forecastList.get(i) : null;
                    java.util.List<String> row = new java.util.ArrayList<>();
                    row.add(orig.getLoanNumber());
                    row.add(orig.getCustomerName());
                    row.add(orig.getLoanAmount());
                    row.add(orig.getMaturityDate());
                    row.add(orig.getExtendedDate());
                    row.add(orig.getPropertyType());
                    row.add(orig.getJobAddress());
                    row.add(orig.getCity());
                    row.add(orig.getLtcRatio());
                    row.add(orig.getLtvRatio());
                    row.add(orig.getLandDraw());
                    row.add(orig.getInterestRate());
                    row.add(orig.getOutstandingBalance());
                    row.add(orig.getUndisbursedAmount());
                    row.add(orig.getPercentOfLoanDrawn());
                    row.add(orig.getPercentOfCompletion());
                    // 追加forecast数据
                    String[] months = {"Nov-24","Dec-24","Jan-25","Feb-25","Mar-25","Apr-25","May-25","Jun-25","Jul-25","Aug-25","Sep-25","Oct-25","Nov-25","Dec-25","Jan-26","Feb-26","Mar-26","Apr-26","May-26","Jun-26","Jul-26","Aug-26","Sep-26","Oct-26","Nov-26","Dec-26","Jan-27","Feb-27","Mar-27","Apr-27","May-27","Jun-27"};
                    for (String m : months) {
                        if (forecast != null && forecast.getForecastData() != null && forecast.getForecastData().containsKey(m)) {
                            row.add(forecast.getForecastData().get(m) != null ? forecast.getForecastData().get(m).toString() : "");
                        } else {
                            row.add("");
                        }
                    }
                    writer.writeNext(row.toArray(new String[0]));
                }
            }
            log.info("Custom forecast CSV generated: {}", filePath);
            return filePath;
        } catch (Exception e) {
            log.error("Failed to generate custom forecast CSV: {}", e.getMessage());
            return null;
        }
    }
    
    public String generateBatchId() {
        return "BATCH_" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }
} 