<?php

namespace App\Http\Controllers;

use App\Models\Note;
use Illuminate\Http\Request;

class NoteController extends Controller
{
    // GET /api/notes — list all notes for the authenticated user
    public function index(Request $request)
    {
        $notes = Note::where('user_id', $request->user()->id)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($notes);
    }

    // POST /api/notes — save a new encrypted note
    public function store(Request $request)
    {
        $validated = $request->validate([
            'category'       => 'required|string|in:Personal,Work,Financial,Credentials,Other',
            'ciphertext'     => 'required|string',
            'iv'             => 'required|string',
            'salt'           => 'required|string',
            'integrity_hash' => 'required|string|size:64', // SHA-256 = always 64 hex chars
        ]);

        $note = Note::create([
            'user_id'        => $request->user()->id,
            'category'       => $validated['category'],
            'ciphertext'     => $validated['ciphertext'],
            'iv'             => $validated['iv'],
            'salt'           => $validated['salt'],
            'integrity_hash' => $validated['integrity_hash'],
        ]);

        return response()->json(['message' => 'Note saved', 'note' => $note], 201);
    }

    // DELETE /api/notes/{id} — delete one note (only if it belongs to this user)
    public function destroy(Request $request, $id)
    {
        $note = Note::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->first();

        if (!$note) {
            return response()->json(['message' => 'Note not found'], 404);
        }

        $note->delete();
        return response()->json(['message' => 'Note deleted']);
    }

    // DELETE /api/notes — delete ALL notes for this user
    public function destroyAll(Request $request)
    {
        Note::where('user_id', $request->user()->id)->delete();
        return response()->json(['message' => 'All notes cleared']);
    }
}
