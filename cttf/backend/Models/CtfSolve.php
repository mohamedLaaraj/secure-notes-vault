<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CtfSolve extends Model
{
    protected $table = 'ctf_solves';

    protected $fillable = [
        'user_id', 'challenge_id', 'points_awarded', 'hint_used'
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function challenge()
    {
        return $this->belongsTo(CtfChallenge::class, 'challenge_id');
    }
}
