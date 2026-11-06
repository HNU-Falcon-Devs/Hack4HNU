<p align="center">
  <img src="hnu-logo.png" width="130" alt="Holy Name University Logo" />
</p>

# 🛡️ HNU CTF – Cybersecurity Challenge & SOC Monitoring Platform

> **Localhost Event Edition**  
> A complete, self-hosted Capture The Flag (CTF) and Security Operations Center (SOC) attack monitoring platform inspired by **PicoCTF** and **CTFd**. Built specifically for offline, local area network (LAN), and localhost cybersecurity competitions.

---

## 📋 Table of Contents
1. [Platform Overview](#-platform-overview)
2. [Technology Stack](#-technology-stack)
3. [Quick Start: Running on Localhost](#-quick-start-running-on-localhost)
4. [Localhost Event: Sharing Across LAN / Local Wi-Fi](#-localhost-event-sharing-across-lan--local-wi-fi)
5. [Database Setup (Manual Import)](#-database-setup-manual-import)
6. [User Accounts & Strict No-Registration Policy](#-user-accounts--strict-no-registration-policy)
7. [How to Use the System](#-how-to-use-the-system)
   - [Participant Guide](#participant-guide)
   - [Administrator SOC Guide](#administrator-soc-guide)
8. [Authentic Challenge Manifest](#-authentic-challenge-manifest)
9. [Stopping the Server](#-stopping-the-server)
10. [Localhost Troubleshooting](#-localhost-troubleshooting)

---

## 🎯 Platform Overview

The **HNU CTF** platform allows organizers to host an on-premise, zero-cloud-dependency cybersecurity challenge competition.

### Core Highlights:
- **Zero Cloud Reliance**: Operates 100% offline on `localhost` or an isolated competition switch/LAN.
- **PicoCTF-Inspired Participant Experience**: Interactive challenge explorer with category tabs, difficulty badges, search, and dynamic solving modal.
- **Authentic Challenge Materials**: Preserves all 22 authentic challenges, PCAP files, ZIP archives, forensic artifacts, and Python scripts.
- **Real-Time SOC Telemetry**: Live attack monitoring dashboard displaying brute-force flag submission detection, suspicious source IPs, and visual analytics via Recharts.
- **Strict Role-Based Access Control**: Participants and administrators only. Public self-registration is strictly blocked—all accounts must be provisioned in MySQL by the organizer.
- **Protected File Delivery**: Challenge attachments are isolated behind an `.htaccess` firewall and served only via session-authenticated PHP streaming.

---

## 💻 Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Tailwind CSS, Lucide React, Recharts, Vite (Pre-compiled in `frontend/dist`) |
| **Backend API** | Native PHP 8.x REST API, PDO Database Layer, Secure PHP Sessions |
| **Database** | MySQL 5.7+ / MariaDB 10.4+ |
| **Local Environment** | XAMPP (Apache / MySQL) or PHP Built-in Server + Standalone MySQL |

---

## 🚀 Quick Start: Running on Localhost

The platform includes a pre-compiled frontend production build inside `frontend/dist/` and a unified PHP router (`router.php`). You do **not** need to install Node.js or run `npm run dev` during the event.

### Option 1: 1-Click Launch with Visible Console (Recommended for Testing)
1. Double-click **[`start_server.bat`](file:///c:/Users/Sam%20Nahutdo/Documents/HACKSAHNU/start_server.bat)** in the root folder.
2. A command window will open showing:
   ```text
   Starting HNU CTF PHP Backend Server on port 8000...
   URL: http://127.0.0.1:8000
   ```
3. Open your browser and navigate to:
   👉 **[http://localhost:8000](http://localhost:8000)** or **[http://127.0.0.1:8000](http://127.0.0.1:8000)**

---

### Option 2: Silent Background Launch (Runs Without Keeping Windows Open)
If you do not want a command prompt window cluttering your desktop during the competition:

1. Double-click **[`start_background.vbs`](file:///c:/Users/Sam%20Nahutdo/Documents/HACKSAHNU/start_background.vbs)**.
2. The server will silently start on `http://127.0.0.1:8000` in the background with zero visible windows.
3. To stop it at any time, simply double-click **[`stop_server.bat`](file:///c:/Users/Sam%20Nahutdo/Documents/HACKSAHNU/stop_server.bat)**.

---

### Option 3: Running via XAMPP Apache
If you prefer serving through XAMPP's Apache web server:
1. Copy or move this entire project folder into your XAMPP `htdocs` directory:
   `C:\xampp\htdocs\HACKSAHNU`
2. Start **Apache** and **MySQL** in the XAMPP Control Panel.
3. Open your browser to:
   👉 **`http://localhost/HACKSAHNU`** (or `http://localhost/HACKSAHNU/frontend/dist/`)

---

## 🌐 Localhost Event: Sharing Across LAN / Local Wi-Fi

Because this event is for a local environment, participants in the same computer lab, room, or Wi-Fi network can connect directly to your host machine without any internet connection.

### How to Allow Other Computers to Connect:

1. **Find your Host Machine's Local IP Address**:
   - Open Command Prompt and run `ipconfig`.
   - Note your **IPv4 Address** (e.g., `192.168.1.50` or `10.0.0.15`).

2. **Allow Port 8000 Through Windows Firewall** (Host Machine Only):
   - Open Command Prompt as Administrator and run:
     ```cmd
     netsh advfirewall firewall add rule name="HNU CTF Localhost Event" dir=in action=allow protocol=TCP localport=8000
     ```

3. **Start the Server Bound to All Network Interfaces**:
   - Open Command Prompt in the project folder and run:
     ```cmd
     php -S 0.0.0.0:8000 router.php
     ```

4. **Participant Access**:
   - Participants open their browser on their own laptops and type:
     👉 **`http://192.168.1.50:8000`** *(replace with your host's actual IP)*.

---

## 🗄️ Database Setup (Manual Import)

> **Important**: In strict compliance with competition rules, the database is **not** automatically modified or created. You manually create and import it once before the event.

### Step-by-Step Database Setup:

1. **Ensure MySQL is running**:
   - In XAMPP, click **Start** next to MySQL (or run `net start mysql`).
2. **Open phpMyAdmin or MySQL CLI**:
   - Navigate to [http://localhost/phpmyadmin](http://localhost/phpmyadmin) in your browser.
3. **Create the database**:
   - Click **New** (left sidebar), enter database name: `hnu_ctf`.
   - Set collation to: `utf8mb4_unicode_ci`.
   - Click **Create**.
4. **Import the SQL schema and challenge seed data**:
   - Click the newly created `hnu_ctf` database in phpMyAdmin.
   - Click the **Import** tab at the top.
   - Click **Choose File** and select:
     [`documentation/database_schema.sql`](file:///c:/Users/Sam%20Nahutdo/Documents/HACKSAHNU/documentation/database_schema.sql)
   - Click **Import** (or **Go**) at the bottom.
5. **Verify Database Configuration**:
   - Open [`backend/config/database.php`](file:///c:/Users/Sam%20Nahutdo/Documents/HACKSAHNU/backend/config/database.php).
   - Check the connection credentials (defaults match standard XAMPP):
     ```php
     define('DB_HOST', 'localhost');
     define('DB_NAME', 'hnu_ctf');
     define('DB_USER', 'root');
     define('DB_PASS', ''); // Leave empty for default XAMPP
     ```

> 💡 **Graceful Offline Fallback**: If MySQL is not imported or becomes temporarily unreachable, the platform automatically detects it and displays a warning banner while serving the pre-packaged challenge catalog. Once MySQL is reachable, full live persistence is automatically activated.

---

## 👥 User Accounts & Strict No-Registration Policy

Per competition security requirements, **there is NO public registration or sign-up page**. Participants cannot create their own accounts. Only administrators can issue accounts.

### Default Pre-Configured Accounts (Included in SQL Schema):

| Role | Username | Password | Purpose |
| :--- | :--- | :--- | :--- |
| **Administrator (SOC)** | `admin` | `Admin@HNU2026!` | Access to SOC Monitoring, Attack Analytics, IP Blocking, Challenge Management |
| **Participant** | `cyber_warrior` | `P@ssword123!` | Solves challenges, submits flags, views scoreboard |
| **Participant (Team 2)** | `team_alpha` | `Alpha@Pass2026` | Additional pre-seeded participant team |
| **Participant (Team 3)** | `team_bravo` | `Bravo@Pass2026` | Additional pre-seeded participant team |

### How to Manually Add New Participant Teams:

To add teams for the event, execute this SQL query in phpMyAdmin or MySQL CLI. (Passwords are hashed with standard PHP `PASSWORD_BCRYPT`):

```sql
-- Example: Adding Team Charlie (Password: Charlie#2026)
-- Hash generated via password_hash('Charlie#2026', PASSWORD_BCRYPT)
INSERT INTO `users` (`username`, `password_hash`, `email`, `role`, `points`, `is_active`, `created_at`)
VALUES (
    'team_charlie',
    '$2y$10$wT8KzQx5Z8U1jF4mO2nL4e5f7g8h9i0j1k2l3m4n5o6p7q8r9s0t.',
    'team_charlie@hnu.local',
    'participant',
    0,
    1,
    NOW()
);
```

You can also generate your own custom bcrypt hash in PHP using:
```php
echo password_hash('YourSecretPassword', PASSWORD_BCRYPT);
```

---

## 🕹️ How to Use the System

### Participant Guide

1. **Login**:
   - Access the platform and log in using the assigned participant credentials.
2. **Participant Dashboard**:
   - View your current points, global rank, solve ratio, and organizer announcements.
3. **Challenge Explorer**:
   - Navigate to the **Challenges** tab.
   - Filter by category (**Web**, **OSINT**, **Network**, **Forensics**, **Steganography**, **Miscellaneous**) or difficulty (**Easy**, **Medium**, **Hard**).
   - Use the real-time search box to find challenges by keyword or topic.
4. **Investigating & Solving Challenges**:
   - Click any challenge card to open the **Challenge Modal**.
   - Read the original challenge narrative, instructions, and target hints.
   - Download the authentic attachments (.pcap, .zip, .png, etc.) by clicking the download button. Analyze them locally using tools such as **Wireshark**, **CyberChef**, **strings**, **binwalk**, or **Python**.
5. **Flag Submission**:
   - Enter the discovered flag in the submission box.
   - Flag format: `HNU{flag_text_here}`.
   - Click **Submit Flag**. Points are instantly credited upon correct match, and the challenge is marked as solved. Duplicate submissions are automatically prevented.
6. **Leaderboard**:
   - Check the **Leaderboard** tab to view live team rankings, points earned, challenges solved, and timestamps of recent solves.

---

### Administrator SOC Guide

Log in using the `admin` account to access the protected Security Operations Center.

1. **SOC Dashboard (`/soc`)**:
   - **Live Metric Cards**: Total participants, active participants, total submissions, failed submissions, detected brute-force attacks, and active suspicious IPs.
   - **Interactive Charts (Recharts)**:
     - *Submissions Over Time* (Hourly trend).
     - *Submission Outcome Distribution* (Correct vs. Incorrect pie chart).
     - *Top Suspicious IPs* (Bar chart of failed attempts per IP).
     - *Most Targeted Challenges* (Challenges receiving the most incorrect attempts).
     - *Failed Submissions by Hour* (Attack volume heat histogram).
2. **Live Attack Monitoring (`/soc/attacks`)**:
   - Displays real-time flag submission anomaly telemetry.
   - Highlights repeated failed attempts, rapid fire submissions, and multi-account targeting from single IP addresses.
   - **Dynamic Threshold Controls**:
     - Adjust suspicious, high-risk, and critical trigger levels directly from the dashboard:
       - *Suspicious*: Default 5 failed attempts within 1 minute.
       - *High Risk*: Default 10 failed attempts within 5 minutes.
       - *Critical*: Default 20 failed attempts within 10 minutes.
3. **IP Security Management (`/soc/ips`)**:
   - View all flagged client IP addresses.
   - One-click actions: **Investigate**, **Block IP**, or **Whitelist IP**.
   - Blocked IPs are immediately denied access to all API endpoints and downloads.
4. **Challenge Management (`/soc/challenges`)**:
   - View all 22 imported challenges.
   - Edit correct flags, update point values, modify descriptions, and toggle visibility.
5. **Security Audit Logs (`/soc/logs`)**:
   - View the immutable audit log of administrative actions (IP blocks, configuration updates, threshold changes).

---

## 🗃️ Authentic Challenge Manifest

All 22 authentic challenges are imported and stored in [`storage/challenges/`](file:///c:/Users/Sam%20Nahutdo/Documents/HACKSAHNU/storage/challenges/):

| Category | Challenge Name | Points | Original Attachments / Artifacts |
| :--- | :--- | :---: | :--- |
| **Web** | DICT Chatbot | 100 | Target IP: `172.16.1.13:3000` |
| **Web** | Bypass the Firewall | 100 | Target IP: `172.16.1.13:3001` |
| **Web** | Gacha Pulling 4 the KING OF JOBBERS | 100 | Target IP: `172.16.1.13:3002` |
| **Web** | Race Royale | 100 | Target IP: `172.16.1.13:3003` |
| **OSINT** | Who Owns This Neighborhood | 100 | Target IP: `172.16.1.13:80` |
| **OSINT** | A Block for Defense | 100 | Investigation prompt |
| **OSINT** | Where Did GoTyme Go | 100 | Investigation prompt |
| **OSINT** | Time Will Tell | 100 | Investigation prompt |
| **OSINT** | NAS-ter of Discovery | 100 | Investigation prompt |
| **OSINT** | The Counterfeit | 100 | Investigation prompt |
| **OSINT** | The Clean Slate | 100 | Investigation prompt |
| **Network** | Domeng's Logic | 100 | `domeng_traffic.pcapng` |
| **Network** | The Silent Traffic | 100 | `silent_traffic.pcap` |
| **Network** | SweeperSwipper | 100 | `17a11a51b899c8ca13717b13adcbccd653697869` (Libpcap capture) |
| **Forensics** | Filing a Leave | 100 | `filing_a_leave.zip` |
| **Steganography** | M3-y4W | 100 | `cat.png` |
| **Steganography** | The Long Way Home | 100 | `the_long_way_home.png` |
| **Steganography** | Where the Sun Hides | 100 | `sunset.jpeg` |
| **Miscellaneous**| Credential Vault | 100 | `credentials.txt` |
| **Miscellaneous**| My Melody's Matcha Latte | 100 | `melody_matcha.png` |
| **Miscellaneous**| IS there really a password? | 100 | `protected.zip` |
| **Miscellaneous**| Quantum Echoes | 100 | `quantum_echoes.py` |

---

## 🛑 Stopping the Server

When the competition event concludes:

- **If you launched via `start_server.bat`**:  
  Simply close the command prompt window or press <kbd>Ctrl</kbd> + <kbd>C</kbd>.
- **If you launched via `start_background.vbs`**:  
  Double-click **[`stop_server.bat`](file:///c:/Users/Sam%20Nahutdo/Documents/HACKSAHNU/stop_server.bat)** to cleanly terminate all background server processes on port 8000.

---

## 🔧 Localhost Troubleshooting

### 1. `Port 8000 is already in use`
- Double-click [`stop_server.bat`](file:///c:/Users/Sam%20Nahutdo/Documents/HACKSAHNU/stop_server.bat) to terminate any lingering processes.
- Alternatively, launch on another port:
  ```cmd
  php -S 127.0.0.1:8080 router.php
  ```

### 2. `Database connection refused (SQLSTATE[HY000] [2002])`
- Ensure MySQL is running in XAMPP or via Windows Services (`net start mysql`).
- Verify database settings in [`backend/config/database.php`](file:///c:/Users/Sam%20Nahutdo/Documents/HACKSAHNU/backend/config/database.php).
- Check that the database name matches: `hnu_ctf`.

### 3. Participants cannot connect over the local network / Wi-Fi
- Verify you launched with `php -S 0.0.0.0:8000 router.php` (not `127.0.0.1`).
- Check that Windows Firewall allows incoming connections on port 8000.
- Ensure all participant devices are on the exact same Wi-Fi SSID or subnet.

### 4. Challenge attachments give `403 Forbidden`
- This is intentional security design! Attachments are protected in `storage/` and cannot be downloaded directly via URL.
- Always download attachments by clicking the **Download Attachment** button inside the challenge popup modal in the UI.

---

*HNU CTF Platform – Engineered for Holy Name University & Regional Cybersecurity Competitions.*

