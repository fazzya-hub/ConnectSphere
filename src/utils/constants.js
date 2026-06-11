export const APP_NAME = 'ConnectSphere';

export const AUTH_STRINGS = {
  loginTitle: 'Masuk ke ConnectSphere',
  registerTitle: 'Buat Akun Baru',
  forgotPasswordTitle: 'Lupa Password',
  emailLabel: 'Email',
  emailPlaceholder: 'nama@email.com',
  passwordLabel: 'Password',
  passwordPlaceholder: 'Minimal 6 karakter',
  usernameLabel: 'Username',
  usernamePlaceholder: 'username_kamu',
  loginButton: 'Masuk',
  registerButton: 'Daftar',
  googleButton: 'Masuk dengan Google',
  forgotPasswordLink: 'Lupa password?',
  noAccount: 'Belum punya akun?',
  hasAccount: 'Sudah punya akun?',
  registerLink: 'Daftar',
  loginLink: 'Masuk',
  resetButton: 'Kirim Email Reset',
  backToLogin: 'Kembali ke Login',
  logoutButton: 'Keluar',
};

export const AUTH_ERRORS = {
  'auth/email-already-in-use': 'Email sudah terdaftar.',
  'auth/wrong-password': 'Password salah.',
  'auth/user-not-found': 'Akun tidak ditemukan.',
  'auth/invalid-email': 'Format email tidak valid.',
  'auth/weak-password': 'Password terlalu lemah (minimal 6 karakter).',
  'auth/network-request-failed': 'Tidak ada koneksi internet.',
  'auth/too-many-requests': 'Terlalu banyak percobaan. Coba lagi nanti.',
  default: 'Terjadi kesalahan. Coba lagi.',
};

export const VALIDATION_ERRORS = {
  emailRequired: 'Email wajib diisi.',
  passwordRequired: 'Password wajib diisi.',
  usernameRequired: 'Username wajib diisi.',
  usernameInvalid: 'Username hanya boleh huruf, angka, dan underscore.',
  passwordTooShort: 'Password minimal 6 karakter.',
};
