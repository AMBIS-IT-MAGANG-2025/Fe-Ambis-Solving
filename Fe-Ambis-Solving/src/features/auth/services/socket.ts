import { io } from 'socket.io-client';

// Sesuaikan URL dengan alamat backend Go Anda
const URL = 'http://localhost:8080'; 

export const socket = io(URL, {
  // Opsi autoConnect: false berarti kita akan menyambungkan secara manual
  // Ini adalah praktik yang baik agar koneksi tidak dibuat sebelum dibutuhkan
  autoConnect: false,
});