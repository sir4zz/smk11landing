<?php

namespace App\Http\Controllers;

use App\Models\SpmbContent;
use Illuminate\Http\Request;

class SpmbController extends Controller
{
    public function index()
    {
        $content = SpmbContent::query()->orderBy('created_at')->first();

        return response()->json($content);
    }

    public function store(Request $request)
    {
        $payload = $request->all();
        unset($payload['id'], $payload['created_at'], $payload['updated_at']);

        $content = SpmbContent::create($payload);

        return response()->json($content, 201);
    }

    public function update(Request $request, string $id)
    {
        $content = SpmbContent::findOrFail($id);

        $payload = $request->all();
        unset($payload['id'], $payload['created_at'], $payload['updated_at']);

        $content->update($payload);

        return response()->json($content);
    }
}
