<?php

namespace App\Http\Controllers\Customer;

use App\Http\Controllers\Controller;
use App\Http\Requests\CustomerRegisterRequest;
use App\Models\Customer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class AuthController extends Controller
{
    /**
     * Show the login form.
     */
    public function login(Request $request): Response
    {
        // Store intended URL from query parameter if provided
        if ($request->has('intended')) {
            $request->session()->put('intended', $request->input('intended'));
        }

        return Inertia::render('customer/Login');
    }

    /**
     * Handle a login request.
     */
    public function authenticate(Request $request)
    {
        $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required'],
        ]);

        if (Auth::guard('customer')->attempt(
            $request->only('email', 'password'),
            $request->boolean('remember')
        )) {
            $request->session()->regenerate();

            $intended = $request->session()->pull('intended', route('home'));

            return redirect()->to($intended);
        }

        throw ValidationException::withMessages([
            'email' => __('The provided credentials do not match our records.'),
        ]);
    }

    /**
     * Show the registration form.
     */
    public function register(): Response
    {
        return Inertia::render('customer/Register');
    }

    /**
     * Handle a registration request.
     */
    public function store(CustomerRegisterRequest $request)
    {
        $customer = Customer::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
        ]);

        Auth::guard('customer')->login($customer);

        $request->session()->regenerate();

        $intended = $request->session()->pull('intended', route('home'));

        return redirect()->to($intended);
    }

    /**
     * Handle a logout request.
     */
    public function logout(Request $request)
    {
        Auth::guard('customer')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('home');
    }
}
