<?php

namespace Tests\Unit;

use App\Models\Student;
use App\Services\AccountService;
use PHPUnit\Framework\TestCase;

class StudentBiodataContractTest extends TestCase
{
    public function test_biodata_keys_are_fillable_and_shared_by_account_service(): void
    {
        $keys = Student::BIODATA_KEYS;

        $this->assertSame($keys, (new AccountService())->biodataKeys());
        $this->assertSame([], array_diff($keys, (new Student())->getFillable()));
        $this->assertNotContains('beasiswa_tk', $keys);
        $this->assertNotContains('beasiswa_dari', $keys);
    }
}
