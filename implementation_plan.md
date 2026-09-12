# IMPLEMENTASI FINAL SISTEM HELPDESK / LAYANAN DISKOMINFO

Anda bertindak sebagai Senior Full-Stack Engineer.

STACK YANG WAJIB DIGUNAKAN:

* Frontend: React
* Backend: Node.js
* REST API: Express.js
* Database: PostgreSQL
* Authentication: JWT
* Database driver/ORM: gunakan yang sudah ada di project. Jika belum ada, gunakan library PostgreSQL yang paling sesuai dengan struktur project.
* API format: JSON

ARSITEKTUR:

React Frontend
↓
Node.js + Express REST API
↓
PostgreSQL
↓
Node.js API
↓
React Frontend

JANGAN menggunakan Go/Golang.

JANGAN membuat backend Go baru.

JANGAN mengganti backend Node.js yang sudah ada dengan teknologi lain.

==================================================

## TUJUAN UTAMA

==================================================

Saya ingin aplikasi benar-benar berjalan menggunakan database PostgreSQL.

Tidak boleh ada dummy transaction.

Semua data transaksi harus berasal dari PostgreSQL.

JANGAN menggunakan:

* dummyTickets
* dummyUsers
* dummyServices
* dummyNotifications
* mockTickets
* mockServices
* hardcoded tickets
* hardcoded users
* hardcoded notifications
* fake dashboard statistics
* localStorage sebagai database
* sessionStorage sebagai database
* array JavaScript sebagai database

Semua proses:

CREATE
READ
UPDATE
DELETE

harus melalui:

React
↓
Node.js / Express API
↓
PostgreSQL

==================================================

## AUDIT PROJECT

==================================================

Sebelum melakukan perubahan:

1. Scan seluruh project.
2. Cari frontend React.
3. Cari backend Node.js.
4. Cari Express routes.
5. Cari controllers.
6. Cari services.
7. Cari database connection.
8. Cari PostgreSQL configuration.
9. Cari migration/schema yang sudah ada.
10. Cari authentication.
11. Cari middleware authorization.
12. Cari seluruh dummy data.
13. Cari mock API.
14. Cari localStorage/sessionStorage.
15. Cari halaman dashboard berdasarkan role.
16. Cari halaman Kelola Layanan.
17. Cari halaman tiket.
18. Cari halaman detail tiket.
19. Cari halaman notifikasi.
20. Cari halaman rating.

JANGAN langsung membuat project backend baru.

Gunakan backend Node.js yang sudah tersedia dan rapikan jika diperlukan.

==================================================

## DATABASE FINAL

==================================================

Gunakan 16 tabel utama:

1. roles
2. users
3. teams
4. team_members
5. service_categories
6. services
7. service_requirements
8. ticket_statuses
9. tickets
10. ticket_details
11. ticket_attachments
12. ticket_assignments
13. ticket_histories
14. ticket_feedback
15. notifications
16. refresh_tokens / sessions

JANGAN membuat:

* skm_questions
* ticket_feedback_answers
* ratings

Karena sistem feedback dibuat sederhana.

==================================================

## FEEDBACK / RATING

==================================================

Setelah tiket selesai dikerjakan, user memberikan rating.

Gunakan satu tabel:

ticket_feedback

Kolom:

* id
* ticket_id
* user_id
* rating
* comment
* created_at
* updated_at

rating:

1 sampai 5.

Satu tiket hanya boleh memiliki satu feedback.

Tambahkan UNIQUE:

ticket_id

Alur:

Tiket selesai
↓
WAITING_USER_CONFIRMATION
↓
User memberikan rating
↓
Feedback masuk PostgreSQL
↓
Status menjadi COMPLETED

Tidak perlu membuat sistem SKM terpisah.

==================================================

## USER DAN TIKET

==================================================

Setiap user hanya boleh melihat tiket miliknya sendiri.

Contoh:

Azka memiliki:

4 tiket

Budi memiliki:

0 tiket

Citra memiliki:

7 tiket

Jika Azka login:

GET /api/my/tickets

Node.js harus mengambil user_id dari JWT/session.

JANGAN mempercayai user_id yang dikirim dari frontend untuk menentukan pemilik tiket.

Contoh:

JWT:

user_id = 15

Query:

SELECT ...
FROM tickets
WHERE user_id = $1

parameter:

15

Jika user belum mempunyai tiket:

{
"success": true,
"data": [],
"meta": {
"total": 0
}
}

Frontend harus menampilkan:

"Belum ada pengajuan tiket"

JANGAN membuat tiket kosong.

==================================================

## ROLE

==================================================

USER:

* melihat layanan
* membuat tiket
* melihat tiket sendiri
* melihat detail tiket sendiri
* melihat history
* melihat notifikasi sendiri
* memberikan rating setelah tiket selesai

HELPDESK:

* melihat tiket yang perlu diverifikasi
* menerima tiket
* menolak tiket
* memberikan alasan penolakan
* meneruskan tiket ke team

PEGAWAI:

* melihat tiket yang ditugaskan
* melihat tiket team
* mengubah progress
* memberikan update pekerjaan
* menyelesaikan pekerjaan

ADMIN:

* CRUD users
* CRUD teams
* CRUD team members
* CRUD kategori layanan
* CRUD layanan
* CRUD requirements
* melihat seluruh tiket
* melihat statistik
* melihat feedback
* melihat notifications

==================================================

## NODE.JS BACKEND

==================================================

Gunakan Node.js + Express.

Struktur boleh menyesuaikan project existing.

Jika belum memiliki struktur yang jelas, gunakan pola:

backend/
├── src/
│   ├── config/
│   ├── middleware/
│   ├── routes/
│   ├── controllers/
│   ├── services/
│   ├── repositories/
│   ├── utils/
│   └── app.js
├── migrations/
├── package.json
└── server.js

Jangan merombak struktur existing jika sudah baik.

==================================================

## AUTH API

==================================================

POST /api/auth/register

POST /api/auth/login

POST /api/auth/refresh

POST /api/auth/logout

GET /api/auth/me

Gunakan JWT.

Password wajib di-hash.

Jangan menyimpan password plain text.

==================================================

## SERVICE API

==================================================

PUBLIC:

GET /api/services

GET /api/services/:id

ADMIN:

GET /api/admin/service-categories

POST /api/admin/service-categories

PUT /api/admin/service-categories/:id

DELETE /api/admin/service-categories/:id

GET /api/admin/services

POST /api/admin/services

PUT /api/admin/services/:id

DELETE /api/admin/services/:id

REQUIREMENTS:

POST /api/admin/services/:id/requirements

PUT /api/admin/requirements/:id

DELETE /api/admin/requirements/:id

Semua endpoint harus benar-benar menggunakan PostgreSQL.

==================================================

## TICKET API

==================================================

USER:

POST /api/tickets

GET /api/my/tickets

GET /api/my/tickets/:id

POST /api/my/tickets/:id/confirm

POST /api/my/tickets/:id/feedback

HELPDESK:

GET /api/helpdesk/tickets

GET /api/helpdesk/tickets/:id

PATCH /api/helpdesk/tickets/:id/verify

PATCH /api/helpdesk/tickets/:id/reject

PATCH /api/helpdesk/tickets/:id/assign

PEGAWAI:

GET /api/employee/tickets

GET /api/employee/tickets/:id

PATCH /api/employee/tickets/:id/progress

PATCH /api/employee/tickets/:id/complete

ADMIN:

GET /api/admin/tickets

GET /api/admin/tickets/:id

HISTORY:

GET /api/tickets/:id/history

NOTIFICATIONS:

GET /api/notifications

PATCH /api/notifications/:id/read

PATCH /api/notifications/read-all

FEEDBACK:

GET /api/tickets/:id/feedback

POST /api/my/tickets/:id/feedback

==================================================

## DATABASE TRANSACTION

==================================================

Gunakan PostgreSQL transaction untuk proses penting.

Contoh ketika user membuat tiket:

BEGIN

INSERT tickets

INSERT ticket_details

INSERT ticket_histories

INSERT notifications

COMMIT

Jika gagal:

ROLLBACK

Jangan sampai ticket berhasil dibuat tetapi history gagal tanpa penanganan.

==================================================

## TICKET HISTORY

==================================================

Setiap perubahan penting wajib masuk:

ticket_histories

Minimal:

* ticket_id
* changed_by_user_id
* old_status_id
* new_status_id
* log_description
* created_at

Contoh timeline:

Tiket dibuat
↓
Diverifikasi
↓
Diterima
↓
Ditugaskan
↓
Diproses
↓
Selesai
↓
Menunggu rating
↓
Completed

History tidak boleh hilang ketika status berubah.

==================================================

## ASSIGNMENT

==================================================

Gunakan:

ticket_assignments

untuk menentukan:

* team
* pegawai
* siapa yang memberikan assignment
* kapan ditugaskan
* kapan mulai
* kapan selesai

Jangan memasukkan nama team sebagai text berulang ke tickets.

Gunakan foreign key.

==================================================

## PROGRESS

==================================================

Pegawai dapat mengubah progress:

0%
25%
50%
75%
100%

Validasi:

progress >= 0
progress <= 100

Jika 100%:

status:

WAITING_USER_CONFIRMATION

User kemudian memberikan rating.

Setelah feedback berhasil:

status:

COMPLETED

==================================================

## NOTIFICATIONS

==================================================

Gunakan tabel:

notifications

Kolom:

* id
* user_id
* ticket_id
* type
* title
* message
* is_read
* created_at
* read_at

Notifikasi dibuat oleh backend Node.js.

Contoh:

Ketika tiket dibuat:

→ Helpdesk mendapat notifikasi.

Ketika tiket diverifikasi:

→ User mendapat notifikasi.

Ketika tiket ditugaskan:

→ Pegawai/Team mendapat notifikasi.

Ketika pengerjaan dimulai:

→ User mendapat notifikasi.

Ketika selesai:

→ User mendapat notifikasi.

Ketika menunggu rating:

→ User mendapat notifikasi.

JANGAN hardcode notification di React.

==================================================

## REACT FRONTEND

==================================================

Semua data aplikasi harus diambil dari API Node.js.

Hapus/ganti seluruh:

* dummy data
* mock data
* static ticket
* static service
* static notification
* static dashboard statistics

Gunakan API service layer.

Contoh:

src/services/api.js

atau sesuaikan dengan struktur existing.

Frontend tidak boleh berkomunikasi langsung ke PostgreSQL.

Hanya:

React
↓
Node.js API
↓
PostgreSQL

==================================================

## DASHBOARD USER

==================================================

Dashboard harus mengambil data real.

Contoh:

GET /api/my/tickets

Tampilkan:

* total tiket
* pending
* diproses
* menunggu rating
* selesai

Semua angka harus berasal dari PostgreSQL.

Jika user baru:

Total = 0

Jangan tampilkan angka dummy.

==================================================

## DASHBOARD HELPDESK

==================================================

Tampilkan real data:

* menunggu verifikasi
* diterima
* ditolak
* perlu diteruskan

==================================================

## DASHBOARD PEGAWAI

==================================================

Tampilkan:

* tiket ditugaskan
* sedang dikerjakan
* progress
* deadline/SLA
* selesai

Data harus berdasarkan team/pegawai yang sedang login.

==================================================

## DASHBOARD ADMIN

==================================================

Statistik harus berasal dari PostgreSQL:

* total users
* total services
* total tickets
* tiket pending
* tiket diproses
* tiket selesai
* rata-rata rating
* jumlah feedback
* layanan aktif

JANGAN menggunakan angka hardcoded.

==================================================

## CRUD KELola LAYANAN

==================================================

Halaman Kelola Layanan harus benar-benar CRUD PostgreSQL.

Tambah:

POST /api/admin/services

Edit:

PUT /api/admin/services/:id

Delete:

DELETE /api/admin/services/:id

List:

GET /api/admin/services

Kategori dan requirements juga harus CRUD.

Setelah operasi berhasil:

* tampilkan response backend
* refresh/refetch data
* tampilkan data terbaru dari PostgreSQL

JANGAN hanya mengubah state React.

==================================================

## SECURITY

==================================================

Wajib:

* JWT authentication
* role middleware
* password hashing
* parameterized SQL
* input validation
* CORS
* environment variables
* authorization berdasarkan user login

Jangan:

* hardcode JWT secret
* hardcode password database
* SQL string concatenation
* mempercayai user_id dari request body untuk authorization
* expose password hash ke frontend

==================================================

## ENVIRONMENT

==================================================

Gunakan:

DATABASE_URL=
JWT_SECRET=
PORT=
CORS_ORIGIN=

Sesuaikan dengan project existing.

Jangan hardcode credential.

==================================================

## DATABASE MIGRATION

==================================================

Jangan langsung DROP database tanpa pemeriksaan.

Lakukan:

1. Audit database lama.
2. Backup jika diperlukan.
3. Buat migration.
4. Terapkan schema baru.
5. Buat foreign key.
6. Buat index.
7. Buat unique constraint.
8. Migrasikan data lama yang masih relevan jika memungkinkan.
9. Verifikasi hasil migration.

Jika database development memang aman untuk direbuild, tetap gunakan migration yang jelas.

==================================================

## SEED DATA

==================================================

Tidak boleh ada dummy transaction.

Yang boleh di-seed:

* roles
* ticket statuses
* service categories/services jika memang diperlukan sebagai master data
* teams

Jangan seed:

* dummy ticket
* dummy notification
* dummy feedback
* dummy history
* dummy user biasa

==================================================

## TESTING WAJIB

==================================================

Test:

1. PostgreSQL connection
2. Migration
3. Register
4. Login
5. JWT
6. Role authorization
7. CRUD service
8. CRUD category
9. CRUD requirements
10. Create ticket
11. User melihat ticket sendiri
12. User baru dengan 0 ticket
13. User lain tidak bisa melihat ticket
14. Helpdesk verification
15. Reject ticket
16. Assignment
17. Employee progress
18. Complete pekerjaan
19. Ticket history
20. Notification
21. Notification read
22. Feedback/rating
23. Duplicate feedback
24. Admin dashboard
25. User dashboard

==================================================

## TEST CASE PALING PENTING

==================================================

TEST 1:

Buat User A.

User A belum membuat ticket.

GET:

/api/my/tickets

HASIL:

data = []

total = 0

Dashboard harus kosong.

Tidak boleh ada ticket dummy.

---

TEST 2:

User A membuat satu ticket.

Database:

tickets = 1

GET /api/my/tickets

HASIL:

1 ticket.

---

TEST 3:

Buat User B.

User B belum membuat ticket.

GET /api/my/tickets

HASIL:

[]

Ticket User A tidak boleh muncul.

---

TEST 4:

User A membuat 4 ticket.

Dashboard User A:

Total = 4

Dashboard User B:

Total = 0

---

TEST 5:

Admin login.

Admin dapat melihat semua ticket.

---

TEST 6:

User B mencoba mengakses ticket milik User A.

HARUS ditolak.

Jangan bocorkan data User A.

---

TEST 7:

Ticket selesai.

Status:

WAITING_USER_CONFIRMATION

User memberikan rating 5.

Feedback tersimpan di PostgreSQL.

Status berubah:

COMPLETED

---

## HASIL AKHIR

==================================================

Saya tidak meminta pseudocode.

Saya tidak meminta contoh implementasi.

Saya meminta implementasi nyata pada project yang tersedia.

Setelah selesai, pastikan:

1. PostgreSQL memiliki schema final.
2. Node.js benar-benar terhubung PostgreSQL.
3. Express API berjalan.
4. Authentication berjalan.
5. Authorization berjalan.
6. React terhubung Node.js API.
7. CRUD layanan benar-benar bekerja.
8. Ticket benar-benar masuk PostgreSQL.
9. Setiap user hanya melihat ticket miliknya.
10. User baru memiliki 0 ticket.
11. Tidak ada dummy transaction.
12. Ticket history bekerja.
13. Assignment bekerja.
14. Progress bekerja.
15. Feedback/rating bekerja.
16. Notification bekerja.
17. Admin dapat melihat seluruh data sesuai hak akses.
18. Helpdesk dapat memverifikasi ticket.
19. Pegawai dapat mengerjakan ticket.
20. User dapat melihat tracking ticket.

==================================================
ATURAN TERAKHIR
===============

JANGAN membuat backend Go.

Backend project ini adalah NODE.JS.

JANGAN membuat database dummy.

JANGAN membuat ticket dummy.

JANGAN membuat dashboard dengan angka palsu.

JANGAN menggunakan localStorage sebagai database.

JANGAN membuat CRUD palsu.

Semua data harus:

React
↓
Node.js + Express
↓
PostgreSQL

Dan pembacaan:

PostgreSQL
↓
Node.js + Express
↓
React

Jika terdapat kode lama yang konflik dengan sistem ini, audit terlebih dahulu lalu perbaiki dengan solusi yang paling aman.

Jangan merusak fitur yang masih diperlukan.

Setelah implementasi selesai, berikan laporan:

* 16 tabel final dan fungsinya
* relasi antar tabel
* migration yang dibuat
* endpoint API
* file backend yang diubah
* file frontend yang diubah
* dummy data yang dihapus
* authentication
* authorization
* alur ticket
* alur assignment
* alur progress
* alur feedback
* alur notification
* cara menjalankan PostgreSQL
* cara menjalankan Node.js backend
* cara menjalankan React frontend
* environment variables
* hasil testing
* error yang masih ada jika memang ada

KERJAKAN LANGSUNG PADA SOURCE CODE PROJECT YANG TERSEDIA.
JANGAN BERHENTI PADA ANALISIS ATAU RENCANA SAJA.
