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
          
            $R->validate([
                'name' => 'required|string|max:255',
                'email' => 'required|email|unique:users,email',
                'password' => 'required|string|min:6|confirmed',
            ]);

            $cred = new User();
            $cred->name = $R->name;
            $cred->email = $R->email;
            $cred->password = Hash::make($R->password);
            $cred->save();

            return response()->json([
                'status' => 200,
                'message' => 'Register Successfully! Welcome to Our Community'
            ]);
        } catch (Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'An error occurred while registering',
                'error' => $e->getMessage(),
            ]);
        }
    }

    function Login(Request $R)
    {
        try {
            // Validate request
            $R->validate([
                'email' => 'required|email',
                'password' => 'required|string'
            ]);

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
                    'message' => 'Wrong email or password! Please try again'
                ]);
            }

            $token = $user->createToken('Personal Access Token')->plainTextToken;

            return response()->json([
                'status' => 200,
                'token' => $token,
                'user' => [
                    'name' => $user->name,
                    'email' => $user->email,
                ],
                'message' => 'Successfully Login! Welcome Back'
            ]);
        } catch (Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'An error occurred during login',
                'error' => $e->getMessage(),
            ]);
        }
    }
}
