<?php

use App\Http\Controllers\TemperatureController;
use App\Http\Controllers\AuthMobileController;
use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;



Route::post('/temperature', [TemperatureController::class, 'store']);
Route::get('/temperatures', [TemperatureController::class, 'history']);


Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

Route::post('/register', [AuthMobileController::class, 'Register']);
Route::post('/login', [AuthMobileController::class, 'login']);
