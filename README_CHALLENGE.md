# Challenge Instructions: Digital Trail

## 1. Running the Script (Netcat Access)
To make the script accessible via `nc <link>`, you have two main options:

### Option A: Hosting on Railway (Integrated)
I have updated your `nixpacks.toml` so that when you push this to GitHub, Railway will automatically:
1. Install Python.
2. Run the PHP website.
3. Run the `challenge.py` server in the background.

**Crucial Step to get the "nc link":**
1. Go to your **Railway Dashboard**.
2. Select your service.
3. Go to **Settings** -> **Network**.
4. Scroll down to **TCP Proxy**.
5. Click **Add TCP Proxy**.
6. Set the **Application Port** to `9999`.
7. Railway will give you a domain like `junction.proxy.rlwy.net:12345`.
8. **This is your "nc link"!** Your friends will connect using:
   `nc junction.proxy.rlwy.net 12345` (replace with your actual proxy info).

---

### Option B: Local Machine (for testing)
1. Run `python challenge.py`.
2. Access it locally with `nc localhost 9999`.
3. To share it, you would need to use a tool like **ngrok** (e.g., `ngrok tcp 9999`) or port forward port 9999 on your router.

---

## 2. The Hidden Key (Instagram Bio/Caption)
The key is **`wachabana`**.

In the `challenge.py` output, the paragraphs start with these letters in reverse:
- **a**-...
- **n**-...
- **a**-...
- **b**-...
- **a**-...
- **h**-...
- **c**-...
- **a**-...
- **w**-...
Reading from bottom to top spells **wachabana**.

### Instagram Setup:
- **Username**: `oldus3rs`
- **Caption**: Post a long text describing the image. Somewhere in the middle, place the key.
  - *Example*: "...the landscape is beautiful and **wachabana** is the secret to everything..."
- **Bio**: Put the link to download the image as you mentioned.

---

## 3. Flag Encryption
The actual flag is `FLIPO{nt4_h3rb4n_brojol4_f1i9o}`.
However, since they need to use the key `wachabana` to decrypt it, you should put the **ENCRYPTED** version in the `flag.txt` inside the image.

**Key**: `wachabana`
**Plaintext**: `nt4_h3rb4n_brojol4_f1i9o`
**Encrypted Version (use this for flag.txt)**: `jt4_j3yb4o_beofon4_m1i9p`

So, `flag.txt` should contain:
`FLIPO{jt4_j3yb4o_beofon4_m1i9p}`

---

## 4. Image Preparation Recap
1. Create `flag.txt` with `FLIPO{jt4_j3yb4o_beofon4_m1i9p}`.
2. Encode your steghide passphrase to Base64 (e.g., `moroccan_ghost` -> `bW9yb2NjYW5fZ2hvc3Q=`).
3. Set metadata: `exiftool -Author="steghide:bW9yb2NjYW5fZ2hvc3Q=" image.jpg`
4. Hide file: `steghide embed -cf image.jpg -ef flag.txt` (it will ask for the passphrase).
5. Upload the image and update the Insta bio link.
