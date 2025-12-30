<?php

namespace OCA\SimpleHabitTracker\AppInfo;

use OCA\SimpleHabitTracker\Service\HabitService;
use OCP\AppFramework\App;
use OCP\Files\AppData\IAppDataFactory;
use OCP\IUserSession;
use OCP\IURLGenerator;
use OCP\Util;

class Application extends App {
    public const APP_ID = 'simplehabittracker';

    public function __construct(array $params = []) {
        parent::__construct(self::APP_ID, $params);

        $c = $this->getContainer();
        $c->registerService(HabitService::class, function ($c) {
            $server = $c->getServer();
            return new HabitService(
                $server->get(IAppDataFactory::class),
                $server->get(IUserSession::class),
            );
        });

        $server = $c->getServer();
        $server->getNavigationManager()->add(function () use ($server) {
            /** @var IURLGenerator $urlGenerator */
            $urlGenerator = $server->getURLGenerator();
            return [
                'id' => self::APP_ID,
                'order' => 40,
                'href' => $urlGenerator->linkToRoute(self::APP_ID . '.page.index'),
                'icon' => $urlGenerator->imagePath(self::APP_ID, 'app.svg'),
                'name' => 'Simple Habit Tracker',
            ];
        });
    }

    public function register(): void {
        Util::addScript(self::APP_ID, 'main');
        Util::addStyle(self::APP_ID, 'style');
    }
}

$app = new Application();
$app->register();
