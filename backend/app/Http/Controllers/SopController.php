<?php

namespace App\Http\Controllers;

use App\Models\Sop;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class SopController extends Controller
{
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
            'data' => Sop::query()->orderBy('sort_order')->orderByDesc('created_at')->get(['id', 'title', 'slug', 'description', 'category', 'drive_url', 'drive_file_id', 'is_published', 'sort_order', 'created_at', 'updated_at']),
            'error' => null,
        ]);
    }

    public function store(Request $request)
    {
        $data = $this->validated($request, true);
        $data['drive_file_id'] = $this->driveFileId($data['drive_url']);
        $data['slug'] = $this->uniqueSlug($data['slug'] ?: Str::slug($data['title']) ?: 'sop');
        $data['is_published'] = $request->boolean('is_published');

        $sop = Sop::create($data);
        return response()->json(['data' => $sop, 'error' => null], 201);
    }

    public function update(Request $request, string $id)
    {
        $sop = Sop::findOrFail($id);
        $data = $this->validated($request, false);

        if (array_key_exists('title', $data) && ! array_key_exists('slug', $data)) {
            $data['slug'] = $this->uniqueSlug(Str::slug($data['title']) ?: 'sop', $sop->id);
        } elseif (! empty($data['slug'])) {
            $data['slug'] = $this->uniqueSlug($data['slug'], $sop->id);
        }

        if (array_key_exists('drive_url', $data)) $data['drive_file_id'] = $this->driveFileId($data['drive_url']);
        if ($request->has('is_published')) {
            $data['is_published'] = $request->boolean('is_published');
        }

        $sop->update($data);
        return response()->json(['data' => $sop->fresh(), 'error' => null]);
    }

    public function destroy(string $id)
    {
        $sop = Sop::findOrFail($id);
        $sop->delete();

        return response()->json(['data' => null, 'error' => null]);
    }

    /** Return a Google Drive embed URL; the PDF itself never passes through this server. */
    public function view(string $slug)
    {
        $sop = Sop::query()->where('slug', $slug)->where('is_published', true)->firstOrFail();
        return response()->json(['data' => $this->viewerData($sop), 'error' => null]);
    }

    /** Admin-only preview supports drafts. */
    public function preview(string $id)
    {
        return response()->json(['data' => $this->viewerData(Sop::findOrFail($id)), 'error' => null]);
    }

    private function viewerData(Sop $sop): array
    {
        if (! $sop->drive_file_id) abort(404, 'Link Google Drive SOP belum tersedia.');
        return ['title' => $sop->title, 'embed_url' => 'https://drive.google.com/file/d/'.$sop->drive_file_id.'/preview?rm=minimal'];
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
            'drive_url' => [$creating ? 'required' : 'sometimes', 'string', 'url', 'max:1000'],
        ];
        $data = $request->validate($rules);
        if (isset($data['drive_url'])) $this->driveFileId($data['drive_url']);
        return $data;
    }

    private function driveFileId(string $url): string
    {
        $parsed = parse_url(trim($url));
        $host = strtolower($parsed['host'] ?? '');
        if (! in_array($host, ['drive.google.com', 'www.drive.google.com', 'docs.google.com'], true)) {
            throw ValidationException::withMessages(['drive_url' => 'URL harus berasal dari Google Drive.']);
        }
        $path = $parsed['path'] ?? '';
        $id = null;
        if (preg_match('~/(?:file/d|document/d)/([A-Za-z0-9_-]+)~', $path, $match)) $id = $match[1];
        $query = [];
        if (! $id && ! empty($parsed['query'])) parse_str($parsed['query'], $query);
        if (! $id && isset($query['id']) && is_string($query['id'])) $id = $query['id'];
        if (! is_string($id) || ! preg_match('/^[A-Za-z0-9_-]{10,200}$/', $id)) {
            throw ValidationException::withMessages(['drive_url' => 'URL Google Drive tidak valid atau File ID tidak dapat diekstrak. Gunakan link berbagi file, misalnya https://drive.google.com/file/d/FILE_ID/view.']);
        }
        return $id;
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
