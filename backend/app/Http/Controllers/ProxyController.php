<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class ProxyController extends Controller
{
    public function fetch(Request $request)
    {
        $data = $request->validate([
            'url' => ['required', 'url'],
        ]);

        $url = $data['url'];

        abort_unless(in_array(strtolower((string) parse_url($url, PHP_URL_SCHEME)), ['http', 'https'], true), 422);

        try {
            $response = Http::timeout(20)
                ->withHeaders([
                    'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36',
                    'Accept' => 'text/html,text/plain,application/xhtml+xml,*/*;q=0.8',
                    'Accept-Language' => 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
                ])
                ->get($url);
        } catch (\Throwable $e) {
            return response()->json([
                'data' => null,
                'error' => ['message' => 'Gagal mengambil URL.'],
            ], 502);
        }

        if (! $response->successful()) {
            return response()->json([
                'data' => null,
                'error' => ['message' => 'HTTP '.$response->status()],
            ], 502);
        }

        return response()->json([
            'data' => [
                'text' => $response->body(),
                'finalUrl' => $response->effectiveUri() ?? $url,
            ],
            'error' => null,
        ]);
    }
}
