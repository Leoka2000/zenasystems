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

    public function history(Request $request)
    {
        $range = $request->query('range', 'day'); // default to 'day'

        $fromTimestamp = match ($range) {
            'day' => now()->subDay()->timestamp,
            'week' => now()->subWeek()->timestamp,
            'month' => now()->subMonth()->timestamp,
            '3months' => now()->subMonths(3)->timestamp,
            default => now()->subDay()->timestamp,
        };

        $data = Temperature::where('timestamp', '>=', $fromTimestamp)
            ->orderBy('timestamp')
            ->get(['timestamp', 'temperature'])
            ->map(function ($item) {
                return [
                    'timestamp' => $item->timestamp,
                    'temperature' => $item->temperature,
                    'date' => \Carbon\Carbon::createFromTimestamp($item->timestamp)->toISOString()
                ];
            });

        return response()->json($data);
    }
}
