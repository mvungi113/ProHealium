<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Notification;
use Illuminate\Http\Request;

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
        Notification::where('user_id', $request->user()->id)->where('is_read', false)->update(['is_read' => true]);
        return response()->json(['message' => 'All marked as read']);
    }

    public function checkAlerts()
    {
        $products = Product::all();
        $created = 0;

        $lowStock = $products->filter(fn($p) => $p->quantity <= $p->reorderLevel && $p->quantity > 0);
        foreach ($lowStock as $p) {
            $exists = Notification::where('type', 'low_stock')->where('data->product_id', $p->id)->whereDate('created_at', today())->exists();
            if (!$exists) {
                Notification::create([
                    'type' => 'low_stock',
                    'title' => 'Low Stock Alert',
                    'message' => "{$p->name} has only {$p->quantity} units left (reorder at {$p->reorder_level})",
                    'data' => ['product_id' => $p->id, 'quantity' => $p->quantity, 'reorder_level' => $p->reorder_level],
                ]);
                $created++;
            }
        }

        $expiring = $products->filter(fn($p) => $p->expiry_date && \Carbon\Carbon::parse($p->expiry_date)->diffInDays(now()) <= 30 && \Carbon\Carbon::parse($p->expiry_date)->isFuture());
        foreach ($expiring as $p) {
            $exists = Notification::where('type', 'expiry')->where('data->product_id', $p->id)->whereDate('created_at', today())->exists();
            if (!$exists) {
                Notification::create([
                    'type' => 'expiry',
                    'title' => 'Expiry Alert',
                    'message' => "{$p->name} expires on {$p->expiry_date}",
                    'data' => ['product_id' => $p->id, 'expiry_date' => $p->expiry_date],
                ]);
                $created++;
            }
        }

        return response()->json(['message' => "Created {$created} new alerts"]);
    }
}
