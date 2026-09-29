<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Exception;

class GoogleAuthService
{
    /**
     * Verify a Google ID token and return (or create) the matching User.
     *
     * @throws Exception when the token is invalid or there is a conflict.
     */
    public function handleIdToken(string $idToken): User
    {
        $payload = $this->verifyIdToken($idToken);

        $sub = $payload['sub'];
        $email = $payload['email'] ?? null;
        $name = $payload['name'] ?? 'Google User';
        $picture = $payload['picture'] ?? null;

        // 1. Match by provider_id — fastest path for returning Google users.
        $user = User::where('provider', 'google')->where('provider_id', $sub)->first();
        if ($user) {
            $user->update(['avatar_url' => $picture, 'name' => $name]);
            return $user;
        }

        // 2. Match by email — may need to link Google to an existing local account.
        if ($email) {
            $existing = User::where('email', $email)->first();
            if ($existing) {
                if ($existing->provider === 'local' && !$existing->email_verified_at) {
                    throw new Exception(
                        'Please log in with your password first, then link Google from Settings.'
                    );
                }
                // Link Google to a verified local account.
                $existing->update(['provider_id' => $sub, 'avatar_url' => $picture]);
                return $existing;
            }
        }

        // 3. New user — create with Google provider.
        return User::create([
            'name' => $name,
            'email' => $email,
            'provider' => 'google',
            'provider_id' => $sub,
            'avatar_url' => $picture,
            'email_verified_at' => now(),
        ]);
    }

    /**
     * Verify the Google ID token via the tokeninfo endpoint and return the payload.
     *
     * @throws Exception on HTTP failure, audience mismatch, or token expiry.
     */
    private function verifyIdToken(string $idToken): array
    {
        $response = Http::timeout(5)->get('https://oauth2.googleapis.com/tokeninfo', [
            'id_token' => $idToken,
        ]);

        if (!$response->ok()) {
            throw new Exception('Invalid Google ID token.');
        }

        $payload = $response->json();

        $clientId = config('services.google.client_id');
        if ($clientId && ($payload['aud'] ?? null) !== $clientId) {
            throw new Exception('Token audience mismatch.');
        }

        if (isset($payload['exp']) && $payload['exp'] < time()) {
            throw new Exception('Token has expired.');
        }

        return $payload;
    }
}

