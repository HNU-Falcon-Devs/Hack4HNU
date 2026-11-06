-- =====================================================================
-- HNU CTF – Cybersecurity Challenge & Attack Monitoring Platform
-- Complete Database Schema & Seed Data
-- =====================================================================
-- IMPORTANT: Do NOT execute this script automatically.
-- The administrator should create a database (e.g., `hnu_ctf`) in MySQL / phpMyAdmin
-- and manually import this file.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Table: users
-- No registration system. Accounts are provisioned manually by administrators.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(50) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `role` ENUM('participant', 'admin') NOT NULL DEFAULT 'participant',
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `last_login_at` DATETIME NULL,
  `last_login_ip` VARCHAR(45) NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_users_role` (`role`),
  INDEX `idx_users_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 2. Table: challenges
-- Official 22 HNU CTF 2026 Challenges
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `challenges` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `slug` VARCHAR(100) NOT NULL UNIQUE,
  `title` VARCHAR(255) NOT NULL,
  `category` ENUM('Web', 'OSINT', 'Network', 'Forensics', 'Steganography', 'Miscellaneous') NOT NULL,
  `difficulty` ENUM('Easy', 'Medium', 'Hard') NOT NULL DEFAULT 'Medium',
  `points` INT UNSIGNED NOT NULL DEFAULT 100,
  `description` TEXT NOT NULL,
  `target_info` VARCHAR(255) NULL,
  `correct_flag` VARCHAR(255) NOT NULL,
  `is_enabled` TINYINT(1) NOT NULL DEFAULT 1,
  `image_path` VARCHAR(255) NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_challenges_cat` (`category`),
  INDEX `idx_challenges_enabled` (`is_enabled`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 3. Table: challenge_attachments
-- Preserved original artifacts downloadable through the PHP backend
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `challenge_attachments` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `challenge_id` INT UNSIGNED NOT NULL,
  `filename` VARCHAR(255) NOT NULL,
  `relative_path` VARCHAR(255) NOT NULL,
  `file_size` BIGINT UNSIGNED NOT NULL,
  `mime_type` VARCHAR(100) NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_attachment_challenge` FOREIGN KEY (`challenge_id`) 
    REFERENCES `challenges` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 4. Table: solves
-- Solved challenges tracking (prevents duplicate points)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `solves` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT UNSIGNED NOT NULL,
  `challenge_id` INT UNSIGNED NOT NULL,
  `points` INT UNSIGNED NOT NULL,
  `solved_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `unique_user_challenge_solve` (`user_id`, `challenge_id`),
  INDEX `idx_solves_user` (`user_id`),
  INDEX `idx_solves_challenge` (`challenge_id`),
  CONSTRAINT `fk_solves_user` FOREIGN KEY (`user_id`) 
    REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_solves_challenge` FOREIGN KEY (`challenge_id`) 
    REFERENCES `challenges` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 5. Table: submissions
-- Every flag submission record with IP, result, and timestamp
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `submissions` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT UNSIGNED NOT NULL,
  `challenge_id` INT UNSIGNED NOT NULL,
  `submitted_flag` VARCHAR(255) NOT NULL,
  `is_correct` TINYINT(1) NOT NULL,
  `ip_address` VARCHAR(45) NOT NULL,
  `user_agent` VARCHAR(255) NULL,
  `points_awarded` INT UNSIGNED NOT NULL DEFAULT 0,
  `submitted_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_sub_user` (`user_id`),
  INDEX `idx_sub_challenge` (`challenge_id`),
  INDEX `idx_sub_ip` (`ip_address`),
  INDEX `idx_sub_time` (`submitted_at`),
  INDEX `idx_sub_correct` (`is_correct`),
  CONSTRAINT `fk_submissions_user` FOREIGN KEY (`user_id`) 
    REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_submissions_challenge` FOREIGN KEY (`challenge_id`) 
    REFERENCES `challenges` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 6. Table: ip_security
-- Real-time IP monitoring, automated threat levels, and blocking status
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `ip_security` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `ip_address` VARCHAR(45) NOT NULL UNIQUE,
  `status` ENUM('normal', 'suspicious', 'rate_limited', 'blocked', 'whitelisted') NOT NULL DEFAULT 'normal',
  `threat_level` ENUM('Low', 'Medium', 'High', 'Critical') NOT NULL DEFAULT 'Low',
  `failed_attempts_count` INT UNSIGNED NOT NULL DEFAULT 0,
  `reason` VARCHAR(255) NULL,
  `is_enforced` TINYINT(1) NOT NULL DEFAULT 1,
  `first_attempt_at` DATETIME NULL,
  `last_attempt_at` DATETIME NULL,
  `blocked_at` DATETIME NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_ip_status` (`status`),
  INDEX `idx_ip_threat` (`threat_level`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 7. Table: ip_actions_log
-- Audit trail of administrator actions on IP addresses
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `ip_actions_log` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `ip_address` VARCHAR(45) NOT NULL,
  `admin_id` INT UNSIGNED NOT NULL,
  `action` ENUM('block', 'unblock', 'whitelist', 'reset') NOT NULL,
  `notes` TEXT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_ip_actions_ip` (`ip_address`),
  CONSTRAINT `fk_ip_actions_admin` FOREIGN KEY (`admin_id`) 
    REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 8. Table: security_logs
-- Comprehensive SOC security logs with filtering and threat levels
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `security_logs` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT UNSIGNED NULL,
  `username` VARCHAR(50) NULL,
  `ip_address` VARCHAR(45) NOT NULL,
  `challenge_id` INT UNSIGNED NULL,
  `challenge_name` VARCHAR(255) NULL,
  `event_type` ENUM(
    'FLAG_ATTEMPT_FAILED', 
    'FLAG_ATTEMPT_SUCCESS', 
    'BRUTE_FORCE_SUSPICIOUS', 
    'BRUTE_FORCE_HIGH_RISK', 
    'BRUTE_FORCE_CRITICAL', 
    'RATE_LIMITED', 
    'IP_BLOCKED_ACCESS', 
    'AUTH_FAILED', 
    'AUTH_SUCCESS', 
    'ADMIN_ACTION'
  ) NOT NULL,
  `result` ENUM('CORRECT', 'INCORRECT', 'BLOCKED', 'TRIGGERED', 'INFO') NOT NULL,
  `threat_level` ENUM('Low', 'Medium', 'High', 'Critical') NOT NULL DEFAULT 'Low',
  `detection_reason` TEXT NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_sec_event` (`event_type`),
  INDEX `idx_sec_threat` (`threat_level`),
  INDEX `idx_sec_ip` (`ip_address`),
  INDEX `idx_sec_time` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 9. Table: system_settings
-- Initial configurable thresholds for SOC brute-force detection
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `system_settings` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `setting_key` VARCHAR(50) NOT NULL UNIQUE,
  `setting_value` VARCHAR(255) NOT NULL,
  `description` VARCHAR(255) NULL,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 10. Table: announcements
-- Competition updates, challenge hints, and rules
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `announcements` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `content` TEXT NOT NULL,
  `category` ENUM('Competition', 'Challenge Release', 'Rules & Reminders', 'Maintenance', 'Important Update') NOT NULL DEFAULT 'Competition',
  `author_id` INT UNSIGNED NOT NULL,
  `is_pinned` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_announcements_author` FOREIGN KEY (`author_id`) 
    REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
-- INITIAL DATA SEEDING
-- =====================================================================

-- 1. Configurable Brute-force Detection Thresholds
INSERT INTO `system_settings` (`setting_key`, `setting_value`, `description`) VALUES
('threshold_1min_suspicious', '5', 'Failed flag submissions within 1 minute to flag as Suspicious (Low/Medium)'),
('threshold_5min_highrisk', '10', 'Failed flag submissions within 5 minutes to escalate to High Risk'),
('threshold_10min_critical', '20', 'Failed flag submissions within 10 minutes to trigger Critical threat and rate limit'),
('enforce_ip_blocking', '1', 'Enforce backend blocking for marked IP addresses (1 = enabled, 0 = marked only)'),
('platform_title', 'HNU CTF', 'Name of the CTF competition platform')
ON DUPLICATE KEY UPDATE `setting_value` = VALUES(`setting_value`);

-- 2. Default Provisioned Accounts (Password: Admin@HNU2026! / Participant123!)
-- Administrators can insert new users directly or change passwords using password_hash()
INSERT INTO `users` (`id`, `username`, `password_hash`, `role`, `is_active`) VALUES
(1, 'admin', '$2y$12$fLdVU3QXfjEM4Ulqwh7QHuF8I7CKy2cTQBe0Csm0PJKjPedUsq7Je', 'admin', 1),
(2, 'cyberspartan', '$2y$12$mOHXPmoH49dLFFDFPUUvhe9yykOS9oPZRhYHSa35TNzrAOuBwETFi', 'participant', 1),
(3, 'bytehunter', '$2y$12$mOHXPmoH49dLFFDFPUUvhe9yykOS9oPZRhYHSa35TNzrAOuBwETFi', 'participant', 1),
(4, 'netrunner', '$2y$12$mOHXPmoH49dLFFDFPUUvhe9yykOS9oPZRhYHSa35TNzrAOuBwETFi', 'participant', 1)
ON DUPLICATE KEY UPDATE `username` = VALUES(`username`);

-- 3. Imported HNU CTF Challenges (All 22 Authentic Challenges)
-- Note: Replace placeholder flags with your desired verified flags in the Admin SOC panel.
INSERT INTO `challenges` (`id`, `slug`, `title`, `category`, `difficulty`, `points`, `description`, `target_info`, `correct_flag`, `is_enabled`, `image_path`) VALUES
-- WEB
(1, 'dict-chatbot', 'DICT Chatbot', 'Web', 'Hard', 100, 
 'The DICT ChatBot is malfunctioning. Get the restart $(code), and restart it to recover it from the corrupted state.\n\n172.16.105.9:3000\n\nFlag format: HNU{flag}', 
 '172.16.105.9:3000', 'HNU{dict_ch4tb0t_r3st4rt_c0d3_2026}', 1, 'dict-chatbot/DICTChatbotChallenge.png'),

(2, 'bypass-the-firewall', 'Bypass the Firewall', 'Web', 'Hard', 100, 
 'You\'re trying to upload a .php file into a Web Application, however there seems to be a firewall. Find a way to bypass it, make sure they don\'t see it.\n\n172.16.105.9:5000\n\nFlag format: HNU{flag}', 
 '172.16.105.9:5000', 'HNU{byp4ss_f1r3w4ll_php_upl04d_succ3ss}', 1, 'bypass-the-firewall/BypasstheFirewallChallenge.png'),

(3, 'gacha-pulling-4-the-king-of-jobbers', 'Gacha Pulling 4 the KING OF JOBBERS', 'Web', 'Hard', 100, 
 'The King of Jobbers, Gilgamesh. Needs you to pull for him! Because of his ego he doesn\'t want anyone else in the banner but him. Find a way to satisfy his pride by getting him 10 times in 1 pull.\n\n172.16.105.9:3067\n\nFlag format: HNU{flag}', 
 '172.16.105.9:3067', 'HNU{g4ch4_k1ng_0f_j0bb3rs_10x_pull}', 1, 'gacha-pulling-4-the-king-of-jobbers/GachaPulling4theKINGOFJOBBERSChallenge.png'),

(4, 'race-royale', 'Race Royale', 'Web', 'Hard', 100, 
 'Welcome to Race Royale, where being first isn\'t just bragging rights, it might be the only way in. The application looks polished, the doors look locked, and the admin panel definitely wasn\'t made for you. Somewhere beneath the surface, though, the system has a slight problem keeping up when things get hectic. Your mission is simple: find the crack, outpace the application, and claim what\'s waiting behind /admin. Ready, set... exploit.\n\n172.16.105.9:5151\n\nFlag format: HNU{flag}', 
 '172.16.105.9:5151', 'HNU{r4c3_c0nd1t10n_adm1n_p4n3l_pwn3d}', 1, 'race-royale/RaceRoyaleChallenge.png'),

-- OSINT
(5, 'who-owns-this-neighborhood', 'Who Owns This Neighborhood', 'OSINT', 'Easy', 30, 
 'An IP address rarely stands alone. You have been given:\n\n124.6.144.115\n\nPublic registration information suggests that this address belongs to a network associated with the Philippine Bureau of Immigration. Your task is to determine the CIDR notation of the netblock containing this IP address. Don\'t submit the individual IP. We want the entire neighborhood.\n\nFlag Format: HNU{cidr}', 
 'Target IP: 124.6.144.115', 'HNU{124.6.144.112/28}', 1, 'who-owns-this-neighborhood/WhoOwnsThisNeighborhoodChallenge.png'),

(6, 'a-block-for-defense', 'A Block for Defense', 'OSINT', 'Easy', 30, 
 'Government organizations have websites. But websites aren\'t the only thing they own.\n\nYour mission is to investigate publicly available IP registration information and identify one IP address range associated with our National Defense.\n\nWe aren\'t looking for an individual IP. We want a block of it. Identify one valid eight-host network associated with the DND.\n\nFlag Format: HNU{cidr}', 
 'Target: Department of National Defense', 'HNU{112.199.117.168/29}', 1, 'a-block-for-defense/ABlockforDefenseChallenge.png'),

(7, 'where-did-gotyme-go', 'Where Did GoTyme Go', 'OSINT', 'Easy', 40, 
 'GoTyme seems to have gone somewhere... Your task is to follow the trail left behind by:\n\ngotyme.com.ph\n\nUsing publicly available domain intelligence tools, trace the trail and identify one domain that leads back to the source.\n\nFlag Format: HNU{domain}', 
 'Domain: gotyme.com.ph', 'HNU{gotyme.bank}', 1, 'where-did-gotyme-go/WhereDidGoTymeGoChallenge.png'),

(8, 'time-will-tell', 'Time Will Tell', 'OSINT', 'Medium', 60, 
 'A FortiGate device belonging to a certain SIIX Logistics Philippines Incorporated has left some information exposed to the public internet. Fortunately, you\'re not being asked to break into it. Everything you need has already been indexed.\n\nDetermine the firmware release date displayed in the device information. The date and time must be synchronized with our local time.\n\nFlag Format: HNU{DayOfTheWeek, Month DD, YYYY at hh:mm:ss AM/PM}', 
 'Target: SIIX Logistics Philippines Inc FortiGate', 'HNU{Wednesday, March 15, 2023 at 08:30:00 AM}', 1, 'time-will-tell/TimeWillTellChallenge.png'),

(9, 'nas-ter-of-discovery', 'NAS-ter of Discovery', 'OSINT', 'Medium', 70, 
 'Some devices prefer to stay at home. This one apparently didn\'t. Somewhere in the Philippines, a QNAP NAS running version 4.4.3 has been publicly exposed.\n\nYour mission is simple: Find the IP address.\n\nFlag Format: HNU{IPaddress}', 
 'Target: QNAP NAS v4.4.3 in Philippines', 'HNU{119.92.174.12}', 1, 'nas-ter-of-discovery/NAS-terofDiscoveryChallenge.png'),

(10, 'the-counterfeit', 'The Counterfeit', 'OSINT', 'Hard', 100, 
 'I drop no payloads and I break no walls, I simply build a mirror where the victim falls. Wearing a trusted face to quietly take your keys, Find the clever counterfeit built to deceive.\n\nFlag Format: HNU{Domain}', 
 'Attachment: The_Counterfeit.txt', 'HNU{phishing-login-portal.net}', 1, 'the-counterfeit/TheCounterfeitChallenge.png'),

(11, 'the-clean-slate', 'The Clean Slate', 'OSINT', 'Hard', 100, 
 'Amongst the wicked shadows, I alone am bright, Zero stains on my name, I walk in the light. No scanner can curse me, no list marks my name, Find the one pure path in this dark, dirty game.\n\nFlag Format: HNU{domain}', 
 'Attachment: The_Clean_Slate.txt', 'HNU{verified-clean-secure.org}', 1, 'the-clean-slate/TheCleanSlateChallenge.png'),

-- NETWORK
(12, 'domengs-logic', 'Domeng\'s Logic', 'Network', 'Hard', 100, 
 'Patterns pretend to be random, but every choice leaves a trace.\n\nFormat Flag: HNU{IPAddress}', 
 'Attachment: Domengs.pcap', 'HNU{192.168.1.105}', 1, 'domengs-logic/Domeng_sLogicChallenge.png'),

(13, 'the-silent-traffic', 'The Silent Traffic', 'Network', 'Easy', 30, 
 'A suspicious PCAP was captured from a compromised workstation. Most of the traffic appears normal, but investigators believe a hidden message was transmitted during the session.\n\nFlag format: HNU{flag}', 
 'Attachment: malicious_traffic.pcapng', 'HNU{icmp_exf1ltr4t10n_succ3ss}', 1, 'the-silent-traffic/TheSilentTrafficChallenge.png'),

(14, 'sweeperswipper', 'SweeperSwipper', 'Network', 'Medium', 50, 
 'The network\'s been rough lately. Something feels off. I bet someone\'s stirring up trouble again.\n\nFlag Format: HNU{TechniqueIdentifierAccessiblePortsSeparatedBy,}', 
 'Attachment: 17a11a51b899c8ca13717b13adcbccd653697869', 'HNU{T1046_22,80,443}', 1, 'sweeperswipper/SweeperSwipperChallenge.png'),

-- FORENSICS
(15, 'filing-a-leave', 'Filing a Leave', 'Forensics', 'Easy', 20, 
 'Meridian Fiduciary Group\'s night-shift network tap caught a file leaving the finance server at 02:02. By breakfast, the CFO\'s workstation had been ""cleaned up"". The Audit Committee has handed you what survived.\n\nFlag Format: HNU{flag}', 
 'Attachment: network_capture.pcap', 'HNU{ftp_exf1ltr4t3d_l34v3_f0rm}', 1, 'filing-a-leave/FilingALeaveChallenge.png'),

-- STEGANOGRAPHY
(16, 'the-long-way-home', 'The Long Way Home', 'Steganography', 'Medium', 50, 
 'For 58 lonely nights, this pup wandered the city streets wearing a collar inscribed with 6s8UurfK81L3da. A kind stranger eventually took him in, and it\'s been 45 days since his rescue. He\'s safe and happy now, but he carries a hidden message inside.\n\nFlag Format: HNU{flag}', 
 'Attachment: happydog.jpeg', 'HNU{st3gh1d3_p4ss_6s8UurfK81L3da}', 1, 'the-long-way-home/TheLongWayHomeChallenge.png'),

(17, 'where-the-sun-hides', 'Where the Sun Hides', 'Steganography', 'Medium', 70, 
 'The photo appears ordinary, but the photographer may have left additional information within the files. Your task is to examine what was left behind and uncover the hidden answer.\n\nFlag Format: HNU{flag}', 
 'Attachments: Final.zip, Sunset.png', 'HNU{h1dd3n_b3h1nd_th3_suns3t}', 1, 'where-the-sun-hides/WheretheSunHidesChallenge.png'),

(18, 'm3-y4w', 'M3-y4W', 'Steganography', 'Hard', 100, 
 'We have a note saying, “cats\' tails tell a lot.” Can you reveal the mystery and find the flag?\n\nHNU Format: HNU{flag}', 
 'Attachments: cat_tails.png, blue_lsb.png', 'HNU{blu3_ch4nn3l_lsb_s3cr3t}', 1, 'm3-y4w/M3-y4WChallenge.png'),

-- MISCELLANEOUS
(19, 'credential-vault', 'Credential Vault', 'Miscellaneous', 'Easy', 30, 
 'A Python-based credential vault was recovered from a compromised workstation. Although the application appears simple, the stored vault contents are not directly readable. Reverse the program\'s logic, determine how the protected data is transformed, recover the original credentials, and submit the correct flag.\n\nFlag Format: HNU{username:password}', 
 'Attachment: Credential_Vault.py', 'HNU{adm1n_us3r:S3cur3P@ssw0rd!}', 1, 'credential-vault/CredentialVaultChallenge.png'),

(20, 'my-melodys-matcha-latte', 'My Melody\'s Matcha Latte', 'Miscellaneous', 'Hard', 100, 
 'Something\'s off about My Melody\'s too-perfect matcha latte, Kuromi thinks, snooping around her computer. That\'s when she spots it: a suspicious matcha latte photo, saved with a strange filename. Her ears perk up, and her tail flicks with excitement, there\'s got to be something hidden in it. But Kuromi can\'t crack this one alone. Can you help her dig through the photo and uncover the secret hidden inside? Time to crack the case, and maybe steal a snack while she\'s at it.\n\nFlag Format: HNU{flag}', 
 'Attachment: my_golisden_matischa_laistte_raistio.jpg', 'HNU{m4tch4_l4tt3_s3cr3t_r3c1p3}', 1, 'my-melodys-matcha-latte/MyMelody_sMatchaLatteChallenge.png'),

(21, 'is-there-really-a-password', 'IS there really a password?', 'Miscellaneous', 'Medium', 50, 
 'We recovered an archive from a decommissioned workstation. It holds two files. One of them opens just fine read it. The other one makes every tool we own demand a password, and the admin swears no password was ever set on these exports.\n\nMaybe that file is only pretending to be locked.\n\nFlag format: HNU{flag}', 
 'Attachment: secret_docs.zip', 'HNU{z1p_f4k3_3ncrypt10n_b1t_byp4ss}', 1, 'is-there-really-a-password/IsThereReallyAPassword.png'),

(22, 'quantum-echoes', 'Quantum Echoes', 'Miscellaneous', 'Hard', 100, 
 'Your task is to follow the traces, uncover what was concealed, and recover the flag before the fragment disappears.\n\nhttps://cert1234.github.io/Quantum-Echoes/\n\nFlag Format: HNU{flag}', 
 'https://cert1234.github.io/Quantum-Echoes/', 'HNU{qu4ntum_c0h3r3nc3_3ch0_d3t3ct3d}', 1, 'quantum-echoes/Quantum_Echoes.png')
ON DUPLICATE KEY UPDATE `title` = VALUES(`title`);

-- 4. Attachment Records Linked to Real Files in storage/challenges/<slug>/attachments/
INSERT INTO `challenge_attachments` (`id`, `challenge_id`, `filename`, `relative_path`, `file_size`, `mime_type`) VALUES
(1, 10, 'The_Counterfeit.txt', 'the-counterfeit/attachments/The_Counterfeit.txt', 10814, 'text/plain'),
(2, 11, 'The_Clean_Slate.txt', 'the-clean-slate/attachments/The_Clean_Slate.txt', 11305, 'text/plain'),
(3, 12, 'Domengs.pcap', 'domengs-logic/attachments/Domengs.pcap', 361639, 'application/vnd.tcpdump.pcap'),
(4, 13, 'malicious_traffic.pcapng', 'the-silent-traffic/attachments/malicious_traffic.pcapng', 5868, 'application/x-pcapng'),
(5, 14, '17a11a51b899c8ca13717b13adcbccd653697869', 'sweeperswipper/attachments/17a11a51b899c8ca13717b13adcbccd653697869', 2248503, 'application/octet-stream'),
(6, 15, 'network_capture.pcap', 'filing-a-leave/attachments/network_capture.pcap', 7703, 'application/vnd.tcpdump.pcap'),
(7, 16, 'happydog.jpeg', 'the-long-way-home/attachments/happydog.jpeg', 8050, 'image/jpeg'),
(8, 17, 'Final.zip', 'where-the-sun-hides/attachments/Final.zip', 494125, 'application/zip'),
(9, 17, 'Sunset.png', 'where-the-sun-hides/attachments/Sunset.png', 492501, 'image/png'),
(10, 18, 'cat_tails.png', 'm3-y4w/attachments/cat_tails.png', 112203, 'image/png'),
(11, 18, 'blue_lsb.png', 'm3-y4w/attachments/blue_lsb.png', 466, 'image/png'),
(12, 19, 'Credential_Vault.py', 'credential-vault/attachments/Credential_Vault.py', 1650, 'text/x-python'),
(13, 20, 'my_golisden_matischa_laistte_raistio.jpg', 'my-melodys-matcha-latte/attachments/my_golisden_matischa_laistte_raistio.jpg', 202327, 'image/jpeg'),
(14, 21, 'secret_docs.zip', 'is-there-really-a-password/attachments/secret_docs.zip', 549, 'application/zip')
ON DUPLICATE KEY UPDATE `filename` = VALUES(`filename`);

-- 5. Announcements
INSERT INTO `announcements` (`id`, `title`, `content`, `category`, `author_id`, `is_pinned`, `created_at`) VALUES
(1, 'Welcome to HNU CTF 2026', 'Welcome participants to Holy Name University Cyber Security Challenge Platform! The competition is now officially live. Please ensure all flag submissions follow the standard format: HNU{flag}. Good luck to all teams!', 'Competition', 1, 1, NOW()),
(2, 'Brute-Force & Automated Scanning Notice', 'Notice: Automated brute-forcing of flags will trigger automated SOC alerts and IP rate-limiting. Please analyze challenges methodically using legitimate forensic, OSINT, stego, and network tools.', 'Rules & Reminders', 1, 1, NOW()),
(3, 'HNU CTF Challenges Released', 'All 22 authentic challenges are now available across Web, OSINT, Network, Forensics, Steganography, and Miscellaneous categories. Investigate files and submit your flags!', 'Challenge Release', 1, 0, NOW())
ON DUPLICATE KEY UPDATE `title` = VALUES(`title`);

