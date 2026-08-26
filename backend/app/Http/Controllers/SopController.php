<?php

namespace App\Http\Controllers;

use App\Models\Sop;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class SopController extends Controller
{
    private const DISK = 'local';
    private const DIRECTORY = 'sop';

    public function index()
    {
        $sops = Sop::query()
            ->where('is_published', true)
            ->orderBy('sort_order')
            ->orderBy('title')
            ->get(['id', 'title', 'slug', 'description', 'category', 'sort_order', 'updated_at']);

        return response()->json(['data' => $sops, 'error' => null]);
    }

    public function adminIndex()
    {
        return response()->json([
            'data' => Sop::query()->orderBy('sort_order')->orderByDesc('created_at')->get(),
            'error' => null,
        ]);
    }

    public function store(Request $request)
    {
        $data = $this->validated($request, true);
        unset($data['file']);
        $data['slug'] = $this->uniqueSlug($data['slug'] ?: Str::slug($data['title']) ?: 'sop');
        $data['file_path'] = $this->storePdf($request);
        $data['is_published'] = $request->boolean('is_published');

        $sop = Sop::create($data);
        return response()->json(['data' => $sop, 'error' => null], 201);
    }

    public function update(Request $request, string $id)
    {
        $sop = Sop::findOrFail($id);
        $data = $this->validated($request, false);
        unset($data['file']);
        $oldFile = null;

        if (array_key_exists('title', $data) && ! array_key_exists('slug', $data)) {
            $data['slug'] = $this->uniqueSlug(Str::slug($data['title']) ?: 'sop', $sop->id);
        } elseif (! empty($data['slug'])) {
            $data['slug'] = $this->uniqueSlug($data['slug'], $sop->id);
        }

        if ($request->hasFile('file')) {
            $data['file_path'] = $this->storePdf($request);
            $oldFile = $sop->file_path;
        }
        if ($request->has('is_published')) {
            $data['is_published'] = $request->boolean('is_published');
        }

        $sop->update($data);
        if ($oldFile) Storage::disk(self::DISK)->delete($oldFile);

        return response()->json(['data' => $sop->fresh(), 'error' => null]);
    }

    public function destroy(string $id)
    {
        $sop = Sop::findOrFail($id);
        $path = $sop->file_path;
        $sop->delete();
        Storage::disk(self::DISK)->delete($path);

        return response()->json(['data' => null, 'error' => null]);
    }

    /** Stream a published PDF through Laravel without revealing its disk path. */
    public function view(string $slug)
    {
        $sop = Sop::query()->where('slug', $slug)->where('is_published', true)->firstOrFail();
        return $this->pdfResponse($sop);
    }

    /** Admin-only preview supports drafts while retaining the same private storage boundary. */
    public function preview(string $id)
    {
        return $this->pdfResponse(Sop::findOrFail($id));
    }

    private function pdfResponse(Sop $sop)
    {
        $disk = Storage::disk(self::DISK);
        if (! $disk->exists($sop->file_path)) {
            abort(404, 'File SOP tidak tersedia.');
        }

        $filename = Str::slug($sop->title) ?: 'dokumen-sop';
        return response()->stream(function () use ($disk, $sop) {
            $stream = $disk->readStream($sop->file_path);
            if ($stream === false) return;
            fpassthru($stream);
            fclose($stream);
        }, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'inline; filename="'.$filename.'.pdf"',
            'Content-Length' => (string) $disk->size($sop->file_path),
            'Cache-Control' => 'private, no-store, max-age=0',
            'Pragma' => 'no-cache',
            'X-Content-Type-Options' => 'nosniff',
            'X-Frame-Options' => 'SAMEORIGIN',
        ]);
    }

    private function validated(Request $request, bool $creating): array
    {
        $rules = [
            'title' => [$creating ? 'required' : 'sometimes', 'string', 'max:255'],
            'slug' => ['sometimes', 'nullable', 'string', 'max:255'],
            'description' => ['sometimes', 'nullable', 'string', 'max:3000'],
            'category' => ['sometimes', 'nullable', 'string', 'max:100'],
            'sort_order' => ['sometimes', 'integer', 'min:0', 'max:999999'],
            'is_published' => ['sometimes', 'boolean'],
            'file' => [$creating ? 'required' : 'sometimes', 'file', 'mimes:pdf', 'max:20480'],
        ];
        return $request->validate($rules);
    }

    private function storePdf(Request $request): string
    {
        $file = $request->file('file');
        if (! $file || $file->getMimeType() !== 'application/pdf') {
            throw ValidationException::withMessages(['file' => 'File harus berupa PDF yang valid.']);
        }
        return $file->storeAs(self::DIRECTORY, Str::uuid().'.pdf', self::DISK);
    }

    private function uniqueSlug(string $value, ?string $ignoreId = null): string
    {
        $base = Str::slug($value) ?: 'sop';
        $slug = $base;
        $suffix = 2;
        while (Sop::query()->where('slug', $slug)->when($ignoreId, fn ($q) => $q->where('id', '!=', $ignoreId))->exists()) {
            $slug = $base.'-'.$suffix++;
        }
        return $slug;
    }
}
