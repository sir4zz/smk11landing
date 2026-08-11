<?php

namespace App\Http\Controllers;

use App\Models\BkkPartner;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class BkkPartnerController extends Controller
{
    // ------------------------------------------------------------------
    // PUBLIC
    // ------------------------------------------------------------------

    public function index()
    {
        $rows = BkkPartner::query()
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->orderByDesc('created_at')
            ->get();

        return response()->json(['data' => $rows, 'error' => null]);
    }

    // ------------------------------------------------------------------
    // ADMIN
    // ------------------------------------------------------------------

    public function adminIndex(Request $request)
    {
        $query = BkkPartner::query();

        if ($request->filled('search')) {
            $search = $request->query('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('industry', 'like', "%{$search}%")
                    ->orWhere('location', 'like', "%{$search}%");
            });
        }

        if ($request->filled('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        $query->orderBy('sort_order')->orderByDesc('created_at');

        return response()->json(['data' => $query->get(), 'error' => null]);
    }

    public function store(Request $request)
    {
        $payload = $this->validatedPayload($request);

        if (empty($payload['name'])) {
            return response()->json(['data' => null, 'error' => ['message' => 'Nama perusahaan wajib diisi.']], 422);
        }

        $partner = BkkPartner::create($payload + [
            'logo' => $this->resolveLogo($request),
        ]);

        return response()->json(['data' => $partner->fresh(), 'error' => null], 201);
    }

    public function update(Request $request, string $id)
    {
        $partner = BkkPartner::findOrFail($id);

        $payload = $this->validatedPayload($request);

        if (array_key_exists('name', $request->all()) && empty($payload['name'])) {
            return response()->json(['data' => null, 'error' => ['message' => 'Nama perusahaan wajib diisi.']], 422);
        }

        $logo = $this->resolveLogo($request);
        if ($logo !== '' && $logo !== $partner->logo) {
            $this->deleteFileFromUrl($partner->logo);
            $payload['logo'] = $logo;
        }

        if (! empty($payload)) {
            $partner->update($payload);
        }

        return response()->json(['data' => $partner->fresh(), 'error' => null]);
    }

    public function destroy(string $id)
    {
        $partner = BkkPartner::findOrFail($id);

        $this->deleteFileFromUrl($partner->logo);
        $partner->delete();

        return response()->json(['data' => null, 'error' => null]);
    }

    // ------------------------------------------------------------------
    // HELPERS
    // ------------------------------------------------------------------

    protected function validatedPayload(Request $request): array
    {
        $data = $request->all();

        $rules = [
            'name' => 'nullable|string',
            'industry' => 'nullable|string',
            'location' => 'nullable|string',
            'description' => 'nullable|string',
            'is_active' => 'nullable|boolean',
            'sort_order' => 'nullable|integer',
        ];

        $validated = $request->validate($rules);

        $payload = [];
        foreach (array_keys($rules) as $field) {
            if (array_key_exists($field, $data)) {
                $payload[$field] = $validated[$field] ?? null;
            }
        }

        if (array_key_exists('is_active', $payload)) {
            $payload['is_active'] = ! empty($payload['is_active']);
        }
        if (array_key_exists('sort_order', $payload)) {
            $payload['sort_order'] = (int) ($payload['sort_order'] ?? 0);
        }

        return $payload;
    }

    protected function resolveLogo(Request $request): string
    {
        if ($request->hasFile('logo')) {
            $request->validate([
                'logo' => ['required', 'file', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
            ]);

            return $this->storeFile($request->file('logo'));
        }

        $logo = $request->input('logo');
        if (is_string($logo) && $logo !== '') {
            return $logo;
        }

        return '';
    }

    protected function storeFile($file): string
    {
        $directory = 'bkk/partners/'.now()->format('Y/m');
        $name = uniqid().'-'.Str::slug(pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME)).'.'.$file->getClientOriginalExtension();
        Storage::disk('public')->putFileAs($directory, $file, $name);

        return '/storage/'.$directory.'/'.$name;
    }

    protected function deleteFileFromUrl(string $url): void
    {
        if (empty($url)) {
            return;
        }
        $prefix = '/storage/';
        if (str_starts_with($url, $prefix)) {
            Storage::disk('public')->delete(substr($url, strlen($prefix)));
        }
    }
}
