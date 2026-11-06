# HNU CTF – Installation & Deployment Guide

This guide walks you through setting up and running the **HNU CTF** platform on **XAMPP (Apache, MySQL, PHP)** on Windows.

---

## Prerequisites

1. **XAMPP** (with PHP 8.x and MySQL / MariaDB).
2. **Node.js** (v18 or higher with npm) for building the React frontend.
3. Web browser (Chrome, Firefox, Edge, Brave).

---

## Step 1: Database Setup (Manual)

> **Important**: Antigravity does **not** create or modify your MySQL database. You must create it manually.

1. Open the **XAMPP Control Panel** and start **Apache** and **MySQL**.
2. Open your browser and navigate to **phpMyAdmin**:
   ```
   http://localhost/phpmyadmin
   ```
3. Click **New** in the left sidebar and create a database named:
   ```
   hnu_ctf
   ```
   (Collation: `utf8mb4_unicode_ci`)
4. Select the newly created `hnu_ctf` database, click on the **Import** tab at the top.
5. Click **Choose File**, select:
   ```
   c:\Users\Sam Nahutdo\Documents\HACKSAHNU\documentation\database_schema.sql
   ```
6. Click **Import** (or **Go**).
   - This creates all 10 required tables.
   - Pre-seeds all 22 authentic challenges.
   - Creates the default administrator and participant accounts.

---

## Step 2: Configure PHP Database Connection

Open `backend/config/database.php` in a text editor:

```php
<?php
// backend/config/database.php

define('DB_HOST', 'localhost');
define('DB_PORT', '3306');
define('DB_NAME', 'hnu_ctf');        // Your database name
define('DB_USER', 'root');           // Your MySQL username (default: root)
define('DB_PASS', '');               // Your MySQL password (default empty in XAMPP)
define('DB_CHARSET', 'utf8mb4');
```

Save the file.

---

## Step 3: Deploy to Apache (XAMPP `htdocs`)

You can either:

### Option A: Create an Apache VirtualHost or Alias (Recommended)
Add an alias to `C:\xampp\apache\conf\extra\httpd-vhosts.conf`:

```apache
Alias /hnu-ctf "C:/Users/Sam Nahutdo/Documents/HACKSAHNU"
<Directory "C:/Users/Sam Nahutdo/Documents/HACKSAHNU">
    Options Indexes FollowSymLinks
    AllowOverride All
    Require all granted
</Directory>
```

### Option B: Copy or Link the Project to `htdocs`
Copy or link the project folder into:
```
C:\xampp\htdocs\hnu-ctf
```

---

## Step 4: Build or Run the Frontend

1. Open PowerShell / Command Prompt in `frontend/`:
   ```bash
   cd frontend
   npm install
   npm run build
   ```
2. The built assets are placed into `frontend/dist/`.
3. To test immediately during local development:
   ```bash
   npm run dev
   ```
   This runs Vite at `http://localhost:5173`. Vite is configured with a proxy forwarding `/backend` and `/api` requests to `http://localhost/hnu-ctf/backend`.

---

## Step 5: Test the Application

### Participant Login
- URL: `http://localhost/hnu-ctf/frontend/dist/` (or `http://localhost:5173`)
- Username: `cyberspartan`
- Password: `Participant123!`

### Administrator SOC Login
- Username: `admin`
- Password: `Admin@HNU2026!`
- Access the SOC attack monitoring console, configure flags, view brute-force metrics, and manage IP addresses.

---

## Default Accounts Reference

| Username | Password | Role | Permissions |
|---|---|---|---|
| `admin` | `Admin@HNU2026!` | Administrator | Full SOC Dashboard, Attack Monitor, Challenge Management, Flag Setting, IP Management |
| `cyberspartan` | `Participant123!` | Participant | Participant Dashboard, Challenge Solving, Flag Submissions, Leaderboard |
| `bytehunter` | `Participant123!` | Participant | Participant Dashboard, Challenge Solving, Flag Submissions, Leaderboard |
| `netrunner` | `Participant123!` | Participant | Participant Dashboard, Challenge Solving, Flag Submissions, Leaderboard |

