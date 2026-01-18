import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Plus, Trash2, Edit, Save, X, BookOpen, 
  FileText, Image, Volume2, Loader2, Check, AlertTriangle
} from 'lucide-react';
import { booksApi, categoriesApi } from '../../services/api';
import axios from 'axios';
import ImageUpload from './ImageUpload';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const AdminPanel = ({ onBack }) => {
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedBook, setSelectedBook] = useState(null);
  const [bookPages, setBookPages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('books');
  const [showAddBook, setShowAddBook] = useState(false);
  const [showAddPage, setShowAddPage] = useState(false);
  const [showEditBook, setShowEditBook] = useState(false);
  const [showEditPage, setShowEditPage] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [showEditCategory, setShowEditCategory] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [audioGenProgress, setAudioGenProgress] = useState('');
  const [editingPage, setEditingPage] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);

  // New book form
  const [newBook, setNewBook] = useState({
    title: '',
    author: 'Çocuk Kitapları',
    category: 'bizim-masallar',
    coverImage: '',
    description: '',
    ageGroup: '4-6',
    duration: '5 dk',
    hasAudio: true,
    isNew: true
  });

  // New page form
  const [newPage, setNewPage] = useState({
    pageNumber: 1,
    text: '',
    image: '',
    insertPosition: 'end' // 'end', 'start', or specific number
  });

  // Edit book form
  const [editBook, setEditBook] = useState({
    title: '',
    author: '',
    category: '',
    coverImage: '',
    description: '',
    ageGroup: '',
    duration: ''
  });

  // Edit page form
  const [editPage, setEditPage] = useState({
    text: '',
    image: '',
    pageNumber: 1
  });

  // New category form
  const [newCategory, setNewCategory] = useState({
    name: '',
    slug: '',
    icon: '📚',
    ageGroup: '4-6',
    sortOrder: 0
  });

  // Edit category form
  const [editCategory, setEditCategory] = useState({
    name: '',
    slug: '',
    icon: '',
    ageGroup: '',
    sortOrder: 0
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [booksRes, catsRes] = await Promise.all([
        booksApi.getAll(),
        categoriesApi.getAll()
      ]);
      setBooks(booksRes.books || []);
      setCategories(catsRes.categories || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const selectBook = async (book) => {
    setSelectedBook(book);
    try {
      const response = await booksApi.getPages(book.id);
      setBookPages(response.pages || []);
    } catch (error) {
      console.error('Error fetching pages:', error);
      setBookPages([]);
    }
  };

  const createBook = async () => {
    setIsSaving(true);
    try {
      const response = await axios.post(`${API_URL}/api/books`, newBook);
      setBooks([...books, response.data]);
      setShowAddBook(false);
      setNewBook({
        title: '',
        author: 'Çocuk Kitapları',
        category: 'bizim-masallar',
        coverImage: '',
        description: '',
        ageGroup: '4-6',
        duration: '5 dk',
        hasAudio: true,
        isNew: true
      });
    } catch (error) {
      console.error('Error creating book:', error);
      alert('Kitap oluşturulurken hata oluştu');
    } finally {
      setIsSaving(false);
    }
  };

  const createPage = async () => {
    if (!selectedBook) return;
    setIsSaving(true);
    try {
      // Calculate page number based on insert position
      let pageNumber;
      if (newPage.insertPosition === 'end') {
        pageNumber = bookPages.length + 1;
      } else if (newPage.insertPosition === 'start') {
        pageNumber = 1;
      } else {
        pageNumber = parseInt(newPage.insertPosition) + 1;
      }
      
      const pageData = {
        pageNumber,
        text: newPage.text,
        image: newPage.image,
        bookId: selectedBook.id
      };
      
      const response = await axios.post(`${API_URL}/api/books/${selectedBook.id}/pages`, pageData);
      
      // Refresh pages to get updated order
      const pagesRes = await booksApi.getPages(selectedBook.id);
      setBookPages(pagesRes.pages || []);
      
      setShowAddPage(false);
      setNewPage({ pageNumber: 1, text: '', image: '', insertPosition: 'end' });
    } catch (error) {
      console.error('Error creating page:', error);
      alert('Sayfa oluşturulurken hata oluştu');
    } finally {
      setIsSaving(false);
    }
  };

  const openEditBook = (book) => {
    setEditBook({
      title: book.title || '',
      author: book.author || '',
      category: book.category || '',
      coverImage: book.coverImage || '',
      description: book.description || '',
      ageGroup: book.ageGroup || '',
      duration: book.duration || ''
    });
    setShowEditBook(true);
  };

  const updateBook = async () => {
    if (!selectedBook) return;
    setIsSaving(true);
    try {
      const response = await axios.put(`${API_URL}/api/books/${selectedBook.id}`, editBook);
      setBooks(books.map(b => b.id === selectedBook.id ? response.data : b));
      setSelectedBook(response.data);
      setShowEditBook(false);
    } catch (error) {
      console.error('Error updating book:', error);
      alert('Kitap güncellenirken hata oluştu');
    } finally {
      setIsSaving(false);
    }
  };

  const deleteBook = async (bookId) => {
    setIsSaving(true);
    try {
      await axios.delete(`${API_URL}/api/books/${bookId}`);
      setBooks(books.filter(b => b.id !== bookId));
      if (selectedBook?.id === bookId) {
        setSelectedBook(null);
        setBookPages([]);
      }
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting book:', error);
      alert('Kitap silinirken hata oluştu');
    } finally {
      setIsSaving(false);
    }
  };

  const openEditPage = (page) => {
    setEditingPage(page);
    setEditPage({
      text: page.text || '',
      image: page.image || '',
      pageNumber: page.pageNumber
    });
    setShowEditPage(true);
  };

  const updatePage = async () => {
    if (!selectedBook || !editingPage) return;
    setIsSaving(true);
    try {
      const response = await axios.put(
        `${API_URL}/api/books/${selectedBook.id}/pages/${editingPage.id}`,
        editPage
      );
      setBookPages(bookPages.map(p => p.id === editingPage.id ? response.data : p));
      setShowEditPage(false);
      setEditingPage(null);
    } catch (error) {
      console.error('Error updating page:', error);
      alert('Sayfa güncellenirken hata oluştu');
    } finally {
      setIsSaving(false);
    }
  };

  const deletePage = async (pageId) => {
    if (!selectedBook) return;
    setIsSaving(true);
    try {
      await axios.delete(`${API_URL}/api/books/${selectedBook.id}/pages/${pageId}`);
      // Refetch pages to get updated page numbers after reordering
      const pagesResponse = await axios.get(`${API_URL}/api/books/${selectedBook.id}/pages`);
      setBookPages(pagesResponse.data.pages || []);
      // Also update the book's total pages
      const booksResponse = await axios.get(`${API_URL}/api/books`);
      setBooks(booksResponse.data.books || []);
      const updatedBook = booksResponse.data.books.find(b => b.id === selectedBook.id);
      if (updatedBook) setSelectedBook(updatedBook);
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting page:', error);
      alert('Sayfa silinirken hata oluştu');
    } finally {
      setIsSaving(false);
    }
  };

  // Category CRUD functions
  const createCategory = async () => {
    setIsSaving(true);
    try {
      const response = await axios.post(`${API_URL}/api/categories`, {
        ...newCategory,
        sortOrder: categories.length + 1
      });
      setCategories([...categories, response.data]);
      setShowAddCategory(false);
      setNewCategory({ name: '', slug: '', icon: '📚', ageGroup: '4-6', sortOrder: 0 });
    } catch (error) {
      console.error('Error creating category:', error);
      alert(error.response?.data?.detail || 'Kategori oluşturulurken hata oluştu');
    } finally {
      setIsSaving(false);
    }
  };

  const openEditCategory = (cat) => {
    setEditingCategory(cat);
    setEditCategory({
      name: cat.name || '',
      slug: cat.slug || '',
      icon: cat.icon || '📚',
      ageGroup: cat.ageGroup || '4-6',
      sortOrder: cat.sortOrder || 0
    });
    setShowEditCategory(true);
  };

  const updateCategory = async () => {
    if (!editingCategory) return;
    setIsSaving(true);
    try {
      const response = await axios.put(`${API_URL}/api/categories/${editingCategory.id}`, editCategory);
      setCategories(categories.map(c => c.id === editingCategory.id ? response.data : c));
      setShowEditCategory(false);
      setEditingCategory(null);
    } catch (error) {
      console.error('Error updating category:', error);
      alert('Kategori güncellenirken hata oluştu');
    } finally {
      setIsSaving(false);
    }
  };

  const deleteCategory = async (categoryId) => {
    setIsSaving(true);
    try {
      await axios.delete(`${API_URL}/api/categories/${categoryId}`);
      setCategories(categories.filter(c => c.id !== categoryId));
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('Kategori silinirken hata oluştu');
    } finally {
      setIsSaving(false);
    }
  };

  const generateAudioForBook = async () => {
    if (!selectedBook) return;
    setIsGeneratingAudio(true);
    setAudioGenProgress('Ses dosyaları oluşturuluyor...');
    
    try {
      const response = await axios.post(`${API_URL}/api/admin/generate-audio/${selectedBook.id}`);
      setAudioGenProgress(`Tamamlandı! ${response.data.success_count} sayfa için ses oluşturuldu.`);
      
      // Refresh pages to get audio URLs
      const pagesRes = await booksApi.getPages(selectedBook.id);
      setBookPages(pagesRes.pages || []);
      
      setTimeout(() => {
        setIsGeneratingAudio(false);
        setAudioGenProgress('');
      }, 2000);
    } catch (error) {
      console.error('Error generating audio:', error);
      setAudioGenProgress('Hata oluştu: ' + (error.response?.data?.detail || error.message));
      setTimeout(() => {
        setIsGeneratingAudio(false);
        setAudioGenProgress('');
      }, 3000);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-4">
          <button 
            onClick={onBack} 
            className="p-2 hover:bg-gray-100 rounded-lg text-gray-700"
            data-testid="admin-back-btn"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-xl font-bold text-gray-800">İçerik Yönetimi</h1>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('books')}
            className={`px-4 py-2 rounded-lg font-medium ${activeTab === 'books' ? 'bg-orange-500 text-white' : 'bg-white text-gray-700'}`}
          >
            <BookOpen size={18} className="inline mr-2" />
            Kitaplar ({books.length})
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`px-4 py-2 rounded-lg font-medium ${activeTab === 'categories' ? 'bg-orange-500 text-white' : 'bg-white text-gray-700'}`}
          >
            Kategoriler ({categories.length})
          </button>
        </div>

        {activeTab === 'books' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Books List */}
            <div className="bg-white rounded-xl shadow-sm p-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-bold text-gray-800">Kitaplar</h2>
                <button
                  onClick={() => setShowAddBook(true)}
                  className="bg-orange-500 text-white px-3 py-1.5 rounded-lg text-sm flex items-center gap-1"
                >
                  <Plus size={16} /> Yeni Kitap
                </button>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {books.map(book => (
                  <div
                    key={book.id}
                    className={`p-3 rounded-lg border transition-colors ${
                      selectedBook?.id === book.id 
                        ? 'border-orange-500 bg-orange-50' 
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => selectBook(book)}
                        className="flex items-center gap-3 flex-1 text-left"
                      >
                        <img src={book.coverImage} alt="" className="w-12 h-16 object-cover rounded" />
                        <div>
                          <p className="font-medium text-gray-800">{book.title}</p>
                          <p className="text-sm text-gray-500">{book.author} • {book.totalPages || 0} sayfa</p>
                        </div>
                      </button>
                      <div className="flex gap-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); selectBook(book); openEditBook(book); }}
                          className="p-2 hover:bg-blue-100 rounded-lg text-blue-600"
                          title="Düzenle"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm({ type: 'book', id: book.id, title: book.title }); }}
                          className="p-2 hover:bg-red-100 rounded-lg text-red-600"
                          title="Sil"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Book Details / Pages */}
            <div className="bg-white rounded-xl shadow-sm p-4">
              {selectedBook ? (
                <>
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="font-bold text-gray-800">{selectedBook.title} - Sayfalar</h2>
                    <div className="flex gap-2">
                      <button
                        onClick={generateAudioForBook}
                        disabled={isGeneratingAudio || bookPages.length === 0}
                        className="bg-purple-500 text-white px-3 py-1.5 rounded-lg text-sm flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                        title={bookPages.length === 0 ? 'Önce sayfa ekleyin' : 'Tüm sayfalar için ses oluştur'}
                      >
                        <Volume2 size={16} /> Ses Oluştur
                      </button>
                      <button
                        onClick={() => setShowAddPage(true)}
                        className="bg-orange-500 text-white px-3 py-1.5 rounded-lg text-sm flex items-center gap-1"
                      >
                        <Plus size={16} /> Sayfa Ekle
                      </button>
                    </div>
                  </div>

                  {isGeneratingAudio && (
                    <div className="mb-4 p-3 bg-purple-50 rounded-lg flex items-center gap-2">
                      <Loader2 size={16} className="animate-spin text-purple-500" />
                      <span className="text-sm text-purple-700">{audioGenProgress}</span>
                    </div>
                  )}

                  {bookPages.length === 0 && (
                    <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-700">
                        <strong>İpucu:</strong> Ses oluşturmak için önce kitaba sayfa eklemeniz gerekiyor.
                      </p>
                    </div>
                  )}

                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {bookPages.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">Henüz sayfa eklenmemiş. Sayfa Ekle butonuna tıklayın.</p>
                    ) : (
                      bookPages.map((page, idx) => (
                        <div key={idx} className="p-3 border rounded-lg">
                          <div className="flex items-start gap-3">
                            <div className="bg-orange-100 text-orange-600 font-bold rounded-full w-8 h-8 flex items-center justify-center text-sm flex-shrink-0">
                              {page.pageNumber}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-gray-700 line-clamp-2">{page.text}</p>
                              <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                                <Image size={12} />
                                <span className="truncate max-w-32">{page.image?.split('/').pop()}</span>
                                {page.audioUrl ? (
                                  <span className="flex items-center gap-1 text-green-600">
                                    <Check size={12} /> Ses var
                                  </span>
                                ) : (
                                  <span className="text-gray-400">Ses yok</span>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-1 flex-shrink-0">
                              <button
                                onClick={() => openEditPage(page)}
                                className="p-1.5 hover:bg-blue-100 rounded text-blue-600"
                                title="Düzenle"
                              >
                                <Edit size={14} />
                              </button>
                              <button
                                onClick={() => setShowDeleteConfirm({ type: 'page', id: page.id, title: `Sayfa ${page.pageNumber}` })}
                                className="p-1.5 hover:bg-red-100 rounded text-red-600"
                                title="Sil"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <BookOpen size={48} className="mx-auto mb-2 opacity-30" />
                  <p>Bir kitap seçin</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'categories' && (
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-gray-800">Kategoriler</h2>
              <button
                onClick={() => setShowAddCategory(true)}
                className="bg-orange-500 text-white px-3 py-1.5 rounded-lg text-sm flex items-center gap-1"
              >
                <Plus size={16} /> Yeni Kategori
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {categories.map(cat => (
                <div key={cat.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{cat.icon || '📚'}</span>
                      <div>
                        <p className="font-medium text-gray-800">{cat.name}</p>
                        <p className="text-sm text-gray-500">{cat.slug}</p>
                        <p className="text-xs text-gray-400 mt-1">Yaş: {cat.ageGroup || 'Belirtilmemiş'}</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => openEditCategory(cat)}
                        className="p-1.5 hover:bg-blue-100 rounded text-blue-600"
                        title="Düzenle"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm({ type: 'category', id: cat.id, title: cat.name })}
                        className="p-1.5 hover:bg-red-100 rounded text-red-600"
                        title="Sil"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Add Book Modal */}
      {showAddBook && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4 sticky top-0 bg-white pb-2 border-b">
              <h3 className="font-bold text-lg text-gray-800">Yeni Kitap Ekle</h3>
              <button onClick={() => setShowAddBook(false)} className="p-2 hover:bg-gray-100 rounded-full">
                <X size={20} className="text-gray-600" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Başlık *</label>
                <input
                  type="text"
                  value={newBook.title}
                  onChange={(e) => setNewBook({...newBook, title: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Kitap başlığı"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Yazar</label>
                <input
                  type="text"
                  value={newBook.author}
                  onChange={(e) => setNewBook({...newBook, author: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Yazar adı"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                <select
                  value={newBook.category}
                  onChange={(e) => setNewBook({...newBook, category: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.slug}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <ImageUpload
                  value={newBook.coverImage}
                  onChange={(url) => setNewBook({...newBook, coverImage: url})}
                  label="Kapak Resmi"
                  placeholder="https://images.unsplash.com/..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama</label>
                <textarea
                  value={newBook.description}
                  onChange={(e) => setNewBook({...newBook, description: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  rows={2}
                  placeholder="Kitap hakkında kısa açıklama"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Yaş Grubu</label>
                  <select
                    value={newBook.ageGroup}
                    onChange={(e) => setNewBook({...newBook, ageGroup: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  >
                    <option value="3-5">3-5 yaş</option>
                    <option value="4-6">4-6 yaş</option>
                    <option value="5-7">5-7 yaş</option>
                    <option value="6-8">6-8 yaş</option>
                    <option value="6-9">6-9 yaş</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Süre</label>
                  <input
                    type="text"
                    value={newBook.duration}
                    onChange={(e) => setNewBook({...newBook, duration: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="5 dk"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6 pt-4 border-t">
              <button
                onClick={() => setShowAddBook(false)}
                className="flex-1 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium text-gray-700"
              >
                İptal
              </button>
              <button
                onClick={createBook}
                disabled={isSaving || !newBook.title}
                className="flex-1 py-2.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
              >
                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Page Modal */}
      {showAddPage && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4 pb-2 border-b">
              <h3 className="font-bold text-lg text-gray-800">Yeni Sayfa Ekle</h3>
              <button onClick={() => setShowAddPage(false)} className="p-2 hover:bg-gray-100 rounded-full">
                <X size={20} className="text-gray-600" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sayfa Konumu</label>
                <select
                  value={newPage.insertPosition}
                  onChange={(e) => setNewPage({...newPage, insertPosition: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="end">Sona Ekle (Sayfa {bookPages.length + 1})</option>
                  <option value="start">Başa Ekle (Sayfa 1)</option>
                  {bookPages.map((_, idx) => (
                    <option key={idx} value={String(idx + 1)}>Sayfa {idx + 1} sonrasına</option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">Sayfa numaraları otomatik güncellenecek</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Metin *</label>
                <textarea
                  value={newPage.text}
                  onChange={(e) => setNewPage({...newPage, text: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  rows={4}
                  placeholder="Bu sayfada anlatılacak hikaye metni..."
                />
              </div>
              <div>
                <ImageUpload
                  value={newPage.image}
                  onChange={(url) => setNewPage({...newPage, image: url})}
                  label="Sayfa Resmi"
                  placeholder="https://images.unsplash.com/..."
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6 pt-4 border-t">
              <button
                onClick={() => setShowAddPage(false)}
                className="flex-1 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium text-gray-700"
              >
                İptal
              </button>
              <button
                onClick={createPage}
                disabled={isSaving || !newPage.text}
                className="flex-1 py-2.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
              >
                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Book Modal */}
      {showEditBook && selectedBook && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">Kitabı Düzenle</h3>
              <button onClick={() => setShowEditBook(false)} className="p-1 hover:bg-gray-100 rounded">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Başlık</label>
                <input
                  type="text"
                  value={editBook.title}
                  onChange={(e) => setEditBook({...editBook, title: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Yazar</label>
                <input
                  type="text"
                  value={editBook.author}
                  onChange={(e) => setEditBook({...editBook, author: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                <select
                  value={editBook.category}
                  onChange={(e) => setEditBook({...editBook, category: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2"
                >
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.slug}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <ImageUpload
                  value={editBook.coverImage}
                  onChange={(url) => setEditBook({...editBook, coverImage: url})}
                  label="Kapak Resmi"
                  placeholder="https://images.unsplash.com/..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama</label>
                <textarea
                  value={editBook.description}
                  onChange={(e) => setEditBook({...editBook, description: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2"
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Yaş Grubu</label>
                  <select
                    value={editBook.ageGroup}
                    onChange={(e) => setEditBook({...editBook, ageGroup: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    <option value="3-5">3-5 yaş</option>
                    <option value="4-6">4-6 yaş</option>
                    <option value="5-7">5-7 yaş</option>
                    <option value="6-8">6-8 yaş</option>
                    <option value="6-9">6-9 yaş</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Süre</label>
                  <input
                    type="text"
                    value={editBook.duration}
                    onChange={(e) => setEditBook({...editBook, duration: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 bg-white"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setShowEditBook(false)}
                className="flex-1 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
              >
                İptal
              </button>
              <button
                onClick={updateBook}
                disabled={isSaving || !editBook.title}
                className="flex-1 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                Güncelle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Page Modal */}
      {showEditPage && editingPage && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4 pb-2 border-b">
              <h3 className="font-bold text-lg text-gray-800">Sayfayı Düzenle (Sayfa {editingPage.pageNumber})</h3>
              <button onClick={() => { setShowEditPage(false); setEditingPage(null); }} className="p-2 hover:bg-gray-100 rounded-full">
                <X size={20} className="text-gray-600" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Metin</label>
                <textarea
                  value={editPage.text}
                  onChange={(e) => setEditPage({...editPage, text: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 bg-white"
                  rows={4}
                />
              </div>
              <div>
                <ImageUpload
                  value={editPage.image}
                  onChange={(url) => setEditPage({...editPage, image: url})}
                  label="Sayfa Resmi"
                  placeholder="https://images.unsplash.com/..."
                />
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={() => { setShowEditPage(false); setEditingPage(null); }}
                className="flex-1 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
              >
                İptal
              </button>
              <button
                onClick={updatePage}
                disabled={isSaving || !editPage.text}
                className="flex-1 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center justify-center gap-2 font-medium"
              >
                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                Güncelle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-red-100 p-2 rounded-full">
                <AlertTriangle size={24} className="text-red-600" />
              </div>
              <h3 className="font-bold text-lg text-gray-800">Silmek istediğinize emin misiniz?</h3>
            </div>
            
            <p className="text-gray-600 mb-6">
              <strong className="text-gray-800">&quot;{showDeleteConfirm.title}&quot;</strong> {
                showDeleteConfirm.type === 'book' ? 'kitabını ve tüm sayfalarını' : 
                showDeleteConfirm.type === 'category' ? 'kategorisini' : 'sayfasını'
              } silmek üzeresiniz. Bu işlem geri alınamaz.
            </p>

            <div className="flex gap-2">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
              >
                İptal
              </button>
              <button
                onClick={() => {
                  if (showDeleteConfirm.type === 'book') deleteBook(showDeleteConfirm.id);
                  else if (showDeleteConfirm.type === 'category') deleteCategory(showDeleteConfirm.id);
                  else deletePage(showDeleteConfirm.id);
                }}
                disabled={isSaving}
                className="flex-1 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 flex items-center justify-center gap-2 font-medium"
              >
                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                Sil
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Category Modal */}
      {showAddCategory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4 pb-2 border-b">
              <h3 className="font-bold text-lg text-gray-800">Yeni Kategori Ekle</h3>
              <button onClick={() => setShowAddCategory(false)} className="p-2 hover:bg-gray-100 rounded-full">
                <X size={20} className="text-gray-600" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kategori Adı *</label>
                <input
                  type="text"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({...newCategory, name: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 bg-white"
                  placeholder="Örn: Macera Hikayeleri"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Slug *</label>
                <input
                  type="text"
                  value={newCategory.slug}
                  onChange={(e) => setNewCategory({...newCategory, slug: e.target.value.toLowerCase().replace(/\s+/g, '-')})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 bg-white"
                  placeholder="Örn: macera-hikayeleri"
                />
                <p className="text-xs text-gray-500 mt-1">URL dostu isim (küçük harf, tire ile)</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">İkon</label>
                  <input
                    type="text"
                    value={newCategory.icon}
                    onChange={(e) => setNewCategory({...newCategory, icon: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 bg-white text-center text-2xl"
                    placeholder="📚"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Yaş Grubu</label>
                  <select
                    value={newCategory.ageGroup}
                    onChange={(e) => setNewCategory({...newCategory, ageGroup: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 bg-white"
                  >
                    <option value="3-5">3-5 yaş</option>
                    <option value="4-6">4-6 yaş</option>
                    <option value="5-7">5-7 yaş</option>
                    <option value="6-8">6-8 yaş</option>
                    <option value="tümü">Tüm yaşlar</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6 pt-4 border-t">
              <button
                onClick={() => setShowAddCategory(false)}
                className="flex-1 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium text-gray-700"
              >
                İptal
              </button>
              <button
                onClick={createCategory}
                disabled={isSaving || !newCategory.name || !newCategory.slug}
                className="flex-1 py-2.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 flex items-center justify-center gap-2 font-medium"
              >
                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Category Modal */}
      {showEditCategory && editingCategory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4 pb-2 border-b">
              <h3 className="font-bold text-lg text-gray-800">Kategoriyi Düzenle</h3>
              <button onClick={() => { setShowEditCategory(false); setEditingCategory(null); }} className="p-2 hover:bg-gray-100 rounded-full">
                <X size={20} className="text-gray-600" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kategori Adı</label>
                <input
                  type="text"
                  value={editCategory.name}
                  onChange={(e) => setEditCategory({...editCategory, name: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
                <input
                  type="text"
                  value={editCategory.slug}
                  onChange={(e) => setEditCategory({...editCategory, slug: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 bg-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">İkon</label>
                  <input
                    type="text"
                    value={editCategory.icon}
                    onChange={(e) => setEditCategory({...editCategory, icon: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 bg-white text-center text-2xl"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Yaş Grubu</label>
                  <select
                    value={editCategory.ageGroup}
                    onChange={(e) => setEditCategory({...editCategory, ageGroup: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 bg-white"
                  >
                    <option value="3-5">3-5 yaş</option>
                    <option value="4-6">4-6 yaş</option>
                    <option value="5-7">5-7 yaş</option>
                    <option value="6-8">6-8 yaş</option>
                    <option value="tümü">Tüm yaşlar</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6 pt-4 border-t">
              <button
                onClick={() => { setShowEditCategory(false); setEditingCategory(null); }}
                className="flex-1 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium text-gray-700"
              >
                İptal
              </button>
              <button
                onClick={updateCategory}
                disabled={isSaving || !editCategory.name}
                className="flex-1 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center justify-center gap-2 font-medium"
              >
                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                Güncelle
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
