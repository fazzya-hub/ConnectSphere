# ConnectSphere

## Anggota Kelompok
 No | Nama | NIM |
| :--- | :--- | :--- |
| 1 | Faraz Thifal | 2410501022 |
| 2 | Muhammad Kevin | 2410501040 |
| 3 | Khania Ramadhani F | 2410501027 |
| 4 | [Nama Anggota 4] | [NIM Anggota 4] |

## Tema Yang Dipilih

**KELOMPOK 2 - ConnectSphere**  
Fokus Utama: **Real-Time Communication & Social Graph**  
Membangun aplikasi media sosial yang mengutamakan konektivitas real-time dan manajemen social graph yang kompleks seperti real-time Direct Messages (DM), social graph management (sistem follow/mute/block/close friends), in-app & push notifications, serta dynamic live status.

## Tech Stack + Versi

- **React Native 0.81.5**: Framework utama untuk membangun aplikasi mobile native lintas platform.
- **Expo 54.0.34**: Platform pengembangan universal untuk building, running, dan deploying aplikasi React Native.
- **React Navigation v7**: Pustaka navigasi terintegrasi (`RootNavigator`, `MainDrawer`, `MainTab`, `AuthStack`).
  - `@react-navigation/native` v7.3.1
  - `@react-navigation/native-stack` v7.17.3
  - `@react-navigation/bottom-tabs` v7.18.0
  - `@react-navigation/drawer` v7.12.0
- **Zustand 5.0.14**: State management yang ringan, cepat, dan modular untuk mengelola state global seperti sesi autentikasi, tema, dan preferensi aplikasi.
- **Firebase 12.14.0**: Solusi Backend as a Service (BaaS) yang digunakan untuk:
  - **Firebase Authentication**: Autentikasi aman melalui Email/Password dan Google Sign-In.
  - **Firebase Firestore**: Database real-time terdistribusi untuk menyimpan postingan, pesan, notifikasi, dan data relasi.
  - **Firebase Storage**: Penyimpanan objek cloud untuk file media seperti foto profil, media postingan, dan catatan audio.
  - **Firebase Cloud Messaging (FCM)**: Pengiriman push notification ke perangkat pengguna saat aplikasi di latar belakang.
- **React Native Reanimated 4.1.1**: Library animasi performa tinggi berbasis UI thread (digunakan pada typing indicator, emoji picker modal, dan bubble chat entry).
- **React Native Gesture Handler 2.28.0**: Pengelolaan gesture interaktif bawaan perangkat (digunakan untuk swipe-to-reply pesan chat dan deteksi long press pada bubble chat).
- **expo-image 3.0.11**: Komponen gambar performa tinggi yang mendukung caching agresif dan transisi halus.
- **expo-audio 1.1.1**: Fitur perekaman suara (Audio Note) dalam chat langsung dari perangkat mikrofon.
- **expo-av 16.0.8**: Fitur pemutaran file audio note (.m4a) dengan kontrol playback.
- **crypto-js 4.2.0**: Pustaka enkripsi di sisi klien untuk mengenkripsi isi pesan chat dengan standar AES-CBC 256-bit.
- **@react-native-community/netinfo 11.4.1**: Pendeteksian status koneksi internet perangkat untuk mendukung fungsionalitas offline.

## Fitur yang Diimplementasikan

### A. Fitur Utama & Core System (Ketentuan Umum)

- **Authentication & Google Sign-In**: Menggunakan custom hook `useAuth` (`useAuth.js`) untuk memanggil fungsi `registerWithEmail`, `loginWithEmail`, dan `signInWithGoogle` (menggunakan `@react-native-google-signin/google-signin`) dari `authService.js`. State kredensial user disimpan di global store `authStore.js` (Zustand).
- **Protected Routing & Session Persistence**: Logika pergantian layar diatur di `RootNavigator.js`. Peta navigasi secara dinamis memisahkan `AuthStack` (layar belum login) dan `MainDrawer`/`MainTab` (layar utama setelah login) berdasarkan nilai state `isAuthenticated` di `authStore.js`. Sesi login di-persist menggunakan token otentikasi Firebase SDK.
- **Infinite Scroll Post Feed**: Implementasi pada `FeedScreen.js` dengan custom hook `useFeed` (`useFeed.js`) yang melakukan pemuatan data postingan menggunakan `getFeedPosts` dari `firestoreService.js`. Pagination diimplementasikan menggunakan pembatas kueri Firestore (`orderBy`, `startAfter`, `limit`) pada komponen `FlatList` dengan mendeteksi properti `onEndReached` untuk memicu pemuatan data halaman berikutnya (*infinite scroll*).
- **Post Creation**: Form pengunggahan di `CreatePostScreen.js` yang memanfaatkan API `ImagePicker.launchImageLibraryAsync` dari `expo-image-picker` untuk memilih media, mengunggah berkas gambar via fungsi `uploadPostImage` di `storageService.js` ke Firebase Storage, dan membuat dokumen posting baru di Firestore koleksi `posts`.
- **Social Interaction (Like, Comment & Follow)**: 
  - Logika follow/unfollow diatur melalui custom hook `useFollowSystem` (`useFollowSystem.js`) yang berinteraksi dengan API `followUser` dan `unfollowUser` di `socialService.js`.
  - Fitur menyukai postingan dikendalikan lewat `toggleLikePost` pada `firestoreService.js`.
  - Fitur komentar real-time pada `PostDetailScreen.js` menggunakan real-time listener dari `subscribeToComments` di `firestoreService.js` untuk menyajikan tanggapan pengguna secara instan.
- **Search & Discovery**: Diterapkan pada `ExploreScreen.js` menggunakan kueri ter-index di Firestore. Pencarian pengguna dilakukan secara asinkron dengan mencocokkan string awalan (prefix search) menggunakan operator batas atas dan batas bawah: `where('username', '>=', query).where('username', '<=', query + '\uf8ff')`.
- **Offline Cache Mode**: Menggunakan konfigurasi *offline persistence* bawaan Firestore JS SDK (`initializeFirestore(app, { localCache: persistentLocalCache(...) })`). Ketersediaan jaringan dideteksi secara real-time via custom hook `useNetworkStatus` (wrapper `@react-native-community/netinfo`) untuk merender banner peringatan dinamis `OfflineBanner.js` saat koneksi terputus.
- **Dynamic Dark/Light Mode Theme Switching**: Penanganan tema gelap dan terang dikelola oleh `themeStore.js` (Zustand) yang berintegrasi dengan `ThemeProvider` di `themeContext.js`. Seluruh komponen visual menggunakan custom hook `useAppTheme` untuk membaca warna palet yang terdefinisi pada `colors.js` secara dinamis tanpa perlu merestart aplikasi.

---

### B. Fitur Unggulan Real-Time & Social Graph (Kelompok 2)

- **Real-Time 1-on-1 Direct Messages (DM)**: Diterapkan pada `ChatScreen.js` dengan custom hook `useChat` (`useChat.js`) yang membuka Firestore real-time listener (`onSnapshot`) ke subkoleksi `conversations/{conversationId}/messages` diurutkan berdasarkan `createdAt` menurun (limit 50 pesan terakhir). Teks pesan dienkripsi dengan standar AES-CBC 256-bit di client-side menggunakan `encryptMessage` sebelum dikirim ke database, dan didekripsi kembali via `decryptMessage` (`encryption.js`) saat ditampilkan di UI.
- **Typing Indicator**: Status mengetik dipantau melalui custom hook `useTypingIndicator` dan `useOtherTyping` di `useTypingIndicator.js`. Ketika input teks berubah, status pengetikan dikirim ke Firestore `conversations/{id}/typing/{userId}`. Komponen `TypingIndicator.js` menggunakan library `react-native-reanimated` untuk menjalankan animasi bouncing 3 titik menggunakan shared values (`useSharedValue`), delay berurutan (`withDelay`), dan pengulangan animasi (`withRepeat`).
- **Message Read Receipts**: Status dibaca (read receipts) dilacak secara visual melalui komponen `ReadReceipt.js` yang merender ikon centang satu atau centang dua biru. Ketika penerima membuka `ChatScreen.js`, fungsi `markMessagesAsRead` di `chatService.js` dipanggil untuk memperbarui kolom `read: true` pada dokumen pesan yang belum terbaca melalui operasi write batch Firestore.
- **Emoji Reactions**: Pemicu reaction diaktifkan dengan gesture long press pada `MessageBubble.js` yang membuka `EmojiReactionPicker.js`. Modal picker ini teranimasi menggunakan transisi Reanimated `ZoomIn` dan `SlideInDown`. Pilihan reaksi disimpan ke database menggunakan fungsi `addReaction` atau `removeReaction` (`chatService.js`) untuk memperbarui field map `reactions` pada dokumen pesan.
- **Multimedia Chat (Audio Note & Image)**: 
  - Pengiriman rekaman suara menggunakan komponen audio composer `AudioNote.js` yang terintegrasi dengan `expo-audio` untuk merekam file format `.m4a` dan mengunggahnya ke Firebase Storage (`uploadChatAudio` di `storageService.js`). Pemutaran audio note menggunakan API Sound dari `expo-av` dengan feedback progress slider secara dinamis.
  - Gambar dikirim menggunakan `ImagePicker` dan ditampilkan via komponen `<Image>` dari `expo-image` untuk performa rendering dan caching optimal.
- **Swipe-to-Reply Gesture**: Pesan chat bubble pada `MessageBubble.js` dibungkus menggunakan `GestureDetector` dari `react-native-gesture-handler`. Pergeseran balon pesan dianimasikan secara horizontal lewat `useSharedValue` dan `useAnimatedStyle` (Reanimated). Ketika tarikan melewati threshold, callback `onReply(message)` dipicu untuk menampilkan panel preview kutipan pesan di atas input bar pada `ChatScreen.js` sebelum dibalikkan ke posisi semula memakai `withSpring`.
- **Follow Request System (Public vs Private Account)**: Dikelola oleh hook `useFollowSystem.js`. Saat pengguna menekan `FollowButton.js`, sistem memeriksa field `isPrivate` pada dokumen target user. Jika akun berstatus privat, `createFollowRequest` di `socialService.js` dipanggil untuk memasukkan dokumen berstatus `'pending'` ke koleksi `followRequests`. Jika publik, relasi langsung dicatat pada koleksi `follows` sebagai dokumen `${followerId}_${followingId}` (auto-follow).
- **Mutual Follow & Suggestion Algorithm**: 
  - Custom hook `usePeopleYouMayKnow` (`useSocialGraph.js`) secara rekursif mengkueri daftar pengikut dari orang yang kita ikuti (2nd-degree connections), menyaring pengguna yang telah diblokir (`getAllBlockedUserIds`) atau sudah diikuti, lalu mengembalikan 5 saran pertemanan acak.
  - Custom hook `useMutualFollowers` menghitung persentase irisan antara daftar following pengguna aktif dengan followers target user.
- **Block & Mute System**: API `blockUser` dan `muteUser` pada `socialService.js` mencatat relasi pembatasan ke koleksi `blocks` dan `mutes` di Firestore. Akun yang diblokir disaring di sisi kueri agar profil dan postingan mereka tidak terlihat sama sekali. Postingan dari akun yang di-mute secara otomatis disaring keluar dari feed query pengguna aktif.
- **Close Friends Privileges**: Halaman pengaturan profil menyediakan antarmuka untuk menambahkan user ID tertentu ke dalam array `closeFriends` di dokumen profil pengguna. Visibilitas status Live disaring menggunakan kueri Firestore (`where('visibility', 'in', ['public', 'close_friends'])`) dan divalidasi di client-side dengan memeriksa apakah user sedang masuk berada dalam array `closeFriends` si pembuat status.
- **In-App & FCM Push Notification Center**: 
  - Registrasi perangkat dilakukan saat inisialisasi aplikasi via `registerForPushNotificationsAsync` (`notificationService.js`) untuk menyimpan token unik ke Firestore.
  - Notifikasi dikelompokkan (grouping) secara cerdas pada `NotificationScreen.js` menggunakan helper pengelompokkan ID event yang sama (misal likes pada postingan yang sama).
  - Preferensi notifikasi pengguna disimpan di koleksi `users/{userId}/preferences` dan diatur melalui `NotificationPreferenceScreen.js`.
  - Notifikasi yang belum dibaca dipantau melalui Zustand `notificationStore.js` dengan Firestore listener untuk memperbarui `NotificationBadge.js` secara langsung tanpa polling.
  - Deep linking diatur pada berkas `App.js` menggunakan handler `addNotificationResponseReceivedListener` untuk mengarahkan pengguna secara instan ke layar obrolan, detail postingan, atau permintaan follow berdasarkan metadata push notifikasi.
- **Live Status (Location & Music)**: Pembuatan status dinamis dikelola oleh `LiveStatusControl.js` dan modal `LiveStatusPickerModal.js`. Komponen ini berintegrasi dengan custom hook `useCurrentLocation` (memakai `expo-location` untuk reverse geocoding nama tempat) dan `useNowPlaying` (simulasi track musik). Status disimpan di koleksi `liveStatuses` dengan penanda TTL (Time-To-Live) dan disaring pada kueri Firestore (`useLiveStatus.js`) agar hanya mengambil status yang aktif dalam kurun waktu 24 jam terakhir.

## Struktur Folder Proyek

```
connectsphere/
├── android/            # Kode native Android (dihasilkan oleh Expo Prebuild)
├── assets/             # Aset gambar, font, dan ikon aplikasi
├── modules/            # Local Expo Native Modules (custom native integration)
│   └── media-session-module/  # Mengambil trek audio yang diputar langsung via Android MediaSession
├── src/                # Kode Sumber Utama (React Native)
│   ├── components/     # Komponen UI Reusable
│   │   ├── common/     # Komponen umum (Avatar, Button, Input, Loader, OfflineBanner)
│   │   ├── dm/         # Komponen chat (AudioNote, EmojiReactionPicker, MessageBubble, ReadReceipt, TypingIndicator)
│   │   ├── feed/       # Komponen feed (PostActions, PostCard, StoryRing)
│   │   ├── live/       # Komponen status live (LiveStatusControl, LiveStatusPickerModal, LiveStatusRing, LocationPicker, NowPlayingPicker)
│   │   ├── notification/ # Komponen notifikasi (NotificationBadge, NotificationItem)
│   │   └── social/     # Komponen grafis sosial (FollowButton, SocialGraphStats, UserCard)
│   ├── config/         # Konfigurasi eksternal (Firebase setup & OAuth)
│   ├── hooks/          # Custom React Hooks
│   │   ├── useAuth.js              # State auth dan login/register helper
│   │   ├── useChat.js              # Logika pengiriman & sinkronisasi chat
│   │   ├── useCurrentLocation.js   # Memperoleh lokasi perangkat untuk Live Status
│   │   ├── useFeed.js              # State post list, like, comment, & pull-to-refresh
│   │   ├── useFollowSystem.js      # Sistem follow/unfollow dan private request
│   │   ├── useLiveStatus.js        # Listener live status teman & update status user
│   │   ├── useNetworkStatus.js     # Memantau koneksi internet (NetInfo)
│   │   ├── useNotifications.js     # Mengelola in-app & push notification
│   │   ├── useNowPlaying.js        # Memilih & memformat musik yang sedang diputar
│   │   ├── useSocialGraph.js       # Pencarian mutual friends & list pengikut
│   │   └── useTypingIndicator.js   # Pengaturan typing status real-time
│   ├── navigation/     # Navigasi Aplikasi
│   │   ├── AuthStack.js            # Alur sebelum masuk (Login, Register, Forgot Password)
│   │   ├── MainDrawer.js           # Menu samping (Drawer) navigasi profil/pengaturan
│   │   ├── MainTab.js              # Tab bawah (Feed, Explore, DM Inbox, Notifications)
│   │   └── RootNavigator.js        # Navigator utama penghubung Auth & App
│   ├── screens/        # Layar Utama Aplikasi
│   │   ├── auth/       # LoginScreen, RegisterScreen, ForgotPasswordScreen
│   │   ├── dm/         # InboxScreen (Daftar Chat), ChatScreen (Pesan 1-on-1)
│   │   ├── main/       # FeedScreen, ExploreScreen, NotificationScreen, ProfileScreen
│   │   ├── post/       # CreatePostScreen, PostDetailScreen
│   │   ├── settings/   # SettingsScreen, NotificationPreferenceScreen
│   │   └── social/     # FollowersScreen, FollowingScreen, FollowRequestScreen, UserProfileScreen
│   ├── services/       # Koneksi API, Firebase, & Database
│   │   ├── authService.js          # CRUD Firebase Auth & Google Sign-In
│   │   ├── chatService.js          # CRUD DM Firestore (tambah pesan, typing, read receipt)
│   │   ├── firestoreService.js     # CRUD General Firestore (postingan, komentar, like)
│   │   ├── liveStatusService.js    # CRUD Live Status (tambah status 24-jam)
│   │   ├── notificationService.js  # Registrasi FCM Token & push notification trigger
│   │   ├── socialService.js        # CRUD Follow, Block, Mute, Close Friends
│   │   └── storageService.js       # Pengunggahan file gambar/audio ke Firebase Storage
│   ├── store/          # State Global Zustand
│   │   ├── authStore.js            # Penyimpanan sesi user terotentikasi
│   │   ├── feedStore.js            # Penyimpanan cache postingan feed
│   │   ├── liveStatusStore.js      # Penyimpanan status live user sendiri
│   │   ├── notificationStore.js    # Penyimpanan badge count dan data notifikasi
│   │   ├── socialStore.js          # Penyimpanan relasi follow/block
│   │   └── themeStore.js           # Penyimpanan preferensi tema warna aktif
│   ├── theme/          # Manajemen Desain dan Gaya
│   │   ├── colors.js               # Palet warna terang dan gelap
│   │   ├── index.js                # Ekspor file tema
│   │   ├── spacing.js              # Satuan margin dan padding standar
│   │   ├── themeContext.js         # React Context untuk tema warna dinamis
│   │   └── typography.js           # Pengaturan font Sora dan ukuran teks
│   └── utils/          # Fungsi Bantuan (Helper Utilities)
│       ├── constants.js            # Teks pesan error, placeholder, dsb.
│       ├── dateFormatter.js        # Format tanggal & waktu chat/postingan
│       ├── encryption.js           # Enkripsi & dekripsi pesan AES-CBC
│       ├── liveStatusFormatter.js  # Format teks deskripsi Live Status
│       └── validators.js           # Validasi formulir login & register
├── App.js              # Entrypoint utama aplikasi React Native
├── app.json            # Konfigurasi aplikasi Expo (nama, slug, plugin, dll.)
└── package.json        # File konfigurasi package dependensi NPM
```

## Cara install & run

1. **Clone repositori proyek ini:**
   ```bash
   git clone https://github.com/fazzya-hub/ConnectSphere.git
   cd connectsphere
   ```

2. **Pasang seluruh dependensi:**
   ```bash
   npm install
   ```

3. **Konfigurasi Environment Variables:**
   Buat berkas `.env` pada direktori root proyek berdasarkan `.env.example`:
   ```bash
   cp .env.example .env
   ```
   Isi berkas `.env` dengan kredensial Firebase dan OAuth Client ID Anda:
  
4. **Jalankan server pengembangan Expo:**
   ```bash
   npm expo run:android
   ```
  
## Screenshot

### 1. Feed Screen
<img src="screenshots/SS1.png" width="300">

### 2. Chat Screen
<img src="screenshots/SS2.png" width="300">

### 3. Profile Screen
<img src="screenshots/SS3.png" width="300">

### 4. Notification Screen
<img src="screenshots/SS4.png" width="300">

### 5. Settings Screen
<img src="screenshots/SS5.png" width="300">

## Link & Referensi Penting

- **React Native Documentation**: [https://reactnative.dev/docs/getting-started](https://reactnative.dev/docs/getting-started)
- **Expo Documentation**: [https://docs.expo.dev/](https://docs.expo.dev/)
- **React Navigation**: [https://reactnavigation.org/](https://reactnavigation.org/)
- **Firebase JS SDK**: [https://firebase.google.com/docs/web/setup](https://firebase.google.com/docs/web/setup)
- **Zustand Documentation**: [https://zustand.docs.pmnd.rs/](https://zustand.docs.pmnd.rs/)
- **React Native Reanimated**: [https://docs.swmansion.com/react-native-reanimated/](https://docs.swmansion.com/react-native-reanimated/)
- **React Native Gesture Handler**: [https://docs.swmansion.com/react-native-gesture-handler/](https://docs.swmansion.com/react-native-gesture-handler/)
- **CryptoJS Library**: [https://cryptojs.gitbook.io/docs/](https://cryptojs.gitbook.io/docs/)
- **Expo Audio**: [https://docs.expo.dev/versions/latest/sdk/audio/](https://docs.expo.dev/versions/latest/sdk/audio/)
