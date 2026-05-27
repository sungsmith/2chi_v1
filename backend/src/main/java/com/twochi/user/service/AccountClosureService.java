package com.twochi.user.service;

import com.twochi.common.exception.BusinessException;
import com.twochi.common.exception.ErrorCode;
import com.twochi.user.domain.User;
import com.twochi.user.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
public class AccountClosureService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AccountClosureService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public void close(Long userId, String currentPassword) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new BusinessException(ErrorCode.UNAUTHENTICATED));

        if (user.getDeletedAt() != null) {
            throw new BusinessException(ErrorCode.ALREADY_WITHDRAWN);
        }

        if (!passwordEncoder.matches(currentPassword, user.getPasswordHash())) {
            throw new BusinessException(ErrorCode.PASSWORD_MISMATCH);
        }

        user.withdraw(Instant.now());
        userRepository.save(user);
    }
}
