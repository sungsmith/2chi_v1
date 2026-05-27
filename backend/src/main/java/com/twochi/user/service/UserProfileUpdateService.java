package com.twochi.user.service;

import com.twochi.common.exception.BusinessException;
import com.twochi.common.exception.ErrorCode;
import com.twochi.user.domain.User;
import com.twochi.user.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
public class UserProfileUpdateService {

    private final UserRepository userRepository;

    public UserProfileUpdateService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Transactional
    public User updateNickname(Long userId, String newNickname) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new BusinessException(ErrorCode.UNAUTHENTICATED));

        if (newNickname.equals(user.getNickname())) {
            return user; // no-op
        }

        if (userRepository.existsByNicknameAndDeletedAtIsNull(newNickname)) {
            throw new BusinessException(ErrorCode.NICKNAME_DUPLICATE);
        }

        user.changeNickname(newNickname, Instant.now());
        return userRepository.save(user);
    }
}
