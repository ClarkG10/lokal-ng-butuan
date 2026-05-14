<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Masterlist;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;

class EmailCampaignController extends Controller
{
    /**
     * Preview recipients based on filters (returns count + sample list).
     */
    public function preview(Request $request)
    {
        $query = $this->buildRecipientQuery($request);

        $total = $query->count();
        $sample = (clone $query)
            ->limit(10)
            ->get(['id', 'first_name', 'middle_name', 'last_name', 'email', 'belongs_to'])
            ->map(fn ($r) => [
                'id'         => $r->id,
                'full_name'  => trim("{$r->first_name} {$r->middle_name} {$r->last_name}"),
                'email'      => $r->email,
                'belongs_to' => $r->belongs_to,
            ]);

        return response()->json(['total' => $total, 'sample' => $sample]);
    }

    /**
     * Send the email campaign.
     */
    public function send(Request $request)
    {
        $request->validate([
            'subject'     => 'required|string|max:255',
            'body_html'   => 'required|string',
            'belongs_to'  => 'nullable|string|in:Binhi,Kadiwa,Buklod',
            'has_email'   => 'nullable|boolean',
        ]);

        $recipients = $this->buildRecipientQuery($request)
            ->whereNotNull('email')
            ->where('email', '!=', '')
            ->get();

        if ($recipients->isEmpty()) {
            return response()->json(['message' => 'No recipients with valid emails found.'], 422);
        }

        $subject  = $request->input('subject');
        $bodyHtml = $request->input('body_html');
        $sent     = 0;
        $failed   = 0;

        foreach ($recipients as $member) {
            try {
                Mail::html($bodyHtml, function ($message) use ($member, $subject) {
                    $message
                        ->to($member->email, trim("{$member->first_name} {$member->last_name}"))
                        ->subject($subject);
                });
                $sent++;
            } catch (\Throwable) {
                $failed++;
            }
        }

        return response()->json([
            'message' => "Campaign sent.",
            'sent'    => $sent,
            'failed'  => $failed,
        ]);
    }

    private function buildRecipientQuery(Request $request)
    {
        $belongsTo = $request->input('belongs_to');
        $purok     = $request->input('purok');

        return Masterlist::query()
            ->when($belongsTo, fn ($q, $b) => $q->where('belongs_to', $b))
            ->when($purok, fn ($q, $p) => $q->where('purok', 'like', "%{$p}%"));
    }
}
