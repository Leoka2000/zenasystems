<?php

namespace App\Http\Controllers;

use App\Models\Temperature;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class TemperatureController extends Controller
{
    public function store(Request $request)
    {
        $data = $request->validate([
            'temperature' => 'required|numeric',
            'timestamp' => 'required|integer',
        ]);

        Temperature::create($data);

        // Store in DB or just log it for now
        Log::info('Received Temperature Data:', $data);

        return response()->json(['message' => 'Data received successfully']);
    }
}
