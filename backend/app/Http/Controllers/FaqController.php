<?php

namespace App\Http\Controllers;

use App\Models\Faq;

class FaqController extends Controller
{
    public function index()
    {
        return response()->json(Faq::query()->orderBy('sort_order', 'asc')->get());
    }
}
