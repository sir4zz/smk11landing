<?php

namespace Tests\Feature;

use App\Models\Profile;
use App\Models\Student;
use App\Models\StudentAccount;
use App\Models\User;
use App\Services\AccountService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class StudentAccountConsistencyTest extends TestCase
{
    use RefreshDatabase;

    public function test_nis_resolves_to_the_existing_student_without_changing_nisn_login(): void
    {
        $user = $this->student('0061234567', '12345');

        $this->assertSame($user->id, app(AccountService::class)->resolveUser('12345')?->id);
        $this->assertSame($user->id, app(AccountService::class)->resolveUser('0061234567')?->id);
    }

    public function test_student_email_sync_updates_all_mirrors(): void
    {
        $user = $this->student('0061234567', '12345');
        $user->update(['email' => 'wrong@example.test']);
        $user->profileRecord->update(['email' => 'wrong@example.test']);
        $user->student->account->update(['email' => 'wrong@example.test']);

        app(AccountService::class)->syncStudentEmails($user, 'nisn-0061234567@mading.smkn11.sch.id');

        $this->assertSame([
            'nisn-0061234567@mading.smkn11.sch.id',
            'nisn-0061234567@mading.smkn11.sch.id',
            'nisn-0061234567@mading.smkn11.sch.id',
        ], [
            $user->fresh()->email,
            $user->profileRecord()->value('email'),
            $user->student->account()->value('email'),
        ]);
    }

    private function student(string $nisn, string $nis): User
    {
        $user = User::create([
            'email' => "nisn-{$nisn}@mading.smkn11.sch.id",
            'password' => Hash::make('1234'),
            'name' => 'Student',
        ]);
        Profile::create(['id' => $user->id, 'role' => 'student', 'name' => 'Student', 'email' => $user->email]);
        Student::create(['id' => $user->id, 'nisn' => $nisn, 'nis' => $nis, 'name' => 'Student', 'pin' => '1234']);
        StudentAccount::create(['id' => $user->id, 'student_id' => $user->id, 'email' => $user->email]);

        return $user->fresh(['profileRecord', 'student']);
    }
}
