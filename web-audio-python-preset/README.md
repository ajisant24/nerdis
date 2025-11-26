Live Audio Coding (Python + Pyodide + Tone.js)

Cara deploy:
1. Buat repo baru di GitHub dan upload seluruh isi (index.html, style.css, main.js, folder preset, folder sounds).
2. Masuk ke Vercel -> Import Project -> pilih repo -> Deploy.
3. Buka URL hasil deploy. Tekan "Mulai & Izinkan Audio" sekali pada HP supaya audio boleh jalan.
4. Untuk mode pameran: pilih Mode Pameran dan centang "Auto play" (pastikan browser di device mendukung autoplay setelah gesture).

Catatan:
- Pengunjung dapat men-trigger suara lewat tombol jika "Pengunjung bisa kontrol" dicentang.
- Jangan hapus main.js (fungsi jembatan Pyodide -> Tone.js berada di sana).
- Jika ingin mengganti sample suara, ganti file di folder /sounds. Kualitas yang lebih tinggi direkomendasikan (.wav).
- Jika memerlukan mp3 alih-alih wav, edit SAMPLES di main.js.
