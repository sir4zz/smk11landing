<?php

namespace App\Http\Controllers;

use App\Models\PpdbActivityLog;
use App\Models\PpdbDocument;
use App\Models\PpdbRegistration;
use Illuminate\Http\Request;

class PpdbController extends Controller
{
    // ---------- REGISTRATIONS ----------
    public function index(Request $request)
    {
        $user = $request->user();

        $query = PpdbRegistration::with(['documents' => function ($q) {
            $q->orderBy('created_at', 'asc');
        }, 'activityLog' => function ($q) {
            $q->orderBy('created_at', 'desc')->limit(20);
        }]);

        if ($request->has('user_id')) {
            $query->where('user_id', $request->query('user_id'));
        }

        $query->orderBy('created_at', 'desc');

        return response()->json($query->get());
    }

    public function store(Request $request)
    {
        $user = $request->user();

        $payload = $request->all();
        unset($payload['id'], $payload['created_at'], $payload['updated_at'], $payload['user_id']);

        if (! $user) {
            return response()->json(['error' => ['message' => 'Unauthorized']], 401);
        }

        $existing = PpdbRegistration::query()->where('user_id', $user->id)->first();

        if ($existing) {
            if (! in_array($existing->status, ['Menunggu Verifikasi', 'Perlu Perbaikan Dokumen'], true)) {
                return response()->json(['error' => ['message' => 'Pendaftaran sudah diproses, tidak dapat diubah.']], 422);
            }
            $existing->update($payload);
            $registration = $existing;
        } else {
            $payload['user_id'] = $user->id;
            $payload['registration_number'] = 'PPDB'.random_int(1000, 9999).substr((string) time(), -4);
            $registration = PpdbRegistration::create($payload);
        }

        return response()->json($this->registrationPayload($registration), 201);
    }

    public function submit(Request $request, string $id)
    {
        $user = $request->user();

        $registration = PpdbRegistration::findOrFail($id);

        if ($registration->user_id !== $user?->id) {
            return response()->json(['error' => ['message' => 'Forbidden']], 403);
        }

        if (! in_array($registration->status, ['Menunggu Verifikasi', 'Perlu Perbaikan Dokumen'], true)) {
            return response()->json(['error' => ['message' => 'Pendaftaran sudah diproses, tidak dapat diubah.']], 422);
        }

        if ($registration->documents_count < 1) {
            return response()->json(['error' => ['message' => 'Upload minimal 1 dokumen sebelum submit.']], 422);
        }

        $registration->update([
            'status' => 'Menunggu Verifikasi',
            'submitted_at' => now(),
        ]);

        PpdbActivityLog::create([
            'application_id' => $registration->id,
            'action' => 'Submit Pendaftaran',
            'note' => 'Pendaftaran berhasil dikirim.',
            'created_at' => now(),
        ]);

        return response()->json($this->registrationPayload($registration));
    }

    // ---------- DOCUMENTS ----------
    public function storeDocument(Request $request)
    {
        $user = $request->user();

        $registration = PpdbRegistration::findOrFail($request->input('application_id'));

        if ($registration->user_id !== $user?->id) {
            return response()->json(['error' => ['message' => 'Forbidden']], 403);
        }

        $data = $request->all();
        unset($data['id'], $data['created_at']);

        $doc = PpdbDocument::create($data);

        $registration->update([
            'documents_count' => $registration->documents_count + 1,
        ]);

        return response()->json($doc, 201);
    }

    public function destroyDocument(Request $request, string $id)
    {
        $user = $request->user();

        $doc = PpdbDocument::findOrFail($id);
        $registration = $doc->application;

        if ($registration->user_id !== $user?->id) {
            return response()->json(['error' => ['message' => 'Forbidden']], 403);
        }

        $doc->delete();
        $registration->update([
            'documents_count' => max(0, $registration->documents_count - 1),
        ]);

        return response()->json(['data' => null, 'error' => null]);
    }

    protected function registrationPayload(PpdbRegistration $registration): PpdbRegistration
    {
        return $registration->load([
            'documents' => fn ($q) => $q->orderBy('created_at', 'asc'),
            'activityLog' => fn ($q) => $q->orderBy('created_at', 'desc')->limit(20),
        ]);
    }
}
