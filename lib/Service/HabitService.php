<?php

namespace OCA\SimpleHabitTracker\Service;

use OCP\Files\AppData\IAppDataFactory;
use OCP\Files\IAppData;
use OCP\Files\NotFoundException;
use OCP\Files\SimpleFS\ISimpleFile;
use OCP\Files\SimpleFS\ISimpleFolder;
use OCP\IUserSession;

class HabitService {
    private IAppData $appData;
    private ?string $userId;

    public function __construct(
        IAppDataFactory $appDataFactory,
        IUserSession $userSession,
    ) {
        $this->appData = $appDataFactory->get('simplehabittracker');
        $this->userId = $userSession->getUser()?->getUID();
    }

    private function storageFolder(): ISimpleFolder {
        try {
            return $this->appData->getFolder('habits');
        } catch (NotFoundException) {
            return $this->appData->newFolder('habits');
        }
    }

    private function storageFile(): ISimpleFile {
        $uid = $this->userId ?? 'anonymous';
        $folder = $this->storageFolder();
        try {
            return $folder->getFile($uid . '.json');
        } catch (NotFoundException) {
            $file = $folder->newFile($uid . '.json');
            $file->putContent(json_encode([]));
            return $file;
        }
    }

    /** @return array<int, array<string, mixed>> */
    private function readHabits(): array {
        $raw = $this->storageFile()->getContent();
        $data = json_decode($raw ?: '[]', true);
        return is_array($data) ? $data : [];
    }

    /** @param array<int, array<string, mixed>> $habits */
    private function writeHabits(array $habits): void {
        $this->storageFile()->putContent(json_encode(array_values($habits), JSON_UNESCAPED_UNICODE));
    }

    private function normalizeDate(string $date): string {
        if ($date !== '') {
            $dt = \DateTimeImmutable::createFromFormat('Y-m-d', $date);
            if ($dt instanceof \DateTimeImmutable) {
                return $dt->format('Y-m-d');
            }
        }
        return (new \DateTimeImmutable('today'))->format('Y-m-d');
    }

    /** @param array<string, bool> $history */
    private function pruneHistory(array $history): array {
        $cutoff = (new \DateTimeImmutable('today -30 days'))->format('Y-m-d');
        return array_filter(
            $history,
            fn ($value, $key) => $key >= $cutoff,
            ARRAY_FILTER_USE_BOTH
        );
    }

    /** @return array<int, array<string, mixed>> */
    public function listHabits(): array {
        return $this->readHabits();
    }

    /** @return array<string, mixed> */
    public function createHabit(string $name): array {
        $habits = $this->readHabits();
        $max = 0;
        foreach ($habits as $habit) {
            $max = max($max, (int)($habit['id'] ?? 0));
        }

        $habit = [
            'id' => $max + 1,
            'name' => $name,
            'history' => [],
            'created' => (new \DateTimeImmutable('today'))->format('Y-m-d'),
        ];
        $habits[] = $habit;
        $this->writeHabits($habits);
        return $habit;
    }

    public function renameHabit(int $id, string $name): ?array {
        $habits = $this->readHabits();
        $updated = null;
        foreach ($habits as &$habit) {
            if ((int)($habit['id'] ?? 0) === $id) {
                $habit['name'] = $name;
                $updated = $habit;
                break;
            }
        }
        unset($habit);

        if ($updated === null) {
            return null;
        }

        $this->writeHabits($habits);
        return $updated;
    }

    public function setHabitDay(int $id, string $date, bool $done): ?array {
        $habits = $this->readHabits();
        $updated = null;
        $dateKey = $this->normalizeDate($date);

        foreach ($habits as &$habit) {
            if ((int)($habit['id'] ?? 0) === $id) {
                $history = is_array($habit['history'] ?? null) ? $habit['history'] : [];
                $history[$dateKey] = $done;
                $habit['history'] = $this->pruneHistory($history);
                $updated = $habit;
                break;
            }
        }
        unset($habit);

        if ($updated === null) {
            return null;
        }

        $this->writeHabits($habits);
        return $updated;
    }

    public function deleteHabit(int $id): bool {
        $habits = $this->readHabits();
        $filtered = array_values(array_filter(
            $habits,
            fn ($habit) => (int)($habit['id'] ?? 0) !== $id
        ));

        if (count($filtered) === count($habits)) {
            return false;
        }

        $this->writeHabits($filtered);
        return true;
    }
}
