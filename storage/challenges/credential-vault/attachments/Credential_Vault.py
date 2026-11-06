#!/usr/bin/env python3

# ==========================================================
# Hack4Gov 2026
# Category  : Cryptography
# Difficulty: Medium
# ==========================================================

PARTS = [
    "KSw5",
    "BTg7",
    "OTEv",
    "KmAJ",
    "aTkv",
    "KGkR",
    "aSMF",
    "aGpo",
    "bHs="
]

KEYS = [
    0x20,
    0x10,
    0x15,
    0x15
]

BANNER = r"""
=======================================================
            Hack4Gov 2026 - Credential Vault
=======================================================
"""

HINTS = [
    "The data has undergone more than one transformation.",
    "The encryption uses a single-byte key.",
    "Everything you need to solve this challenge is already there.",
]

def banner():
    print(BANNER)

def show_blob():
    print("\nEncrypted Blob\n")
    print("".join(PARTS))

def show_hints():
    print("\nHints")
    print("-" * 55)

    for i, hint in enumerate(HINTS, 1):
        print(f"[{i}] {hint}")

def show_flag():
    print("\nFlag Format")
    print("H4G{USERNAME:PASSWORD}")

def menu():
    print("\nMenu")
    print("1. View Credential Vault")
    print("2. View Hints")
    print("3. View Flag Format")
    print("4. Exit")

def main():
    banner()

    while True:
        menu()

        choice = input("\n> ").strip()

        if choice == "1":
            show_blob()

        elif choice == "2":
            show_hints()

        elif choice == "3":
            show_flag()

        elif choice == "4":
            print("\nGood luck!\n")
            break

        else:
            print("\nInvalid option.")

if __name__ == "__main__":
    main()