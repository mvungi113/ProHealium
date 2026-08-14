<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Database\Connectors\PostgresConnector;
use App\Database\Connectors\NeonPostgresConnector;

class NeonDatabaseServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        if (env('DB_CONNECTION') === 'pgsql' && env('DB_NEON_ENDPOINT')) {
            $this->app->bind('db.connector.pgsql', NeonPostgresConnector::class);
        }
    }

    public function boot(): void
    {
        //
    }
}
