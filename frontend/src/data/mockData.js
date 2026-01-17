// Mock Data for TRT Çocuk Kitaplık Clone

export const categories = [
  {
    id: 'bizim-kahramanlar',
    name: 'Bizim Kahramanlar',
    description: 'TRT Çocuk karakterlerinin maceraları',
    icon: 'hero',
    color: '#FF6B6B',
    gradient: 'from-red-400 to-orange-400',
    islandImage: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=200&h=200&fit=crop'
  },
  {
    id: 'doganin-masali',
    name: 'Doğanın Masalı',
    description: 'Doğa ve hayvan hikayeleri',
    icon: 'nature',
    color: '#4ECDC4',
    gradient: 'from-green-400 to-teal-400',
    islandImage: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=200&h=200&fit=crop'
  },
  {
    id: 'bizim-masallar',
    name: 'Bizim Masallar',
    description: 'Geleneksel Türk masalları',
    icon: 'fairytale',
    color: '#FFE66D',
    gradient: 'from-yellow-400 to-amber-400',
    islandImage: 'https://images.unsplash.com/photo-1598618137594-8e7657a6ef6a?w=200&h=200&fit=crop'
  },
  {
    id: 'merakli-bilgin',
    name: 'Meraklı Bilgin',
    description: 'Bilim ve keşif hikayeleri',
    icon: 'science',
    color: '#95E1D3',
    gradient: 'from-blue-400 to-cyan-400',
    islandImage: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=200&h=200&fit=crop'
  },
  {
    id: 'hayatin-icinden',
    name: 'Hayatın İçinden',
    description: 'Günlük yaşam hikayeleri',
    icon: 'life',
    color: '#F38181',
    gradient: 'from-pink-400 to-rose-400',
    islandImage: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=200&h=200&fit=crop'
  }
];

export const books = [
  {
    id: 1,
    title: 'Pırıl ve Sihirli Orman',
    author: 'TRT Çocuk',
    category: 'bizim-kahramanlar',
    coverImage: 'https://images.unsplash.com/photo-1598618137594-8e7657a6ef6a?w=300&h=400&fit=crop',
    pages: 24,
    duration: '8 dk',
    ageGroup: '4-6',
    hasAudio: true,
    isNew: true,
    rating: 4.8,
    description: 'Pırıl sihirli ormanda yeni arkadaşlar ediniyor.',
    readCount: 1250
  },
  {
    id: 2,
    title: 'Rafadan Tayfa: Piknik Günü',
    author: 'TRT Çocuk',
    category: 'bizim-kahramanlar',
    coverImage: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=300&h=400&fit=crop',
    pages: 20,
    duration: '6 dk',
    ageGroup: '6-8',
    hasAudio: true,
    isNew: false,
    rating: 4.9,
    description: 'Tayfa piknikte eğlenceli bir gün geçiriyor.',
    readCount: 3420
  },
  {
    id: 3,
    title: 'Ege ile Gaga: Deniz Macerası',
    author: 'TRT Çocuk',
    category: 'bizim-kahramanlar',
    coverImage: 'https://images.unsplash.com/photo-1629992101753-56d196c8aabb?w=300&h=400&fit=crop',
    pages: 18,
    duration: '5 dk',
    ageGroup: '3-5',
    hasAudio: true,
    isNew: true,
    rating: 4.7,
    description: 'Ege ve Gaga denizde yeni keşifler yapıyor.',
    readCount: 890
  },
  {
    id: 4,
    title: 'Ormanın Şarkısı',
    author: 'Ayşe Yıldız',
    category: 'doganin-masali',
    coverImage: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=300&h=400&fit=crop',
    pages: 22,
    duration: '7 dk',
    ageGroup: '5-7',
    hasAudio: true,
    isNew: false,
    rating: 4.6,
    description: 'Orman hayvanlarının müzikal macerası.',
    readCount: 2100
  },
  {
    id: 5,
    title: 'Küçük Sincap',
    author: 'Mehmet Kara',
    category: 'doganin-masali',
    coverImage: 'https://images.unsplash.com/photo-1474511320723-9a56873571b7?w=300&h=400&fit=crop',
    pages: 16,
    duration: '4 dk',
    ageGroup: '3-5',
    hasAudio: true,
    isNew: true,
    rating: 4.9,
    description: 'Küçük sincabın kış hazırlıkları.',
    readCount: 1560
  },
  {
    id: 6,
    title: 'Keloğlan ve Altın Elma',
    author: 'Halk Masalı',
    category: 'bizim-masallar',
    coverImage: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=300&h=400&fit=crop',
    pages: 28,
    duration: '10 dk',
    ageGroup: '6-9',
    hasAudio: true,
    isNew: false,
    rating: 4.8,
    description: 'Keloğlanın altın elma arayışı.',
    readCount: 4500
  },
  {
    id: 7,
    title: 'Nasrettin Hoca Hikayeleri',
    author: 'Halk Masalı',
    category: 'bizim-masallar',
    coverImage: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=300&h=400&fit=crop',
    pages: 30,
    duration: '12 dk',
    ageGroup: '7-10',
    hasAudio: true,
    isNew: false,
    rating: 5.0,
    description: 'Nasrettin Hocanın eğlenceli hikayeleri.',
    readCount: 5200
  },
  {
    id: 8,
    title: 'Uzay Yolculuğu',
    author: 'Dr. Ali Bilim',
    category: 'merakli-bilgin',
    coverImage: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=300&h=400&fit=crop',
    pages: 26,
    duration: '9 dk',
    ageGroup: '6-9',
    hasAudio: true,
    isNew: true,
    rating: 4.7,
    description: 'Güneş sistemini keşfeden bir yolculuk.',
    readCount: 1890
  },
  {
    id: 9,
    title: 'Dinozorlar Dünyası',
    author: 'Prof. Tarih',
    category: 'merakli-bilgin',
    coverImage: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=300&h=400&fit=crop',
    pages: 24,
    duration: '8 dk',
    ageGroup: '5-8',
    hasAudio: true,
    isNew: false,
    rating: 4.9,
    description: 'Dinozorların yaşadığı çağa yolculuk.',
    readCount: 3100
  },
  {
    id: 10,
    title: 'İlk Gün Okulda',
    author: 'Zeynep Öğretmen',
    category: 'hayatin-icinden',
    coverImage: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=300&h=400&fit=crop',
    pages: 18,
    duration: '5 dk',
    ageGroup: '5-7',
    hasAudio: true,
    isNew: false,
    rating: 4.6,
    description: 'Okula ilk gün heyecanı.',
    readCount: 2800
  },
  {
    id: 11,
    title: 'Kardeşim Geliyor',
    author: 'Elif Anne',
    category: 'hayatin-icinden',
    coverImage: 'https://images.unsplash.com/photo-1491013516836-7db643ee125a?w=300&h=400&fit=crop',
    pages: 20,
    duration: '6 dk',
    ageGroup: '4-6',
    hasAudio: true,
    isNew: true,
    rating: 4.8,
    description: 'Yeni kardeşe hazırlık.',
    readCount: 1400
  },
  {
    id: 12,
    title: 'Akıllı Tavşan Momo',
    author: 'TRT Çocuk',
    category: 'bizim-kahramanlar',
    coverImage: 'https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?w=300&h=400&fit=crop',
    pages: 22,
    duration: '7 dk',
    ageGroup: '4-7',
    hasAudio: true,
    isNew: false,
    rating: 4.9,
    description: 'Momonun matematik maceraları.',
    readCount: 3800
  }
];

export const profiles = [
  {
    id: 1,
    name: 'Elif',
    avatar: 'E',
    avatarColor: 'bg-pink-400',
    age: 6,
    booksRead: 24,
    totalReadingTime: '3s 45dk',
    favoriteCategory: 'bizim-kahramanlar'
  },
  {
    id: 2,
    name: 'Can',
    avatar: 'C',
    avatarColor: 'bg-blue-400',
    age: 8,
    booksRead: 42,
    totalReadingTime: '6s 20dk',
    favoriteCategory: 'merakli-bilgin'
  }
];

export const bookPages = [
  {
    pageNumber: 1,
    text: 'Bir varmış, bir yokmuş. Güzel bir bahar gününde, küçük Pırıl ormana doğru yola çıkmış.',
    image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=600&h=400&fit=crop',
    audioTimestamp: 0
  },
  {
    pageNumber: 2,
    text: 'Ormanın derinliklerinde rengârenk çiçekler ve şarkı söyleyen kuşlar varmış.',
    image: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=600&h=400&fit=crop',
    audioTimestamp: 8
  },
  {
    pageNumber: 3,
    text: 'Pırıl, bir sincap ile karşılaşmış. "Merhaba küçük sincap, adın ne?" diye sormuş.',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=400&fit=crop',
    audioTimestamp: 16
  },
  {
    pageNumber: 4,
    text: '"Benim adım Fındık!" demiş sincap. "Sen kimsin?"',
    image: 'https://images.unsplash.com/photo-1474511320723-9a56873571b7?w=600&h=400&fit=crop',
    audioTimestamp: 24
  },
  {
    pageNumber: 5,
    text: 'Pırıl ve Fındık birlikte ormanda maceraya atılmışlar. Çok güzel bir dostluk başlamış.',
    image: 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=600&h=400&fit=crop',
    audioTimestamp: 32
  }
];

export const miniGames = [
  {
    id: 1,
    type: 'puzzle',
    name: 'Yapboz',
    icon: '🧩',
    description: 'Resmi tamamla'
  },
  {
    id: 2,
    type: 'matching',
    name: 'Eşleştirme',
    icon: '🎴',
    description: 'Kartları eşleştir'
  },
  {
    id: 3,
    type: 'quiz',
    name: 'Bilgi Yarışması',
    icon: '❓',
    description: 'Soruları cevapla'
  },
  {
    id: 4,
    type: 'coloring',
    name: 'Boyama',
    icon: '🎨',
    description: 'Resmi boya'
  }
];

export const parentStats = {
  totalBooksRead: 66,
  totalReadingTime: '10s 5dk',
  averageComprehension: 85,
  weeklyProgress: [
    { day: 'Pzt', books: 3 },
    { day: 'Sal', books: 2 },
    { day: 'Çar', books: 4 },
    { day: 'Per', books: 1 },
    { day: 'Cum', books: 5 },
    { day: 'Cmt', books: 3 },
    { day: 'Paz', books: 2 }
  ],
  categoryStats: [
    { category: 'Bizim Kahramanlar', count: 20, percentage: 30 },
    { category: 'Doğanın Masalı', count: 15, percentage: 23 },
    { category: 'Bizim Masallar', count: 12, percentage: 18 },
    { category: 'Meraklı Bilgin', count: 10, percentage: 15 },
    { category: 'Hayatın İçinden', count: 9, percentage: 14 }
  ]
};
