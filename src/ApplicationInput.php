<?php
declare(strict_types=1);

final class ApplicationInput
{
    public readonly array $values;
    public readonly array $errors;

    public function __construct(array $input)
    {
        $values = [];
        $errors = [];

        foreach ([
            'municipality' => ['Enter your municipality.', 120],
            'email' => ['Enter a contact email.', 254],
            'summary' => ['Describe the proposed project.', 1500],
        ] as $field => [$required, $limit]) {
            $value = $input[$field] ?? '';
            $value = is_string($value) ? trim($value) : '';
            $values[$field] = $value;

            if ($value === '') {
                $errors[$field] = $required;
            } elseif (mb_strlen($value) > $limit) {
                $errors[$field] = "Use {$limit} characters or fewer.";
            }
        }

        if (!isset($errors['email']) && !filter_var($values['email'], FILTER_VALIDATE_EMAIL)) {
            $errors['email'] = 'Enter an email in the format name@example.org.';
        }

        $this->values = $values;
        $this->errors = $errors;
    }
}
