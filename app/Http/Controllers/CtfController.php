<?php

namespace App\Http\Controllers;

use App\Models\CtfChallenge;
use App\Models\CtfSolve;
use App\Models\User;
use Illuminate\Http\Request;

class CtfController extends Controller
{
    // ── GET /api/ctf/challenges ──────────────────────────────────
    // Returns all active challenges + which ones the user has solved
    public function challenges(Request $request)
    {
        $userId = $request->user()->id;

        $challenges = CtfChallenge::where('is_active', true)
            ->withCount('solves') // adds solves_count
            ->get()
            ->map(function ($ch) {
                return [
                    'id'             => $ch->id,
                    'title'          => $ch->title,
                    'description'    => $ch->description,
                    'category'       => $ch->category,
                    'difficulty'     => $ch->difficulty,
                    'points'         => $ch->points,
                    'hint'           => $ch->hint,
                    'attachment_url' => $ch->attachment_url,
                    'solves_count'   => $ch->solves_count,
                    // NEVER include 'flag' here!
                ];
            });

        // IDs of challenges this user has already solved
        $solvedIds = CtfSolve::where('user_id', $userId)
            ->pluck('challenge_id')
            ->toArray();

        return response()->json([
            'challenges' => $challenges,
            'solved_ids' => $solvedIds,
        ]);
    }

    // ── POST /api/ctf/submit ─────────────────────────────────────
    // Submit a flag for a challenge
    public function submit(Request $request)
    {
        $request->validate([
            'challenge_id' => 'required|exists:ctf_challenges,id',
            'flag'         => 'required|string',
            'hint_used'    => 'boolean',
        ]);

        $userId      = $request->user()->id;
        $challengeId = $request->challenge_id;
        $flag        = trim($request->flag);
        $hintUsed    = $request->hint_used ?? false;

        // Check if already solved
        $alreadySolved = CtfSolve::where('user_id', $userId)
            ->where('challenge_id', $challengeId)
            ->exists();

        if ($alreadySolved) {
            return response()->json(['correct' => false, 'message' => 'Already solved!']);
        }

        $challenge = CtfChallenge::findOrFail($challengeId);

        // Case-sensitive flag check
        if ($flag !== $challenge->flag) {
            return response()->json(['correct' => false, 'message' => 'Wrong flag']);
        }

        // Calculate points (50 points deduction if hint was used)
        $pointsAwarded = $hintUsed
            ? max(0, $challenge->points - 50)
            : $challenge->points;

        // Record the solve
        CtfSolve::create([
            'user_id'        => $userId,
            'challenge_id'   => $challengeId,
            'points_awarded' => $pointsAwarded,
            'hint_used'      => $hintUsed,
        ]);

        return response()->json([
            'correct'        => true,
            'points_awarded' => $pointsAwarded,
            'message'        => 'Correct flag!',
        ]);
    }

    // ── GET /api/ctf/scoreboard ──────────────────────────────────
    // Returns ranked list of all players by total points
    public function scoreboard()
    {
        $scores = CtfSolve::selectRaw('user_id, SUM(points_awarded) as total_points, COUNT(*) as solved_count, MIN(created_at) as first_solve')
            ->groupBy('user_id')
            ->orderByDesc('total_points')
            ->orderBy('first_solve') // Tiebreaker: earliest solve wins
            ->with('user:id,name')
            ->get()
            ->map(function ($row) {
                return [
                    'id'           => $row->user_id,
                    'name'         => $row->user->name ?? 'Unknown',
                    'total_points' => (int) $row->total_points,
                    'solved_count' => (int) $row->solved_count,
                ];
            });

        return response()->json($scores);
    }

    // ── GET /api/ctf/admin/challenges (admin only) ───────────────
    // List all challenges including flags (for admin management)
    public function adminList(Request $request)
    {
        // Simple admin check — only user with ID 1 can access
        if ($request->user()->id !== 1) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        return response()->json(CtfChallenge::all());
    }

    // ── POST /api/ctf/admin/challenges (admin only) ──────────────
    // Create a new challenge
    public function adminCreate(Request $request)
    {
        if ($request->user()->id !== 1) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'title'          => 'required|string|max:255',
            'description'    => 'required|string',
            'category'       => 'required|in:web,crypto,forensics,reverse,osint,misc',
            'difficulty'     => 'required|in:easy,medium,hard,insane',
            'points'         => 'required|integer|min:1',
            'flag'           => 'required|string',
            'hint'           => 'nullable|string',
            'attachment_url' => 'nullable|url',
        ]);

        $challenge = CtfChallenge::create($validated);
        return response()->json(['message' => 'Challenge created', 'challenge' => $challenge], 201);
    }

    // ── PUT /api/ctf/admin/challenges/{id} (admin only) ──────────
    // Update a challenge
    public function adminUpdate(Request $request, $id)
    {
        if ($request->user()->id !== 1) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $challenge = CtfChallenge::findOrFail($id);
        $challenge->update($request->all());
        return response()->json(['message' => 'Challenge updated', 'challenge' => $challenge]);
    }

    // ── DELETE /api/ctf/admin/challenges/{id} (admin only) ───────
    public function adminDelete(Request $request, $id)
    {
        if ($request->user()->id !== 1) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        CtfChallenge::findOrFail($id)->delete();
        return response()->json(['message' => 'Challenge deleted']);
    }

    public function getTransmission()
    {
        $transmission = "...Transmission intercepted at 03:47 UTC...\n" .
            "...Source: UNKNOWN | Destination: UNKNOWN...\n" .
            "...Decryption: PARTIAL...\n\n" .
            "ACCESS GRANTED. READING CLASSIFIED FILE #4471-B...\n\n" .
            "Analysts have been tracking a mysterious digital entity known only\n" .
            "as \"The Archivist\" for several months. This individual operates in\n" .
            "the shadows of the internet, leaving traces that are nearly\n" .
            "impossible to follow without the right tools.\n\n" .
            "A recent investigation led our team to an abandoned digital\n" .
            "footprint. The trail goes cold quickly — most people give up here.\n" .
            "a-nsqldnlksqndlqsl (The path is hidden in the beginning)\n\n" .
            "Among the intercepted fragments, we found references to old online\n" .
            "profiles — accounts that were once active but now seem dormant.\n" .
            "n-qsfkjslkdjlksqjlkf (Shadows of the past)\n\n" .
            "Ancient digital archives suggest the entity used to share images\n" .
            "regularly — images that appear innocent on the surface.\n" .
            "a-sflksjqlkfjlksq (The surface is a lie)\n\n" .
            "Behavioral analysis shows a pattern: this individual always hides\n" .
            "something in plain sight.\n" .
            "b-qsljdlksqjdlkqs (Look closer)\n\n" .
            "A source close to the investigation mentioned a phrase: \"the old\n" .
            "ways are the best ways.\"\n" .
            "a-qslkjsqlkflksq (Ancient methods)\n\n" .
            "Hidden inside what appears to be a perfectly normal photograph,\n" .
            "lies the truth.\n" .
            "h-sdhlshqldqsld (The metadata speaks)\n\n" .
            "Coordinates point to a social media trail.\n" .
            "c-lsqdlkjsqlkdsqlk (The profile is watching)\n\n" .
            "A colleague noted something strange about the captions on this\n" .
            "account.\n" .
            "a-lqsflsqljfljqshljsq (The key is in the reverse)\n\n" .
            "We believe the account is still active on Instagram.\n" .
            "wqdfljdsqlkjfqsjl (The username is 'oldus3rs')\n\n" .
            "The ghost is waiting for you. Find the profile, find the image,\n" .
            "and find the key hidden in the caption's structure.\n\n" .
            "End of transmission. The rest is up to you.\n" .
            "Good luck, investigator.\n\n" .
            "...CONNECTION CLOSED...";

        return response($transmission)->header('Content-Type', 'text/plain');
    }
}
