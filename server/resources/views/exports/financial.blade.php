<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Financial Report</title>
    <style>
        body { font-family: sans-serif; font-size: 12px; color: #333; }
        h1 { font-size: 18px; color: #0f766e; margin-bottom: 5px; }
        p.subtitle { color: #666; font-size: 11px; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th { background: #f1f5f9; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; padding: 8px 10px; text-align: left; border-bottom: 2px solid #e2e8f0; }
        td { padding: 7px 10px; border-bottom: 1px solid #f1f5f9; font-size: 11px; }
        tr:nth-child(even) { background: #fafafa; }
        .summary-box { display: inline-block; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 20px; margin: 5px 10px 15px 0; }
        .summary-box .label { font-size: 10px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
        .summary-box .value { font-size: 16px; font-weight: bold; color: #0f766e; }
        .summary-box .value.red { color: #dc2626; }
        .footer { margin-top: 20px; font-size: 10px; color: #999; text-align: center; }
    </style>
</head>
<body>
    <h1>Financial Report</h1>
    <p class="subtitle">ProHealium RxPMS &mdash; Generated {{ now()->format('M d, Y \a\t h:i A') }}</p>

    <div>
        @foreach($summary as $row)
            @if($row[0] !== 'Metric')
                <div class="summary-box">
                    <div class="label">{{ $row[0] }}</div>
                    <div class="value{{ str_contains($row[0], 'Refund') ? ' red' : '' }}">{{ $row[1] }}</div>
                </div>
            @endif
        @endforeach
    </div>

    @if(count($daily) > 0)
    <h2 style="font-size: 14px; color: #334155; margin-top: 20px;">Daily Breakdown</h2>
    <table>
        <thead>
            <tr>
                <th>Date</th>
                <th>Orders</th>
                <th>Revenue</th>
                <th>Avg Order</th>
            </tr>
        </thead>
        <tbody>
            @foreach($daily as $row)
                <tr>
                    <td>{{ $row['Date'] }}</td>
                    <td>{{ $row['Orders'] }}</td>
                    <td>${{ $row['Revenue'] }}</td>
                    <td>${{ $row['Avg Order'] }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>
    @endif

    <div class="footer">ProHealium RxPMS &bull; Pharmacy Management System</div>
</body>
</html>
