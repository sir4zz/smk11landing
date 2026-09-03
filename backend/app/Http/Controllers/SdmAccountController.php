<?php

namespace App\Http\Controllers;

use App\Models\SdmGuru;
use App\Models\SdmTendik;
use App\Services\SdmAccountService;
use Illuminate\Http\Request;

/**
 * Admin/operator management of login accounts for imported SDM records
 * (guru & tenaga kependidikan). Read endpoints are protected by sdm.view,
 * mutations by sdm.edit (routes).
 */
class SdmAccountController extends Controller
{
    public function __construct(protected SdmAccountService $service)
    {
    }

    public function show(Request $request, string $id)
    {
        $person = $this->resolvePerson($id);

        return response()->json([
            'data' => $this->service->accountSummary($person),
            'error' => null,
        ]);
    }

    public function store(Request $request, string $id)
    {
        $person = $this->resolvePerson($id);

        $result = $this->service->createAccount($person, $request->input('email'), $request->input('password'));

        return response()->json([
            'data' => [
                'account' => $this->service->accountSummary($person->fresh(['user', 'user.profileRecord', 'user.guru'])),
                'generated_password' => $result['password'],
            ],
            'error' => null,
        ], 201);
    }

    public function update(Request $request, string $id)
    {
        $person = $this->resolvePerson($id);

        $this->service->updateAccount($person, $request);

        return response()->json([
            'data' => $this->service->accountSummary($person->fresh(['user', 'user.profileRecord', 'user.guru'])),
            'error' => null,
        ]);
    }

    public function destroy(Request $request, string $id)
    {
        $person = $this->resolvePerson($id);

        $this->service->unlinkAccount($person);

        return response()->json(['data' => null, 'error' => null]);
    }

    public function bulkCreate()
    {
        $result = $this->service->bulkCreateAccounts();

        return response()->json([
            'data' => $result,
            'error' => null,
        ]);
    }

    /**
     * Resolve SDM person from either guru or tendik table.
     */
    private function resolvePerson(string $id): SdmGuru|SdmTendik
    {
        $person = SdmGuru::with(['user', 'user.profileRecord', 'user.guru'])->find($id);

        if (! $person) {
            $person = SdmTendik::with(['user', 'user.profileRecord', 'user.guru'])->find($id);
        }

        if (! $person) {
            abort(404, 'Data SDM tidak ditemukan.');
        }

        return $person;
    }
}
