"""
Admin Panel CRUD Tests for Books and Pages
Tests all CRUD operations for the Admin Panel functionality
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test data prefix for cleanup
TEST_PREFIX = "TEST_"


class TestBooksListAndGet:
    """Test GET endpoints for books"""
    
    def test_get_all_books(self):
        """Test GET /api/books returns list of books"""
        response = requests.get(f"{BASE_URL}/api/books")
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "books" in data
        assert "total" in data
        assert isinstance(data["books"], list)
        assert data["total"] >= 0
        
        # If books exist, verify structure
        if len(data["books"]) > 0:
            book = data["books"][0]
            assert "id" in book
            assert "title" in book
            assert "author" in book
    
    def test_get_books_with_category_filter(self):
        """Test GET /api/books with category filter"""
        response = requests.get(f"{BASE_URL}/api/books?category=bizim-masallar")
        assert response.status_code == 200
        data = response.json()
        
        # All returned books should have the filtered category
        for book in data["books"]:
            assert book["category"] == "bizim-masallar"
    
    def test_get_single_book(self):
        """Test GET /api/books/{id} returns single book"""
        # First get list to find a valid ID
        list_response = requests.get(f"{BASE_URL}/api/books")
        books = list_response.json()["books"]
        
        if len(books) > 0:
            book_id = books[0]["id"]
            response = requests.get(f"{BASE_URL}/api/books/{book_id}")
            assert response.status_code == 200
            data = response.json()
            assert data["id"] == book_id
    
    def test_get_nonexistent_book(self):
        """Test GET /api/books/{id} with invalid ID returns 404"""
        response = requests.get(f"{BASE_URL}/api/books/nonexistent-id-12345")
        assert response.status_code == 404


class TestBooksCRUD:
    """Test Create, Update, Delete operations for books"""
    
    @pytest.fixture
    def test_book_data(self):
        """Generate unique test book data"""
        unique_id = str(uuid.uuid4())[:8]
        return {
            "title": f"{TEST_PREFIX}Test Book {unique_id}",
            "author": "Test Author",
            "category": "bizim-masallar",
            "coverImage": "https://images.unsplash.com/photo-1598618137594-8e7657a6ef6a?w=300&h=400&fit=crop",
            "description": "Test book description",
            "ageGroup": "4-6",
            "duration": "5 dk",
            "hasAudio": True,
            "isNew": True
        }
    
    def test_create_book(self, test_book_data):
        """Test POST /api/books creates a new book"""
        response = requests.post(
            f"{BASE_URL}/api/books",
            json=test_book_data
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify response contains created book data
        assert "id" in data
        assert data["title"] == test_book_data["title"]
        assert data["author"] == test_book_data["author"]
        assert data["category"] == test_book_data["category"]
        
        # Verify persistence - GET the created book
        book_id = data["id"]
        get_response = requests.get(f"{BASE_URL}/api/books/{book_id}")
        assert get_response.status_code == 200
        fetched_book = get_response.json()
        assert fetched_book["title"] == test_book_data["title"]
        
        # Cleanup - delete the test book
        requests.delete(f"{BASE_URL}/api/books/{book_id}")
    
    def test_update_book(self, test_book_data):
        """Test PUT /api/books/{id} updates a book"""
        # First create a book
        create_response = requests.post(
            f"{BASE_URL}/api/books",
            json=test_book_data
        )
        assert create_response.status_code == 200
        book_id = create_response.json()["id"]
        
        # Update the book
        update_data = {
            "title": f"{TEST_PREFIX}Updated Title",
            "author": "Updated Author",
            "description": "Updated description"
        }
        update_response = requests.put(
            f"{BASE_URL}/api/books/{book_id}",
            json=update_data
        )
        assert update_response.status_code == 200
        updated_book = update_response.json()
        
        # Verify update response
        assert updated_book["title"] == update_data["title"]
        assert updated_book["author"] == update_data["author"]
        assert updated_book["description"] == update_data["description"]
        
        # Verify persistence - GET the updated book
        get_response = requests.get(f"{BASE_URL}/api/books/{book_id}")
        assert get_response.status_code == 200
        fetched_book = get_response.json()
        assert fetched_book["title"] == update_data["title"]
        assert fetched_book["author"] == update_data["author"]
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/books/{book_id}")
    
    def test_delete_book(self, test_book_data):
        """Test DELETE /api/books/{id} deletes a book"""
        # First create a book
        create_response = requests.post(
            f"{BASE_URL}/api/books",
            json=test_book_data
        )
        assert create_response.status_code == 200
        book_id = create_response.json()["id"]
        
        # Delete the book
        delete_response = requests.delete(f"{BASE_URL}/api/books/{book_id}")
        assert delete_response.status_code == 200
        
        # Verify deletion - GET should return 404
        get_response = requests.get(f"{BASE_URL}/api/books/{book_id}")
        assert get_response.status_code == 404
    
    def test_delete_nonexistent_book(self):
        """Test DELETE /api/books/{id} with invalid ID returns 404"""
        response = requests.delete(f"{BASE_URL}/api/books/nonexistent-id-12345")
        assert response.status_code == 404
    
    def test_update_nonexistent_book(self):
        """Test PUT /api/books/{id} with invalid ID returns 404"""
        response = requests.put(
            f"{BASE_URL}/api/books/nonexistent-id-12345",
            json={"title": "Test"}
        )
        assert response.status_code == 404


class TestPagesCRUD:
    """Test CRUD operations for book pages"""
    
    @pytest.fixture
    def test_book_with_cleanup(self):
        """Create a test book and cleanup after test"""
        unique_id = str(uuid.uuid4())[:8]
        book_data = {
            "title": f"{TEST_PREFIX}Book for Pages {unique_id}",
            "author": "Test Author",
            "category": "bizim-masallar",
            "coverImage": "https://example.com/cover.jpg",
            "description": "Test book for page tests",
            "ageGroup": "4-6",
            "duration": "5 dk"
        }
        response = requests.post(f"{BASE_URL}/api/books", json=book_data)
        book = response.json()
        yield book
        # Cleanup
        requests.delete(f"{BASE_URL}/api/books/{book['id']}")
    
    def test_get_book_pages_empty(self, test_book_with_cleanup):
        """Test GET /api/books/{id}/pages returns empty list for new book"""
        book_id = test_book_with_cleanup["id"]
        response = requests.get(f"{BASE_URL}/api/books/{book_id}/pages")
        assert response.status_code == 200
        data = response.json()
        
        assert "pages" in data
        assert "bookId" in data
        assert data["bookId"] == book_id
        assert len(data["pages"]) == 0
    
    def test_create_page(self, test_book_with_cleanup):
        """Test POST /api/books/{id}/pages creates a new page"""
        book_id = test_book_with_cleanup["id"]
        page_data = {
            "pageNumber": 1,
            "text": "Bu ilk sayfa metnidir.",
            "image": "https://images.unsplash.com/photo-1598618137594-8e7657a6ef6a?w=800"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/books/{book_id}/pages",
            json=page_data
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify response
        assert "id" in data
        assert data["pageNumber"] == page_data["pageNumber"]
        assert data["text"] == page_data["text"]
        assert data["image"] == page_data["image"]
        assert data["bookId"] == book_id
        
        # Verify persistence - GET pages
        get_response = requests.get(f"{BASE_URL}/api/books/{book_id}/pages")
        assert get_response.status_code == 200
        pages = get_response.json()["pages"]
        assert len(pages) == 1
        assert pages[0]["text"] == page_data["text"]
    
    def test_create_multiple_pages(self, test_book_with_cleanup):
        """Test creating multiple pages for a book"""
        book_id = test_book_with_cleanup["id"]
        
        # Create 3 pages
        for i in range(1, 4):
            page_data = {
                "pageNumber": i,
                "text": f"Sayfa {i} metni.",
                "image": f"https://example.com/page{i}.jpg"
            }
            response = requests.post(
                f"{BASE_URL}/api/books/{book_id}/pages",
                json=page_data
            )
            assert response.status_code == 200
        
        # Verify all pages exist
        get_response = requests.get(f"{BASE_URL}/api/books/{book_id}/pages")
        pages = get_response.json()["pages"]
        assert len(pages) == 3
        
        # Verify pages are sorted by page number
        for i, page in enumerate(pages):
            assert page["pageNumber"] == i + 1
    
    def test_update_page(self, test_book_with_cleanup):
        """Test PUT /api/books/{id}/pages/{page_id} updates a page"""
        book_id = test_book_with_cleanup["id"]
        
        # Create a page first
        page_data = {
            "pageNumber": 1,
            "text": "Original text",
            "image": "https://example.com/original.jpg"
        }
        create_response = requests.post(
            f"{BASE_URL}/api/books/{book_id}/pages",
            json=page_data
        )
        page_id = create_response.json()["id"]
        
        # Update the page
        update_data = {
            "text": "Updated text content",
            "image": "https://example.com/updated.jpg"
        }
        update_response = requests.put(
            f"{BASE_URL}/api/books/{book_id}/pages/{page_id}",
            json=update_data
        )
        assert update_response.status_code == 200
        updated_page = update_response.json()
        
        # Verify update response
        assert updated_page["text"] == update_data["text"]
        assert updated_page["image"] == update_data["image"]
        
        # Verify persistence
        get_response = requests.get(f"{BASE_URL}/api/books/{book_id}/pages")
        pages = get_response.json()["pages"]
        assert len(pages) == 1
        assert pages[0]["text"] == update_data["text"]
    
    def test_delete_page(self, test_book_with_cleanup):
        """Test DELETE /api/books/{id}/pages/{page_id} deletes a page"""
        book_id = test_book_with_cleanup["id"]
        
        # Create a page first
        page_data = {
            "pageNumber": 1,
            "text": "Page to delete",
            "image": "https://example.com/delete.jpg"
        }
        create_response = requests.post(
            f"{BASE_URL}/api/books/{book_id}/pages",
            json=page_data
        )
        page_id = create_response.json()["id"]
        
        # Delete the page
        delete_response = requests.delete(
            f"{BASE_URL}/api/books/{book_id}/pages/{page_id}"
        )
        assert delete_response.status_code == 200
        
        # Verify deletion
        get_response = requests.get(f"{BASE_URL}/api/books/{book_id}/pages")
        pages = get_response.json()["pages"]
        assert len(pages) == 0
    
    def test_delete_nonexistent_page(self, test_book_with_cleanup):
        """Test DELETE /api/books/{id}/pages/{page_id} with invalid page ID returns 404"""
        book_id = test_book_with_cleanup["id"]
        response = requests.delete(
            f"{BASE_URL}/api/books/{book_id}/pages/nonexistent-page-id"
        )
        assert response.status_code == 404
    
    def test_create_page_for_nonexistent_book(self):
        """Test POST /api/books/{id}/pages with invalid book ID returns 404"""
        page_data = {
            "pageNumber": 1,
            "text": "Test text",
            "image": "https://example.com/test.jpg"
        }
        response = requests.post(
            f"{BASE_URL}/api/books/nonexistent-book-id/pages",
            json=page_data
        )
        assert response.status_code == 404
    
    def test_get_pages_for_nonexistent_book(self):
        """Test GET /api/books/{id}/pages with invalid book ID returns 404"""
        response = requests.get(f"{BASE_URL}/api/books/nonexistent-book-id/pages")
        assert response.status_code == 404


class TestBookTotalPagesUpdate:
    """Test that totalPages is updated when pages are added/deleted"""
    
    def test_total_pages_increments_on_page_create(self):
        """Test that book's totalPages increases when page is created"""
        # Create a test book
        book_data = {
            "title": f"{TEST_PREFIX}TotalPages Test",
            "author": "Test Author",
            "category": "bizim-masallar",
            "coverImage": "https://example.com/cover.jpg",
            "description": "Test",
            "ageGroup": "4-6",
            "duration": "5 dk"
        }
        create_response = requests.post(f"{BASE_URL}/api/books", json=book_data)
        book_id = create_response.json()["id"]
        
        try:
            # Initial totalPages should be 0 or not set
            book = requests.get(f"{BASE_URL}/api/books/{book_id}").json()
            initial_pages = book.get("totalPages", 0)
            
            # Add a page
            page_data = {"pageNumber": 1, "text": "Test", "image": "https://example.com/1.jpg"}
            requests.post(f"{BASE_URL}/api/books/{book_id}/pages", json=page_data)
            
            # Check totalPages increased
            book = requests.get(f"{BASE_URL}/api/books/{book_id}").json()
            assert book.get("totalPages", 0) == initial_pages + 1
            
        finally:
            # Cleanup
            requests.delete(f"{BASE_URL}/api/books/{book_id}")
    
    def test_total_pages_decrements_on_page_delete(self):
        """Test that book's totalPages decreases when page is deleted"""
        # Create a test book
        book_data = {
            "title": f"{TEST_PREFIX}TotalPages Delete Test",
            "author": "Test Author",
            "category": "bizim-masallar",
            "coverImage": "https://example.com/cover.jpg",
            "description": "Test",
            "ageGroup": "4-6",
            "duration": "5 dk"
        }
        create_response = requests.post(f"{BASE_URL}/api/books", json=book_data)
        book_id = create_response.json()["id"]
        
        try:
            # Add 2 pages
            page1 = requests.post(
                f"{BASE_URL}/api/books/{book_id}/pages",
                json={"pageNumber": 1, "text": "Page 1", "image": "https://example.com/1.jpg"}
            ).json()
            requests.post(
                f"{BASE_URL}/api/books/{book_id}/pages",
                json={"pageNumber": 2, "text": "Page 2", "image": "https://example.com/2.jpg"}
            )
            
            # Verify totalPages is 2
            book = requests.get(f"{BASE_URL}/api/books/{book_id}").json()
            assert book.get("totalPages", 0) == 2
            
            # Delete one page
            requests.delete(f"{BASE_URL}/api/books/{book_id}/pages/{page1['id']}")
            
            # Verify totalPages is 1
            book = requests.get(f"{BASE_URL}/api/books/{book_id}").json()
            assert book.get("totalPages", 0) == 1
            
        finally:
            # Cleanup
            requests.delete(f"{BASE_URL}/api/books/{book_id}")


class TestCategoriesEndpoint:
    """Test categories endpoint"""
    
    def test_get_categories(self):
        """Test GET /api/categories returns list of categories"""
        response = requests.get(f"{BASE_URL}/api/categories")
        assert response.status_code == 200
        data = response.json()
        
        assert "categories" in data
        assert isinstance(data["categories"], list)
        
        # Verify category structure
        if len(data["categories"]) > 0:
            cat = data["categories"][0]
            assert "id" in cat
            assert "slug" in cat
            assert "name" in cat


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
