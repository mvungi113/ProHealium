<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>{{ $title }}</title>
    <style>
        body { font-family: sans-serif; font-size: 12px; color: #333; }
        h1 { font-size: 18px; color: #0f766e; margin-bottom: 5px; }
        p.subtitle { color: #666; font-size: 11px; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th { background: #f1f5f9; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; padding: 8px 10px; text-align: left; border-bottom: 2px solid #e2e8f0; }
        td { padding: 7px 10px; border-bottom: 1px solid #f1f5f9; font-size: 11px; }
        tr:nth-child(even) { background: #fafafa; }
        .text-right { text-align: right; }
        .footer { margin-top: 20px; font-size: 10px; color: #999; text-align: center; }
    </style>
</head>
<body>
    <h1>{{ $title }}</h1>
    <p class="subtitle">ProHealium RxPMS &mdash; Generated {{ now()->format('M d, Y \a\t h:i A') }}</p>

    @if(count($data) > 0)
    <table>
        <thead>
            <tr>
                @foreach($headings as $heading)
                    <th>{{ $heading }}</th>
                @endforeach
            </tr>
        </thead>
        <tbody>
            @foreach($data as $row)
                <tr>
                    @foreach($row as $value)
                        <td>{{ $value }}</td>
                    @endforeach
                </tr>
            @endforeach
        </tbody>
    </table>
    @else
        <p style="text-align: center; color: #999; padding: 40px;">No data available for the selected period.</p>
    @endif

    <div class="footer">ProHealium RxPMS &bull; Pharmacy Management System</div>
</body>
</html>
