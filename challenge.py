import socketserver
import time
import sys

# ================================================================
# CIPHERSTRIKE CTF — Forensics Challenge
# "Digital Ghost" — Multi-layer OSINT + Steganography
# Run: python challenge.py
# Connect: nc <link> <port>
# ================================================================

LONG_TEXT = """
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
a-nsqldnlksqndlqsl (The path is hidden in the beginning)

Among the intercepted fragments, we found references to old online
profiles — accounts that were once active but now seem dormant.
n-qsfkjslkdjlksqjlkf (Shadows of the past)

Ancient digital archives suggest the entity used to share images
regularly — images that appear innocent on the surface.
a-sflksjqlkfjlksq (The surface is a lie)

Behavioral analysis shows a pattern: this individual always hides
something in plain sight.
b-qsljdlksqjdlkqs (Look closer)

A source close to the investigation mentioned a phrase: "the old
ways are the best ways."
a-qslkjsqlkflksq (Ancient methods)

Hidden inside what appears to be a perfectly normal photograph,
lies the truth.
h-sdhlshqldqsld (The metadata speaks)

Coordinates point to a social media trail.
c-lsqdlkjsqlkdsqlk (The profile is watching)

A colleague noted something strange about the captions on this
account.
a-lqsflsqljfljqshljsq (The key is in the reverse)

We believe the account is still active on Instagram.
wqdfljdsqlkjfqsjl (The username is 'oldus3rs')

The ghost is waiting for you. Find the profile, find the image,
and find the key hidden in the caption's structure.

End of transmission. The rest is up to you.
Good luck, investigator.

...CONNECTION CLOSED...
"""

QUESTIONS = [
    {
        "q": "Which tool is commonly used in Kali Linux to view and edit image metadata?",
        "a": "exiftool"
    },
    {
        "q": "What is the specific command (subcommand) used with 'steghide' to get a hidden file out?",
        "a": "extract"
    },
    {
        "q": "In a Vigenere cipher, if the plaintext is 'HELLO' and the key is 'A', the ciphertext is 'HELLO'. If the key is 'B', what does 'A' become?",
        "a": "B"
    }
]

def handle_client(conn):
    try:
        conn.sendall(b"\033[2J\033[H")  # Clear screen
        conn.sendall("""
\033[31m
  ██████╗██╗██████╗ ██╗  ██╗███████╗██████╗ ███████╗████████╗██████╗ ██╗██╗  ██╗███████╗
  ██╔════╝██║██╔══██╗██║  ██║██╔════╝██╔══██╗██╔════╝╚══██╔══╝██╔══██╗██║██║ ██╔╝██╔════╝
  ██║     ██║██████╔╝███████║█████╗  ██████╔╝███████╗   ██║   ██████╔╝██║█████╔╝ █████╗
  ██║     ██║██╔═══╝ ██╔══██║██╔══╝  ██╔══██╗╚════██║   ██║   ██╔══██╗██║██╔═██╗ ██╔══╝
  ╚██████╗██║██║     ██║  ██║███████╗██║  ██║███████║   ██║   ██║  ██║██║██║  ██╗███████╗
  ╚═════╝╚═╝╚═╝     ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚══════╝   ╚═╝   ╚═╝  ╚═╝╚═╝╚═╝  ╚═╝╚══════╝
\033[0m
""".encode('utf-8'))
        conn.sendall(b"\033[36m=== FORENSICS CHALLENGE : THE DIGITAL TRAIL ===\033[0m\n")
        conn.sendall(b"\033[90mCategory: Forensics | Status: ENCRYPTED\033[0m\n\n")
        conn.sendall(b"\033[33mProve your identity to access the classified files.\033[0m\n\n")

        for i, q_item in enumerate(QUESTIONS):
            conn.sendall(f"\033[32m[QUESTION {i+1}/3]\033[0m {q_item['q']}\n".encode())
            conn.sendall(b"\033[32m> \033[0m")
            
            data = b""
            while True:
                chunk = conn.recv(1)
                if not chunk or chunk == b"\n":
                    break
                if chunk == b"\r":
                    continue
                data += chunk
            
            user_ans = data.decode(errors='ignore').strip().lower()
            
            if user_ans != q_item['a'].lower():
                conn.sendall(b"\n\033[31m[ACCESS DENIED] Incorrect answer. Connection terminated.\033[0m\n")
                return
            
            conn.sendall(b"\033[32m[CORRECT]\033[0m\n\n")

        conn.sendall(b"\033[32m[ACCESS GRANTED] Decrypting transmission...\033[0m\n\n")
        time.sleep(1)

        for line in LONG_TEXT.split('\n'):
            conn.sendall((line + '\n').encode())
            time.sleep(0.05)

        conn.sendall(b"\n\033[31m[END OF FILE]\033[0m\n")
        conn.sendall(b"\033[90mConnection will close in 10 seconds...\033[0m\n")
        time.sleep(10)

    except Exception:
        pass
    finally:
        conn.close()

class ThreadedTCPServer(socketserver.ThreadingMixIn, socketserver.TCPServer):
    allow_reuse_address = True
    daemon_threads      = True

import os

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
