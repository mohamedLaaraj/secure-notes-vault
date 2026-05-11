import socketserver
import time
import sys
import os

# ================================================================
# CIPHERSTRIKE CTF -- Forensics Challenge
# "The Digital Trail" -- Wordle-style access gate
# Connect: nc viaduct.proxy.rlwy.net 27201
# ================================================================

SECRET = "nymph"

TRANSMISSION = (
    "\n...Transmission intercepted at 03:47 UTC...\n"
    "...Source: UNKNOWN | Destination: UNKNOWN...\n"
    "...Decryption: PARTIAL...\n\n"
    "ACCESS GRANTED. READING CLASSIFIED FILE #4471-B...\n\n"
    "Analysts have been tracking a mysterious digital entity known only\n"
    "as \"The Archivist\" for several months. This individual operates in\n"
    "the shadows of the internet, leaving traces that are nearly\n"
    "impossible to follow without the right tools.\n\n"
    "A recent investigation led our team to an abandoned digital\n"
    "footprint. The trail goes cold quickly -- most people give up here.\n\n"
    "Among the intercepted fragments, we found references to old online\n"
    "profiles -- accounts that were once active but now seem dormant.\n\n"
    "Ancient digital archives suggest the entity used to share images\n"
    "regularly -- images that appear innocent on the surface.\n\n"
    "Behavioral analysis shows a pattern: this individual always hides\n"
    "something in plain sight.\n\n"
    "A source close to the investigation mentioned a phrase: \"the old\n"
    "ways are the best ways.\"\n\n"
    "Hidden inside what appears to be a perfectly normal photograph,\n"
    "lies the truth.\n\n"
    "Coordinates point to a social media trail.\n\n"
    "A colleague noted something strange about the captions on this\n"
    "account.\n\n"
    "We believe the account is still active on Instagram.\n"
    "The username is: oldus3rs\n\n"
    "The ghost is waiting for you. Find the profile, find the image,\n"
    "and find the key hidden in the caption's structure.\n\n"
    "End of transmission. The rest is up to you.\n"
    "Good luck, investigator.\n\n"
    "...CONNECTION CLOSED...\n"
)

BANNER = (
    "\033[31m\n"
    "  ####### ###  ###### ###  ### ####### ###### ####### ######## ###### ### ###  ### #######\n"
    " ###      ### ###  ## ###  ### ###      ###  ## ###      ###   ###  ## ### ###  ## ###    \n"
    " ###      ### #######  ####### #####   #######  #######  ###   #######  ### ##### #####   \n"
    " ###      ### ###  ##  ###  ## ###      ###  ## ====###  ###   ###  ## ### ###  ## ###    \n"
    "  ####### ### ###  ##  ###  ## ####### ###  ## #######   ###   ###  ## ### ###  ## #######\n"
    "\033[0m\n"
)

def recv_line(conn):
    """Read one line from the connection."""
    data = b""
    while True:
        try:
            chunk = conn.recv(1)
        except Exception:
            return ""
        if not chunk or chunk == b"\n":
            break
        if chunk == b"\r":
            continue
        data += chunk
    return data.decode(errors='ignore').strip()

def handle_client(conn):
    try:
        # Clear screen
        conn.sendall(b"\033[2J\033[H")

        # Banner
        conn.sendall(BANNER.encode('utf-8'))

        # Challenge header (same style as original)
        conn.sendall(b"\033[36m=== FORENSICS CHALLENGE : THE DIGITAL TRAIL ===\033[0m\n")
        conn.sendall(b"\033[90mCategory: Forensics | Status: ENCRYPTED\033[0m\n\n")
        conn.sendall(b"\033[33mProve your identity to access the classified files.\033[0m\n\n")

        # Prompt -- no rules, no hint about length
        conn.sendall(b"\033[36mA word is the key to unlock the classified transmission.\033[0m\n")
        conn.sendall("This has nothing to do with water spirits \U0001f609\n\n".encode('utf-8'))

        # Wordle-style loop -- silent, no rules shown
        while True:
            conn.sendall(b"\033[32m> \033[0m")
            user = recv_line(conn)

            if not user:
                continue

            user_lower = user.lower()

            # Only process exactly 5-letter alpha words silently
            if len(user_lower) != 5 or not user_lower.isalpha():
                continue

            score = sum(1 for i in range(5) if user_lower[i] == SECRET[i])

            if score < 5:
                conn.sendall(f"{score}/5\n".encode())
                continue

            # Correct!
            conn.sendall(b"\n\033[32m[ACCESS GRANTED] Decrypting transmission...\033[0m\n\n")
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
