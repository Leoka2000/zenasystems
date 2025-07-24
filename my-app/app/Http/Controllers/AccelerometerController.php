<?php

namespace App\Http\Controllers;

use App\Models\Accelerometer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class AccelerometerController extends Controller
{
    public function store(Request $request)
    {
        $data = $request->validate([
            'x' => 'required|numeric',
            'y' => 'required|numeric',
            'z' => 'required|numeric',
            'timestamp' => 'required|integer',
        ]);

        Accelerometer::create($data);
        Log::info('Received Accelerometer Data:', $data);

        return response()->json(['message' => 'Accelerometer data stored successfully']);
    }

    public function history(Request $request)
    {
        $range = $request->query('range', 'day');
        $fromTimestamp = match ($range) {
            'day' => now()->subDay()->timestamp,
            'week' => now()->subWeek()->timestamp,
            'month' => now()->subMonth()->timestamp,
            '3months' => now()->subMonths(3)->timestamp,
            default => now()->subDay()->timestamp,
        };

        $data = Accelerometer::where('timestamp', '>=', $fromTimestamp)
            ->orderBy('timestamp')
            ->get(['timestamp', 'x', 'y', 'z'])
            ->map(function ($item) {
                return [
                    'timestamp' => $item->timestamp,
                    'x' => $item->x,
                    'y' => $item->y,
                    'z' => $item->z,
                    'date' => \Carbon\Carbon::createFromTimestamp($item->timestamp)->toISOString()
                ];
            });

        return response()->json($data);
    }
}
