<?php

namespace App\Http\Controllers;

use App\Models\SdmGuru;
use App\Services\SdmAccountService;
use Illuminate\Http\Request;

/**
 * Admin/operator management of login accounts for imported guru records.
 * Read endpoints are protected by sdm.view, mutations by sdm.edit (routes).
 */
class SdmAccountController extends Controller
{
    public function __construct(protected SdmAccountService $service)
    {
    }

    public function show(Request $request, string $id)
    {
        $guru = SdmGuru::with(['user', 'user.profileRecord', 'user.guru'])->findOrFail($id);

        return response()->json([
            'data' => $this->service->accountSummary($guru),
            'error' => null,
        ]);
    }

    public function store(Request $request, string $id)
    {
        $guru = SdmGuru::with(['user', 'user.profileRecord', 'user.guru'])->findOrFail($id);

        $result = $this->service->createAccount($guru, $request->input('email'), $request->input('password'));

        return response()->json([
            'data' => [
                'account' => $this->service->accountSummary($guru->fresh(['user', 'user.profileRecord', 'user.guru'])),
                'generated_password' => $result['password'],
            ],
            'error' => null,
        ], 201);
    }

    public function update(Request $request, string $id)
    {
        $guru = SdmGuru::with(['user', 'user.profileRecord', 'user.guru'])->findOrFail($id);

        $this->service->updateAccount($guru, $request);

        return response()->json([
            'data' => $this->service->accountSummary($guru->fresh(['user', 'user.profileRecord', 'user.guru'])),
            'error' => null,
        ]);
    }

    public function destroy(Request $request, string $id)
    {
        $guru = SdmGuru::with('user')->findOrFail($id);

        $this->service->unlinkAccount($guru);

        return response()->json(['data' => null, 'error' => null]);
    }
}