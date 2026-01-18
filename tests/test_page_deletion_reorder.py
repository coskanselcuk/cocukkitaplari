"""
Test page deletion with reordering functionality
Tests that when a page is deleted, remaining pages are renumbered correctly
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestPageDeletionReorder:
    """Test page deletion and automatic reordering"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test book and pages"""
        self.test_book_id = None
        self.test_page_ids = []
        yield
        # Cleanup
        if self.test_book_id:
            try:
                requests.delete(f"{BASE_URL}/api/books/{self.test_book_id}")
            except:
                pass
    
    def test_delete_middle_page_reorders_remaining(self):
        """Test that deleting a middle page reorders remaining pages correctly"""
        # Create a test book
        book_data = {
            "title": f"TEST_Reorder_Book_{uuid.uuid4().hex[:8]}",
            "author": "Test Author",
            "category": "bizim-masallar",
            "coverImage": "https://example.com/cover.jpg",
            "description": "Test book for page reordering",
            "ageGroup": "4-6",
            "duration": "5 dk"
        }
        
        response = requests.post(f"{BASE_URL}/api/books", json=book_data)
        assert response.status_code == 200, f"Failed to create book: {response.text}"
        book = response.json()
        self.test_book_id = book["id"]
        
        # Create 5 pages
        for i in range(1, 6):
            page_data = {
                "pageNumber": i,
                "text": f"Page {i} content - This is test page number {i}",
                "image": f"https://example.com/page{i}.jpg"
            }
            response = requests.post(f"{BASE_URL}/api/books/{self.test_book_id}/pages", json=page_data)
            assert response.status_code == 200, f"Failed to create page {i}: {response.text}"
            page = response.json()
            self.test_page_ids.append(page["id"])
        
        # Verify we have 5 pages
        response = requests.get(f"{BASE_URL}/api/books/{self.test_book_id}/pages")
        assert response.status_code == 200
        pages = response.json()["pages"]
        assert len(pages) == 5, f"Expected 5 pages, got {len(pages)}"
        
        # Verify page numbers are 1-5
        page_numbers = [p["pageNumber"] for p in pages]
        assert page_numbers == [1, 2, 3, 4, 5], f"Initial page numbers incorrect: {page_numbers}"
        
        # Delete page 3 (middle page)
        page_3_id = self.test_page_ids[2]  # Index 2 = page 3
        response = requests.delete(f"{BASE_URL}/api/books/{self.test_book_id}/pages/{page_3_id}")
        assert response.status_code == 200, f"Failed to delete page 3: {response.text}"
        
        # Verify remaining pages are reordered
        response = requests.get(f"{BASE_URL}/api/books/{self.test_book_id}/pages")
        assert response.status_code == 200
        pages = response.json()["pages"]
        
        # Should have 4 pages now
        assert len(pages) == 4, f"Expected 4 pages after deletion, got {len(pages)}"
        
        # Page numbers should be 1, 2, 3, 4 (reordered)
        page_numbers = [p["pageNumber"] for p in pages]
        assert page_numbers == [1, 2, 3, 4], f"Page numbers not reordered correctly: {page_numbers}"
        
        # Verify content - old page 4 should now be page 3
        page_3_content = pages[2]["text"]  # Index 2 = page 3
        assert "Page 4 content" in page_3_content, f"Page 3 should have old page 4 content: {page_3_content}"
        
        # Verify book's totalPages is updated
        response = requests.get(f"{BASE_URL}/api/books/{self.test_book_id}")
        assert response.status_code == 200
        book = response.json()
        assert book["totalPages"] == 4, f"Book totalPages should be 4, got {book.get('totalPages')}"
        
        print("✓ Middle page deletion and reordering works correctly")
    
    def test_delete_first_page_reorders_remaining(self):
        """Test that deleting the first page reorders remaining pages correctly"""
        # Create a test book
        book_data = {
            "title": f"TEST_FirstPage_Book_{uuid.uuid4().hex[:8]}",
            "author": "Test Author",
            "category": "bizim-masallar",
            "coverImage": "https://example.com/cover.jpg",
            "description": "Test book for first page deletion",
            "ageGroup": "4-6",
            "duration": "5 dk"
        }
        
        response = requests.post(f"{BASE_URL}/api/books", json=book_data)
        assert response.status_code == 200
        book = response.json()
        self.test_book_id = book["id"]
        
        # Create 3 pages
        for i in range(1, 4):
            page_data = {
                "pageNumber": i,
                "text": f"Page {i} content",
                "image": f"https://example.com/page{i}.jpg"
            }
            response = requests.post(f"{BASE_URL}/api/books/{self.test_book_id}/pages", json=page_data)
            assert response.status_code == 200
            page = response.json()
            self.test_page_ids.append(page["id"])
        
        # Delete page 1 (first page)
        page_1_id = self.test_page_ids[0]
        response = requests.delete(f"{BASE_URL}/api/books/{self.test_book_id}/pages/{page_1_id}")
        assert response.status_code == 200
        
        # Verify remaining pages are reordered
        response = requests.get(f"{BASE_URL}/api/books/{self.test_book_id}/pages")
        assert response.status_code == 200
        pages = response.json()["pages"]
        
        # Should have 2 pages now
        assert len(pages) == 2
        
        # Page numbers should be 1, 2 (reordered)
        page_numbers = [p["pageNumber"] for p in pages]
        assert page_numbers == [1, 2], f"Page numbers not reordered correctly: {page_numbers}"
        
        # Old page 2 should now be page 1
        assert "Page 2 content" in pages[0]["text"]
        
        print("✓ First page deletion and reordering works correctly")
    
    def test_delete_last_page_no_reorder_needed(self):
        """Test that deleting the last page doesn't affect other page numbers"""
        # Create a test book
        book_data = {
            "title": f"TEST_LastPage_Book_{uuid.uuid4().hex[:8]}",
            "author": "Test Author",
            "category": "bizim-masallar",
            "coverImage": "https://example.com/cover.jpg",
            "description": "Test book for last page deletion",
            "ageGroup": "4-6",
            "duration": "5 dk"
        }
        
        response = requests.post(f"{BASE_URL}/api/books", json=book_data)
        assert response.status_code == 200
        book = response.json()
        self.test_book_id = book["id"]
        
        # Create 3 pages
        for i in range(1, 4):
            page_data = {
                "pageNumber": i,
                "text": f"Page {i} content",
                "image": f"https://example.com/page{i}.jpg"
            }
            response = requests.post(f"{BASE_URL}/api/books/{self.test_book_id}/pages", json=page_data)
            assert response.status_code == 200
            page = response.json()
            self.test_page_ids.append(page["id"])
        
        # Delete page 3 (last page)
        page_3_id = self.test_page_ids[2]
        response = requests.delete(f"{BASE_URL}/api/books/{self.test_book_id}/pages/{page_3_id}")
        assert response.status_code == 200
        
        # Verify remaining pages
        response = requests.get(f"{BASE_URL}/api/books/{self.test_book_id}/pages")
        assert response.status_code == 200
        pages = response.json()["pages"]
        
        # Should have 2 pages now
        assert len(pages) == 2
        
        # Page numbers should still be 1, 2
        page_numbers = [p["pageNumber"] for p in pages]
        assert page_numbers == [1, 2], f"Page numbers should be [1, 2]: {page_numbers}"
        
        print("✓ Last page deletion works correctly (no reorder needed)")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
