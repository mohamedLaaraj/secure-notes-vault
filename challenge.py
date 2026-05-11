import socketserver
import time
import sys
import os

# ================================================================
# CIPHERSTRIKE CTF — Forensics Challenge
# "The Digital Trail" — Wordle-style access gate
# Run: python challenge.py
# Connect: nc viaduct.proxy.rlwy.net 27201
# ================================================================

SECRET = "nymph"

TRANSMISSION = """
...Transmission intercepted at 03:47 UTC...
...Source: UNKNOWN | Destination: UNKNOWN...
...Decryption: PARTIAL...

ACCESS GRANTED. READING CLASSIFIED FILE #4471-B...

Analysts have been tracking a mysterious digital entity known only
as "The Archivist" for several months. This individual operates in
the shadows of the internet, leaving traces that are nearly
impossible to follow without the right tools.

A recent investigation led our team to an abandoned digital
footprint. The trail goes cold quickly — most people give up here.

Among the intercepted fragments, we found references to old online
profiles — accounts that were once active but now seem dormant.

Ancient digital archives suggest the entity used to share images
regularly — images that appear innocent on the surface.

Behavioral analysis shows a pattern: this individual always hides
something in plain sight.

A source close to the investigation mentioned a phrase: "the old
ways are the best ways."

Hidden inside what appears to be a perfectly normal photograph,
lies the truth.

Coordinates point to a social media trail.

A colleague noted something strange about the captions on this
account.

We believe the account is still active on Instagram.
The username is: oldus3rs

The ghost is waiting for you. Find the profile, find the image,
and find the key hidden in the caption's structure.

End of transmission. The rest is up to you.
Good luck, investigator.

...CONNECTION CLOSED...
"""

def recv_line(conn):
    """Read one line from the connection."""
    data = b""
    while True:
        chunk = conn.recv(1)
        if not chunk or chunk == b"\n":
            break
        if chunk == b"\r":
            continue
        data += chunk
    return data.decode(errors='ignore').strip()

def handle_client(conn):
    try:
        # Clear screen & show banner
        conn.sendall(b"\033[2J\033[H")
        conn.sendall("""
\033[31m
  \u2588\u2588\u2588\u2588\u2588\u2588\u2557\u2588\u2588\u2557\u2588\u2588\u2588\u2588\u2588\u2588\u2557 \u2588\u2588\u2557  \u2588\u2588\u2557\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2557\u2588\u2588\u2588\u2588\u2588\u2588\u2557 \u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2557\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2557\u2588\u2588\u2588\u2588\u2588\u2588\u2557 \u2588\u2588\u2557\u2588\u2588\u2557  \u2588\u2588\u2557\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2557
  \u2588\u2588\u2554\u2550\u2550\u2550\u2550\u255d\u2588\u2588\u2551\u2588\u2588\u2554\u2550\u2550\u2588\u2588\u2557\u2588\u2588\u2551  \u2588\u2588\u2551\u2588\u2588\u2554\u2550\u2550\u2550\u2550\u255d\u2588\u2588\u2554\u2550\u2550\u2588\u2588\u2557\u2588\u2588\u2554\u2550\u2550\u2550\u2550\u255d\u255a\u2550\u2550\u2588\u2588\u2554\u2550\u2550\u255d\u2588\u2588\u2554\u2550\u2550\u2588\u2588\u2557\u2588\u2588\u2551\u2588\u2588\u2551 \u2588\u2588\u2554\u255d\u2588\u2588\u2554\u2550\u2550\u2550\u2550\u255d
  \u2588\u2588\u2551     \u2588\u2588\u2551\u2588\u2588\u2588\u2588\u2588\u2588\u2554\u255d\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2551\u2588\u2588\u2588\u2588\u2588\u2557  \u2588\u2588\u2588\u2588\u2588\u2588\u2554\u255d\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2557   \u2588\u2588\u2551   \u2588\u2588\u2588\u2588\u2588\u2588\u2554\u255d\u2588\u2588\u2551\u2588\u2588\u2588\u2588\u2588\u2554\u255d \u2588\u2588\u2588\u2588\u2588\u2557
  \u2588\u2588\u2551     \u2588\u2588\u2551\u2588\u2588\u2554\u2550\u2550\u255d \u2588\u2588\u2554\u2550\u2550\u2588\u2588\u2551\u2588\u2588\u2554\u2550\u2550\u255d  \u2588\u2588\u2554\u2550\u2550\u2588\u2588\u2557\u255a\u2550\u2550\u2550\u2550\u2588\u2588\u2551   \u2588\u2588\u2551   \u2588\u2588\u2554\u2550\u2550\u2588\u2588\u2557\u2588\u2588\u2551\u2588\u2588\u2554\u2550\u2588\u2588\u2557 \u2588\u2588\u2554\u2550\u2550\u255d
  \u255a\u2588\u2588\u2588\u2588\u2588\u2588\u2557\u2588\u2588\u2551\u2588\u2588\u2551     \u2588\u2588\u2551  \u2588\u2588\u2551\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2557\u2588\u2588\u2551  \u2588\u2588\u2551\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2551   \u2588\u2588\u2551   \u2588\u2588\u2551  \u2588\u2588\u2551\u2588\u2588\u2551\u2588\u2588\u2551  \u2588\u2588\u2557\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2557
  \u255a\u2550\u2550\u2550\u2550\u2550\u255d\u255a\u2550\u255d\u255a\u2550\u255d     \u255a\u2550\u255d  \u255a\u2550\u255d\u255a\u2550\u2550\u2550\u2550\u2550\u2550\u255d\u255a\u2550\u255d  \u255a\u2550\u255d\u255a\u2550\u2550\u2550\u2550\u2550\u2550\u255d   \u255a\u2550\u255d   \u255a\u2550\u255d  \u255a\u2550\u255d\u255a\u2550\u255d\u255a\u2550\u255d  \u255a\u2550\u255d\u255a\u2550\u2550\u2550\u2550\u2550\u2550\u255d
\033[0m
""".encode('utf-8'))

        conn.sendall(b"\033[36m=== FORENSICS CHALLENGE : THE DIGITAL TRAIL ===\033[0m\n")
        conn.sendall(b"\033[90mCategory: Forensics | Difficulty: MEDIUM | Points: 250\033[0m\n\n")
        conn.sendall(b"\033[33mA 5-letter word is the key to unlock the classified transmission.\033[0m\n")
        conn.sendall(b"\033[33mThis has nothing to do with Romans \xf0\x9f\x98\x89\033[0m\n\n")
        conn.sendall(b"\033[90mRules: Enter any 5-letter word. Score shows how many letters match.\033[0m\n")
        conn.sendall(b"\033[90mGet 5/5 to unlock the transmission.\033[0m\n")
        conn.sendall(b"\033[90m" + b"-" * 50 + b"\033[0m\n\n")

        # Wordle-style loop
        while True:
            conn.sendall(b"\033[32m> \033[0m")
            user = recv_line(conn)

            # Silently ignore non 5-letter alpha inputs
            if len(user) != 5 or not user.isalpha():
                continue

            user = user.lower()
            score = sum(1 for i in range(5) if user[i] == SECRET[i])

            if score < 5:
                conn.sendall(f"\033[33m{score}/5\033[0m\n".encode())
                continue

            # Correct!
            conn.sendall(b"\n\033[32m5/5 — ACCESS GRANTED. Decrypting transmission...\033[0m\n\n")
            time.sleep(1)

            for line in TRANSMISSION.split('\n'):
                conn.sendall((line + '\n').encode('utf-8'))
                time.sleep(0.04)

            conn.sendall(b"\n\033[31m[END OF FILE]\033[0m\n")
            conn.sendall(b"\033[90mConnection will close in 10 seconds...\033[0m\n")
            time.sleep(10)
            return

    except Exception:
        pass
    finally:
        conn.close()


class ThreadedTCPServer(socketserver.ThreadingMixIn, socketserver.TCPServer):
    allow_reuse_address = True
    daemon_threads      = True


if __name__ == '__main__':
    HOST = '0.0.0.0'
    PORT = int(os.environ.get('CHALLENGE_PORT', 9050))
    print(f"[*] Challenge server starting on {HOST}:{PORT}")
    try:
        with ThreadedTCPServer((HOST, PORT), socketserver.StreamRequestHandler) as srv:
            srv.RequestHandlerClass.handle = lambda self: handle_client(self.connection)
            srv.serve_forever()
    except KeyboardInterrupt:
        print("\n[*] Server stopping.")
        sys.exit(0)
    except Exception as e:
        print(f"[!] Error: {e}")
        sys.exit(1)
