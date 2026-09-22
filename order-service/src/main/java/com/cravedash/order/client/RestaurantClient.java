package com.cravedash.order.client;

import com.cravedash.order.dto.ValidateItemsRequest;
import com.cravedash.order.dto.ValidateItemsResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

@FeignClient(name = "restaurant-service")
public interface RestaurantClient {

    @PostMapping("/api/v1/restaurants/validate-items")
    ValidateItemsResponse validateOrderItems(@RequestBody ValidateItemsRequest request);
}
