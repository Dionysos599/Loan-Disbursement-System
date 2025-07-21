package com.bankplus.loan_forecast.model;

import com.opencsv.bean.CsvBindByName;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CsvLoanData {
    
    @CsvBindByName(column = "Loan Number")
    private String loanNumber;
    
    @CsvBindByName(column = "Customer Name")
    private String customerName;
    
    @CsvBindByName(column = "Loan Amount")
    private String loanAmount;
    
    @CsvBindByName(column = "Maturity Date")
    private String maturityDate;
    
    @CsvBindByName(column = "Extended Date")
    private String extendedDate;
    
    @CsvBindByName(column = "Property Type")
    private String propertyType;
    
    @CsvBindByName(column = "Job Address")
    private String jobAddress;
    
    @CsvBindByName(column = "City")
    private String city;
    
    @CsvBindByName(column = "LTC Ratio")
    private String ltcRatio;
    
    @CsvBindByName(column = "LTV Ratio")
    private String ltvRatio;
    
    @CsvBindByName(column = "Land Draw")
    private String landDraw;
    
    @CsvBindByName(column = "Interest Rate")
    private String interestRate;
    
    @CsvBindByName(column = "Outstanding Balance")
    private String outstandingBalance;
    
    @CsvBindByName(column = "Undisbursed Amount")
    private String undisbursedAmount;
    
    @CsvBindByName(column = "% of Loan Drawn")
    private String percentOfLoanDrawn;
    
    @CsvBindByName(column = "% of Completion")
    private String percentOfCompletion;
    
    // Forecast columns from Dec-24 onwards
    @CsvBindByName(column = "Nov-24")
    private String nov24;
    
    @CsvBindByName(column = "Dec-24")
    private String dec24;
    
    @CsvBindByName(column = "Jan-25")
    private String jan25;
    
    @CsvBindByName(column = "Feb-25")
    private String feb25;
    
    @CsvBindByName(column = "Mar-25")
    private String mar25;
    
    @CsvBindByName(column = "Apr-25")
    private String apr25;
    
    @CsvBindByName(column = "May-25")
    private String may25;
    
    @CsvBindByName(column = "Jun-25")
    private String jun25;
    
    @CsvBindByName(column = "Jul-25")
    private String jul25;
    
    @CsvBindByName(column = "Aug-25")
    private String aug25;
    
    @CsvBindByName(column = "Sep-25")
    private String sep25;
    
    @CsvBindByName(column = "Oct-25")
    private String oct25;
    
    @CsvBindByName(column = "Nov-25")
    private String nov25;
    
    @CsvBindByName(column = "Dec-25")
    private String dec25;
    
    @CsvBindByName(column = "Jan-26")
    private String jan26;
    
    @CsvBindByName(column = "Feb-26")
    private String feb26;
    
    @CsvBindByName(column = "Mar-26")
    private String mar26;
    
    @CsvBindByName(column = "Apr-26")
    private String apr26;
    
    @CsvBindByName(column = "May-26")
    private String may26;
    
    @CsvBindByName(column = "Jun-26")
    private String jun26;
    
    @CsvBindByName(column = "Jul-26")
    private String jul26;
    
    @CsvBindByName(column = "Aug-26")
    private String aug26;
    
    @CsvBindByName(column = "Sep-26")
    private String sep26;
    
    @CsvBindByName(column = "Oct-26")
    private String oct26;
    
    @CsvBindByName(column = "Nov-26")
    private String nov26;
    
    @CsvBindByName(column = "Dec-26")
    private String dec26;
    
    @CsvBindByName(column = "Jan-27")
    private String jan27;
    
    @CsvBindByName(column = "Feb-27")
    private String feb27;
    
    @CsvBindByName(column = "Mar-27")
    private String mar27;
    
    @CsvBindByName(column = "Apr-27")
    private String apr27;
    
    @CsvBindByName(column = "May-27")
    private String may27;
    
    @CsvBindByName(column = "Jun-27")
    private String jun27;
    
    // Helper method to get all forecast values as a map
    public Map<String, BigDecimal> getForecastValues() {
        Map<String, BigDecimal> forecasts = new HashMap<>();
        
        if (nov24 != null && !nov24.trim().isEmpty()) forecasts.put("Nov-24", parseBigDecimal(nov24));
        if (dec24 != null && !dec24.trim().isEmpty()) forecasts.put("Dec-24", parseBigDecimal(dec24));
        if (jan25 != null && !jan25.trim().isEmpty()) forecasts.put("Jan-25", parseBigDecimal(jan25));
        if (feb25 != null && !feb25.trim().isEmpty()) forecasts.put("Feb-25", parseBigDecimal(feb25));
        if (mar25 != null && !mar25.trim().isEmpty()) forecasts.put("Mar-25", parseBigDecimal(mar25));
        if (apr25 != null && !apr25.trim().isEmpty()) forecasts.put("Apr-25", parseBigDecimal(apr25));
        if (may25 != null && !may25.trim().isEmpty()) forecasts.put("May-25", parseBigDecimal(may25));
        if (jun25 != null && !jun25.trim().isEmpty()) forecasts.put("Jun-25", parseBigDecimal(jun25));
        if (jul25 != null && !jul25.trim().isEmpty()) forecasts.put("Jul-25", parseBigDecimal(jul25));
        if (aug25 != null && !aug25.trim().isEmpty()) forecasts.put("Aug-25", parseBigDecimal(aug25));
        if (sep25 != null && !sep25.trim().isEmpty()) forecasts.put("Sep-25", parseBigDecimal(sep25));
        if (oct25 != null && !oct25.trim().isEmpty()) forecasts.put("Oct-25", parseBigDecimal(oct25));
        if (nov25 != null && !nov25.trim().isEmpty()) forecasts.put("Nov-25", parseBigDecimal(nov25));
        if (dec25 != null && !dec25.trim().isEmpty()) forecasts.put("Dec-25", parseBigDecimal(dec25));
        if (jan26 != null && !jan26.trim().isEmpty()) forecasts.put("Jan-26", parseBigDecimal(jan26));
        if (feb26 != null && !feb26.trim().isEmpty()) forecasts.put("Feb-26", parseBigDecimal(feb26));
        if (mar26 != null && !mar26.trim().isEmpty()) forecasts.put("Mar-26", parseBigDecimal(mar26));
        if (apr26 != null && !apr26.trim().isEmpty()) forecasts.put("Apr-26", parseBigDecimal(apr26));
        if (may26 != null && !may26.trim().isEmpty()) forecasts.put("May-26", parseBigDecimal(may26));
        if (jun26 != null && !jun26.trim().isEmpty()) forecasts.put("Jun-26", parseBigDecimal(jun26));
        if (jul26 != null && !jul26.trim().isEmpty()) forecasts.put("Jul-26", parseBigDecimal(jul26));
        if (aug26 != null && !aug26.trim().isEmpty()) forecasts.put("Aug-26", parseBigDecimal(aug26));
        if (sep26 != null && !sep26.trim().isEmpty()) forecasts.put("Sep-26", parseBigDecimal(sep26));
        if (oct26 != null && !oct26.trim().isEmpty()) forecasts.put("Oct-26", parseBigDecimal(oct26));
        if (nov26 != null && !nov26.trim().isEmpty()) forecasts.put("Nov-26", parseBigDecimal(nov26));
        if (dec26 != null && !dec26.trim().isEmpty()) forecasts.put("Dec-26", parseBigDecimal(dec26));
        if (jan27 != null && !jan27.trim().isEmpty()) forecasts.put("Jan-27", parseBigDecimal(jan27));
        if (feb27 != null && !feb27.trim().isEmpty()) forecasts.put("Feb-27", parseBigDecimal(feb27));
        if (mar27 != null && !mar27.trim().isEmpty()) forecasts.put("Mar-27", parseBigDecimal(mar27));
        if (apr27 != null && !apr27.trim().isEmpty()) forecasts.put("Apr-27", parseBigDecimal(apr27));
        if (may27 != null && !may27.trim().isEmpty()) forecasts.put("May-27", parseBigDecimal(may27));
        if (jun27 != null && !jun27.trim().isEmpty()) forecasts.put("Jun-27", parseBigDecimal(jun27));
        
        return forecasts;
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
            return BigDecimal.ZERO;
        }
    }
} 