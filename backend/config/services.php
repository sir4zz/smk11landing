<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'whatsapp' => [
        // Base URL dari WhatsApp service (Baileys) di server/index.js
        'url' => env('WHATSAPP_SERVICE_URL', 'http://127.0.0.1:5001'),
        // Harus sama dengan env WA_TOKEN di WhatsApp service
        'token' => env('WHATSAPP_SERVICE_TOKEN', ''),
        'enabled' => env('WHATSAPP_ENABLED', true),
        'connect_timeout' => (int) env('WHATSAPP_CONNECT_TIMEOUT', 5),
        'timeout' => (int) env('WHATSAPP_TIMEOUT', 15),
    ],

    'openrouter' => [
        'key' => env('OPENROUTER_API_KEY'),
        'model' => env('OPENROUTER_CHAT_MODEL', 'openai/gpt-4o-mini'),
        'vision_model' => env('OPENROUTER_VISION_MODEL', 'google/gemini-2.0-flash-exp:free'),
        'connect_timeout' => (int) env('OPENROUTER_CONNECT_TIMEOUT', 10),
        'timeout' => (int) env('OPENROUTER_TIMEOUT', 60),
    ],

];
