"""
Upload API Tests for Image Upload Functionality
Tests the /api/upload/image endpoint for file uploads
"""
import pytest
import requests
import os
import io

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


class TestImageUpload:
    """Test image upload functionality"""
    
    def create_test_image(self, format='png'):
        """Create a minimal valid image file for testing"""
        if format == 'png':
            # Minimal valid PNG (1x1 pixel)
            return bytes([
                0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,  # PNG signature
                0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,  # IHDR chunk
                0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,  # 1x1 dimensions
                0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,  # bit depth, color type
                0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41,  # IDAT chunk
                0x54, 0x78, 0x9C, 0x63, 0xF8, 0x0F, 0x00, 0x00,  # compressed data
                0x01, 0x01, 0x00, 0x05, 0x18, 0xD8, 0x4E, 0x00,  # more data
                0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE,  # IEND chunk
                0x42, 0x60, 0x82
            ])
        elif format == 'jpg':
            # Minimal valid JPEG (1x1 pixel)
            return bytes([
                0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46,
                0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01,
                0x00, 0x01, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43,
                0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08,
                0x07, 0x07, 0x07, 0x09, 0x09, 0x08, 0x0A, 0x0C,
                0x14, 0x0D, 0x0C, 0x0B, 0x0B, 0x0C, 0x19, 0x12,
                0x13, 0x0F, 0x14, 0x1D, 0x1A, 0x1F, 0x1E, 0x1D,
                0x1A, 0x1C, 0x1C, 0x20, 0x24, 0x2E, 0x27, 0x20,
                0x22, 0x2C, 0x23, 0x1C, 0x1C, 0x28, 0x37, 0x29,
                0x2C, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1F, 0x27,
                0x39, 0x3D, 0x38, 0x32, 0x3C, 0x2E, 0x33, 0x34,
                0x32, 0xFF, 0xC0, 0x00, 0x0B, 0x08, 0x00, 0x01,
                0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xFF, 0xC4,
                0x00, 0x1F, 0x00, 0x00, 0x01, 0x05, 0x01, 0x01,
                0x01, 0x01, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00,
                0x00, 0x00, 0x00, 0x00, 0x01, 0x02, 0x03, 0x04,
                0x05, 0x06, 0x07, 0x08, 0x09, 0x0A, 0x0B, 0xFF,
                0xC4, 0x00, 0xB5, 0x10, 0x00, 0x02, 0x01, 0x03,
                0x03, 0x02, 0x04, 0x03, 0x05, 0x05, 0x04, 0x04,
                0x00, 0x00, 0x01, 0x7D, 0x01, 0x02, 0x03, 0x00,
                0x04, 0x11, 0x05, 0x12, 0x21, 0x31, 0x41, 0x06,
                0x13, 0x51, 0x61, 0x07, 0x22, 0x71, 0x14, 0x32,
                0x81, 0x91, 0xA1, 0x08, 0x23, 0x42, 0xB1, 0xC1,
                0x15, 0x52, 0xD1, 0xF0, 0x24, 0x33, 0x62, 0x72,
                0x82, 0x09, 0x0A, 0x16, 0x17, 0x18, 0x19, 0x1A,
                0x25, 0x26, 0x27, 0x28, 0x29, 0x2A, 0x34, 0x35,
                0x36, 0x37, 0x38, 0x39, 0x3A, 0x43, 0x44, 0x45,
                0x46, 0x47, 0x48, 0x49, 0x4A, 0x53, 0x54, 0x55,
                0x56, 0x57, 0x58, 0x59, 0x5A, 0x63, 0x64, 0x65,
                0x66, 0x67, 0x68, 0x69, 0x6A, 0x73, 0x74, 0x75,
                0x76, 0x77, 0x78, 0x79, 0x7A, 0x83, 0x84, 0x85,
                0x86, 0x87, 0x88, 0x89, 0x8A, 0x92, 0x93, 0x94,
                0x95, 0x96, 0x97, 0x98, 0x99, 0x9A, 0xA2, 0xA3,
                0xA4, 0xA5, 0xA6, 0xA7, 0xA8, 0xA9, 0xAA, 0xB2,
                0xB3, 0xB4, 0xB5, 0xB6, 0xB7, 0xB8, 0xB9, 0xBA,
                0xC2, 0xC3, 0xC4, 0xC5, 0xC6, 0xC7, 0xC8, 0xC9,
                0xCA, 0xD2, 0xD3, 0xD4, 0xD5, 0xD6, 0xD7, 0xD8,
                0xD9, 0xDA, 0xE1, 0xE2, 0xE3, 0xE4, 0xE5, 0xE6,
                0xE7, 0xE8, 0xE9, 0xEA, 0xF1, 0xF2, 0xF3, 0xF4,
                0xF5, 0xF6, 0xF7, 0xF8, 0xF9, 0xFA, 0xFF, 0xDA,
                0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3F, 0x00,
                0xFB, 0xD5, 0xDB, 0x20, 0xA8, 0xF1, 0x7F, 0xFF,
                0xD9
            ])
        return None
    
    def test_upload_png_image(self):
        """Test uploading a PNG image"""
        image_data = self.create_test_image('png')
        files = {'file': ('test.png', io.BytesIO(image_data), 'image/png')}
        
        response = requests.post(f"{BASE_URL}/api/upload/image", files=files)
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] == True
        assert "filename" in data
        assert "url" in data
        assert data["url"].startswith("/api/upload/images/")
        assert data["filename"].endswith(".png")
        
        # Cleanup - delete the uploaded file
        filename = data["filename"]
        requests.delete(f"{BASE_URL}/api/upload/images/{filename}")
    
    def test_upload_and_retrieve_image(self):
        """Test uploading and then retrieving an image"""
        image_data = self.create_test_image('png')
        files = {'file': ('test.png', io.BytesIO(image_data), 'image/png')}
        
        # Upload
        upload_response = requests.post(f"{BASE_URL}/api/upload/image", files=files)
        assert upload_response.status_code == 200
        filename = upload_response.json()["filename"]
        
        # Retrieve
        get_response = requests.get(f"{BASE_URL}/api/upload/images/{filename}")
        assert get_response.status_code == 200
        assert get_response.headers.get('content-type', '').startswith('image/')
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/upload/images/{filename}")
    
    def test_upload_and_delete_image(self):
        """Test uploading and then deleting an image"""
        image_data = self.create_test_image('png')
        files = {'file': ('test.png', io.BytesIO(image_data), 'image/png')}
        
        # Upload
        upload_response = requests.post(f"{BASE_URL}/api/upload/image", files=files)
        assert upload_response.status_code == 200
        filename = upload_response.json()["filename"]
        
        # Delete
        delete_response = requests.delete(f"{BASE_URL}/api/upload/images/{filename}")
        assert delete_response.status_code == 200
        assert delete_response.json()["success"] == True
        
        # Verify deletion - should return 404
        get_response = requests.get(f"{BASE_URL}/api/upload/images/{filename}")
        assert get_response.status_code == 404
    
    def test_upload_invalid_file_type(self):
        """Test uploading an invalid file type returns error"""
        files = {'file': ('test.txt', io.BytesIO(b'This is not an image'), 'text/plain')}
        
        response = requests.post(f"{BASE_URL}/api/upload/image", files=files)
        assert response.status_code == 400
        assert "detail" in response.json()
    
    def test_get_nonexistent_image(self):
        """Test getting a non-existent image returns 404"""
        response = requests.get(f"{BASE_URL}/api/upload/images/nonexistent-image-12345.png")
        assert response.status_code == 404
    
    def test_delete_nonexistent_image(self):
        """Test deleting a non-existent image returns 404"""
        response = requests.delete(f"{BASE_URL}/api/upload/images/nonexistent-image-12345.png")
        assert response.status_code == 404
    
    def test_upload_response_structure(self):
        """Test that upload response has correct structure"""
        image_data = self.create_test_image('png')
        files = {'file': ('test.png', io.BytesIO(image_data), 'image/png')}
        
        response = requests.post(f"{BASE_URL}/api/upload/image", files=files)
        assert response.status_code == 200
        
        data = response.json()
        # Verify all expected fields
        assert "success" in data
        assert "filename" in data
        assert "url" in data
        assert "size" in data
        
        # Verify types
        assert isinstance(data["success"], bool)
        assert isinstance(data["filename"], str)
        assert isinstance(data["url"], str)
        assert isinstance(data["size"], int)
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/upload/images/{data['filename']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
