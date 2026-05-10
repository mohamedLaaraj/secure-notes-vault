<?php

namespace Database\Seeders;

use App\Models\CtfChallenge;
use Illuminate\Database\Seeder;

/**
 * CTF CHALLENGES SEEDER
 * Run with: php artisan db:seed --class=CtfChallengeSeeder
 * 
 * These are SAMPLE challenges — replace the flags with your real ones!
 */
class CtfChallengeSeeder extends Seeder
{
    public function run(): void
    {
        $challenges = [

            // ── WEB ───────────────────────────────────────────────
            [
                'title'       => 'Hidden in Plain Sight',
                'description' => 'This website has something to hide. Look carefully at what the developer left behind. Sometimes developers forget to clean up their comments before pushing to production.',
                'category'    => 'web',
                'difficulty'  => 'easy',
                'points'      => 100,
                'flag'        => 'FLIPO{html_comments_are_not_secrets}',
                'hint'        => 'Have you tried right-clicking and viewing the page source?',
            ],
            [
                'title'       => 'Cookie Monster',
                'description' => 'The admin panel is locked, but maybe you can trick the server into thinking you\'re already logged in. Cookies can be quite revealing.',
                'category'    => 'web',
                'difficulty'  => 'medium',
                'points'      => 250,
                'flag'        => 'FLIPO{c00k13s_4r3_d3l1c10us}',
                'hint'        => 'Open your browser DevTools → Application → Cookies. What do you see?',
            ],
            [
                'title'       => 'SQL Injection 101',
                'description' => 'The login form looks normal but the developer trusted user input a little too much. Can you bypass the authentication without knowing the password?',
                'category'    => 'web',
                'difficulty'  => 'medium',
                'points'      => 250,
                'flag'        => 'FLIPO{trust_n0_inp0t_3v3r}',
                'hint'        => 'What happens when you put a single quote in the username field?',
            ],

            // ── CRYPTO ───────────────────────────────────────────
            [
                'title'       => 'Caesar\'s Secret',
                'description' => 'The Roman emperor sent a secret message: IODN{fdhvdu_flskhu_lv_eurnhq}. Decode it to find the flag.',
                'category'    => 'crypto',
                'difficulty'  => 'easy',
                'points'      => 100,
                'flag'        => 'FLIPO{caesar_cipher_is_broken}',
                'hint'        => 'Caesar used a shift of 3. The flag format is FLIPO{...}',
            ],
            [
                'title'       => 'Base64 is Not Encryption',
                'description' => 'Someone thought encoding their secret would keep it safe. Here it is: RkxBR3tiYXNlNjRfaXNfbm90X2VuY3J5cHRpb259. Prove them wrong.',
                'category'    => 'crypto',
                'difficulty'  => 'easy',
                'points'      => 100,
                'flag'        => 'FLIPO{base64_is_not_encryption}',
                'hint'        => 'Base64 is an encoding, not encryption. Any online decoder will work.',
            ],
            [
                'title'       => 'The Vigenere Mystery',
                'description' => 'Intercepted ciphertext: MZWGZEXLM{zmrkirir_vw_xsq_wier}. The key is the name of the most famous French hacker (lowercase).',
                'category'    => 'crypto',
                'difficulty'  => 'hard',
                'points'      => 500,
                'flag'        => 'FLIPO{vigenere_not_too_safe}',
                'hint'        => 'Research: who is the most famous French hacker in history?',
            ],
            [
                'title'       => 'RSA Baby Steps',
                'description' => 'Given: p=61, q=53, e=17, ciphertext=2790. Find the plaintext and convert it to ASCII. The flag is FLIPO{ASCII_character}.',
                'category'    => 'crypto',
                'difficulty'  => 'hard',
                'points'      => 500,
                'flag'        => 'FLIPO{A}',
                'hint'        => 'n=p*q, phi=(p-1)*(q-1), find d such that e*d ≡ 1 (mod phi), then m = c^d mod n',
            ],

            // ── FORENSICS ─────────────────────────────────────────
            [
                'title'       => 'Metadata Madness',
                'description' => 'A photo was taken at a secret location. The photographer forgot to strip the metadata. Download the image and find where it was taken. The flag is FLIPO{city_country} in lowercase.',
                'category'    => 'forensics',
                'difficulty'  => 'easy',
                'points'      => 100,
                'flag'        => 'FLIPO{agadir_morocco}',
                'hint'        => 'Use ExifTool or any online EXIF viewer to read the image metadata.',
                'attachment_url' => 'https://your-server.com/challenges/photo.jpg', // Replace with real file
            ],
            [
                'title'       => 'Steganography 101',
                'description' => 'There\'s a secret message hidden inside this innocent-looking image. The flag is hidden in the pixels themselves.',
                'category'    => 'forensics',
                'difficulty'  => 'medium',
                'points'      => 250,
                'flag'        => 'FLIPO{pixels_hide_secrets}',
                'hint'        => 'Try zsteg or steghide tools. Or look at the LSB (Least Significant Bits).',
                'attachment_url' => 'https://your-server.com/challenges/stego.png',
            ],
            [
                'title'       => 'Deleted but Not Gone',
                'description' => 'A file was deleted from this disk image, but digital forensics never lies. Recover the deleted file and find the flag inside.',
                'category'    => 'forensics',
                'difficulty'  => 'hard',
                'points'      => 500,
                'flag'        => 'FLIPO{deleted_files_speak_volumes}',
                'hint'        => 'Use Autopsy or foremost to carve files from the disk image.',
                'attachment_url' => 'https://your-server.com/challenges/disk.img',
            ],

            // ── REVERSE ───────────────────────────────────────────
            [
                'title'       => 'What Does It Say?',
                'description' => 'This Python bytecode hides a flag. Decompile it and find out what the program would print. Submit the output as FLIPO{output}.',
                'category'    => 'reverse',
                'difficulty'  => 'medium',
                'points'      => 250,
                'flag'        => 'FLIPO{reverse_engineering_rocks}',
                'hint'        => 'Use uncompyle6 or pycdc to decompile Python .pyc files.',
                'attachment_url' => 'https://your-server.com/challenges/secret.pyc',
            ],
            [
                'title'       => 'Assembly Nightmare',
                'description' => 'This x86 assembly function checks a password. Figure out what the correct password is. The flag is FLIPO{the_password}.',
                'category'    => 'reverse',
                'difficulty'  => 'hard',
                'points'      => 500,
                'flag'        => 'FLIPO{asm_is_fun_not}',
                'hint'        => 'Load it in Ghidra or use online x86 emulators. Focus on the CMP instructions.',
                'attachment_url' => 'https://your-server.com/challenges/check.asm',
            ],

            // ── OSINT ─────────────────────────────────────────────
            [
                'title'       => 'Find The Developer',
                'description' => 'A developer posted their project on GitHub. Their username contains the word "cipher". Find their oldest repository and submit the flag hidden in the README as FLIPO{...}.',
                'category'    => 'osint',
                'difficulty'  => 'easy',
                'points'      => 100,
                'flag'        => 'FLIPO{github_is_an_open_book}',
                'hint'        => 'Search GitHub for users with "cipher" in their username. Check their repos by date.',
            ],
            [
                'title'       => 'Wayback Machine',
                'description' => 'A website removed its flag page, but the internet never forgets. The flag was on example-ctf-site.com/secret in January 2023.',
                'category'    => 'osint',
                'difficulty'  => 'medium',
                'points'      => 250,
                'flag'        => 'FLIPO{the_internet_never_forgets}',
                'hint'        => 'web.archive.org is your best friend.',
            ],

            // ── MISC ──────────────────────────────────────────────
            [
                'title'       => 'Morse Code SOS',
                'description' => '-- --- .-. ... . / -.-. --- -.. . / .. ... / -. --- - / -.. . .- -.. / ..-. .-.. .- --. ... / .- .-. . / .... .. -.. -.. . -. / .. -. / .. -/ Decode this to find the flag.',
                'category'    => 'misc',
                'difficulty'  => 'easy',
                'points'      => 100,
                'flag'        => 'FLIPO{morse_code_lives_on}',
                'hint'        => 'Each letter is separated by a space, each word by a /. Use an online Morse decoder.',
            ],
            [
                'title'       => 'QR Code Challenge',
                'description' => 'This QR code has been deliberately corrupted. 3 blocks are wrong. Fix it and scan it to get the flag. The flag format is FLIPO{...}.',
                'category'    => 'misc',
                'difficulty'  => 'hard',
                'points'      => 500,
                'flag'        => 'FLIPO{qr_error_correction_saves_lives}',
                'hint'        => 'QR codes have built-in error correction up to 30%. Study the QR code format.',
                'attachment_url' => 'https://your-server.com/challenges/corrupted.png',
            ],
            [
                'title'       => 'The Darija Challenge',
                'description' => 'هاد السؤال فالدارجة المغربية. شنو هو الشيء لي كيدخل كبير وكيخرج صغير؟ الجواب هو FLIPO{الجواب بالانجليزية}',
                'category'    => 'misc',
                'difficulty'  => 'insane',
                'points'      => 1000,
                'flag'        => 'FLIPO{sharpener}',
                'hint'        => 'Think about everyday objects. This is a classic riddle.',
            ],
        ];

        foreach ($challenges as $ch) {
            CtfChallenge::updateOrCreate(['title' => $ch['title']], $ch);
        }

        echo "✅ " . count($challenges) . " CTF challenges seeded!\n";
    }
}
