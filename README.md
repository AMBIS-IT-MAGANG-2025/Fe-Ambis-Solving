# Fe-Ambis-Solving
Project task manager untuk menyelesaikan permasalahn di Ambisius Academy

$ npm create vite@latest Fe-Ambis-Solving--template react-ts
Need to install the following packages:
create-vite@7.1.1
Ok to proceed? (y) Y

> npx
> create-vite Fe-Ambis-Solving--template react-ts

│
◇  Package name:
│  fe-ambis-solving
│
◇  Select a framework:
│  React
│
◇  Select a variant:
│  TypeScript + SWC
│
◇  Scaffolding project in C:\Users\user\Documents\Project Magang\Fe-Ambis-Solving\Fe-Ambis-Solving--template...
│
└  Done.

$ cd Fe-Ambis-Solving

$ npm install

# Instalasi library yang dibutuhkan sebagai dev dependencies
$ npm install -D tailwindcss@^3.4.3 postcss@^8.4.38 autoprefixer@^10.4.19

$ npx tailwindcss init -p

# Router, State Management, dan Data Fetching
$ npm install @tanstack/react-router
$ npm install @tanstack/react-query
$ npm install zustand

# Form & Validasi
$ npm install react-hook-form@^7.51.5 @hookform/resolvers@^3.4.2 zod@^3.23.8

# Drag-and-Drop, Tanggal, dan Real-time
$ npm install @hello-pangea/dnd
$ npm i date-fns
$ npm i socket.io-client

# Library Ikon
$ npm install lucide-react

(+) Feature-Sliced Design di tambahkan

🎯 Tugas 7 Selesai!
Kamu telah berhasil:
✅ Membuat struktur folder yang sangat baik.
✅ Membuat komponen placeholder untuk halaman-halaman utama.
✅ Mengkonfigurasi TanStack Router dengan rute-rute dasar.

Inti konsep yang perlu kamu ingat

Server state ≠ client state. TanStack Query fokus ke server state; untuk client state pakai Redux/Zustand/Pinia dsb. Mereka saling melengkapi, bukan saling mengganti. 
TanStack

staleTime mengontrol seberapa lama data dianggap segar; habis itu Query bisa refetch otomatis (focus/reconnect/interval). 
TanStack

invalidateQueries adalah kunci agar cache “nyambung” setelah mutate.





Baru sampai task minggu ke 2 tinggal yang ke 3