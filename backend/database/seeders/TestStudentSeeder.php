<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Student;
use App\Models\StudentAccount;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

class TestStudentSeeder extends Seeder
{
    public function run(): void
    {
        $students = [
            [
                'nisn' => '0067890001',
                'nis' => '001234',
                'name' => 'BUDI SANTOSA',
                'class' => 'X TKJ 1',
                'major' => 'TKJ',
                'gender' => 'LAKI-LAKI',
                'place_of_birth' => 'TANGERANG',
                'date_of_birth' => '2008-05-15',
                'religion' => 'ISLAM',
                'address' => 'Jl. Merdeka No.10, Tangerang',
                'biodata' => [
                    'nickname' => 'BUDI',
                    'kewarganegaraan' => 'WNI',
                    'anak_ke' => 2,
                    'jml_saudara_kandung' => 1,
                    'jml_saudara_tiri' => 0,
                    'anak_yatim_piatu' => 'TIDAK',
                    'bahasa_sehari_hari' => 'BAHASA INDONESIA',
                    'phone' => '081234567890',
                    'tinggal_dengan' => 'ORANG TUA',
                    'jarak_sekolah' => 0.5,
                    'golongan_darah' => 'O',
                    'penyakit' => 'TIDAK ADA',
                    'kelainan_jasmani' => 'TIDAK ADA',
                    'tinggi_cm' => 165,
                    'berat_kg' => 55,
                    'lulusan_dari' => 'SMP NEGERI 5 TANGERANG',
                    'kompetensi_keahlian' => 'TKJ',
                    'ayah_nama' => 'AHMAD SANTOSA',
                    'ayah_tempat' => 'TANGERANG',
                    'ayah_tanggal_lahir' => '1975-03-20',
                    'ayah_pendidikan' => 'SMA',
                    'ayah_pekerjaan' => 'PEDAGANG',
                    'ayah_penghasilan' => '2.000.000 - 3.000.000',
                    'ayah_alamat' => 'Jl. Merdeka No.10, Tangerang',
                    'ayah_no_telp' => '081298765432',
                    'ayah_status_hidup' => 'MASIH HIDUP',
                    'ibu_nama' => 'SITI AMINAH',
                    'ibu_tempat' => 'TANGERANG',
                    'ibu_tanggal_lahir' => '1978-07-10',
                    'ibu_pendidikan' => 'SMA',
                    'ibu_pekerjaan' => 'IBU RUMAH TANGGA',
                    'ibu_penghasilan' => '< 1.000.000',
                    'ibu_alamat' => 'Jl. Merdeka No.10, Tangerang',
                    'ibu_no_telp' => '081211112222',
                    'ibu_status_hidup' => 'MASIH HIDUP',
                    'gemar_kesenian' => 'MENYENI',
                    'gemar_olahraga' => 'SEPAK BOLA',
                    'gemar_kemasyarakatan' => 'PRAMUKA',
                ],
            ],
            [
                'nisn' => '0067890002',
                'nis' => null,
                'name' => 'RINA WATI',
                'class' => 'X DKV 1',
                'major' => 'DKV',
                'gender' => 'PEREMPUAN',
                'place_of_birth' => 'JAKARTA',
                'date_of_birth' => '2008-08-20',
                'religion' => 'ISLAM',
                'address' => 'Jl. Pahlawan No.5, Jakarta',
                'biodata' => [
                    'asal_sekolah' => 'SMPN 2 JAKARTA',
                    'nik' => '3201234567890001',
                    'kewarganegaraan' => 'WNI',
                    'anak_ke' => 1,
                    'jml_saudara_kandung' => 2,
                    'cita_cita' => 'DESAINER',
                    'hobi' => 'MELUKIS',
                    'phone' => '085612345678',
                    'pernah_paud' => 'YA',
                    'pernah_tk' => 'YA',
                    'no_kk' => '3201234567890099',
                    'kepala_keluarga' => 'SUGIANTO',
                    'jenis_tempat_tinggal' => 'RUMAH',
                    'provinsi' => 'DKI JAKARTA',
                    'kota' => 'JAKARTA SELATAN',
                    'kecamatan' => 'PASAR MINGGU',
                    'desa' => 'PEJAGALAN',
                    'kode_pos' => '12530',
                    'jarak_sekolah' => 2.5,
                    'jarak_tempuh' => '30 MENIT',
                    'transportasi' => 'KENDARAAN PRIBADI',
                    'ayah_nama' => 'SUGIANTO',
                    'ayah_nik' => '3201234567890011',
                    'ayah_tempat' => 'JAKARTA',
                    'ayah_tanggal_lahir' => '1975-01-15',
                    'ayah_pendidikan' => 'SMA',
                    'ayah_pekerjaan' => 'KARYAWAN',
                    'ayah_penghasilan' => '3.000.000 - 5.000.000',
                    'ayah_no_telp' => '081345678901',
                    'ayah_status_hidup' => 'MASIH HIDUP',
                    'ibu_nama' => 'SRI WAHYUNI',
                    'ibu_nik' => '3201234567890022',
                    'ibu_tempat' => 'JAKARTA',
                    'ibu_tanggal_lahir' => '1978-05-20',
                    'ibu_pendidikan' => 'SMP',
                    'ibu_pekerjaan' => 'PEDAGANG',
                    'ibu_penghasilan' => '2.000.000 - 3.000.000',
                    'ibu_no_telp' => '081345678902',
                    'ibu_status_hidup' => 'MASIH HIDUP',
                ],
            ],
        ];

        $password = Hash::make('123456', ['rounds' => 10]);

        foreach ($students as $data) {
            $id = (string) Str::uuid();
            $biodata = $data['biodata'];
            unset($data['biodata']);
            $email = strtolower(str_replace(' ', '.', $data['name'])) . '@siswa.smk11.sch.id';

            DB::transaction(function () use ($id, $email, $password, $data, $biodata) {
                User::create([
                    'id' => $id,
                    'email' => $email,
                    'password' => $password,
                    'name' => $data['name'],
                    'profile' => ['name' => $data['name']],
                    'email_verified_at' => now(),
                ]);

                DB::table('profiles')->insert([
                    'id' => $id,
                    'role' => 'student',
                    'name' => $data['name'],
                    'email' => $email,
                    'updated_at' => now(),
                ]);

                Student::create(array_merge([
                    'id' => $id,
                    'nisn' => $data['nisn'],
                    'nis' => $data['nis'],
                    'pin' => '123456',
                    'name' => $data['name'],
                    'class' => $data['class'],
                    'major' => $data['major'],
                    'gender' => $data['gender'],
                    'date_of_birth' => $data['date_of_birth'],
                    'place_of_birth' => $data['place_of_birth'],
                    'religion' => $data['religion'],
                    'address' => $data['address'],
                ], $biodata));

                StudentAccount::create([
                    'id' => $id,
                    'student_id' => $id,
                    'email' => $email,
                    'status' => 'active',
                ]);

                $this->command->info("Created: {$data['name']} (NISN: {$data['nisn']}, Class: {$data['class']}, Major: {$data['major']})");
            });
        }

        $this->command->info("Total students: " . Student::count());
    }
}
