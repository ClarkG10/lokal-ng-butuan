<?php

namespace App\Console\Commands;

use App\Models\Event;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;

class SyncEventStatuses extends Command
{
    protected $signature = 'events:sync-statuses';

    protected $description = 'Sync event statuses based on current time. Cancelled events are sticky.';

    public function handle(): int
    {
        $now = Carbon::now();

        // upcoming → ongoing
        $a = Event::query()
            ->whereNotIn('status', ['cancelled'])
            ->where('starts_at', '<=', $now)
            ->where('ends_at', '>=', $now)
            ->where('status', '!=', 'ongoing')
            ->update(['status' => 'ongoing']);

        // ongoing/upcoming → completed
        $b = Event::query()
            ->whereNotIn('status', ['cancelled', 'completed'])
            ->where('ends_at', '<', $now)
            ->update(['status' => 'completed']);

        // anything that drifted but should be upcoming
        $c = Event::query()
            ->whereNotIn('status', ['cancelled'])
            ->where('starts_at', '>', $now)
            ->where('status', '!=', 'upcoming')
            ->update(['status' => 'upcoming']);

        $this->info("Sync complete. ongoing+={$a} completed+={$b} upcoming+={$c}");
        return self::SUCCESS;
    }
}
