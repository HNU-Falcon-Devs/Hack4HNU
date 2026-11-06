# HNU CTF Database Schema Documentation

This document describes the relational database schema, data types, primary keys, foreign key constraints, indexes, and manual account management procedures for the **HNU CTF – Cybersecurity Challenge & Attack Monitoring Platform**.

---

## Database Architecture Overview

The system runs on **MySQL** (InnoDB engine) with `utf8mb4` character encoding. It stores challenges, submissions, solves, role-based accounts, SOC real-time IP threat metrics, administrator audit logs, and announcements.

### Entity Relationship Summary

```
[users] 1 ----- * [solves] * ----- 1 [challenges]
   |                 |                     |
   1                 1                     1
   |                 |                     |
   *                 *                     *
[submissions]   [security_logs]   [challenge_attachments]
   |
   *
[ip_security] 1 ----- * [ip_actions_log]
```

---

## Table Definitions

### 1. `users`
Stores user credentials for participants and administrators. There is **no public registration**. Accounts are added manually by database administrators.

| Column | Data Type | Constraints | Description |
|---|---|---|---|
| `id` | INT UNSIGNED | PRIMARY KEY, AUTO_INCREMENT | Unique user identifier |
| `username` | VARCHAR(50) | UNIQUE, NOT NULL | Login username |
| `password_hash` | VARCHAR(255) | NOT NULL | Secure PHP `password_hash()` bcrypt string |
| `role` | ENUM('participant', 'admin') | NOT NULL, DEFAULT 'participant' | Access control level |
| `is_active` | TINYINT(1) | NOT NULL, DEFAULT 1 | 1 = active, 0 = disabled |
| `last_login_at` | DATETIME | NULL | Timestamp of last successful authentication |
| `last_login_ip` | VARCHAR(45) | NULL | IPv4/IPv6 address of last login |
| `created_at` | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Account creation date |

### 2. `challenges`
Contains all 22 HNU CTF challenges with point values, categories, and correct flag answers.

| Column | Data Type | Constraints | Description |
|---|---|---|---|
| `id` | INT UNSIGNED | PRIMARY KEY, AUTO_INCREMENT | Unique challenge identifier |
| `slug` | VARCHAR(100) | UNIQUE, NOT NULL | URL-friendly identifier |
| `title` | VARCHAR(255) | NOT NULL | Challenge display name |
| `category` | ENUM | NOT NULL | Web, OSINT, Network, Forensics, Steganography, Miscellaneous |
| `difficulty` | ENUM | NOT NULL, DEFAULT 'Medium' | Easy, Medium, Hard |
| `points` | INT UNSIGNED | NOT NULL, DEFAULT 100 | Point value |
| `description` | TEXT | NOT NULL | Challenge prompt and instructions |
| `target_info` | VARCHAR(255) | NULL | Target IP/port or external link |
| `correct_flag` | VARCHAR(255) | NOT NULL | Server-side flag (`HNU{...}`) |
| `is_enabled` | TINYINT(1) | NOT NULL, DEFAULT 1 | 1 = visible to participants, 0 = hidden |
| `image_path` | VARCHAR(255) | NULL | Relative path to challenge card screenshot |
| `created_at` | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Creation timestamp |
| `updated_at` | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP ON UPDATE | Last modification |

### 3. `challenge_attachments`
Tracks downloadable challenge files stored in protected directory `storage/challenges/`.

| Column | Data Type | Constraints | Description |
|---|---|---|---|
| `id` | INT UNSIGNED | PRIMARY KEY, AUTO_INCREMENT | Attachment ID |
| `challenge_id` | INT UNSIGNED | FOREIGN KEY (challenges.id) ON DELETE CASCADE | Parent challenge |
| `filename` | VARCHAR(255) | NOT NULL | Original filename presented to user |
| `relative_path` | VARCHAR(255) | NOT NULL | Storage path on disk |
| `file_size` | BIGINT UNSIGNED | NOT NULL | File size in bytes |
| `mime_type` | VARCHAR(100) | NOT NULL | MIME content type |
| `created_at` | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Date uploaded |

### 4. `solves`
Tracks solved challenges and awards points. The UNIQUE key `(user_id, challenge_id)` strictly prevents duplicate points.

| Column | Data Type | Constraints | Description |
|---|---|---|---|
| `id` | INT UNSIGNED | PRIMARY KEY, AUTO_INCREMENT | Solve ID |
| `user_id` | INT UNSIGNED | FOREIGN KEY (users.id) ON DELETE CASCADE | Solver user ID |
| `challenge_id` | INT UNSIGNED | FOREIGN KEY (challenges.id) ON DELETE CASCADE | Solved challenge ID |
| `points` | INT UNSIGNED | NOT NULL | Points awarded at solve time |
| `solved_at` | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Solve timestamp |

### 5. `submissions`
Logs every flag submission attempt for scoring and brute-force detection.

| Column | Data Type | Constraints | Description |
|---|---|---|---|
| `id` | BIGINT UNSIGNED | PRIMARY KEY, AUTO_INCREMENT | Submission ID |
| `user_id` | INT UNSIGNED | FOREIGN KEY (users.id) ON DELETE CASCADE | Submitting user ID |
| `challenge_id` | INT UNSIGNED | FOREIGN KEY (challenges.id) ON DELETE CASCADE | Target challenge ID |
| `submitted_flag` | VARCHAR(255) | NOT NULL | Flag string submitted |
| `is_correct` | TINYINT(1) | NOT NULL | 1 = correct, 0 = incorrect |
| `ip_address` | VARCHAR(45) | NOT NULL | Source IP address |
| `user_agent` | VARCHAR(255) | NULL | Browser User-Agent header |
| `points_awarded` | INT UNSIGNED | NOT NULL, DEFAULT 0 | Points given (0 if duplicate/wrong) |
| `submitted_at` | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Submission timestamp |

### 6. `ip_security`
Maintains real-time IP risk status, automated threat levels, and blocking states.

| Column | Data Type | Constraints | Description |
|---|---|---|---|
| `id` | INT UNSIGNED | PRIMARY KEY, AUTO_INCREMENT | Security record ID |
| `ip_address` | VARCHAR(45) | UNIQUE, NOT NULL | Monitored IP address |
| `status` | ENUM | NOT NULL, DEFAULT 'normal' | 'normal', 'suspicious', 'rate_limited', 'blocked', 'whitelisted' |
| `threat_level` | ENUM | NOT NULL, DEFAULT 'Low' | 'Low', 'Medium', 'High', 'Critical' |
| `failed_attempts_count`| INT UNSIGNED | NOT NULL, DEFAULT 0 | Total incorrect attempts recorded |
| `reason` | VARCHAR(255) | NULL | Automated reason for status |
| `is_enforced` | TINYINT(1) | NOT NULL, DEFAULT 1 | 1 = backend blocked, 0 = marked only |
| `first_attempt_at` | DATETIME | NULL | Timestamp of initial attempt |
| `last_attempt_at` | DATETIME | NULL | Timestamp of most recent attempt |
| `blocked_at` | DATETIME | NULL | Timestamp when blocked |

### 7. `ip_actions_log`
Audit log of administrator actions taken against IP addresses.

| Column | Data Type | Constraints | Description |
|---|---|---|---|
| `id` | INT UNSIGNED | PRIMARY KEY, AUTO_INCREMENT | Log ID |
| `ip_address` | VARCHAR(45) | NOT NULL | Target IP |
| `admin_id` | INT UNSIGNED | FOREIGN KEY (users.id) ON DELETE CASCADE | Administrator who performed action |
| `action` | ENUM | NOT NULL | 'block', 'unblock', 'whitelist', 'reset' |
| `notes` | TEXT | NULL | Administrative justification |
| `created_at` | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Action timestamp |

### 8. `security_logs`
Comprehensive SOC activity log for failed/successful flags, brute-force triggers, rate limits, and authentication.

| Column | Data Type | Constraints | Description |
|---|---|---|---|
| `id` | BIGINT UNSIGNED | PRIMARY KEY, AUTO_INCREMENT | Log entry ID |
| `user_id` | INT UNSIGNED | NULL | Submitting user ID |
| `username` | VARCHAR(50) | NULL | Username at event time |
| `ip_address` | VARCHAR(45) | NOT NULL | Source IP address |
| `challenge_id` | INT UNSIGNED | NULL | Targeted challenge |
| `challenge_name` | VARCHAR(255) | NULL | Challenge name for quick lookup |
| `event_type` | ENUM | NOT NULL | Security event classification |
| `result` | ENUM | NOT NULL | CORRECT, INCORRECT, BLOCKED, TRIGGERED, INFO |
| `threat_level` | ENUM | NOT NULL, DEFAULT 'Low' | Low, Medium, High, Critical |
| `detection_reason` | TEXT | NOT NULL | Detailed explanation of threat rule fired |
| `created_at` | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Event timestamp |

### 9. `system_settings`
Configurable detection thresholds and competition settings.

| Column | Data Type | Constraints | Description |
|---|---|---|---|
| `id` | INT UNSIGNED | PRIMARY KEY, AUTO_INCREMENT | Setting ID |
| `setting_key` | VARCHAR(50) | UNIQUE, NOT NULL | Setting identifier |
| `setting_value` | VARCHAR(255) | NOT NULL | Value (e.g. '5', '10', '20') |
| `description` | VARCHAR(255) | NULL | Description of the setting |

### 10. `announcements`
Competition-wide broadcasts displayed on the participant dashboard.

| Column | Data Type | Constraints | Description |
|---|---|---|---|
| `id` | INT UNSIGNED | PRIMARY KEY, AUTO_INCREMENT | Announcement ID |
| `title` | VARCHAR(255) | NOT NULL | Headline |
| `content` | TEXT | NOT NULL | Announcement message body |
| `category` | ENUM | NOT NULL | Competition, Challenge Release, Rules & Reminders, Maintenance, Important Update |
| `author_id` | INT UNSIGNED | FOREIGN KEY (users.id) | Admin creator |
| `is_pinned` | TINYINT(1) | NOT NULL, DEFAULT 0 | 1 = pinned at top |
| `created_at` | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Timestamp |

---

## Instructions for Manually Inserting Accounts

Because there is **no public registration system**, you must insert participant and administrator accounts directly into the database.

### Generating a Secure Password Hash
Use PHP CLI or an online PHP terminal to generate the password hash:

```php
<?php
echo password_hash('YourSecretPasswordHere', PASSWORD_BCRYPT);
?>
```

### SQL Insert Query Example

```sql
-- 1. Insert an Administrator Account
INSERT INTO `users` (`username`, `password_hash`, `role`, `is_active`) 
VALUES (
  'admin_security', 
  '$2y$12$fLdVU3QXfjEM4Ulqwh7QHuF8I7CKy2cTQBe0Csm0PJKjPedUsq7Je', 
  'admin', 
  1
);

-- 2. Insert a Participant Account
INSERT INTO `users` (`username`, `password_hash`, `role`, `is_active`) 
VALUES (
  'team_alpha', 
  '$2y$12$mOHXPmoH49dLFFDFPUUvhe9yykOS9oPZRhYHSa35TNzrAOuBwETFi', 
  'participant', 
  1
);
```

### Pre-Configured Demo Credentials in Seed File
The seed file `database_schema.sql` comes with these accounts ready for testing:
- **Admin**: `admin` / Password: `Admin@HNU2026!`
- **Participant**: `cyberspartan` / Password: `Participant123!`
- **Participant**: `bytehunter` / Password: `Participant123!`
- **Participant**: `netrunner` / Password: `Participant123!`

