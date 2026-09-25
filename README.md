# Full-Stack Real-Time Kanban Board

Modern web teknolojileriyle geliştirilmiş, sürükle-bırak desteğine ve gerçek zamanlı güncellemelere sahip tam kapsamlı (full-stack) bir görev ve proje yönetim uygulaması.

---

## Özellikler

- **Görev & Kolon Yönetimi:** Görevleri oluşturma, düzenleme, silme ve durumlarına göre kolonlar arasında taşıma.
- **Gerçek Zamanlı Senkronizasyon:** Socket.IO / WebSockets ile farklı kullanıcılar arasında anlık tahta güncellemeleri.
- **Tip Güvenliği:** Hem istemci (Frontend) hem sunucu (Backend) tarafında uçtan uca TypeScript mimarisi.
- **Container Desteği:** Docker & Docker Compose ile veritabanı ve servislerin tek komutla ayağa kaldırılabilmesi.
- **RESTful API:** Modüler, test edilebilir ve güvenli backend mimarisi.

---

## Kullanılan Teknolojiler

### Frontend (`/client`)
- **Framework:** React
- **Dil:** TypeScript
- **State Yönetimi:** Redux Toolkit
- **Stil / Arayüz:** Modern UI Kütüphanesi

### Backend (`/server`)
- **Çalışma Ortamı:** Node.js, Express.js
- **Dil:** TypeScript
- **Veritabanı & ORM:** PostgreSQL, Prisma ORM
- **Önbellek & Kuyruk:** Redis
- **Gerçek Zamanlı Haberleşme:** Socket.IO

### DevOps & Araçlar
- **Container:** Docker, Docker Compose
- **Sürüm Kontrolü:** Git & GitHub (Conventional Commits)

---

## Proje Yapısı

```bash
.
├── client/              # React & TypeScript frontend uygulaması
├── server/              # Node.js, Express & Prisma backend servisi
├── docker-compose.yml   # Servislerin ve veritabanının Docker yapılandırması
├── package.json
└── README.md
