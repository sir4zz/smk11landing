<?php

namespace App\Http\Controllers;

use App\Models\ContactMessage;
use Illuminate\Http\Request;

class ContactController extends Controller
{
    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string'],
            'email' => ['required', 'email'],
            'subject' => ['required', 'string'],
            'message' => ['required', 'string'],
        ]);

        $message = ContactMessage::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'subject' => $data['subject'],
            'message' => $data['message'],
            'is_read' => 0,
            'created_at' => now(),
        ]);

        return response()->json($message, 201);
    }

    public function index()
    {
        return response()->json(ContactMessage::query()->orderBy('created_at', 'desc')->get());
    }

    public function markRead(string $id)
    {
        $message = ContactMessage::findOrFail($id);
        $message->update(['is_read' => 1]);

        return response()->json(['data' => null, 'error' => null]);
    }

    public function destroy(string $id)
    {
        ContactMessage::findOrFail($id)->delete();

        return response()->json(['data' => null, 'error' => null]);
    }
}
