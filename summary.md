# Ringkasan Fitur Aplikasi Article Generator

Aplikasi ini adalah **SEO-First AI Article Generator** yang dibangun menggunakan **Next.js 15** (App Router) dengan tujuan mengotomatisasi pembuatan artikel blog berkualitas tinggi yang ramah SEO.

## 🚀 Fitur Utama (Core Features)

### 1. Keyword Research (Riset Kata Kunci)
- **AI-Powered Discovery:** Menggunakan AI untuk menemukan *long-tail keywords* potensial dari satu kata kunci dasar (*seed keyword*).
- **Intent Classification:** Otomatis mengklasifikasikan intent pencarian menjadi **Informational** atau **Transactional**.
- **Custom Prompt:** Kemampuan untuk memberikan instruksi khusus kepada AI saat melakukan riset keyword.
- **Bulk Selection:** Memilih banyak keyword sekaligus untuk disimpan ke database.

### 2. Article Generation (Pembuatan Artikel)
- **Automated Writing:** Menulis artikel lengkap (800-1000 kata) secara otomatis berdasarkan keyword dan intent.
- **SEO Optimized:** Artikel dibuat dengan struktur heading yang benar (H1, H2, H3), meta description yang menarik, dan keyword placement yang strategis.
- **Custom Instructions:** Fitur untuk memberikan instruksi tambahan pada setiap job generasi artikel (misal: "Gunakan gaya bahasa santai").
- **Manual Generation:** Kemampuan untuk membuat artikel langsung dari input manual tanpa melalui proses riset keyword.
- **Background Jobs:** Proses pembuatan artikel berjalan di background, memungkinkan pengguna melakukan hal lain sambil menunggu.

### 3. Content Management (Manajemen Konten)
- **Article Dashboard:** Melihat daftar artikel yang sudah dibuat dengan status (Draft/Published) dan skor SEO dasar.
- **Rich Text Editor (WYSIWYG):** Editor lengkap (menggunakan Quill) untuk mengedit konten artikel, menambahkan gambar, atau mengubah format sebelum dipublikasi.
- **Regenerate Article:** Kemampuan untuk menulis ulang artikel yang dirasa kurang memuaskan dengan prompt baru.
- **Undo Generation:** Fitur keamanan untuk mengembalikan artikel ke versi sebelumnya jika hasil regenerasi tidak sesuai.
- **Image Handling:** Mendukung input URL gambar dan Alt Text untuk SEO gambar.

## 🛡️ Fitur Admin & Sistem

### 4. User Management (Manajemen Pengguna)
- **Role Based Access Control (RBAC):** Mendukung role **Super Admin**, **Author**, dan **User**.
- **CRUD Pengguna:** Admin dapat menambah, mengedit, dan menghapus pengguna lain.
- **Secure Authentication:** Login sistem menggunakan sesi aman.

### 5. Comment Moderation (Moderasi Komentar)
- **Approval Workflow:** Semua komentar masuk status "Pending" secara default. Admin harus menyetujui (Approve) agar muncul di publik.
- **Bulk Actions:** Menyetujui atau menolak banyak komentar sekaligus.
- **Filter Tab:** Tabs untuk melihat komentar berdasarkan status (All, Pending, Approved, Rejected).

### 6. Settings & Konfigurasi
- **Product Knowledge:** Input konteks global tentang produk/website yang akan digunakan AI sebagai referensi di setiap artikel.
- **AI Provider Switcher:** Opsi untuk memilih provider AI (Google Gemini atau Z.AI/OpenAI Compatible).
- **Social Share Configuration:** Mengaktifkan/menonaktifkan tombol share ke media sosial (Facebook, Twitter, LinkedIn, WhatsApp).
- **Branding:** Mengatur nama aplikasi dan ikon.

## 🎨 User Experience (UX) & Frontend

### 7. Modern UI/UX
- **Responsive Design:** Tampilan admin yang responsif dan ramah mobile (termasuk sidebar dan tabel).
- **Tabbed Interface:** Navigasi yang bersih antara Keyword, Content, dan fitur lainnya.
- **Loading States:** Indikator loading yang jelas pada setiap aksi asinkron (simpan, hapus, generate).

### 8. Feedback System
- **Toast Notifications:** Notifikasi pop-up (Sukses/Error) yang non-intrusive di pojok layar.
- **Confirm Modals:** Dialog konfirmasi yang aman untuk aksi destruktif (Hapus, Undo) untuk mencegah kesalahan klik.
- **Safety Checks:** Pencegahan penghapusan keyword yang masih memiliki artikel terkait (Foreign Key constraint handling).

## 🌐 Fitur Publik (Blog Frontend)

### 9. Public Blog Pages
- **SEO Friendly URLs:** Menggunakan slug yang bersih dan deskriptif.
- **Meta Tags:** Otomatis men-generate Title Tag dan Meta Description untuk setiap halaman.
- **Semantic HTML:** Struktur HTML yang valid untuk memudahkan mesin pencari mengindeks konten.
- **Comment System:** Formulir komentar untuk interaksi pengunjung.
