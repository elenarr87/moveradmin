# Mover Studio Admin

A micro PHP backend for managing clean HTML websites.

## Setup

1. Upload all files to your web server with PHP support.
2. Visit `/.mover/setup.php` to generate a password hash.
3. Replace the `$correct_hash` in `.mover/auth.php` with your generated hash.
4. Delete `setup.php`.
5. Access admin by visiting `yoursite.com/#admin` and enter the password.

## Features

- Clean HTML frontend
- JSON-based content storage
- Image uploads
- Session-based authentication
- No dependencies

## Default Password

The default hash is for password 'password'. Change it using setup.php.