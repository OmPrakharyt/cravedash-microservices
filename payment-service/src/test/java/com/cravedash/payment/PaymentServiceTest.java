package com.cravedash.payment;

import com.cravedash.payment.dto.PaymentProcessRequest;
import com.cravedash.payment.dto.PaymentProcessResponse;
import com.cravedash.payment.model.PaymentMethod;
import com.cravedash.payment.model.PaymentStatus;
import com.cravedash.payment.model.PaymentTransaction;
import com.cravedash.payment.repository.PaymentTransactionRepository;
import com.cravedash.payment.service.PaymentService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class PaymentServiceTest {

    @Mock
    private PaymentTransactionRepository paymentTransactionRepository;

    @InjectMocks
    private PaymentService paymentService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void testProcessPaymentSuccess() {
        PaymentProcessRequest req = new PaymentProcessRequest(10L, 1L, new BigDecimal("45.50"), PaymentMethod.UPI, null);

        when(paymentTransactionRepository.save(any(PaymentTransaction.class)))
                .thenAnswer(invocation -> {
                    PaymentTransaction pt = invocation.getArgument(0);
                    pt.setId(100L);
                    return pt;
                });

        PaymentProcessResponse resp = paymentService.processPayment(req);

        assertNotNull(resp);
        assertTrue(resp.isSuccess());
        assertEquals(PaymentStatus.SUCCESS, resp.getStatus());
        assertEquals(new BigDecimal("45.50"), resp.getAmount());
        assertNotNull(resp.getTransactionReference());
    }

    @Test
    void testProcessPaymentInvalidAmount() {
        PaymentProcessRequest req = new PaymentProcessRequest(10L, 1L, new BigDecimal("-10.00"), PaymentMethod.CARD, null);

        PaymentProcessResponse resp = paymentService.processPayment(req);

        assertNotNull(resp);
        assertFalse(resp.isSuccess());
        assertEquals(PaymentStatus.FAILED, resp.getStatus());
    }
}
