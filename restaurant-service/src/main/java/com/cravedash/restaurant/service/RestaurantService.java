package com.cravedash.restaurant.service;

import com.cravedash.restaurant.dto.ValidateItemsRequest;
import com.cravedash.restaurant.dto.ValidateItemsResponse;
import com.cravedash.restaurant.model.MenuItem;
import com.cravedash.restaurant.model.Restaurant;
import com.cravedash.restaurant.repository.MenuItemRepository;
import com.cravedash.restaurant.repository.RestaurantRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class RestaurantService {

    private final RestaurantRepository restaurantRepository;
    private final MenuItemRepository menuItemRepository;

    public RestaurantService(RestaurantRepository restaurantRepository, MenuItemRepository menuItemRepository) {
        this.restaurantRepository = restaurantRepository;
        this.menuItemRepository = menuItemRepository;
    }

    public List<Restaurant> getAllRestaurants(String cuisine) {
        if (cuisine != null && !cuisine.isBlank()) {
            return restaurantRepository.findByCuisineIgnoreCase(cuisine);
        }
        return restaurantRepository.findAll();
    }

    public Optional<Restaurant> getRestaurantById(Long id) {
        return restaurantRepository.findById(id);
    }

    public List<MenuItem> getMenuByRestaurant(Long restaurantId, boolean onlyAvailable) {
        if (onlyAvailable) {
            return menuItemRepository.findByRestaurantIdAndIsAvailableTrue(restaurantId);
        }
        return menuItemRepository.findByRestaurantId(restaurantId);
    }

    public MenuItem addMenuItem(Long restaurantId, MenuItem item) {
        item.setRestaurantId(restaurantId);
        return menuItemRepository.save(item);
    }

    @Transactional
    public MenuItem updateItemAvailability(Long restaurantId, Long itemId, boolean available) {
        MenuItem item = menuItemRepository.findById(itemId)
                .orElseThrow(() -> new IllegalArgumentException("Menu item not found: " + itemId));
        if (!item.getRestaurantId().equals(restaurantId)) {
            throw new IllegalArgumentException("Item does not belong to restaurant: " + restaurantId);
        }
        item.setIsAvailable(available);
        return menuItemRepository.save(item);
    }

    @Transactional(readOnly = true)
    public ValidateItemsResponse validateOrderItems(ValidateItemsRequest request) {
        ValidateItemsResponse response = new ValidateItemsResponse();
        List<String> errors = new ArrayList<>();
        List<ValidateItemsResponse.ValidatedItemInfo> itemDetails = new ArrayList<>();
        BigDecimal total = BigDecimal.ZERO;

        Restaurant restaurant = restaurantRepository.findById(request.getRestaurantId())
                .orElse(null);

        if (restaurant == null) {
            errors.add("Restaurant not found with ID: " + request.getRestaurantId());
            response.setValid(false);
            response.setErrorMessages(errors);
            return response;
        }

        if (Boolean.FALSE.equals(restaurant.getIsOpen())) {
            errors.add("Restaurant " + restaurant.getName() + " is currently closed for orders.");
        }

        response.setRestaurantName(restaurant.getName());

        if (request.getItems() == null || request.getItems().isEmpty()) {
            errors.add("Order contains no items");
            response.setValid(false);
            response.setErrorMessages(errors);
            return response;
        }

        List<Long> itemIds = request.getItems().stream()
                .map(ValidateItemsRequest.OrderItemDto::getMenuItemId)
                .collect(Collectors.toList());

        Map<Long, MenuItem> dbItemsMap = menuItemRepository.findByIdIn(itemIds).stream()
                .collect(Collectors.toMap(MenuItem::getId, m -> m));

        for (ValidateItemsRequest.OrderItemDto orderItemDto : request.getItems()) {
            MenuItem dbItem = dbItemsMap.get(orderItemDto.getMenuItemId());
            if (dbItem == null) {
                errors.add("Menu item ID " + orderItemDto.getMenuItemId() + " does not exist.");
                continue;
            }

            if (!dbItem.getRestaurantId().equals(request.getRestaurantId())) {
                errors.add("Item " + dbItem.getName() + " does not belong to " + restaurant.getName());
                continue;
            }

            if (Boolean.FALSE.equals(dbItem.getIsAvailable())) {
                errors.add("Item '" + dbItem.getName() + "' is currently OUT OF STOCK.");
                continue;
            }

            int qty = (orderItemDto.getQuantity() != null && orderItemDto.getQuantity() > 0) ? orderItemDto.getQuantity() : 1;
            BigDecimal subtotal = dbItem.getPrice().multiply(BigDecimal.valueOf(qty));
            total = total.add(subtotal);

            itemDetails.add(new ValidateItemsResponse.ValidatedItemInfo(
                    dbItem.getId(),
                    dbItem.getName(),
                    dbItem.getPrice(),
                    qty,
                    subtotal
            ));
        }

        boolean isValid = errors.isEmpty();
        response.setValid(isValid);
        response.setCalculatedTotal(total);
        response.setItems(itemDetails);
        response.setErrorMessages(errors);
        return response;
    }
}
