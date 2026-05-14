<?php

use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment('Build for the community.');
})->purpose('Display an inspiring quote');
