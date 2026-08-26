<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

/**
 * AI Content Upload Service — Vision-based image analysis for automatic
 * content form population. Uses OpenRouter with a vision-capable model.
 *
 * Images are read from local storage and sent as base64 data URIs because
 * OpenRouter cannot access localhost URLs.
 */
class AIContentUploadService
{
    public const CONTENT_TYPES = [
        'auto' => 'Auto Detect',
        'kegiatan_guru' => 'Kegiatan Guru',
        'kegiatan_siswa' => 'Kegiatan Siswa',
        'galeri' => 'Galeri',
        'prestasi' => 'Prestasi',
        'osis' => 'OSIS',
        'ekstrakurikuler' => 'Ekstrakurikuler',
        'pengumuman' => 'Pengumuman',
        'berita' => 'Berita',
        'mading' => 'Mading',
        'lainnya' => 'Lainnya',
    ];

    private const VISION_MODEL_FALLBACK = 'google/gemma-4-31b-it:free';

    /**
     * Analyze one or more images and return structured content data.
     *
     * @param  array<string>  $imageUrls  Array of /storage/... URLs or full HTTP URLs
     * @param  string         $contentType  'auto' or a specific content type key
     * @return array{title: string, description: string, category: string, content_type: string, date: string|null, location: string|null, tags: string[], caption: string, summary: string, additional_info: string, confidence: array<string,string>}
     */
    public function analyzeImages(array $imageUrls, string $contentType = 'auto'): array
    {
        $key = config('services.openrouter.key');
        if (empty($key)) {
            throw ValidationException::withMessages([
                'message' => 'AI tidak tersedia. OPENROUTER_API_KEY belum dikonfigurasi.',
            ]);
        }

        // Convert images to base64 data URIs so OpenRouter can access them
        $contentParts = [];
        foreach ($imageUrls as $url) {
            $dataUri = $this->urlToDataUri($url);
            if ($dataUri) {
                $contentParts[] = [
                    'type' => 'image_url',
                    'image_url' => ['url' => $dataUri],
                ];
            }
        }

        if (empty($contentParts)) {
            throw ValidationException::withMessages([
                'message' => 'Tidak ada gambar yang berhasil diproses. Pastikan foto valid.',
            ]);
        }

        // Add the text prompt
        $contentParts[] = [
            'type' => 'text',
            'text' => $this->buildAnalysisPrompt($contentType, count($imageUrls)),
        ];

        try {
            $timeout = max(30, min(120, (int) config('services.openrouter.timeout', 60)));
            $connectTimeout = max(5, min($timeout, (int) config('services.openrouter.connect_timeout', 10)));

            $primaryModel = config('services.openrouter.vision_model', self::VISION_MODEL_FALLBACK);
            // Fallback models if primary is rate-limited or fails
            $fallbackModels = [
                'google/gemma-4-26b-a4b-it:free',
                'nvidia/nemotron-nano-12b-v2-vl:free',
                'dots-studio/dots-3-note-preview:free',
            ];
            // Build ordered list: primary first, then fallbacks (skip duplicates)
            $modelsToTry = array_unique(array_merge([$primaryModel], $fallbackModels));

            $lastError = null;
            $response = null;

            foreach ($modelsToTry as $model) {
                Log::info('AI Content Upload: Trying model', [
                    'model' => $model,
                    'image_count' => count($imageUrls),
                ]);

                $response = Http::connectTimeout($connectTimeout)
                    ->timeout($timeout)
                    ->withToken($key)
                    ->withHeaders([
                        'HTTP-Referer' => config('app.url'),
                        'X-Title' => 'SMKN 11 AI Content Upload',
                        'Content-Type' => 'application/json',
                    ])
                    ->post('https://openrouter.ai/api/v1/chat/completions', [
                        'model' => $model,
                        'messages' => [
                            [
                                'role' => 'system',
                                'content' => $this->systemPrompt(),
                            ],
                            [
                                'role' => 'user',
                                'content' => $contentParts,
                            ],
                        ],
                        'max_tokens' => 1500,
                        'temperature' => 0.6,
                    ]);

                if ($response->successful()) {
                    break; // Success, stop trying
                }

                $body = (string) $response->body();
                $errorData = json_decode($body, true);
                $statusCode = $response->status();
                $errorMsg = data_get($errorData, 'error.message', 'Unknown error');

                Log::warning('AI Content Upload: Model failed', [
                    'model' => $model,
                    'status' => $statusCode,
                    'error' => $errorMsg,
                ]);

                $lastError = $errorMsg;

                // If rate-limited (429) or provider error, try next model
                if (in_array($statusCode, [429, 503, 502], true)) {
                    continue;
                }

                // For other errors (403, 400, etc), don't retry with other models
                break;
            }

            if (! $response || ! $response->successful()) {
                $msg = $lastError ?? 'AI gagal menganalisis foto.';
                throw ValidationException::withMessages(['message' => "AI gagal: {$msg}"]);
            }

            $body = $response->json();
            $content = data_get($body, 'choices.0.message.content', '');

            if (! is_string($content) || trim($content) === '') {
                Log::warning('AI Content Upload: empty response', ['body' => $body]);
                throw ValidationException::withMessages([
                    'message' => 'AI tidak menghasilkan analisis. Silakan coba lagi.',
                ]);
            }

            Log::info('AI Content Upload: analysis complete', [
                'response_length' => strlen($content),
            ]);

            return $this->parseAnalysisResult($content);

        } catch (ValidationException $e) {
            throw $e;
        } catch (\Throwable $e) {
            Log::error('AI Content Upload request failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            throw ValidationException::withMessages([
                'message' => 'Gagal terhubung ke AI: '.$e->getMessage(),
            ]);
        }
    }

    /**
     * Convert an image URL/path to a base64 data URI.
     * Supports: /storage/... paths, full HTTP(S) URLs.
     */
    private function urlToDataUri(string $url): ?string
    {
        try {
            $contents = null;
            $mimeType = 'image/jpeg';

            if (str_starts_with($url, 'http://') || str_starts_with($url, 'https://')) {
                // Full URL — download via HTTP
                $response = Http::timeout(15)->get($url);
                if ($response->successful()) {
                    $contents = $response->body();
                    $contentType = $response->header('Content-Type', 'image/jpeg');
                    $mimeType = explode(';', $contentType)[0] ?: 'image/jpeg';
                }
            } else {
                // Local storage path — read from disk
                $path = $url;
                if (str_starts_with($path, '/storage/')) {
                    $path = substr($path, strlen('/storage/'));
                }
                $path = ltrim($path, '/');

                if (Storage::disk('public')->exists($path)) {
                    $contents = Storage::disk('public')->get($path);
                    // Determine mime from extension
                    $ext = strtolower(pathinfo($path, PATHINFO_EXTENSION));
                    $mimeType = match ($ext) {
                        'png' => 'image/png',
                        'gif' => 'image/gif',
                        'webp' => 'image/webp',
                        'svg' => 'image/svg+xml',
                        default => 'image/jpeg',
                    };
                }
            }

            if ($contents === null || $contents === '') {
                Log::warning('AI Content Upload: could not read image', ['url' => $url]);
                return null;
            }

            $base64 = base64_encode($contents);
            return "data:{$mimeType};base64,{$base64}";

        } catch (\Throwable $e) {
            Log::warning('AI Content Upload: failed to convert image', [
                'url' => $url,
                'error' => $e->getMessage(),
            ]);
            return null;
        }
    }

    private function systemPrompt(): string
    {
        return <<<'PROMPT'
Ku adalah AI analis konten visual untuk Admin Panel website sekolah SMKN 11 Kabupaten Tangerang.
Tugasku menganalisis foto/foto yang diunggah oleh admin dan mengisi form konten secara otomatis.

Aturan WAJIB:
1. Analisis seluruh foto sebagai satu kesatuan (bukan per foto).
2. JANGAN mengarang informasi yang tidak terlihat atau tidak dapat disimpulkan dengan yakin dari foto.
3. Jika informasi tidak diketahui, gunakan string kosong "" atau "Perlu dilengkapi admin".
4. Jika foto berisi poster/tulisan, gunakan OCR untuk membaca teks: judul acara, tanggal, waktu, tempat, penyelenggara, kontak, info pendaftaran.
5. Identifikasi jenis konten berdasarkan konteks visual: kegiatan guru, kegiatan siswa, upacara, perlombaan, rapat, seminar, OSIS, ekstrakurikuler, galeri, prestasi, pengumuman, berita, poster/spanduk.
6. Tentukan kategori yang paling sesuai.
7. Buat judul yang deskriptif dan sesuai.
8. Buat deskripsi minimal 2-3 kalimat yang menjelaskan apa yang terlihat.
9. Tag harus relevan dengan isi foto.
10. Caption harus singkat dan menarik.

Output WAJIB berupa JSON valid tanpa teks lain:
{
  "title": "Judul konten",
  "description": "Deskripsi lengkap minimal 2-3 kalimat",
  "category": "Kategori",
  "content_type": "jenis_konten",
  "date": "YYYY-MM-DD atau null",
  "location": "Lokasi atau null",
  "tags": ["tag1", "tag2"],
  "caption": "Caption singkat",
  "summary": "Ringkasan 1 kalimat",
  "additional_info": "Informasi tambahan dari foto atau kosong",
  "confidence": {
    "title": "high",
    "date": "low",
    "location": "medium"
  }
}

Confidence levels: "high" (yakin), "medium" (cukup yakin), "low" (tidak yakin/perlu konfirmasi admin).
PROMPT;
    }

    private function buildAnalysisPrompt(string $contentType, int $imageCount): string
    {
        $typeHint = self::CONTENT_TYPES[$contentType] ?? 'Auto Detect';

        $prompt = "Analisis foto-foto berikut dan hasilkan data konten untuk admin panel.\n\n";
        $prompt .= "Jenis konten yang dipilih: {$typeHint}\n";
        if ($contentType === 'auto') {
            $prompt .= "Tentukan jenis konten otomatis berdasarkan foto.\n";
        }
        $prompt .= "\nJumlah foto: {$imageCount} foto.\n";
        $prompt .= "Analisis seluruh foto sebagai dokumentasi dari satu kegiatan/konten.\n";
        $prompt .= "Jika ada poster/tulisan di foto, baca dan ekstrak informasinya.\n";
        $prompt .= "\nHasilkan JSON sesuai format yang diminta.";

        return $prompt;
    }

    private function parseAnalysisResult(string $text): array
    {
        $text = trim($text);
        $text = preg_replace('/^```(?:json)?\s*/i', '', $text);
        $text = preg_replace('/\s*```$/', '', $text);
        $text = trim($text);

        $decoded = json_decode($text, true);

        if (! is_array($decoded)) {
            if (preg_match('/\{.*\}/s', $text, $matches)) {
                $decoded = json_decode($matches[0], true);
            }
        }

        if (! is_array($decoded)) {
            throw ValidationException::withMessages([
                'message' => 'AI tidak dapat memproses analisis. Silakan coba lagi.',
            ]);
        }

        // Normalize and validate fields
        $defaults = [
            'title' => '',
            'description' => '',
            'category' => '',
            'content_type' => 'lainnya',
            'date' => null,
            'location' => null,
            'tags' => [],
            'caption' => '',
            'summary' => '',
            'additional_info' => '',
            'confidence' => [],
        ];

        $result = [];
        foreach ($defaults as $key => $default) {
            $value = $decoded[$key] ?? $default;

            if ($key === 'tags' && is_array($value)) {
                $result[$key] = array_map('strval', $value);
            } elseif ($key === 'date' && is_string($value) && $value !== '') {
                $result[$key] = preg_match('/^\d{4}-\d{2}-\d{2}$/', $value) ? $value : null;
            } elseif ($key === 'confidence' && is_array($value)) {
                $result[$key] = $value;
            } elseif (is_string($value)) {
                $result[$key] = trim($value);
            } else {
                $result[$key] = $value;
            }
        }

        $validTypes = array_keys(self::CONTENT_TYPES);
        if (! in_array($result['content_type'], $validTypes, true)) {
            $result['content_type'] = 'lainnya';
        }

        return $result;
    }
}
