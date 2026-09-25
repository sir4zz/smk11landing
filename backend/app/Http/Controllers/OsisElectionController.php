<?php

namespace App\Http\Controllers;

use App\Models\OsisCandidate;
use App\Models\OsisElection;
use App\Models\OsisVote;
use App\Services\PermissionService;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class OsisElectionController extends Controller
{
    public function __construct(protected PermissionService $permissions)
    {
    }

    // ── STUDENT ───────────────────────────────────────────────────────────

    public function studentStatus(Request $request): JsonResponse
    {
        $user = $request->user();

        if (! $user || ! $this->permissions->isStudent($user)) {
            return response()->json(['error' => ['message' => 'Forbidden.']], 403);
        }

        $election = OsisElection::query()
            ->where('is_visible', true)
            ->with(['candidates' => fn ($q) => $q->orderBy('sort_order')->orderBy('number')])
            ->orderByDesc('updated_at')
            ->first();

        if (! $election) {
            return response()->json([
                'data' => [
                    'election' => null,
                    'candidates' => [],
                    'has_voted' => false,
                    'my_candidate_id' => null,
                ],
                'error' => null,
            ]);
        }

        $vote = OsisVote::query()
            ->where('election_id', $election->id)
            ->where('student_id', $user->id)
            ->first();

        $hasVoted = $vote !== null;
        $candidates = $election->candidates->map(fn (OsisCandidate $c) => $c->toArray());

        if ($hasVoted) {
            $tallies = $this->tallies($election->id);
            $candidates = $candidates->map(function (array $c) use ($tallies) {
                $c['votes'] = $tallies[$c['id']] ?? 0;

                return $c;
            });
        }

        return response()->json([
            'data' => [
                'election' => $election->only(['id', 'title', 'description', 'is_active', 'is_visible']),
                'candidates' => $candidates->values(),
                'has_voted' => $hasVoted,
                'my_candidate_id' => $vote?->candidate_id,
            ],
            'error' => null,
        ]);
    }

    public function vote(Request $request): JsonResponse
    {
        $user = $request->user();

        if (! $user || ! $this->permissions->isStudent($user)) {
            return response()->json(['error' => ['message' => 'Forbidden.']], 403);
        }

        $validated = $request->validate([
            'candidate_id' => ['required', 'string'],
        ]);

        $election = OsisElection::query()->where('is_visible', true)->where('is_active', true)->orderByDesc('updated_at')->first();

        if (! $election) {
            return response()->json(['error' => ['message' => 'Pemilihan OSIS belum dibuka.']], 422);
        }

        $candidate = OsisCandidate::query()
            ->where('id', $validated['candidate_id'])
            ->where('election_id', $election->id)
            ->where('is_active', true)
            ->first();

        if (! $candidate) {
            return response()->json(['error' => ['message' => 'Kandidat tidak ditemukan.']], 422);
        }

        if (OsisVote::query()->where('election_id', $election->id)->where('student_id', $user->id)->exists()) {
            return response()->json(['error' => ['message' => 'Anda sudah memilih.']], 409);
        }

        try {
            DB::transaction(function () use ($election, $candidate, $user) {
                OsisVote::create([
                    'election_id' => $election->id,
                    'candidate_id' => $candidate->id,
                    'student_id' => $user->id,
                ]);
            });
        } catch (UniqueConstraintViolationException) {
            return response()->json(['error' => ['message' => 'Anda sudah memilih.']], 409);
        }

        $tallies = $this->tallies($election->id);
        $candidates = OsisCandidate::query()
            ->where('election_id', $election->id)
            ->orderBy('sort_order')
            ->orderBy('number')
            ->get()
            ->map(function (OsisCandidate $c) use ($tallies) {
                $payload = $c->toArray();
                $payload['votes'] = $tallies[$c->id] ?? 0;

                return $payload;
            })
            ->values();

        return response()->json([
            'data' => [
                'election' => $election->only(['id', 'title', 'description', 'is_active', 'is_visible']),
                'candidates' => $candidates,
                'has_voted' => true,
                'my_candidate_id' => $candidate->id,
            ],
            'error' => null,
        ], 201);
    }

    // ── ADMIN ─────────────────────────────────────────────────────────────

    public function adminIndex(): JsonResponse
    {
        $election = OsisElection::query()
            ->with(['candidates' => fn ($q) => $q->orderBy('sort_order')->orderBy('number')])
            ->orderByDesc('updated_at')
            ->first();

        if (! $election) {
            return response()->json([
                'data' => ['election' => null, 'candidates' => [], 'total_votes' => 0],
                'error' => null,
            ]);
        }

        $tallies = $this->tallies($election->id);
        $candidates = $election->candidates
            ->map(function (OsisCandidate $c) use ($tallies) {
                $payload = $c->toArray();
                $payload['votes'] = $tallies[$c->id] ?? 0;

                return $payload;
            })
            ->values();

        return response()->json([
            'data' => [
                'election' => $election->only(['id', 'title', 'description', 'is_active', 'is_visible']),
                'candidates' => $candidates,
                'total_votes' => array_sum($tallies),
            ],
            'error' => null,
        ]);
    }

    public function storeElection(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['sometimes', 'string'],
            'is_active' => ['sometimes', 'boolean'],
            'is_visible' => ['sometimes', 'boolean'],
        ]);

        $election = OsisElection::create([
            'title' => $validated['title'],
            'description' => $validated['description'] ?? '',
            'is_active' => (bool) ($validated['is_active'] ?? false),
            'is_visible' => (bool) ($validated['is_visible'] ?? false),
        ]);

        return response()->json(['data' => $election, 'error' => null], 201);
    }

    public function updateElection(Request $request, string $id): JsonResponse
    {
        $election = OsisElection::findOrFail($id);

        $validated = $request->validate([
            'title' => ['sometimes', 'string', 'max:255'],
            'description' => ['sometimes', 'string'],
            'is_active' => ['sometimes', 'boolean'],
            'is_visible' => ['sometimes', 'boolean'],
        ]);

        if (array_key_exists('title', $validated)) {
            $election->title = $validated['title'];
        }
        if (array_key_exists('description', $validated)) {
            $election->description = $validated['description'];
        }
        if (array_key_exists('is_active', $validated)) {
            $election->is_active = (bool) $validated['is_active'];
        }
        if (array_key_exists('is_visible', $validated)) {
            $election->is_visible = (bool) $validated['is_visible'];
        }
        $election->save();

        return response()->json(['data' => $election, 'error' => null]);
    }

    public function storeCandidate(Request $request, string $electionId): JsonResponse
    {
        $election = OsisElection::findOrFail($electionId);
        $validated = $this->validateCandidate($request);

        $candidate = OsisCandidate::create([
            'election_id' => $election->id,
            'number' => $validated['number'],
            'name' => $validated['name'],
            'class' => $validated['class'],
            'wakil_name' => $validated['wakil_name'],
            'wakil_class' => $validated['wakil_class'],
            'vision' => $validated['vision'],
            'mission' => $validated['mission'],
            'photo' => $validated['photo'],
            'wakil_photo' => $validated['wakil_photo'],
            'banner_photo' => $validated['banner_photo'],
            'sort_order' => $validated['sort_order'],
            'is_active' => $validated['is_active'],
        ]);

        return response()->json(['data' => $candidate, 'error' => null], 201);
    }

    public function updateCandidate(Request $request, string $electionId, string $candidateId): JsonResponse
    {
        $candidate = OsisCandidate::query()
            ->where('election_id', $electionId)
            ->where('id', $candidateId)
            ->firstOrFail();

        $validated = $this->validateCandidate($request, updating: true);
        $oldPhoto = (string) $candidate->photo;
        $oldWakilPhoto = (string) $candidate->wakil_photo;
        $oldBannerPhoto = (string) $candidate->banner_photo;

        foreach ($validated as $key => $value) {
            $candidate->{$key} = $value;
        }
        $candidate->save();

        $newPhoto = (string) $candidate->photo;
        if ($oldPhoto !== '' && $oldPhoto !== $newPhoto) {
            $this->deleteStoredFile($oldPhoto);
        }
        $newWakilPhoto = (string) $candidate->wakil_photo;
        if ($oldWakilPhoto !== '' && $oldWakilPhoto !== $newWakilPhoto) {
            $this->deleteStoredFile($oldWakilPhoto);
        }
        $newBannerPhoto = (string) $candidate->banner_photo;
        if ($oldBannerPhoto !== '' && $oldBannerPhoto !== $newBannerPhoto) {
            $this->deleteStoredFile($oldBannerPhoto);
        }

        return response()->json(['data' => $candidate, 'error' => null]);
    }

    public function destroyCandidate(string $electionId, string $candidateId): JsonResponse
    {
        $candidate = OsisCandidate::query()
            ->where('election_id', $electionId)
            ->where('id', $candidateId)
            ->firstOrFail();

        $this->deleteStoredFile((string) $candidate->photo);
        $this->deleteStoredFile((string) $candidate->wakil_photo);
        $this->deleteStoredFile((string) $candidate->banner_photo);
        $candidate->delete();

        return response()->json(['data' => null, 'error' => null]);
    }

    // ── HELPERS ───────────────────────────────────────────────────────────

    /**
     * @return array<string, int> candidate_id => vote count
     */
    private function tallies(string $electionId): array
    {
        return OsisVote::query()
            ->where('election_id', $electionId)
            ->select('candidate_id', DB::raw('COUNT(*) as total'))
            ->groupBy('candidate_id')
            ->pluck('total', 'candidate_id')
            ->map(fn ($v) => (int) $v)
            ->all();
    }

    private function validateCandidate(Request $request, bool $updating = false): array
    {
        $validated = $request->validate([
            'number' => [$updating ? 'sometimes' : 'required', 'integer', 'min:1'],
            'name' => [$updating ? 'sometimes' : 'required', 'string', 'max:255'],
            'class' => ['sometimes', 'string', 'max:255'],
            'wakil_name' => ['sometimes', 'string', 'max:255'],
            'wakil_class' => ['sometimes', 'string', 'max:255'],
            'vision' => ['sometimes', 'string'],
            'mission' => ['sometimes', 'string'],
            'photo' => ['sometimes', 'string'],
            'wakil_photo' => ['sometimes', 'string'],
            'banner_photo' => ['sometimes', 'string'],
            'sort_order' => ['sometimes', 'integer'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        if ($updating) {
            // Hanya kirim field yang benar-benar diubah agar tidak mereset kolom lain.
            return $validated;
        }

        return [
            'number' => (int) ($validated['number'] ?? 1),
            'name' => (string) ($validated['name'] ?? ''),
            'class' => (string) ($validated['class'] ?? ''),
            'wakil_name' => (string) ($validated['wakil_name'] ?? ''),
            'wakil_class' => (string) ($validated['wakil_class'] ?? ''),
            'vision' => (string) ($validated['vision'] ?? ''),
            'mission' => (string) ($validated['mission'] ?? ''),
            'photo' => (string) ($validated['photo'] ?? ''),
            'wakil_photo' => (string) ($validated['wakil_photo'] ?? ''),
            'banner_photo' => (string) ($validated['banner_photo'] ?? ''),
            'sort_order' => (int) ($validated['sort_order'] ?? 0),
            'is_active' => (bool) ($validated['is_active'] ?? true),
        ];
    }

    private function deleteStoredFile(?string $url): void
    {
        if (empty($url)) {
            return;
        }

        $path = parse_url($url, PHP_URL_PATH) ?? $url;
        $prefix = '/storage/';
        if (str_starts_with($path, $prefix)) {
            $path = substr($path, strlen($prefix));
        } else {
            if (! str_starts_with($url, '/storage/')) {
                return;
            }
            $path = ltrim($path, '/');
        }

        if ($path !== '') {
            Storage::disk('public')->delete($path);
        }
    }
}
