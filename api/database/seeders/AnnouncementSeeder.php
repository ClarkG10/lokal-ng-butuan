<?php

namespace Database\Seeders;

use App\Models\Announcement;
use App\Models\AnnouncementCategory;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class AnnouncementSeeder extends Seeder
{
    public function run(): void
    {
        $category = AnnouncementCategory::firstOrCreate(
            ['name' => 'Worship'],
            ['slug' => 'worship'],
        );

        $announcements = [
            [
                'title'      => 'Worship Service Schedule — Lokal ng Butuan City',
                'slug'       => 'worship-service-schedule',
                'body_rich'  => implode("\n\n", [
                    'We warmly invite all members and guests to our regular worship services at the Iglesia ni Cristo — Lokal ng Butuan City.',
                    '**Thursday (Tagalog)**' . "\n" . '• 6:00 AM Morning Service' . "\n" . '• 6:30 PM Evening Service',
                    '**Sunday (Tagalog)**' . "\n" . '• 6:00 AM Morning Service' . "\n" . '• 10:00 AM Mid-Morning Service',
                    '**Wednesday (English)**' . "\n" . '• 6:00 AM Morning Service' . "\n" . '• 6:30 PM Evening Service',
                    '**Saturday (English)**' . "\n" . '• 6:00 AM Morning Service' . "\n" . '• 6:00 PM Evening Service',
                    'May our worship always be pleasing to God. We look forward to worshipping together with you.',
                ]),
                'status'     => 'published',
                'published_at' => now(),
                'category_id' => $category->id,
            ],
            [
                'title'      => 'Maligayang Pagdating sa Plataporma ng Lokal ng Butuan City',
                'slug'       => 'maligayang-pagdating',
                'body_rich'  => implode("\n\n", [
                    'Ikinagagalak naming ipakilala ang bagong digital na plataporma ng Iglesia ni Cristo — Lokal ng Butuan City.',
                    'Sa pamamagitan ng platapormang ito, maaari kayong:',
                    '• Makita ang mga paparating na gawain at kaganapan' . "\n" .
                    '• Sumali sa mga survey at maihatid ang inyong mga saloobin' . "\n" .
                    '• Manood ng mga larawan mula sa aming mga nakaraang pagtitipon' . "\n" .
                    '• Manatiling konektado sa buhay ng Iglesia',
                    'Sama-sama, bilang isa — para sa kaluwalhatian ng Diyos.',
                ]),
                'status'     => 'published',
                'published_at' => now()->subDay(),
                'category_id' => $category->id,
            ],
        ];

        foreach ($announcements as $data) {
            Announcement::updateOrCreate(
                ['slug' => $data['slug']],
                $data,
            );
        }
    }
}
