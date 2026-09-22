package com.cravedash.payment.dto;

import com.cravedash.payment.model.PaymentStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class PaymentProcessResponse {
    private boolean success;
    private String transactionReference;
    private Long orderId;
    private BigDecimal amount;
    private PaymentStatus status;
    private String message;
    private LocalDateTime timestamp;

    public PaymentProcessResponse() {}

    public PaymentProcessResponse(boolean success, String transactionReference, Long orderId, BigDecimal amount, PaymentStatus status, String message, LocalDateTime timestamp) {
        this.success = success;
        this.transactionReference = transactionReference;
        this.orderId = orderId;
        this.amount = amount;
        this.status = status;
        this.message = message;
        this.timestamp = timestamp;
    }

    public boolean isSuccess() {
        return success;
    }

    public void setSuccess(boolean success) {
        this.success = success;
    }

    public String getTransactionReference() {
        return transactionReference;
    }

    public void setTransactionReference(String transactionReference) {
        this.transactionReference = transactionReference;
    }

    public Long getOrderId() {
        return orderId;
    }

    public void setOrderId(Long orderId) {
        this.orderId = orderId;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public PaymentStatus getStatus() {
        return status;
    }

    public void setStatus(PaymentStatus status) {
        this.status = status;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }
}
