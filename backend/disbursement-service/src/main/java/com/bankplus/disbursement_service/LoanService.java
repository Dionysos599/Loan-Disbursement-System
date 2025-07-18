package com.bankplus.disbursement_service;

import com.bankplus.disbursement_service.dto.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class LoanService {
    @Autowired
    private LoanRepository loanRepository;
    @Autowired
    private LoanProgressRepository loanProgressRepository;
    @Autowired
    private LoanScheduleRepository loanScheduleRepository;
    @Autowired
    private RedisTemplate<String, Object> redisTemplate;
    private final DisbursementCalculator calculator = new DisbursementCalculator();

    public LoanDetailResponse getLoanDetails(String loanId) {
        Loan loan = loanRepository.findById(loanId).orElseThrow();
        LoanProgress progress = loanProgressRepository.findAll().stream()
                .filter(lp -> lp.getLoan().getLoanId().equals(loanId))
                .max((a, b) -> a.getAsOfDate().compareTo(b.getAsOfDate())).orElse(null);
        List<LoanSchedule> scheduleList = loanScheduleRepository.findAll().stream()
                .filter(ls -> ls.getLoan().getLoanId().equals(loanId))
                .collect(Collectors.toList());
        LoanDetailResponse resp = new LoanDetailResponse();
        resp.loanId = loan.getLoanId();
        resp.customerName = loan.getCustomerName();
        resp.loanAmount = loan.getLoanAmount();
        resp.startDate = loan.getStartDate();
        resp.maturityDate = loan.getMaturityDate();
        resp.extendedDate = loan.getExtendedDate();
        if (progress != null) {
            LoanDetailResponse.Progress prog = new LoanDetailResponse.Progress();
            prog.percentComplete = progress.getPercentComplete();
            prog.outstandingBalance = progress.getOutstandingBalance();
            prog.asOfDate = progress.getAsOfDate();
            resp.currentProgress = prog;
        }
        resp.schedule = scheduleList.stream().map(ls -> {
            LoanDetailResponse.ScheduleItem item = new LoanDetailResponse.ScheduleItem();
            item.month = ls.getMonth();
            item.cumulativeAmount = ls.getCumAmount();
            item.monthlyAmount = ls.getMonthlyAmount();
            return item;
        }).collect(Collectors.toList());
        return resp;
    }

    public List<LoanDetailResponse.ScheduleItem> calculateSchedule(Loan loan, LoanProgress progress, LocalDate fromDate, LocalDate toDate, Double overrideCompletion) {
        String cacheKey = String.format("schedule:%s:%s:%s:%s", loan.getLoanId(), fromDate, toDate, overrideCompletion);
        @SuppressWarnings("unchecked")
        List<LoanDetailResponse.ScheduleItem> cached = (List<LoanDetailResponse.ScheduleItem>) redisTemplate.opsForValue().get(cacheKey);
        if (cached != null) {
            return cached;
        }
        double percentComplete = overrideCompletion != null ? overrideCompletion : (progress != null ? progress.getPercentComplete().doubleValue() : 0.0);
        BigDecimal outstanding = progress != null ? progress.getOutstandingBalance() : BigDecimal.ZERO;
        List<DisbursementCalculator.DisbursementScheduleItem> calc = calculator.calculateSchedule(
                loan.getStartDate(),
                loan.getMaturityDate(),
                loan.getExtendedDate(),
                loan.getLoanAmount(),
                percentComplete,
                outstanding,
                fromDate,
                toDate
        );
        List<LoanDetailResponse.ScheduleItem> result = calc.stream().map(s -> {
            LoanDetailResponse.ScheduleItem item = new LoanDetailResponse.ScheduleItem();
            item.month = s.month;
            item.cumulativeAmount = s.cumulativeAmount;
            item.monthlyAmount = s.monthlyAmount;
            return item;
        }).collect(Collectors.toList());
        redisTemplate.opsForValue().set(cacheKey, result);
        return result;
    }

    public void updateProgress(String loanId, UpdateProgressRequest req) {
        Loan loan = loanRepository.findById(loanId).orElseThrow();
        LoanProgress progress = new LoanProgress();
        progress.setLoan(loan);
        progress.setAsOfDate(req.asOfDate);
        progress.setPercentComplete(req.percentComplete);
        progress.setOutstandingBalance(req.outstandingBalance);
        progress.setCreatedAt(java.time.LocalDateTime.now());
        loanProgressRepository.save(progress);
    }

    public void extendMaturity(String loanId, ExtendMaturityRequest req) {
        Loan loan = loanRepository.findById(loanId).orElseThrow();
        loan.setExtendedDate(req.newMaturityDate);
        loanRepository.save(loan);
    }
} 