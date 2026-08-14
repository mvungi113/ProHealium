<?php

namespace App\Database\Connectors;

use Illuminate\Database\Connectors\PostgresConnector;

class NeonPostgresConnector extends PostgresConnector
{
    protected function getDsn(array $config)
    {
        $dsn = parent::getDsn($config);

        $endpoint = $config['neon_endpoint'] ?? null;

        if ($endpoint && !str_contains($dsn, 'options=')) {
            $dsn .= ';options=endpoint=' . $endpoint;
        }

        return $dsn;
    }
}
