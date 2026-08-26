<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Http;

class WhatsAppAdminController extends Controller
{
    private function serviceRequest()
    {
        return Http::connectTimeout(config('services.whatsapp.connect_timeout'))
            ->timeout(config('services.whatsapp.timeout'))
            ->when(config('services.whatsapp.token') !== '', function ($http) {
                $http->withHeaders(['x-wa-token' => config('services.whatsapp.token')]);
            });
    }

    private function serviceUrl(string $path): string
    {
        return rtrim(config('services.whatsapp.url'), '/') . $path;
    }

    public function status(): JsonResponse
    {
        try {
            $response = $this->serviceRequest()->get($this->serviceUrl('/status'));

            if (!$response->successful()) {
                throw new \Exception('WhatsApp service merespons dengan error.');
            }

            return response()->json(['data' => $response->json(), 'error' => null]);
        } catch (\Throwable $e) {
            return response()->json([
                'data' => [
                    'ok' => false,
                    'connected' => false,
                    'connectedAs' => null,
                    'hasQr' => false,
                    'offline' => true,
                ],
                'error' => ['message' => 'WhatsApp service tidak berjalan. Jalankan `npm run server` di server.'],
            ]);
        }
    }

    public function qr(): JsonResponse
    {
        if (!config('services.whatsapp.enabled')) {
            return response()->json(['data' => null, 'error' => ['message' => 'Fitur WhatsApp sedang dimatikan.']], 403);
        }

        try {
            $response = $this->serviceRequest()->get($this->serviceUrl('/qr'));

            if (!$response->successful()) {
                return response()->json([
                    'data' => null,
                    'error' => ['message' => $response->json('error') ?? 'QR belum tersedia, coba lagi.'],
                ], 503);
            }

            return response()->json(['data' => $response->json(), 'error' => null]);
        } catch (\Throwable $e) {
            return response()->json(['data' => null, 'error' => ['message' => 'WhatsApp service tidak berjalan.']], 503);
        }
    }

    public function logout(): JsonResponse
    {
        try {
            $response = $this->serviceRequest()->post($this->serviceUrl('/logout'));

            if (!$response->successful()) {
                return response()->json([
                    'data' => null,
                    'error' => ['message' => $response->json('error') ?? 'Gagal menghapus session WhatsApp.'],
                ], 500);
            }

            return response()->json(['data' => ['ok' => true], 'error' => null]);
        } catch (\Throwable $e) {
            return response()->json(['data' => null, 'error' => ['message' => 'WhatsApp service tidak berjalan.']], 503);
        }
    }
}
