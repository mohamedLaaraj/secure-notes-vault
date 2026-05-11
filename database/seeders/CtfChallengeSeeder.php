<?php

namespace Database\Seeders;

use App\Models\CtfChallenge;
use App\Models\CtfSolve;
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
        // Truncate existing challenges and solves to reset everything
        CtfChallenge::truncate();
        CtfSolve::truncate();

        $challenges = [
            [
                'title'       => 'The Digital Trail',
                'description' => 'nc mainline.proxy.rlwy.net 57564',
                'category'    => 'forensics',
                'difficulty'  => 'medium',
                'points'      => 250,
                'flag'        => 'FLIPO{nt4_h3rb4n_brojol4_f1i9o}',
                'hint'        => 'somethimes the beginning of the paragraph gives something useful',
                'is_active'   => true,
            ],
        ];

        foreach ($challenges as $ch) {
            CtfChallenge::create($ch);
        }

        echo "✅ Seeding complete. Scoreboard reset and ONLY 'The Digital Trail' (Medium) is active.\n";
    }
}
