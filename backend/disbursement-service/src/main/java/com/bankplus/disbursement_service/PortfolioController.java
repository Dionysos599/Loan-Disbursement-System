package com.bankplus.disbursement_service;

import org.springframework.web.bind.annotation.*;
import org.springframework.beans.factory.annotation.Autowired;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/portfolio")
public class PortfolioController {
    @Autowired
    private LoanRepository loanRepository;
    @Autowired
    private LoanScheduleRepository loanScheduleRepository;

    @GetMapping("/exposure")
    public Map<String, Object> getPortfolioExposure() {
        List<Loan> loans = loanRepository.findAll();
        List<LoanSchedule> schedules = loanScheduleRepository.findAll();
        BigDecimal totalExposure = schedules.stream().map(LoanSchedule::getCumAmount).max(BigDecimal::compareTo).orElse(BigDecimal.ZERO);
        Map<String, BigDecimal> exposureByType = new HashMap<>();
        for (Loan loan : loans) {
            String type = loan.getPropertyType() != null ? loan.getPropertyType() : "Unknown";
            BigDecimal max = schedules.stream().filter(s -> s.getLoan().getLoanId().equals(loan.getLoanId()))
                .map(LoanSchedule::getCumAmount).max(BigDecimal::compareTo).orElse(BigDecimal.ZERO);
            exposureByType.put(type, exposureByType.getOrDefault(type, BigDecimal.ZERO).add(max));
        }
        // Monthly projections
        Map<LocalDate, BigDecimal> monthlyMap = new TreeMap<>();
        for (LoanSchedule s : schedules) {
            monthlyMap.put(s.getMonth(), monthlyMap.getOrDefault(s.getMonth(), BigDecimal.ZERO).add(s.getMonthlyAmount()));
        }
        List<Map<String, Object>> monthlyProjections = monthlyMap.entrySet().stream().map(e -> {
            Map<String, Object> m = new HashMap<>();
            m.put("month", e.getKey());
            m.put("totalExposure", e.getValue());
            return m;
        }).collect(Collectors.toList());
        Map<String, Object> resp = new HashMap<>();
        resp.put("totalExposure", totalExposure);
        resp.put("exposureByType", exposureByType);
        resp.put("monthlyProjections", monthlyProjections);
        return resp;
    }
} 