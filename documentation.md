# Dokumentasi Article Generator

Dokumentasi ini mencakup panduan instalasi, struktur proyek, dan cara penggunaan aplikasi Article Generator.

## 🛠️ Tech Stack

Aplikasi ini dibangun menggunakan teknologi web modern:

-   **Frontend:** [Next.js 15](https://nextjs.org/) (App Router), [React 19](https://react.dev/)
-   **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
-   **Database:** [Turso](https://turso.tech/) (LibSQL)
-   **ORM:** [Drizzle ORM](https://orm.drizzle.team/)
-   **AI Integration:** Google Generative AI (Gemini) & OpenAI Compatible (Z.AI)
-   **Icons:** Lucide React

## 🚀 Panduan Instalasi (Installation Guide)

Ikuti langkah-langkah berikut untuk menjalankan aplikasi di komputer lokal Anda.

### 1. Prasyarat
Pastikan Anda sudah menginstal:
-   Node.js (v18 atau lebih baru)
-   Git

### 2. Clone Repository
```bash
git clone <repository-url>
cd article-generator
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Konfigurasi Environment Variables
Buat file `.env.local` di root proyek dan isi dengan konfigurasi berikut:

```env
# Database (Turso)
TURSO_DATABASE_URL=libsql://nama-database-anda.turso.io
TURSO_AUTH_TOKEN=your-turso-auth-token

# AI Providers
GEMINI_API_KEY=your-google-gemini-api-key
ZAI_API_KEY=your-zai-api-key

# App Secret (untuk Auth)
NEXTAUTH_SECRET=your-secret-key-min-32-chars
```

### 5. Setup Database
Jalankan migrasi database untuk membuat tabel yang diperlukan:

```bash
npm run db:push
```
*(Catatan: Pastikan Anda memiliki script `db:push` di package.json yang menjalankan `drizzle-kit push`, atau gunakan `npx drizzle-kit push`)*

### 6. Jalankan Aplikasi
Jalankan server development:

```bash
npm run dev
// atau
npm run dev --turbopack
```

Buka browser dan akses [http://localhost:3000](http://localhost:3000).

## 📖 Panduan Penggunaan (User Manual)

### Login ke Admin
Akses [http://localhost:3000/admin](http://localhost:3000/admin). Login default (jika belum ada user, silakan buat melalui seed atau registrasi jika diaktifkan).

### 1. Melakukan Riset Keyword
1.  Masuk ke menu **Keywords**.
2.  Ketik kata kunci dasar (seed keyword) pada kolom input.
3.  Klik tombol **Research**.
4.  Pilih keyword yang diinginkan dari hasil riset.
5.  Klik **Save Keywords**.

### 2. Membuat Artikel (Generate Article)
1.  Masuk ke menu **Content Manager**.
2.  Buka tab **Keywords** (untuk keyword yang sudah disimpan).
3.  Klik tombol **Generate** pada keyword target.
4.  Tunggu proses selesai (notifikasi akan muncul).
5.  Artikel yang selesai akan muncul di tab **Articles**.
    *   *Alternatif:* Gunakan form "Manual Generate" di tab Keywords untuk membuat artikel langsung tanpa riset.

### 3. Mengelola Artikel
-   **Edit:** Klik ikon pensil untuk membuka editor. Ubah konten, judul, atau gambar. Klik Save.
-   **Delete:** Klik ikon sampah untuk menghapus artikel.
-   **Regenerate:** Jika konten kurang sesuai, klik tombol putar balik (Regenerate) untuk membuat ulang.

### 4. Pengaturan (Settings)
-   **Product Knowledge:** Isi informasi tentang produk/blog Anda agar AI lebih memahami konteks tulisan.
-   **AI Provider:** Pilih engine AI yang ingin digunakan di menu Settings.

## 📂 Struktur Folder

```
src/
├── app/                    # Next.js App Router root
│   ├── admin/              # Halaman-halaman Admin Panel
│   ├── api/                # Backend API Routes
│   ├── article/            # Halaman Public Blog
│   └── layout.tsx          # Root Layout
├── components/             # Reusable React Components
│   └── ...                 # (ConfirmModal, ToastProvider, etc.)
├── lib/
│   ├── db/                 # Database Schema & Connection
│   └── services/           # Logic Service (AI, Auth)
└── ...
```
