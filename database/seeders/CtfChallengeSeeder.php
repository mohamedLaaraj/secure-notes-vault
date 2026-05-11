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
        // Truncate existing challenges to ensure ONLY the requested one is present
        CtfChallenge::truncate();

        $challenges = [
            [
                'title'       => 'The Digital Trail',
                'description' => 'nc mainline.proxy.rlwy.net 57564',
                'category'    => 'forensics',
                'difficulty'  => 'hard',
                'points'      => 500,
                'flag'        => 'FLIPO{nt4_h3rb4n_brojol4_f1i9o}',
                'hint'        => 'The key is hidden in the first letters of each paragraph in the story. Read them in reverse. Once you have the Instagram profile, use exiftool and then steghide.',
                'is_active'   => true,
            ],
        ];

        foreach ($challenges as $ch) {
            CtfChallenge::create($ch);
        }

        echo "✅ Seeding complete. ONLY 'The Digital Trail' is now in the database.\n";
    }
}
