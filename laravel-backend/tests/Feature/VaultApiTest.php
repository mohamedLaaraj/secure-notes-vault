<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class VaultApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_register_user()
    {
        $response = $this->postJson('/api/register', [
            'name' => 'Mohamed',
            'email' => 'mohameedlaaraj@gmail.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertStatus(201)
                 ->assertJsonStructure(['message', 'user', 'token']);
    }

    public function test_can_login_user()
    {
        $user = User::factory()->create([
            'email' => 'mohameedlaaraj@gmail.com',
            'password' => bcrypt('password123'),
        ]);

        $response = $this->postJson('/api/login', [
            'email' => 'mohameedlaaraj@gmail.com',
            'password' => 'password123',
        ]);

        $response->assertStatus(200)
                 ->assertJsonStructure(['message', 'user', 'token']);
    }

    public function test_cannot_access_notes_without_token()
    {
        $response = $this->getJson('/api/notes');
        $response->assertStatus(401); // Or 404 depending on your middleware handler
    }
}