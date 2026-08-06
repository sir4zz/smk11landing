<?php

namespace App\Http\Controllers;

use App\Services\MadingAiService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class MadingAiController extends Controller
{
    public function __construct(protected MadingAiService $ai)
    {
    }

    protected function authorizeUse(Request $request): void
    {
        $user = $request->user();

        if (! $this->ai->canUse($user)) {
            abort(403, 'Forbidden');
        }
    }

    public function generate(Request $request)
    {
        $this->authorizeUse($request);

        $data = $request->validate([
            'content_type' => ['required', Rule::in(MadingAiService::CONTENT_TYPES)],
            'topic' => ['required', 'string', 'max:500'],
            'style' => ['sometimes', 'string', 'max:100'],
            'length' => ['sometimes', Rule::in(MadingAiService::LENGTHS)],
            'context' => ['sometimes', 'string', 'max:2000'],
        ]);

        return $this->result(fn () => $this->ai->generate($request->user(), $data));
    }

    public function improve(Request $request)
    {
        $this->authorizeUse($request);

        $data = $request->validate([
            'content' => ['required', 'string', 'min:10', 'max:20000'],
            'content_type' => ['sometimes', 'string', 'max:100'],
            'style' => ['sometimes', 'string', 'max:100'],
        ]);

        return $this->result(fn () => $this->ai->improve($request->user(), $data));
    }

    public function shorten(Request $request)
    {
        $this->authorizeUse($request);

        $data = $request->validate([
            'content' => ['required', 'string', 'min:10', 'max:20000'],
            'content_type' => ['sometimes', 'string', 'max:100'],
        ]);

        return $this->result(fn () => $this->ai->shorten($request->user(), $data));
    }

    public function expand(Request $request)
    {
        $this->authorizeUse($request);

        $data = $request->validate([
            'content' => ['required', 'string', 'min:10', 'max:20000'],
            'content_type' => ['sometimes', 'string', 'max:100'],
            'style' => ['sometimes', 'string', 'max:100'],
        ]);

        return $this->result(fn () => $this->ai->expand($request->user(), $data));
    }

    public function changeStyle(Request $request)
    {
        $this->authorizeUse($request);

        $data = $request->validate([
            'content' => ['required', 'string', 'min:10', 'max:20000'],
            'style' => ['required', 'string', 'max:100'],
            'content_type' => ['sometimes', 'string', 'max:100'],
        ]);

        return $this->result(fn () => $this->ai->changeStyle($request->user(), $data));
    }

    public function generateIdeas(Request $request)
    {
        $this->authorizeUse($request);

        $data = $request->validate([
            'topic' => ['required', 'string', 'max:500'],
            'target' => ['sometimes', 'string', 'max:300'],
        ]);

        return $this->result(fn () => $this->ai->generateIdeas($request->user(), $data));
    }

    protected function result(callable $work)
    {
        try {
            return response()->json(['data' => $work(), 'error' => null]);
        } catch (ValidationException $e) {
            return response()->json(['error' => $e->errors()], 422);
        }
    }
}
