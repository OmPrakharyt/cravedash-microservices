package com.cravedash.payment.service;

import com.cravedash.payment.dto.PaymentProcessRequest;
import com.cravedash.payment.dto.PaymentProcessResponse;
import com.cravedash.payment.model.PaymentMethod;
import com.cravedash.payment.model.PaymentStatus;
import com.cravedash.payment.model.PaymentTransaction;
import com.cravedash.payment.repository.PaymentTransactionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class PaymentService {

    private final PaymentTransactionRepository paymentTransactionRepository;

    public PaymentService(PaymentTransactionRepository paymentTransactionRepository) {
        this.paymentTransactionRepository = paymentTransactionRepository;
    }

    @Transactional
    public PaymentProcessResponse processPayment(PaymentProcessRequest request) {
        if (request.getAmount() == null || request.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            return new PaymentProcessResponse(
                    false,
                    null,
                    request.getOrderId(),
                    request.getAmount(),
                    PaymentStatus.FAILED,
                    "Invalid transaction amount",
                    LocalDateTime.now()
            );
        }

        // Check idempotency if client reference ID is provided
        if (request.getPaymentReferenceId() != null && !request.getPaymentReferenceId().isBlank()) {
            Optional<PaymentTransaction> existing = paymentTransactionRepository.findByTransactionReference(request.getPaymentReferenceId());
            if (existing.isPresent()) {
                PaymentTransaction pt = existing.get();
                return new PaymentProcessResponse(
                        pt.getStatus() == PaymentStatus.SUCCESS,
                        pt.getTransactionReference(),
                        pt.getOrderId(),
                        pt.getAmount(),
                        pt.getStatus(),
                        "Idempotent response: transaction previously processed",
                        pt.getCreatedAt()
                );
            }
        }

        String txnRef = (request.getPaymentReferenceId() != null && !request.getPaymentReferenceId().isBlank())
                ? request.getPaymentReferenceId()
                : "TXN-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        PaymentMethod method = request.getPaymentMethod() != null ? request.getPaymentMethod() : PaymentMethod.UPI;

        PaymentTransaction transaction = new PaymentTransaction();
        transaction.setTransactionReference(txnRef);
        transaction.setOrderId(request.getOrderId());
        transaction.setUserId(request.getUserId());
        transaction.setAmount(request.getAmount());
        transaction.setPaymentMethod(method);
        transaction.setStatus(PaymentStatus.SUCCESS);
        transaction.setGatewayTraceId("GW-TRACE-" + UUID.randomUUID().toString().substring(0, 12));
        transaction.setCreatedAt(LocalDateTime.now());

        PaymentTransaction saved = paymentTransactionRepository.save(transaction);

        return new PaymentProcessResponse(
                true,
                saved.getTransactionReference(),
                saved.getOrderId(),
                saved.getAmount(),
                saved.getStatus(),
                "Payment successfully authorized via " + saved.getPaymentMethod(),
                saved.getCreatedAt()
        );
    }

    public List<PaymentTransaction> getTransactionsByOrderId(Long orderId) {
        return paymentTransactionRepository.findByOrderId(orderId);
    }

    public Optional<PaymentTransaction> getTransactionByReference(String reference) {
        return paymentTransactionRepository.findByTransactionReference(reference);
    }
}
