<?php

use App\Http\Controllers\TemperatureController;
use Illuminate\Support\Facades\Route;

Route::post('/temperature', [TemperatureController::class, 'store']);
Route::get('/temperatures', [TemperatureController::class, 'history']);
