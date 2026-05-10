<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CtfChallenge extends Model
{
    protected $table = 'ctf_challenges';

    protected $fillable = [
        'title', 'description', 'category', 'difficulty',
        'points', 'flag', 'hint', 'attachment_url', 'is_active'
    ];

    // Hide the flag from API responses (never expose the answer!)
    protected $hidden = ['flag'];

    public function solves()
    {
        return $this->hasMany(CtfSolve::class, 'challenge_id');
    }
}
