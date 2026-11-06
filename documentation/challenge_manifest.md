# HNU CTF – Hack4Gov 2026 Region 7 Challenge Manifest

This manifest documents all 22 authentic challenges imported from the **Hack4Gov 2026 Region 7** package, organized strictly according to official categories, point values, difficulty levels, descriptions transcribed from the original challenge cards, and preserved downloadable artifacts.

---

## Challenge Summary

| # | Challenge Name | Category | Difficulty | Points | Downloadable Attachments | Service Target / Link | Original Screenshot |
|---|----------------|----------|------------|--------|--------------------------|------------------------|---------------------|
| 1 | DICT Chatbot | Web | Hard | 100 | None | `172.16.105.9:3000` | `DICTChatbotChallenge.png` |
| 2 | Bypass the Firewall | Web | Hard | 100 | None | `172.16.105.9:5000` | `BypasstheFirewallChallenge.png` |
| 3 | Gacha Pulling 4 the KING OF JOBBERS | Web | Hard | 100 | None | `172.16.105.9:3067` | `GachaPulling4theKINGOFJOBBERSChallenge.png` |
| 4 | Race Royale | Web | Hard | 100 | None | `172.16.105.9:5151` | `RaceRoyaleChallenge.png` |
| 5 | Who Owns This Neighborhood | OSINT | Easy | 30 | None | Target: `124.6.144.115` | `WhoOwnsThisNeighborhoodChallenge.png` |
| 6 | A Block for Defense | OSINT | Easy | 30 | None | DND Registration Search | `ABlockforDefenseChallenge.png` |
| 7 | Where Did GoTyme Go | OSINT | Easy | 40 | None | Domain: `gotyme.com.ph` | `WhereDidGoTymeGoChallenge.png` |
| 8 | Time Will Tell | OSINT | Medium | 60 | None | SIIX Logistics FortiGate | `TimeWillTellChallenge.png` |
| 9 | NAS-ter of Discovery | OSINT | Medium | 70 | None | PH QNAP NAS v4.4.3 | `NAS-terofDiscoveryChallenge.png` |
| 10 | The Counterfeit | OSINT | Hard | 100 | `The_Counterfeit.txt` (10.8 KB) | Analysis file | `TheCounterfeitChallenge.png` |
| 11 | The Clean Slate | OSINT | Hard | 100 | `The_Clean_Slate.txt` (11.3 KB) | Analysis file | `TheCleanSlateChallenge.png` |
| 12 | Domeng's Logic | Network | Hard | 100 | `Domengs.pcap` (361.6 KB) | Packet Capture | `Domeng_sLogicChallenge.png` |
| 13 | The Silent Traffic | Network | Easy | 30 | `malicious_traffic.pcapng` (5.8 KB) | Wireshark Capture | `TheSilentTrafficChallenge.png` |
| 14 | SweeperSwipper | Network | Medium | 50 | `17a11a51b899c8ca13717b13adcbccd653697869` (2.2 MB) | Raw PCAP Capture | `SweeperSwipperChallenge.png` |
| 15 | Filing a Leave | Forensics | Easy | 20 | `network_capture.pcap` (7.7 KB) | Packet Capture | `FilingALeaveChallenge.png` |
| 16 | The Long Way Home | Steganography | Medium | 50 | `happydog.jpeg` (8.0 KB) | Stego JPEG | `TheLongWayHomeChallenge.png` |
| 17 | Where the Sun Hides | Steganography | Medium | 70 | `Final.zip` (494.1 KB), `Sunset.png` (492.5 KB) | Stego Archive & Image | `WheretheSunHidesChallenge.png` |
| 18 | M3-y4W | Steganography | Hard | 100 | `cat_tails.png` (112.2 KB), `blue_lsb.png` (466 B) | Stego PNGs | `M3-y4WChallenge.png` |
| 19 | Credential Vault | Miscellaneous | Easy | 30 | `Credential_Vault.py` (1.6 KB) | Python Reverse Script | `CredentialVaultChallenge.png` |
| 20 | My Melody's Matcha Latte | Miscellaneous | Hard | 100 | `my_golisden_matischa_laistte_raistio.jpg` (202.3 KB) | Image Investigation | `MyMelody_sMatchaLatteChallenge.png` |
| 21 | IS there really a password? | Miscellaneous | Medium | 50 | `secret_docs.zip` (549 B) | Corrupted/Fake Zip | `IsThereReallyAPassword.png` |
| 22 | Quantum Echoes | Miscellaneous | Hard | 100 | None | `https://cert1234.github.io/Quantum-Echoes/` | `Quantum_Echoes.png` |

---

## Detailed Category Breakdown

### 1. WEB CATEGORY

#### 1.1 DICT Chatbot
- **Slug**: `dict-chatbot`
- **Points**: 100
- **Difficulty**: Hard
- **Transcribed Prompt**:
  > "The DICT ChatBot is malfunctioning. Get the restart \$(code), and restart it to recover it from the corrupted state.  
  > `172.16.105.9:3000`  
  > Flag format: `HNU{flag}`"
- **Investigation Artifacts**: Interactive web interface.

#### 1.2 Bypass the Firewall
- **Slug**: `bypass-the-firewall`
- **Points**: 100
- **Difficulty**: Hard
- **Transcribed Prompt**:
  > "You're trying to upload a .php file into a Web Application, however there seems to be a firewall. Find a way to bypass it, make sure they don't see it.  
  > `172.16.105.9:5000`  
  > Flag format: `HNU{flag}`"
- **Investigation Artifacts**: Web upload endpoint with WAF filtering.

#### 1.3 Gacha Pulling 4 the KING OF JOBBERS
- **Slug**: `gacha-pulling-4-the-king-of-jobbers`
- **Points**: 100
- **Difficulty**: Hard
- **Transcribed Prompt**:
  > "The King of Jobbers, Gilgamesh. Needs you to pull for him! Because of his ego he doesn't want anyone else in the banner but him. Find a way to satisfy his pride by getting him 10 times in 1 pull.  
  > `172.16.105.9:3067`  
  > Flag format: `HNU{flag}`"
- **Investigation Artifacts**: Web application simulating gacha mechanics.

#### 1.4 Race Royale
- **Slug**: `race-royale`
- **Points**: 100
- **Difficulty**: Hard
- **Transcribed Prompt**:
  > "Welcome to Race Royale, where being first isn't just bragging rights, it might be the only way in. The application looks polished, the doors look locked, and the admin panel definitely wasn't made for you. Somewhere beneath the surface, though, the system has a slight problem keeping up when things get hectic. Your mission is simple: find the crack, outpace the application, and claim what's waiting behind /admin. Ready, set... exploit.  
  > `172.16.105.9:5151`  
  > Flag format: `HNU{flag}`"
- **Investigation Artifacts**: Web application with race condition vulnerability.

---

### 2. OSINT CATEGORY

#### 2.1 Who Owns This Neighborhood
- **Slug**: `who-owns-this-neighborhood`
- **Points**: 30
- **Difficulty**: Easy
- **Transcribed Prompt**:
  > "An IP address rarely stands alone. You have been given:  
  > `124.6.144.115`  
  > Public registration information suggests that this address belongs to a network associated with the Philippine Bureau of Immigration. Your task is to determine the CIDR notation of the netblock containing this IP address. Don't submit the individual IP. We want the entire neighborhood.  
  > Flag Format: `HNU{cidr}`"

#### 2.2 A Block for Defense
- **Slug**: `a-block-for-defense`
- **Points**: 30
- **Difficulty**: Easy
- **Transcribed Prompt**:
  > "Government organizations have websites. But websites aren't the only thing they own.  
  > Your mission is to investigate publicly available IP registration information and identify one IP address range associated with our National Defense.  
  > We aren't looking for an individual IP. We want a block of it. Identify one valid eight-host network associated with the DND.  
  > Flag Format: `HNU{cidr}`"

#### 2.3 Where Did GoTyme Go
- **Slug**: `where-did-gotyme-go`
- **Points**: 40
- **Difficulty**: Easy
- **Transcribed Prompt**:
  > "GoTyme seems to have gone somewhere... Your task is to follow the trail left behind by:  
  > `gotyme.com.ph`  
  > Using publicly available domain intelligence tools, trace the trail and identify one domain that leads back to the source.  
  > Flag Format: `HNU{domain}`"

#### 2.4 Time Will Tell
- **Slug**: `time-will-tell`
- **Points**: 60
- **Difficulty**: Medium
- **Transcribed Prompt**:
  > "A FortiGate device belonging to a certain SIIX Logistics Philippines Incorporated has left some information exposed to the public internet. Fortunately, you're not being asked to break into it. Everything you need has already been indexed.  
  > Determine the firmware release date displayed in the device information. The date and time must be synchronized with our local time.  
  > Flag Format: `HNU{DayOfTheWeek, Month DD, YYYY at hh:mm:ss AM/PM}`"

#### 2.5 NAS-ter of Discovery
- **Slug**: `nas-ter-of-discovery`
- **Points**: 70
- **Difficulty**: Medium
- **Transcribed Prompt**:
  > "Some devices prefer to stay at home. This one apparently didn't. Somewhere in the Philippines, a QNAP NAS running version 4.4.3 has been publicly exposed.  
  > Your mission is simple: Find the IP address.  
  > Flag Format: `HNU{IPaddress}`"

#### 2.6 The Counterfeit
- **Slug**: `the-counterfeit`
- **Points**: 100
- **Difficulty**: Hard
- **Transcribed Prompt**:
  > "I drop no payloads and I break no walls, I simply build a mirror where the victim falls. Wearing a trusted face to quietly take your keys, Find the clever counterfeit built to deceive.  
  > Flag Format: `HNU{Domain}`"
- **Downloadable File**: `The_Counterfeit.txt`

#### 2.7 The Clean Slate
- **Slug**: `the-clean-slate`
- **Points**: 100
- **Difficulty**: Hard
- **Transcribed Prompt**:
  > "Amongst the wicked shadows, I alone am bright, Zero stains on my name, I walk in the light. No scanner can curse me, no list marks my name, Find the one pure path in this dark, dirty game.  
  > Flag Format: `HNU{domain}`"
- **Downloadable File**: `The_Clean_Slate.txt`

---

### 3. NETWORK CATEGORY

#### 3.1 Domeng's Logic
- **Slug**: `domengs-logic`
- **Points**: 100
- **Difficulty**: Hard
- **Transcribed Prompt**:
  > "Patterns pretend to be random, but every choice leaves a trace.  
  > Format Flag: `HNU{IPAddress}`"
- **Downloadable File**: `Domengs.pcap`

#### 3.2 The Silent Traffic
- **Slug**: `the-silent-traffic`
- **Points**: 30
- **Difficulty**: Easy
- **Transcribed Prompt**:
  > "A suspicious PCAP was captured from a compromised workstation. Most of the traffic appears normal, but investigators believe a hidden message was transmitted during the session.  
  > Flag format: `HNU{flag}`"
- **Downloadable File**: `malicious_traffic.pcapng`

#### 3.3 SweeperSwipper
- **Slug**: `sweeperswipper`
- **Points**: 50
- **Difficulty**: Medium
- **Transcribed Prompt**:
  > "The network's been rough lately. Something feels off. I bet someone's stirring up trouble again.  
  > Flag Format: `HNU{TechniqueIdentifierAccessiblePortsSeparatedBy,}`"
- **Downloadable File**: `17a11a51b899c8ca13717b13adcbccd653697869` (Libpcap capture)

---

### 4. FORENSICS CATEGORY

#### 4.1 Filing a Leave
- **Slug**: `filing-a-leave`
- **Points**: 20
- **Difficulty**: Easy
- **Transcribed Prompt**:
  > "Meridian Fiduciary Group's night-shift network tap caught a file leaving the finance server at 02:02. By breakfast, the CFO's workstation had been \"cleaned up\". The Audit Committee has handed you what survived.  
  > Flag Format: `HNU{flag}`"
- **Downloadable File**: `network_capture.pcap`

---

### 5. STEGANOGRAPHY CATEGORY

#### 5.1 The Long Way Home
- **Slug**: `the-long-way-home`
- **Points**: 50
- **Difficulty**: Medium
- **Transcribed Prompt**:
  > "For 58 lonely nights, this pup wandered the city streets wearing a collar inscribed with 6s8UurfK81L3da. A kind stranger eventually took him in, and it's been 45 days since his rescue. He's safe and happy now, but he carries a hidden message inside.  
  > Flag Format: `HNU{flag}`"
- **Downloadable File**: `happydog.jpeg`

#### 5.2 Where the Sun Hides
- **Slug**: `where-the-sun-hides`
- **Points**: 70
- **Difficulty**: Medium
- **Transcribed Prompt**:
  > "The photo appears ordinary, but the photographer may have left additional information within the files. Your task is to examine what was left behind and uncover the hidden answer.  
  > Flag Format: `HNU{flag}`"
- **Downloadable Files**: `Final.zip`, `Sunset.png`

#### 5.3 M3-y4W
- **Slug**: `m3-y4w`
- **Points**: 100
- **Difficulty**: Hard
- **Transcribed Prompt**:
  > "We have a note saying, “cats' tails tell a lot.” Can you reveal the mystery and find the flag?  
  > Flag Format: `HNU{flag}`"
- **Downloadable Files**: `cat_tails.png`, `blue_lsb.png`

---

### 6. MISCELLANEOUS CATEGORY

#### 6.1 Credential Vault
- **Slug**: `credential-vault`
- **Points**: 30
- **Difficulty**: Easy
- **Transcribed Prompt**:
  > "A Python-based credential vault was recovered from a compromised workstation. Although the application appears simple, the stored vault contents are not directly readable. Reverse the program's logic, determine how the protected data is transformed, recover the original credentials, and submit the correct flag.  
  > Flag Format: `HNU{username:password}`"
- **Downloadable File**: `Credential_Vault.py`

#### 6.2 My Melody's Matcha Latte
- **Slug**: `my-melodys-matcha-latte`
- **Points**: 100
- **Difficulty**: Hard
- **Transcribed Prompt**:
  > "Something's off about My Melody's too-perfect matcha latte, Kuromi thinks, snooping around her computer. That's when she spots it: a suspicious matcha latte photo, saved with a strange filename. Her ears perk up, and her tail flicks with excitement, there's got to be something hidden in it. But Kuromi can't crack this one alone. Can you help her dig through the photo and uncover the secret hidden inside? Time to crack the case, and maybe steal a snack while she's at it.  
  > Flag Format: `HNU{flag}`"
- **Downloadable File**: `my_golisden_matischa_laistte_raistio.jpg`

#### 6.3 IS there really a password?
- **Slug**: `is-there-really-a-password`
- **Points**: 50
- **Difficulty**: Medium
- **Transcribed Prompt**:
  > "We recovered an archive from a decommissioned workstation. It holds two files. One of them opens just fine read it. The other one makes every tool we own demand a password, and the admin swears no password was ever set on these exports.  
  > Maybe that file is only pretending to be locked.  
  > Flag format: `HNU{flag}`"
- **Downloadable File**: `secret_docs.zip`

#### 6.4 Quantum Echoes
- **Slug**: `quantum-echoes`
- **Points**: 100
- **Difficulty**: Hard
- **Transcribed Prompt**:
  > "Your task is to follow the traces, uncover what was concealed, and recover the flag before the fragment disappears.  
  > `https://cert1234.github.io/Quantum-Echoes/`  
  > Flag Format: `HNU{flag}`"
- **Investigation Target**: GitHub Pages deployment.

---

## File Preservation Guarantee

All original files have been strictly preserved with:
- Exact original filenames and extensions (`.pcap`, `.pcapng`, `.zip`, `.png`, `.jpeg`, `.jpg`, `.txt`, `.py`, hash identifier).
- Original bit-level checksums and file sizes.
- Server-side access control in `storage/challenges/<slug>/` governed by PHP backend authentication and Apache `.htaccess` deny rules.

