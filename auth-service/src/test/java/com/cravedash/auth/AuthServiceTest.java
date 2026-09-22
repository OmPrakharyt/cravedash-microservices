package com.cravedash.auth;

import com.cravedash.auth.dto.AuthResponse;
import com.cravedash.auth.dto.LoginRequest;
import com.cravedash.auth.dto.RegisterRequest;
import com.cravedash.auth.model.Role;
import com.cravedash.auth.model.User;
import com.cravedash.auth.repository.UserRepository;
import com.cravedash.auth.service.AuthService;
import com.cravedash.auth.util.JwtUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtUtil jwtUtil;

    @InjectMocks
    private AuthService authService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void testRegisterSuccess() {
        RegisterRequest req = new RegisterRequest("test@test.com", "pass123", "Test User", "1234567890", Role.CONSUMER);
        when(userRepository.existsByEmail("test@test.com")).thenReturn(false);
        when(passwordEncoder.encode("pass123")).thenReturn("encodedPassword");

        User saved = new User(1L, "test@test.com", "encodedPassword", "Test User", "1234567890", Role.CONSUMER, null);
        when(userRepository.save(any(User.class))).thenReturn(saved);
        when(jwtUtil.generateToken(any(User.class))).thenReturn("mock-jwt-token");
        when(jwtUtil.getExpiration()).thenReturn(86400000L);

        AuthResponse resp = authService.register(req);

        assertNotNull(resp);
        assertEquals("mock-jwt-token", resp.getToken());
        assertEquals("test@test.com", resp.getUser().getEmail());
        verify(userRepository, times(1)).save(any(User.class));
    }

    @Test
    void testLoginSuccess() {
        LoginRequest req = new LoginRequest("test@test.com", "pass123");
        User user = new User(1L, "test@test.com", "encodedPassword", "Test User", "1234567890", Role.CONSUMER, null);

        when(userRepository.findByEmail("test@test.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("pass123", "encodedPassword")).thenReturn(true);
        when(jwtUtil.generateToken(user)).thenReturn("mock-jwt-token");
        when(jwtUtil.getExpiration()).thenReturn(86400000L);

        AuthResponse resp = authService.login(req);

        assertNotNull(resp);
        assertEquals("mock-jwt-token", resp.getToken());
        assertEquals(Role.CONSUMER, resp.getUser().getRole());
    }

    @Test
    void testLoginInvalidPassword() {
        LoginRequest req = new LoginRequest("test@test.com", "wrongPass");
        User user = new User(1L, "test@test.com", "encodedPassword", "Test User", "1234567890", Role.CONSUMER, null);

        when(userRepository.findByEmail("test@test.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrongPass", "encodedPassword")).thenReturn(false);

        assertThrows(IllegalArgumentException.class, () -> authService.login(req));
    }
}
