<?php

namespace OCA\SimpleHabitTracker\Controller;

use OCA\SimpleHabitTracker\Service\HabitService;
use OCP\AppFramework\Controller;
use OCP\AppFramework\Http\DataResponse;
use OCP\AppFramework\Http\Attribute\NoAdminRequired;
use OCP\AppFramework\Http\Attribute\NoCSRFRequired;
use OCP\IRequest;

class HabitController extends Controller {
    public function __construct(
        string $appName,
        IRequest $request,
        private HabitService $service,
    ) {
        parent::__construct($appName, $request);
    }

    private function body(): array {
        $params = $this->request->getParams();
        return is_array($params) ? $params : [];
    }

    #[NoAdminRequired, NoCSRFRequired]
    public function list(): DataResponse {
        return new DataResponse([
            'habits' => $this->service->listHabits(),
        ]);
    }

    #[NoAdminRequired, NoCSRFRequired]
    public function create(): DataResponse {
        $body = $this->body();
        $name = trim((string)($body['name'] ?? ''));
        if ($name === '') {
            return new DataResponse(['error' => 'empty_name'], 400);
        }

        return new DataResponse([
            'habit' => $this->service->createHabit($name),
        ], 201);
    }

    #[NoAdminRequired, NoCSRFRequired]
    public function rename(int $id): DataResponse {
        $body = $this->body();
        $name = trim((string)($body['name'] ?? ''));
        if ($name === '') {
            return new DataResponse(['error' => 'empty_name'], 400);
        }

        $habit = $this->service->renameHabit($id, $name);
        if (!$habit) {
            return new DataResponse(['error' => 'not_found'], 404);
        }

        return new DataResponse(['habit' => $habit]);
    }

    #[NoAdminRequired, NoCSRFRequired]
    public function toggle(int $id): DataResponse {
        $body = $this->body();
        $date = trim((string)($body['date'] ?? ''));
        $done = isset($body['done']) ? (bool)$body['done'] : true;

        $habit = $this->service->setHabitDay($id, $date, $done);
        if (!$habit) {
            return new DataResponse(['error' => 'not_found'], 404);
        }

        return new DataResponse(['habit' => $habit]);
    }

    #[NoAdminRequired, NoCSRFRequired]
    public function delete(int $id): DataResponse {
        if (!$this->service->deleteHabit($id)) {
            return new DataResponse(['error' => 'not_found'], 404);
        }

        return new DataResponse(['deleted' => $id]);
    }
}
