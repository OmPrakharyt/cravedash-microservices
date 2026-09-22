package com.cravedash.order.client;

import com.cravedash.order.dto.PaymentProcessRequest;
import com.cravedash.order.dto.PaymentProcessResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

@FeignClient(name = "payment-service")
public interface PaymentClient {

    @PostMapping("/api/v1/payments/process")
    PaymentProcessResponse processPayment(@RequestBody PaymentProcessRequest request);
}
