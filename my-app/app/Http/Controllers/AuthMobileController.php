<?php

namespace App\Http\Controllers;

use App\Models\User;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthMobileController extends Controller
{
    function Register(Request $R)
    {
        try {
            $cred = new User();
            $cred->name = $R->name;
            $cred->email = $R->email;
            $cred->password = Hash::make($R->password);
            $cred->save();
            $response = ['status' => 200, 'message' => 'Register Successfully! Welcome to Our Community'];
            return response()->json($response);
        } catch (Exception $e) {
            $response = ['status' => 500, 'message' => $e];
        }
    }

    function Login(Request $R)
    {
        $user = User::where('email', $R->email)->first();

        if (!$user) {
            return response()->json([
                'status' => 404,
                'message' => 'No account found with this email'
            ]);
        }

        if (!Hash::check($R->password, $user->password)) {
            return response()->json([
                'status' => 401,
                'message' => 'Wrong email or password! please try again'
            ]);
        }

        $token = $user->createToken('Personal Access Token')->plainTextToken;
        return response()->json([
            'status' => 200,
            'token' => $token,
            'user' => $user,
            'message' => 'Successfully Login! Welcome Back'
        ]);
    }
}
