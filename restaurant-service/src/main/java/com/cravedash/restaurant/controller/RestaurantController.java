package com.cravedash.restaurant.controller;

import com.cravedash.restaurant.dto.ValidateItemsRequest;
import com.cravedash.restaurant.dto.ValidateItemsResponse;
import com.cravedash.restaurant.model.MenuItem;
import com.cravedash.restaurant.model.Restaurant;
import com.cravedash.restaurant.service.RestaurantService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/restaurants")
public class RestaurantController {

    private final RestaurantService restaurantService;

    public RestaurantController(RestaurantService restaurantService) {
        this.restaurantService = restaurantService;
    }

    @GetMapping
    public ResponseEntity<List<Restaurant>> getAllRestaurants(@RequestParam(required = false) String cuisine) {
        return ResponseEntity.ok(restaurantService.getAllRestaurants(cuisine));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getRestaurantById(@PathVariable Long id) {
        return restaurantService.getRestaurantById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}/menu")
    public ResponseEntity<List<MenuItem>> getMenu(@PathVariable Long id,
                                                   @RequestParam(defaultValue = "false") boolean onlyAvailable) {
        return ResponseEntity.ok(restaurantService.getMenuByRestaurant(id, onlyAvailable));
    }

    @PostMapping("/{id}/items")
    public ResponseEntity<MenuItem> addMenuItem(@PathVariable Long id, @RequestBody MenuItem item) {
        return ResponseEntity.status(HttpStatus.CREATED).body(restaurantService.addMenuItem(id, item));
    }

    @PutMapping("/{id}/items/{itemId}/availability")
    public ResponseEntity<?> updateItemAvailability(@PathVariable Long id,
                                                    @PathVariable Long itemId,
                                                    @RequestBody Map<String, Boolean> payload) {
        Boolean available = payload.get("available");
        if (available == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Property 'available' is required"));
        }
        try {
            MenuItem updated = restaurantService.updateItemAvailability(id, itemId, available);
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/validate-items")
    public ResponseEntity<ValidateItemsResponse> validateOrderItems(@RequestBody ValidateItemsRequest request) {
        ValidateItemsResponse response = restaurantService.validateOrderItems(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Map.of("status", "UP", "service", "restaurant-service"));
    }
}
