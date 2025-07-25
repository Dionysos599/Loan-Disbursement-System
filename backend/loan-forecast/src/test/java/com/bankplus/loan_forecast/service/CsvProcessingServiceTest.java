package com.bankplus.loan_forecast.service;

import com.bankplus.loan_forecast.model.CsvLoanData;
import com.bankplus.loan_forecast.dto.LoanForecastData;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.io.File;
import java.io.StringReader;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class CsvProcessingServiceTest {
    private CsvProcessingService service;

    @BeforeEach
    void setUp() {
        MeterRegistry registry = new SimpleMeterRegistry();
        service = new CsvProcessingService(registry);
    }

    @Test
    void testProcessCsvData_missingRequiredColumn() {
        String csv = "Loan Number,Customer Name,Loan Amount\n1,Alice,1000";
        Exception ex = assertThrows(Exception.class, () -> service.processCsvData(new StringReader(csv)));
        assertTrue(ex.getMessage().contains("Required column missing"));
    }

    @Test
    void testProcessCsvData_emptyFile() {
        String csv = "";
        Exception ex = assertThrows(Exception.class, () -> service.processCsvData(new StringReader(csv)));
        assertTrue(ex.getMessage().contains("empty"));
    }

    @Test
    void testProcessCsvData_invalidRow() throws Exception {
        String csv = "Loan Number,Customer Name,Loan Amount,Maturity Date,Extended Date,Outstanding Balance,Undisbursed Amount,% of Completion\n1,Alice,1000,2024-01-01,2024-12-01,500,100,90\n2,Bob,notanumber,2024-01-01,2024-12-01,500,100,90";
        List<CsvLoanData> list = service.processCsvData(new StringReader(csv));
        assertTrue(list.stream().anyMatch(l -> l.getLoanAmount() != null && l.getLoanAmount().matches("\\d+")));
    }

    @Test
    void testConvertToLoanForecastData_invalidValues() {
        CsvLoanData d = new CsvLoanData();
        d.setLoanNumber("1");
        d.setCustomerName("A");
        d.setLoanAmount("-1000"); // negative number
        d.setMaturityDate("2024-01-01");
        d.setExtendedDate("2024-12-01");
        d.setOutstandingBalance("-500"); // negative number
        d.setUndisbursedAmount("-100"); // negative number
        d.setPercentOfCompletion("200"); // out of range
        d.setPercentOfLoanDrawn("0");
        List<CsvLoanData> list = List.of(d);
        List<LoanForecastData> result = service.convertToLoanForecastData(list, "2024-01-01");
        assertEquals(0, result.size()); // should not generate any forecast
    }

    @Test
    void testProcessCsvData_csvValidationException() {
        String csv = "Loan Number,Customer Name,Loan Amount,Maturity Date,Extended Date,Outstanding Balance,Undisbursed Amount,% of Completion\n1,Alice,1000,2024-01-01,2024-12-01,500,100,90\n\"unclosed";
        Exception ex = assertThrows(Exception.class, () -> service.processCsvData(new StringReader(csv)));
        assertTrue(ex.getMessage().toLowerCase().contains("csv"));
    }

    @Test
    void testGenerateForecastCsvAndWriteForecastToCsv() {
        // construct a LoanForecastData
        LoanForecastData data = LoanForecastData.builder()
                .loanNumber("L001")
                .customerName("Test")
                .propertyType("APT")
                .loanAmount(new BigDecimal("1000"))
                .outstandingBalance(new BigDecimal("800"))
                .undisbursedAmount(new BigDecimal("200"))
                .percentOfLoanDrawn(new BigDecimal("80"))
                .maturityDate(LocalDate.of(2025, 12, 31))
                .extendedDate(LocalDate.of(2026, 6, 30))
                .percentOfCompletion(new BigDecimal("60"))
                .forecastData(new HashMap<>())
                .totalForecastedAmount(new BigDecimal("1000"))
                .forecastMonths(12)
                .build();
        data.getForecastData().put("Jan-25", new BigDecimal("900"));
        data.getForecastData().put("Feb-25", new BigDecimal("800"));
        service.generateForecastCsv(List.of(data), "test_input.csv");
        service.writeForecastToCsv(List.of(data), "test_output.csv");
        File f1 = new File("backend/data/forecast/test_input_forecast.csv");
        File f2 = new File("backend/data/Output/test_output.csv");
        assertTrue(f1.exists());
        assertTrue(f2.exists());
        // simple content check
        assertTrue(f1.length() > 0);
        assertTrue(f2.length() > 0);
        // clean up
        f1.delete();
        f2.delete();
    }
} 