package com.cravedash.order;

import com.cravedash.order.client.PaymentClient;
import com.cravedash.order.client.RestaurantClient;
import com.cravedash.order.dto.*;
import com.cravedash.order.model.Order;
import com.cravedash.order.model.OrderStatus;
import com.cravedash.order.repository.OrderRepository;
import com.cravedash.order.service.OrderOrchestratorService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class OrderOrchestratorServiceTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private RestaurantClient restaurantClient;

    @Mock
    private PaymentClient paymentClient;

    @InjectMocks
    private OrderOrchestratorService orderOrchestratorService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void testCreateOrderSuccessWorkflow() {
        CreateOrderRequest request = new CreateOrderRequest(
                1L, 10L, "Om Prakhar", "om@cravedash.com", "742 Evergreen Blvd", "UPI",
                List.of(new CreateOrderRequest.OrderItemDto(101L, 2))
        );

        // 1. Mock Restaurant validation response
        ValidateItemsResponse valResp = new ValidateItemsResponse(
                true,
                "Gourmet Smash & Grills",
                new BigDecimal("29.98"),
                List.of(new ValidateItemsResponse.ValidatedItemInfo(101L, "Truffle Smash Burger", new BigDecimal("14.99"), 2, new BigDecimal("29.98"))),
                List.of()
        );
        when(restaurantClient.validateOrderItems(any(ValidateItemsRequest.class))).thenReturn(valResp);

        // 2. Mock Order saving
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> {
            Order o = invocation.getArgument(0);
            if (o.getId() == null) o.setId(500L);
            return o;
        });

        // 3. Mock Payment processing response
        PaymentProcessResponse payResp = new PaymentProcessResponse(
                true, "TXN-123456", 500L, new BigDecimal("29.98"), "SUCCESS", "Authorized", LocalDateTime.now()
        );
        when(paymentClient.processPayment(any(PaymentProcessRequest.class))).thenReturn(payResp);

        OrderResponse response = orderOrchestratorService.createOrder(request);

        assertNotNull(response);
        assertEquals(OrderStatus.CONFIRMED, response.getStatus());
        assertEquals("TXN-123456", response.getPaymentTransactionRef());
        assertEquals("Gourmet Smash & Grills", response.getRestaurantName());
        assertEquals(1, response.getItems().size());
        assertEquals(0, new BigDecimal("29.98").compareTo(response.getTotalAmount()));

        verify(restaurantClient, times(1)).validateOrderItems(any(ValidateItemsRequest.class));
        verify(paymentClient, times(1)).processPayment(any(PaymentProcessRequest.class));
    }

    @Test
    void testCreateOrderValidationFailure() {
        CreateOrderRequest request = new CreateOrderRequest(
                1L, 10L, "Om Prakhar", "om@cravedash.com", "742 Evergreen Blvd", "UPI",
                List.of(new CreateOrderRequest.OrderItemDto(101L, 1))
        );

        ValidateItemsResponse valResp = new ValidateItemsResponse(
                false, "Gourmet Smash & Grills", BigDecimal.ZERO, List.of(),
                List.of("Item 'Truffle Smash Burger' is currently OUT OF STOCK.")
        );
        when(restaurantClient.validateOrderItems(any(ValidateItemsRequest.class))).thenReturn(valResp);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                orderOrchestratorService.createOrder(request));

        assertTrue(ex.getMessage().contains("OUT OF STOCK"));
        verifyNoInteractions(paymentClient);
    }

    @Test
    void testGetOrderTracking() {
        Order order = new Order();
        order.setId(100L);
        order.setOrderNumber("CRV-TEST1");
        order.setRestaurantName("Tokyo Ramen");
        order.setStatus(OrderStatus.PREPARING);
        order.setDeliveryAddress("Cyber Hub");

        when(orderRepository.findById(100L)).thenReturn(Optional.of(order));

        OrderTrackingResponse tracking = orderOrchestratorService.getOrderTracking(100L);

        assertNotNull(tracking);
        assertEquals(OrderStatus.PREPARING, tracking.getStatus());
        assertEquals(20, tracking.getEstimatedDeliveryMinutes());
        assertEquals(4, tracking.getSteps().size());
        assertTrue(tracking.getSteps().get(0).isCompleted()); // CONFIRMED completed
        assertTrue(tracking.getSteps().get(1).isCompleted()); // PREPARING completed
        assertTrue(tracking.getSteps().get(1).isCurrent());   // PREPARING current
        assertFalse(tracking.getSteps().get(2).isCompleted()); // OUT_FOR_DELIVERY not completed
    }
}
