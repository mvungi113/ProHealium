<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Notification;
use Illuminate\Http\Request;
use Carbon\Carbon;

class NotificationController extends Controller
{
    public function index(Request $request)
    {
        $query = Notification::query();
        if ($request->user()) {
            $query->where(function ($q) use ($request) {
                $q->where('user_id', $request->user()->id)->orWhereNull('user_id');
            });
        }
        if ($request->filled('unread_only') && $request->unread_only === 'true') {
            $query->where('is_read', false);
        }
        return response()->json($query->latest()->take(50)->get());
    }

    public function markRead(Notification $notification)
    {
        $notification->update(['is_read' => true]);
        return response()->json(['message' => 'Marked as read']);
    }

    public function markAllRead(Request $request)
    {
        Notification::where(function ($q) use ($request) {
            $q->where('user_id', $request->user()->id)->orWhereNull('user_id');
        })->where('is_read', false)->update(['is_read' => true]);
        return response()->json(['message' => 'All marked as read']);
    }

    public function checkAlerts(Request $request)
    {
        $products = Product::all();
        $created = 0;
        $userId = $request->user()?->id;

        $lowStock = $products->filter(fn($p) => $p->quantity <= $p->reorder_level && $p->quantity > 0);
        foreach ($lowStock as $p) {
            $exists = Notification::where('type', 'low_stock')
                ->whereRaw("data->>'product_id' = ?", [$p->id])
                ->whereDate('created_at', today())
                ->exists();
            if (!$exists) {
                Notification::create([
                    'user_id' => $userId,
                    'type' => 'low_stock',
                    'title' => 'Low Stock Alert',
                    'message' => "{$p->name} has only {$p->quantity} units left (reorder at {$p->reorder_level})",
                    'data' => ['product_id' => $p->id, 'quantity' => $p->quantity, 'reorder_level' => $p->reorder_level],
                ]);
                $created++;
            }
        }

        $expiring = $products->filter(fn($p) => $p->expiry_date && Carbon::parse($p->expiry_date)->isFuture() && now()->diffInDays(Carbon::parse($p->expiry_date)) <= 30);
        foreach ($expiring as $p) {
            $exists = Notification::where('type', 'expiry')
                ->whereRaw("data->>'product_id' = ?", [$p->id])
                ->whereDate('created_at', today())
                ->exists();
            if (!$exists) {
                Notification::create([
                    'user_id' => $userId,
                    'type' => 'expiry',
                    'title' => 'Expiry Alert',
                    'message' => "{$p->name} expires on {$p->expiry_date}",
                    'data' => ['product_id' => $p->id, 'expiry_date' => $p->expiry_date],
                ]);
                $created++;
            }
        }

        return response()->json(['message' => "Created {$created} new alerts", 'created' => $created]);
    }
}
