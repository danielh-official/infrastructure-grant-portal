<?php
declare(strict_types=1);

final class Applications
{
    private PDO $db;

    public function __construct(string $path)
    {
        $this->db = new PDO('sqlite:' . $path, options: [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]);
        $this->db->exec('PRAGMA busy_timeout = 5000');
        $this->db->exec(
            'CREATE TABLE IF NOT EXISTS applications (
                id INTEGER PRIMARY KEY,
                municipality TEXT NOT NULL,
                email TEXT NOT NULL,
                summary TEXT NOT NULL,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            )'
        );
    }

    public function create(array $values): int
    {
        $statement = $this->db->prepare(
            'INSERT INTO applications (municipality, email, summary)
             VALUES (:municipality, :email, :summary)'
        );
        $statement->execute($values);

        return (int) $this->db->lastInsertId();
    }

    public function count(): int
    {
        return (int) $this->db->query('SELECT COUNT(*) FROM applications')->fetchColumn();
    }
}
