// src/pages/arsipedia/_dummyArsipedia.js

export const ARSIPEDIA_CATEGORIES = [
    "Semua",
    "Modern",
    "Klasik",
    "Desain Interior",
    "Perencanaan Kota",
    "Bersejarah",
];

export const DUMMY_ARTICLES = [
    {
        id: "a1",
        title: "Kebangkitan Peradaban Lembah Indus",
        excerpt:
            "Temukan kota-kota kuno, sistem sanitasi canggih, dan tulisan misterius dari salah satu peradaban pertama dunia.",
        author: "Ahmad Nurhadi",
        authorAvatar:
            "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=96&q=60",
        createdAt: "2023-04-15T09:12:00.000Z",
        category: "Bersejarah",
        tags: ["Sejarah", "Arsitektur", "Peradaban"],
        coverImage:
            "https://images.unsplash.com/photo-1523413651479-597eb2da0ad6?auto=format&fit=crop&w=1400&q=80",
        gallery: [
            "https://images.unsplash.com/photo-1523413651479-597eb2da0ad6?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1529421308418-eab98863cee5?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1505843513577-22bb7d21e455?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=1200&q=80",
        ],
        content: [
            "Arsitektur kota-kota kuno Lembah Indus menunjukkan tingkat perencanaan yang luar biasa untuk zamannya.",
            "Sistem drainase, tata letak jalan, dan standar bangunan mencerminkan pemahaman mendalam tentang fungsi dan higienitas.",
            "Dalam konteks modern, studi peradaban awal memberi kita pelajaran tentang ketahanan kota dan efisiensi infrastruktur.",
        ],
        related: [
            {
                id: "r1",
                title: "Balok Kayu Laminasi Glulam",
                subtitle: "Struktur Kayu",
                image:
                    "https://images.unsplash.com/photo-1523413651479-597eb2da0ad6?auto=format&fit=crop&w=1200&q=80",
            },
            {
                id: "r2",
                title: "Kaca Insulasi Berlapis Rendah-E",
                subtitle: "Material Kaca",
                image:
                    "https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1200&q=80",
            },
            {
                id: "r3",
                title: "Genteng Keramik Glasir Hijau",
                subtitle: "Material Atap",
                image:
                    "https://images.unsplash.com/photo-1586864387789-628af9feed72?auto=format&fit=crop&w=1200&q=80",
            },
        ],
    },

    {
        id: "a2",
        title: "Penemuan Gravitasi Gelombang",
        excerpt:
            "Bagaimana detektor LIGO mengkonfirmasi prediksi Einstein dan membuka era baru astronomi multi-pesan.",
        author: "Sri Rahayu",
        authorAvatar:
            "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=96&q=60",
        createdAt: "2023-05-22T09:12:00.000Z",
        category: "Sains",
        tags: ["Sains", "Teknologi", "Riset"],
        coverImage:
            "https://images.unsplash.com/photo-1581091870622-2f6b8a2f3c62?auto=format&fit=crop&w=1400&q=80",
    },

    {
        id: "a3",
        title: "Blockchain: Lebih dari Sekadar Kripto",
        excerpt:
            "Pelajari potensi revolusioner teknologi blockchain di luar mata uang digital, dari rantai pasok hingga manajemen identitas.",
        author: "Budi Santoso",
        authorAvatar:
            "https://images.unsplash.com/photo-1502685104226-ee32379fefbe?auto=format&fit=crop&w=96&q=60",
        createdAt: "2023-06-10T09:12:00.000Z",
        category: "Teknologi",
        tags: ["Teknologi", "Inovasi", "Sistem"],
        coverImage:
            "https://images.unsplash.com/photo-1624377632657-3902bfd35958?auto=format&fit=crop&w=1400&q=80",
    },

    {
        id: "a4",
        title: "Evolusi Seni Rupa Renaisans",
        excerpt:
            "Jelajahi karya-karya master seperti Leonardo da Vinci dan Michelangelo, serta dampaknya pada budaya Barat.",
        author: "Dewi Lestari",
        authorAvatar:
            "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=96&q=60",
        createdAt: "2023-07-05T09:12:00.000Z",
        category: "Seni",
        tags: ["Seni", "Sejarah", "Budaya"],
        coverImage:
            "https://images.unsplash.com/photo-1526481280695-3c687fd643ed?auto=format&fit=crop&w=1400&q=80",
    },

    {
        id: "a5",
        title: "Misteri Segitiga Bermuda",
        excerpt:
            "Analisis faktual di balik mitos, teori konspirasi, dan hilangnya kapal serta pesawat di Segitiga Bermuda.",
        author: "Fajar Nugroho",
        authorAvatar:
            "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=96&q=60",
        createdAt: "2023-08-18T09:12:00.000Z",
        category: "Sejarah",
        tags: ["Sejarah", "Misteri", "Geografi"],
        coverImage:
            "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1400&q=80",
    },

    {
        id: "a6",
        title: "Tokoh-Tokoh Sastra Dunia",
        excerpt:
            "Dari Shakespeare hingga Austen, jelajahi kehidupan dan warisan para penulis yang membentuk sastra global.",
        author: "Gita Paramita",
        authorAvatar:
            "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=96&q=60",
        createdAt: "2023-09-01T09:12:00.000Z",
        category: "Literatur",
        tags: ["Literatur", "Budaya", "Tokoh"],
        coverImage:
            "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=1400&q=80",
    },

    // 3 tambahan agar grid 3x3 pada screenshot Search Articles
    {
        id: "a7",
        title: "Kecerdasan Buatan: Masa Depan dan Tantangan",
        excerpt:
            "Menjelajahi perkembangan terkini dalam AI, potensinya, serta etika dan tantangan yang menyertainya.",
        author: "Rian Prasetya",
        authorAvatar:
            "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=96&q=60",
        createdAt: "2023-10-10T09:12:00.000Z",
        category: "Teknologi",
        tags: ["AI", "Etika", "Masa Depan"],
        coverImage:
            "https://images.unsplash.com/photo-1526378722484-cc5c5102b890?auto=format&fit=crop&w=1400&q=80",
    },
    {
        id: "a8",
        title: "Perang Dingin: Konfrontasi Ideologi Global",
        excerpt:
            "Analisis mendalam tentang konflik tanpa senjata yang membentuk peta politik dunia pasca-Perang Dunia II.",
        author: "Dina Mariana",
        authorAvatar:
            "https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?auto=format&fit=crop&w=96&q=60",
        createdAt: "2023-11-25T09:12:00.000Z",
        category: "Sejarah",
        tags: ["Sejarah", "Politik", "Global"],
        coverImage:
            "https://images.unsplash.com/photo-1529070538774-1843cb3265df?auto=format&fit=crop&w=1400&q=80",
    },
    {
        id: "a9",
        title: "Gaya Arsitektur Modernis",
        excerpt:
            "Meningkap prinsip-prinsip di balik desain arsitektur abad ke-20 yang menekankan fungsionalitas dan minimalisme.",
        author: "Yoga Pratama",
        authorAvatar:
            "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=96&q=60",
        createdAt: "2023-12-12T09:12:00.000Z",
        category: "Modern",
        tags: ["Arsitektur", "Modern", "Minimalis"],
        coverImage:
            "https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=1400&q=80",
    },
];
