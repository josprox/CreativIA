<?php

/**
 * User Model
 * 
 * Represents a user in the system.
 * Handles authentication and user data management.
 */

require_once __DIR__ . '/../core/Model.php';

class User extends Model
{
    protected $table = 'users';
    protected $fillable = ['username', 'email', 'password_hash'];

    /**
     * Create a new user with hashed password
     * 
     * @param array $data User data (username, email, password)
     * @return int|bool User ID or false
     */
    public function createUser($data)
    {
        // Hash password
        $data['password_hash'] = password_hash($data['password'], PASSWORD_BCRYPT);
        unset($data['password']);

        return $this->create($data);
    }

    /**
     * Verify user credentials
     * 
     * @param string $email User email
     * @param string $password Plain text password
     * @return array|null User data or null
     */
    public function verifyCredentials($email, $password)
    {
        $user = $this->findOne(['email' => $email]);

        if ($user && password_verify($password, $user['password_hash'])) {
            return $user;
        }

        return null;
    }

    /**
     * Find user by email
     * 
     * @param string $email User email
     * @return array|null User data or null
     */
    public function findByEmail($email)
    {
        return $this->findOne(['email' => $email]);
    }

    /**
     * Find user by username
     * 
     * @param string $username Username
     * @return array|null User data or null
     */
    public function findByUsername($username)
    {
        return $this->findOne(['username' => $username]);
    }

    /**
     * Check if email exists
     * 
     * @param string $email Email to check
     * @return bool True if exists
     */
    public function emailExists($email)
    {
        return $this->findByEmail($email) !== null;
    }

    /**
     * Check if username exists
     * 
     * @param string $username Username to check
     * @return bool True if exists
     */
    public function usernameExists($username)
    {
        return $this->findByUsername($username) !== null;
    }

    /**
     * Update user password
     * 
     * @param int $userId User ID
     * @param string $newPassword New password
     * @return bool Success status
     */
    public function updatePassword($userId, $newPassword)
    {
        $passwordHash = password_hash($newPassword, PASSWORD_BCRYPT);
        return $this->update($userId, ['password_hash' => $passwordHash]);
    }
}
