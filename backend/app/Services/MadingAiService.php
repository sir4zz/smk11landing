<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

/**
 * Server-side AI Content Assistant for Mading.
 *
 * All calls go through OpenRouter using the project's server-side key
 * (OPENROUTER_API_KEY). The key never reaches the browser.
 */
class MadingAiService
{
    public const CONTENT_TYPES = [
        'Puisi', 'Cerpen', 'Artikel', 'Pantun', 'Esai', 'Opini',
        'Motivasi', 'Edukasi', 'Tips', 'Pengumuman', 'Konten Kreatif',
    ];

    public const STYLES = ['Formal', 'Santai', 'Inspiratif', 'Edukatif', 'Persuasif', 'Kreatif'];

    public const LENGTHS = ['Pendek', 'Sedang', 'Panjang'];

    private const LENGTH_TOKENS = ['Pendek' => 500, 'Sedang' => 900, 'Panjang' => 1600];

    private const RATE_LIMITS = ['student' => 30, 'guru' => 60, 'osis' => 60, 'admin' => 300];

    public function __construct(protected PermissionService $permissions)
    {
    }

    /**
     * Students may use AI for their Mading works; staff need mading.ai_generate.
     */
    public function canUse(?User $user): bool
    {
        if (! $user) {
            return false;
        }

        return $this->permissions->isStudent($user)
            || $this->permissions->hasPermission($user, 'mading.ai_generate');
    }

    public function assertRateLimit(User $user): void
    {
        $role = $user->profileRecord?->role ?? 'student';
        $limit = self::RATE_LIMITS[$role] ?? self::RATE_LIMITS['student'];

        $key = 'mading_ai:'.$user->id.':'.now()->format('Y-m-d');

        if (Cache::has($key)) {
            $used = (int) Cache::get($key);
            if ($used >= $limit) {
                throw ValidationException::withMessages([
                    'message' => 'Batas penggunaan AI untuk hari ini sudah tercapai. Silakan coba lagi besok.',
                ]);
            }
            Cache::increment($key);
        } else {
            Cache::put($key, 1, now()->endOfDay());
        }
    }

    // ---------- ACTIONS ----------

    public function generate(User $user, array $input): array
    {
        $this->assertRateLimit($user);

        $type = $input['content_type'];
        $topic = trim((string) ($input['topic'] ?? ''));
        $style = $input['style'] ?? 'Santai';
        $length = $input['length'] ?? 'Sedang';
        $context = trim((string) ($input['context'] ?? ''));

        $prompt = "Jenis konten: {$type}\n";
        $prompt .= "Topik: {$topic}\n";
        $prompt .= "Gaya bahasa: {$style}\n";
        $prompt .= "Panjang: {$length}\n";
        if ($context !== '') {
            $prompt .= "Konteks tambahan: {$context}\n";
        }

        return $this->runStructured($prompt, self::LENGTH_TOKENS[$length] ?? 900);
    }

    public function improve(User $user, array $input): array
    {
        $this->assertRateLimit($user);

        $content = trim((string) ($input['content'] ?? ''));
        if ($content === '') {
            throw ValidationException::withMessages(['content' => 'Tidak ada isi yang dapat diperbaiki.']);
        }

        $prompt = "Perbaiki tulisan berikut ini tanpa mengubah maksud utama. Perbaiki tata bahasa, ejaan, tanda baca, struktur kalimat, dan alur, tetapi tetap pertahankan ide pokok penulis.\n\nIsi saat ini:\n\"\"\"\n{$content}\n\"\"\"\n\nJenis konten: ".($input['content_type'] ?? 'Konten kreatif')."\nGaya bahasa: ".($input['style'] ?? 'Santai');

        return $this->runStructured($prompt, 1200);
    }

    public function shorten(User $user, array $input): array
    {
        $this->assertRateLimit($user);

        $content = trim((string) ($input['content'] ?? ''));
        if ($content === '') {
            throw ValidationException::withMessages(['content' => 'Tidak ada isi yang dapat diringkas.']);
        }

        $prompt = "Ringkas tulisan berikut secara signifikan namun tetap mempertahankan pesan dan informasi pentingnya.\n\nIsi saat ini:\n\"\"\"\n{$content}\n\"\"\"\n\nJenis konten: ".($input['content_type'] ?? 'Konten kreatif');

        return $this->runStructured($prompt, 600);
    }

    public function expand(User $user, array $input): array
    {
        $this->assertRateLimit($user);

        $content = trim((string) ($input['content'] ?? ''));
        if ($content === '') {
            throw ValidationException::withMessages(['content' => 'Tidak ada isi yang dapat dikembangkan.']);
        }

        $prompt = "Kembangkan tulisan berikut menjadi lebih lengkap dan mendetail, tetap dengan topik dan maksud yang sama. Tambahkan penjelasan, contoh, atau sub-poin yang relevan dan sesuai konteks sekolah.\n\nIsi saat ini:\n\"\"\"\n{$content}\n\"\"\"\n\nJenis konten: ".($input['content_type'] ?? 'Konten kreatif')."\nGaya bahasa: ".($input['style'] ?? 'Santai');

        return $this->runStructured($prompt, 1400);
    }

    public function changeStyle(User $user, array $input): array
    {
        $this->assertRateLimit($user);

        $content = trim((string) ($input['content'] ?? ''));
        if ($content === '') {
            throw ValidationException::withMessages(['content' => 'Tidak ada isi yang dapat diubah gayanya.']);
        }

        $style = $input['style'] ?? 'Formal';

        $prompt = "Ubah gaya penulisan tulisan berikut menjadi gaya '{$style}' tanpa mengubah maksud dan informasi utamanya.\n\nIsi saat ini:\n\"\"\"\n{$content}\n\"\"\"\n\nJenis konten: ".($input['content_type'] ?? 'Konten kreatif');

        return $this->runStructured($prompt, 1200);
    }

    public function generateIdeas(User $user, array $input): array
    {
        $this->assertRateLimit($user);

        $topic = trim((string) ($input['topic'] ?? ''));
        $target = trim((string) ($input['target'] ?? 'siswa SMK'));

        if ($topic === '') {
            throw ValidationException::withMessages(['topic' => 'Topik ide wajib diisi.']);
        }

        $prompt = "Topik: {$topic}\nTarget pembaca: {$target}\n\nBerikan 6 ide konten Mading yang menarik. Setiap ide memiliki judul, deskripsi singkat, dan jenis konten.";

        $json = $this->chat($this->systemPrompt(), $prompt, 1000, 'ide');
        $data = $this->parseJson($json);

        $ideas = $data['ideas'] ?? $data['result'] ?? [];

        if (! is_array($ideas) || count($ideas) === 0) {
            throw ValidationException::withMessages(['message' => 'AI tidak dapat menghasilkan ide saat ini.']);
        }

        $normalized = [];
        foreach ($ideas as $idea) {
            if (! is_array($idea)) {
                continue;
            }
            $normalized[] = [
                'title' => (string) ($idea['title'] ?? $idea['judul'] ?? ''),
                'description' => (string) ($idea['description'] ?? $idea['deskripsi'] ?? ''),
                'category' => (string) ($idea['category'] ?? $idea['jenis'] ?? $idea['content_type'] ?? ''),
            ];
        }

        if (count($normalized) === 0) {
            throw ValidationException::withMessages(['message' => 'AI tidak dapat menghasilkan ide saat ini.']);
        }

        return ['ideas' => $normalized];
    }

    // ---------- INTERNALS ----------

    protected function runStructured(string $prompt, int $maxTokens): array
    {
        $json = $this->chat($this->systemPrompt(), $prompt, $maxTokens, 'konten');
        $data = $this->parseJson($json);

        $title = trim((string) ($data['title'] ?? ''));
        $content = trim((string) ($data['content'] ?? $data['isi'] ?? ''));
        $category = trim((string) ($data['category'] ?? $data['kategori'] ?? ''));
        $excerpt = trim((string) ($data['excerpt'] ?? $data['ringkasan'] ?? ''));

        if ($content === '') {
            $content = trim((string) $data['result']);
        }
        if ($content === '') {
            throw ValidationException::withMessages(['message' => 'AI tidak dapat memproses permintaan saat ini.']);
        }

        return [
            'title' => $title,
            'content' => $content,
            'category' => $category,
            'excerpt' => $excerpt,
        ];
    }

    protected function systemPrompt(): string
    {
        return <<<'PROMPT'
Kamu adalah AI Content Assistant untuk Mading (Majalah Dinding) SMKN 11 Kabupaten Tangerang.
Tugasmu membantu siswa, guru, OSIS, dan admin sekolah membuat serta mengembangkan karya tulis untuk Mading sekolah.

Konteks sekolah:
- Nama sekolah: SMKN 11 Kabupaten Tangerang
- Target pembaca: siswa SMK, guru, staf sekolah, orang tua, dan pengunjung website
- Konteks konten yang relevan: pendidikan, sekolah, teknologi, organisasi siswa, OSIS, ekstrakurikuler, kesemaptaan, prestasi, kegiatan sekolah, dunia industri, karier, pengembangan diri, dan kehidupan siswa.

Aturan WAJIB yang harus dipatuhi:
1. Kamu adalah asisten penulisan, bukan pengganti penulis. Hasilkan draft yang masih bisa diedit oleh pengguna.
2. JANGAN PERNAH mengarang fakta sekolah: nama guru, nama kepala sekolah, nama siswa, prestasi sekolah, jadwal sekolah, alamat, data organisasi, nama ekstrakurikuler, atau informasi resmi lainnya. Jika pengguna meminta informasi faktual tetapi datanya tidak tersedia, katakan bahwa informasi tersebut perlu diberikan oleh pengguna atau diambil dari data yang tersedia.
3. Gunakan bahasa Indonesia yang baik, sopan, dan sesuai dengan lingkungan sekolah serta usia siswa.
4. Tolak atau arahkan ulang permintaan yang berbahaya, berisi kebencian, bernuansa seksual, pelecehan, kekerasan di luar konteks edukasi, penipuan, ilegal, atau tidak pantas untuk lingkungan sekolah.
5. Kamu tidak boleh mempublikasikan, menyetujui, atau mengirim konten untuk review. Kamu hanya menghasilkan atau memodifikasi draft.
6. Sesuaikan format output dengan jenis konten:
   - Puisi & Pantun: hasilkan bait-bait yang indah dengan tema yang diminta.
   - Cerpen: pembuka, konflik, klimaks, penyelesaian.
   - Artikel/Esai/Opini: judul, pembuka, isi dengan subjudul, penjelasan, kesimpulan.
   - Pengumuman: judul, ringkasan, detail, tanggal, tempat, informasi penting, ajakan bertindak. Jangan mengarang tanggal/tempat jika belum diberikan.
   - Tips/Edukasi/Motivasi: poin-poin yang jelas dan inspiratif.

Format output (WAJIB JSON, tanpa teks lain di luar JSON):
{"title":"judul yang menarik","content":"isi lengkap karya dalam bahasa Indonesia","category":"jenis konten","excerpt":"ringkasan singkat 1-2 kalimat"}
PROMPT;
    }

    protected function chat(string $system, string $userPrompt, int $maxTokens, string $mode): string
    {
        $key = config('services.openrouter.key');

        if (empty($key)) {
            Log::warning('Mading AI: OPENROUTER_API_KEY belum dikonfigurasi.');
            throw ValidationException::withMessages(['message' => 'AI tidak dapat memproses permintaan saat ini.']);
        }

        $model = config('services.openrouter.model', 'openai/gpt-4o-mini');

        $instruction = $mode === 'ide'
            ? 'Format output (WAJIB JSON, tanpa teks lain di luar JSON): {"ideas":[{"title":"judul ide","description":"deskripsi singkat","category":"jenis konten"}]}'
            : 'Ikuti format output JSON yang sudah dijelaskan di system prompt.';

        try {
            // The editor requires the generated draft in this response, so queueing would
            // change the frontend contract. Keep the synchronous fallback bounded instead;
            // add a job-status API before moving this work to a queue.
            $timeout = max(1, min(30, (int) config('services.openrouter.timeout', 20)));
            $connectTimeout = max(1, min($timeout, (int) config('services.openrouter.connect_timeout', 5)));

            $response = Http::connectTimeout($connectTimeout)
                ->timeout($timeout)
                ->withToken($key)
                ->withHeaders([
                    'HTTP-Referer' => config('app.url'),
                    'X-Title' => 'SMKN 11 Mading AI',
                    'Content-Type' => 'application/json',
                ])
                ->post('https://openrouter.ai/api/v1/chat/completions', [
                    'model' => $model,
                    'messages' => [
                        ['role' => 'system', 'content' => $system],
                        ['role' => 'user', 'content' => $userPrompt."\n\n".$instruction],
                    ],
                    'max_tokens' => $maxTokens,
                    'temperature' => 0.8,
                ]);

            if (! $response->successful()) {
                Log::warning('Mading AI upstream error', [
                    'status' => $response->status(),
                    'body' => substr((string) $response->body(), 0, 500),
                ]);
                throw ValidationException::withMessages(['message' => 'AI tidak dapat memproses permintaan saat ini.']);
            }

            $content = data_get($response->json(), 'choices.0.message.content', '');

            if (! is_string($content) || trim($content) === '') {
                throw ValidationException::withMessages(['message' => 'AI tidak dapat memproses permintaan saat ini.']);
            }

            return $content;
        } catch (ValidationException $e) {
            throw $e;
        } catch (\Throwable $e) {
            Log::error('Mading AI request failed', ['error' => $e->getMessage()]);
            throw ValidationException::withMessages(['message' => 'AI tidak dapat memproses permintaan saat ini.']);
        }
    }

    protected function parseJson(string $text): array
    {
        $text = trim($text);
        $text = preg_replace('/^```(?:json)?\s*/i', '', $text);
        $text = preg_replace('/\s*```$/', '', $text);
        $text = trim($text);

        $decoded = json_decode($text, true);
        if (is_array($decoded)) {
            return $decoded;
        }

        if (preg_match('/\{.*\}/s', $text, $matches)) {
            $decoded = json_decode($matches[0], true);
            if (is_array($decoded)) {
                return $decoded;
            }
        }

        if (preg_match('/\[.*\]/s', $text, $matches)) {
            $decoded = json_decode($matches[0], true);
            if (is_array($decoded)) {
                return ['ideas' => $decoded];
            }
        }

        return [];
    }
}
