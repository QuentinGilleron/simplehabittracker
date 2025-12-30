<?php
return [
    'routes' => [
        ['name' => 'page#index',    'url' => '/',                      'verb' => 'GET'],
        ['name' => 'habit#list',    'url' => '/habits',                'verb' => 'GET'],
        ['name' => 'habit#create',  'url' => '/habits',                'verb' => 'POST'],
        ['name' => 'habit#rename',  'url' => '/habits/{id}',           'verb' => 'PUT'],
        ['name' => 'habit#toggle',  'url' => '/habits/{id}/toggle',    'verb' => 'POST'],
        ['name' => 'habit#delete',  'url' => '/habits/{id}',           'verb' => 'DELETE'],
    ],
];
