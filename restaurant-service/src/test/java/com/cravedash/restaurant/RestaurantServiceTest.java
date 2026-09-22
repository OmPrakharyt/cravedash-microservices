package com.cravedash.restaurant;

import com.cravedash.restaurant.dto.ValidateItemsRequest;
import com.cravedash.restaurant.dto.ValidateItemsResponse;
import com.cravedash.restaurant.model.MenuItem;
import com.cravedash.restaurant.model.Restaurant;
import com.cravedash.restaurant.repository.MenuItemRepository;
import com.cravedash.restaurant.repository.RestaurantRepository;
import com.cravedash.restaurant.service.RestaurantService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class RestaurantServiceTest {

    @Mock
    private RestaurantRepository restaurantRepository;

    @Mock
    private MenuItemRepository menuItemRepository;

    @InjectMocks
    private RestaurantService restaurantService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void testValidateOrderItemsSuccess() {
        Restaurant r = new Restaurant(1L, "Burger Haven", "American", 4.5, 20, "123 Main St", "img", true);
        when(restaurantRepository.findById(1L)).thenReturn(Optional.of(r));

        MenuItem item1 = new MenuItem(101L, 1L, "Burger", "Juicy", new BigDecimal("10.00"), "Burgers", true, "img", 10);
        MenuItem item2 = new MenuItem(102L, 1L, "Fries", "Crispy", new BigDecimal("5.00"), "Sides", true, "img", 5);

        when(menuItemRepository.findByIdIn(List.of(101L, 102L))).thenReturn(List.of(item1, item2));

        ValidateItemsRequest request = new ValidateItemsRequest(1L, List.of(
                new ValidateItemsRequest.OrderItemDto(101L, 2),
                new ValidateItemsRequest.OrderItemDto(102L, 1)
        ));

        ValidateItemsResponse response = restaurantService.validateOrderItems(request);

        assertTrue(response.isValid());
        assertEquals("Burger Haven", response.getRestaurantName());
        assertEquals(0, new BigDecimal("25.00").compareTo(response.getCalculatedTotal()));
        assertEquals(2, response.getItems().size());
    }

    @Test
    void testValidateOrderItemsUnavailableItem() {
        Restaurant r = new Restaurant(1L, "Burger Haven", "American", 4.5, 20, "123 Main St", "img", true);
        when(restaurantRepository.findById(1L)).thenReturn(Optional.of(r));

        MenuItem item1 = new MenuItem(101L, 1L, "Burger", "Juicy", new BigDecimal("10.00"), "Burgers", false, "img", 10);
        when(menuItemRepository.findByIdIn(List.of(101L))).thenReturn(List.of(item1));

        ValidateItemsRequest request = new ValidateItemsRequest(1L, List.of(
                new ValidateItemsRequest.OrderItemDto(101L, 1)
        ));

        ValidateItemsResponse response = restaurantService.validateOrderItems(request);

        assertFalse(response.isValid());
        assertTrue(response.getErrorMessages().get(0).contains("OUT OF STOCK"));
    }
}
