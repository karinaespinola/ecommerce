<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;

class AdminConfigService
{
    /**
     * Get all admin config entries.
     */
    public function getAll(): array
    {
        return DB::table('admin_config')
            ->orderBy('key')
            ->get()
            ->mapWithKeys(function ($item) {
                return [$item->key => $item->value];
            })
            ->toArray();
    }

    /**
     * Get a config value by key.
     */
    public function get(string $key, ?string $default = null): ?string
    {
        $config = DB::table('admin_config')
            ->where('key', $key)
            ->first();

        return $config?->value ?? $default;
    }

    /**
     * Set or update a config value.
     */
    public function set(string $key, string $value): void
    {
        $exists = DB::table('admin_config')->where('key', $key)->exists();
        
        DB::table('admin_config')->updateOrInsert(
            ['key' => $key],
            array_merge(
                [
                    'value' => $value,
                    'updated_at' => now(),
                ],
                $exists ? [] : ['created_at' => now()]
            )
        );
    }

    /**
     * Update multiple config values.
     */
    public function updateMany(array $configs): void
    {
        foreach ($configs as $key => $value) {
            $this->set($key, $value);
        }
    }

    /**
     * Delete a config entry.
     */
    public function delete(string $key): bool
    {
        return DB::table('admin_config')
            ->where('key', $key)
            ->delete() > 0;
    }
}
