<?php

namespace App\Http\Controllers;

use App\Services\AdminConfigService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AdminConfigController extends Controller
{
    public function __construct(
        protected AdminConfigService $adminConfigService
    ) {
    }

    /**
     * Display the admin config management page.
     */
    public function index(): Response
    {
        $configs = $this->adminConfigService->getAll();

        return Inertia::render('AdminConfig/Index', [
            'configs' => $configs,
        ]);
    }

    /**
     * Update admin config values.
     */
    public function update(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'configs' => 'required|array',
            'configs.*' => 'required|string',
        ]);

        $this->adminConfigService->updateMany($validated['configs']);

        return redirect()
            ->route('admin.config.index')
            ->with('success', 'Configuration updated successfully.');
    }
}
