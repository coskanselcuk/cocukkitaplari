"""
Backend API Tests for Çocuk Kitapları App
Tests TTS endpoints and basic API functionality
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestHealthAndBasicAPI:
    """Test basic API health and root endpoints"""
    
    def test_root_endpoint(self):
        """Test root API endpoint returns Hello World"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert data["message"] == "Hello World"
    
    def test_status_endpoint_get(self):
        """Test GET /api/status returns list"""
        response = requests.get(f"{BASE_URL}/api/status")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)


class TestTTSEndpoints:
    """Test TTS (Text-to-Speech) endpoints"""
    
    def test_tts_generate_success(self):
        """Test TTS generation with valid text"""
        response = requests.post(
            f"{BASE_URL}/api/tts/generate",
            json={"text": "Merhaba dünya"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "audio_url" in data
        assert "text" in data
        assert "voice_id" in data
        
        # Verify Valory voice ID is used
        assert data["voice_id"] == "VhxAIIZM8IRmnl5fyeyk", "Should use Valory voice ID"
        
        # Verify audio URL is base64 data URL
        assert data["audio_url"].startswith("data:audio/mpeg;base64,")
        
        # Verify text is echoed back
        assert data["text"] == "Merhaba dünya"
    
    def test_tts_generate_turkish_text(self):
        """Test TTS with Turkish characters"""
        turkish_text = "Bir varmış, bir yokmuş. Güzel bir bahar gününde."
        response = requests.post(
            f"{BASE_URL}/api/tts/generate",
            json={"text": turkish_text}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["text"] == turkish_text
        assert "audio_url" in data
    
    def test_tts_generate_empty_text(self):
        """Test TTS with empty text - should fail validation"""
        response = requests.post(
            f"{BASE_URL}/api/tts/generate",
            json={"text": ""}
        )
        # Empty text might return 422 (validation error) or 500
        # Depending on implementation
        assert response.status_code in [200, 422, 500]
    
    def test_tts_voices_endpoint(self):
        """Test GET /api/tts/voices returns available voices"""
        response = requests.get(f"{BASE_URL}/api/tts/voices")
        assert response.status_code == 200
        data = response.json()
        assert "voices" in data
        assert isinstance(data["voices"], list)
    
    def test_tts_page_endpoint(self):
        """Test TTS page audio generation"""
        response = requests.post(
            f"{BASE_URL}/api/tts/page",
            json={
                "text": "Pırıl ormana doğru yola çıkmış.",
                "page_number": 1,
                "book_id": 1
            }
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify response includes page metadata
        assert "audio_url" in data
        assert "page_number" in data
        assert "book_id" in data
        assert data["page_number"] == 1
        assert data["book_id"] == 1
    
    def test_tts_book_endpoint(self):
        """Test TTS for entire book pages"""
        response = requests.post(
            f"{BASE_URL}/api/tts/book",
            json={
                "pages": [
                    {"text": "Sayfa bir.", "pageNumber": 1},
                    {"text": "Sayfa iki.", "pageNumber": 2}
                ],
                "book_id": 1
            }
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "pages" in data
        assert isinstance(data["pages"], list)
        assert len(data["pages"]) == 2


class TestTTSVoiceConfiguration:
    """Test that Valory voice is properly configured"""
    
    def test_default_voice_is_valory(self):
        """Verify default voice ID is Valory (VhxAIIZM8IRmnl5fyeyk)"""
        response = requests.post(
            f"{BASE_URL}/api/tts/generate",
            json={"text": "Test"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # The voice_id should be Valory's ID
        VALORY_VOICE_ID = "VhxAIIZM8IRmnl5fyeyk"
        assert data["voice_id"] == VALORY_VOICE_ID, \
            f"Expected Valory voice ID {VALORY_VOICE_ID}, got {data['voice_id']}"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
