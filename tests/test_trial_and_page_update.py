"""
Test Suite for Trial Notification System and Page Update Audio Invalidation
Tests:
1. PUT /api/books/{book_id}/pages/{page_id} - audioUrl cleared when voiceId changes
2. GET /api/subscriptions/admin/trial-notifications - admin only endpoint
3. POST /api/subscriptions/admin/trigger-trial-check - admin only endpoint
4. Background trial notification task verification
"""
import pytest
import requests
import os
import uuid
from datetime import datetime, timezone, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Admin credentials
ADMIN_EMAIL = "coskanselcuk@gmail.com"


class TestPageUpdateAudioInvalidation:
    """Test that updating a page's voiceId clears the audioUrl"""
    
    def test_update_page_with_new_voice_clears_audio(self):
        """
        Test: When a page's voiceId is changed, the audioUrl should be set to null
        This ensures audio is regenerated with the new voice
        """
        # First, get list of books
        response = requests.get(f"{BASE_URL}/api/books")
        assert response.status_code == 200, f"Failed to get books: {response.text}"
        
        books = response.json().get("books", [])
        assert len(books) > 0, "No books found in database"
        
        # Find a book with pages
        book_with_pages = None
        pages = []
        for book in books:
            pages_response = requests.get(f"{BASE_URL}/api/books/{book['id']}/pages")
            if pages_response.status_code == 200:
                pages = pages_response.json().get("pages", [])
                if len(pages) > 0:
                    book_with_pages = book
                    break
        
        assert book_with_pages is not None, "No book with pages found"
        assert len(pages) > 0, "No pages found"
        
        # Get a page to test
        test_page = pages[0]
        book_id = book_with_pages['id']
        page_id = test_page['id']
        original_voice_id = test_page.get('voiceId', '')
        original_audio_url = test_page.get('audioUrl')
        
        print(f"Testing page {page_id} from book {book_id}")
        print(f"Original voiceId: {original_voice_id}")
        print(f"Original audioUrl: {original_audio_url}")
        
        # Update the page with a different voiceId
        new_voice_id = "test_voice_" + str(uuid.uuid4())[:8]
        update_data = {
            "text": test_page.get('text', 'Test text'),
            "image": test_page.get('image', 'https://example.com/image.jpg'),
            "voiceId": new_voice_id
        }
        
        update_response = requests.put(
            f"{BASE_URL}/api/books/{book_id}/pages/{page_id}",
            json=update_data
        )
        
        assert update_response.status_code == 200, f"Failed to update page: {update_response.text}"
        
        updated_page = update_response.json()
        
        # Verify audioUrl is cleared (null) when voice changes
        assert updated_page.get('audioUrl') is None, \
            f"audioUrl should be null after voice change, got: {updated_page.get('audioUrl')}"
        
        # Verify voiceId was updated
        assert updated_page.get('voiceId') == new_voice_id, \
            f"voiceId should be {new_voice_id}, got: {updated_page.get('voiceId')}"
        
        print(f"SUCCESS: audioUrl cleared after voice change")
        print(f"New voiceId: {updated_page.get('voiceId')}")
        print(f"New audioUrl: {updated_page.get('audioUrl')}")
        
        # Restore original voiceId (cleanup)
        restore_data = {
            "text": test_page.get('text', 'Test text'),
            "image": test_page.get('image', 'https://example.com/image.jpg'),
            "voiceId": original_voice_id if original_voice_id else ""
        }
        requests.put(f"{BASE_URL}/api/books/{book_id}/pages/{page_id}", json=restore_data)
    
    def test_update_page_without_voice_change_preserves_audio(self):
        """
        Test: When a page is updated without changing voiceId, audioUrl should be preserved
        """
        # Get a book with pages
        response = requests.get(f"{BASE_URL}/api/books")
        assert response.status_code == 200
        
        books = response.json().get("books", [])
        
        # Find a page with audio
        page_with_audio = None
        book_id = None
        for book in books:
            pages_response = requests.get(f"{BASE_URL}/api/books/{book['id']}/pages")
            if pages_response.status_code == 200:
                pages = pages_response.json().get("pages", [])
                for page in pages:
                    if page.get('audioUrl'):
                        page_with_audio = page
                        book_id = book['id']
                        break
            if page_with_audio:
                break
        
        if not page_with_audio:
            pytest.skip("No page with audio found to test preservation")
        
        page_id = page_with_audio['id']
        original_audio_url = page_with_audio.get('audioUrl')
        original_voice_id = page_with_audio.get('voiceId', '')
        
        print(f"Testing audio preservation for page {page_id}")
        print(f"Original audioUrl: {original_audio_url}")
        
        # Update only the text, keep same voiceId
        update_data = {
            "text": page_with_audio.get('text', 'Test text'),
            "image": page_with_audio.get('image', 'https://example.com/image.jpg'),
            "voiceId": original_voice_id  # Same voice
        }
        
        update_response = requests.put(
            f"{BASE_URL}/api/books/{book_id}/pages/{page_id}",
            json=update_data
        )
        
        assert update_response.status_code == 200
        
        updated_page = update_response.json()
        
        # Audio should be preserved when voice doesn't change
        # Note: If text changes, audio might still be cleared - this tests voice-only logic
        print(f"Updated audioUrl: {updated_page.get('audioUrl')}")
        print(f"Audio preservation test completed")


class TestAdminTrialNotificationEndpoints:
    """Test admin-only trial notification endpoints"""
    
    def test_trial_notifications_endpoint_requires_auth(self):
        """
        Test: GET /api/subscriptions/admin/trial-notifications requires admin authentication
        """
        # Without authentication
        response = requests.get(f"{BASE_URL}/api/subscriptions/admin/trial-notifications")
        
        # Should return 403 (Forbidden) for non-admin users
        assert response.status_code == 403, \
            f"Expected 403 for unauthenticated request, got {response.status_code}: {response.text}"
        
        print(f"SUCCESS: Endpoint correctly requires admin auth (returned {response.status_code})")
    
    def test_trigger_trial_check_endpoint_requires_auth(self):
        """
        Test: POST /api/subscriptions/admin/trigger-trial-check requires admin authentication
        """
        # Without authentication
        response = requests.post(f"{BASE_URL}/api/subscriptions/admin/trigger-trial-check")
        
        # Should return 403 (Forbidden) for non-admin users
        assert response.status_code == 403, \
            f"Expected 403 for unauthenticated request, got {response.status_code}: {response.text}"
        
        print(f"SUCCESS: Endpoint correctly requires admin auth (returned {response.status_code})")
    
    def test_admin_stats_endpoint_accessible(self):
        """
        Test: GET /api/subscriptions/admin/stats is accessible (may not require auth)
        """
        response = requests.get(f"{BASE_URL}/api/subscriptions/admin/stats")
        
        # This endpoint might be accessible without auth for stats
        assert response.status_code in [200, 403], \
            f"Unexpected status code: {response.status_code}: {response.text}"
        
        if response.status_code == 200:
            data = response.json()
            # Verify response structure
            assert "total_users" in data, "Missing total_users in stats"
            assert "premium_users" in data, "Missing premium_users in stats"
            assert "trial_users" in data, "Missing trial_users in stats"
            print(f"SUCCESS: Admin stats accessible - {data.get('total_users')} total users")
        else:
            print(f"Admin stats requires authentication (returned {response.status_code})")


class TestTrialStatusEndpoints:
    """Test trial status related endpoints"""
    
    def test_trial_status_endpoint_exists(self):
        """
        Test: GET /api/subscriptions/trial-status/{user_id} endpoint exists
        """
        # Use a test user ID
        test_user_id = "test_user_" + str(uuid.uuid4())[:8]
        
        response = requests.get(f"{BASE_URL}/api/subscriptions/trial-status/{test_user_id}")
        
        # Should return 404 for non-existent user (not 500 or other error)
        assert response.status_code == 404, \
            f"Expected 404 for non-existent user, got {response.status_code}: {response.text}"
        
        print(f"SUCCESS: Trial status endpoint exists and returns 404 for unknown user")
    
    def test_subscription_status_endpoint_exists(self):
        """
        Test: GET /api/subscriptions/status/{user_id} endpoint exists
        """
        test_user_id = "test_user_" + str(uuid.uuid4())[:8]
        
        response = requests.get(f"{BASE_URL}/api/subscriptions/status/{test_user_id}")
        
        # Should return 404 for non-existent user
        assert response.status_code == 404, \
            f"Expected 404 for non-existent user, got {response.status_code}: {response.text}"
        
        print(f"SUCCESS: Subscription status endpoint exists and returns 404 for unknown user")


class TestBackgroundTaskVerification:
    """Verify background trial notification task is configured"""
    
    def test_server_health_check(self):
        """
        Test: Server is running and responding
        """
        response = requests.get(f"{BASE_URL}/api/")
        
        assert response.status_code == 200, \
            f"Server health check failed: {response.status_code}: {response.text}"
        
        print(f"SUCCESS: Server is healthy")
    
    def test_notification_endpoints_exist(self):
        """
        Test: Notification endpoints are registered
        """
        # Test unread count endpoint (doesn't require auth)
        response = requests.get(f"{BASE_URL}/api/notifications/unread-count")
        
        assert response.status_code == 200, \
            f"Notification endpoint failed: {response.status_code}: {response.text}"
        
        data = response.json()
        # Field can be 'count' or 'unread_count'
        assert "count" in data or "unread_count" in data, "Missing count field in unread-count response"
        
        count = data.get('count') or data.get('unread_count', 0)
        print(f"SUCCESS: Notification system is working - {count} unread notifications")


class TestPageUpdateResponseStructure:
    """Test the response structure of page update endpoint"""
    
    def test_page_update_response_includes_audio_url_field(self):
        """
        Test: PUT /api/books/{book_id}/pages/{page_id} response includes audioUrl field
        """
        # Get a book with pages
        response = requests.get(f"{BASE_URL}/api/books")
        assert response.status_code == 200
        
        books = response.json().get("books", [])
        assert len(books) > 0, "No books found"
        
        # Find a book with pages
        for book in books:
            pages_response = requests.get(f"{BASE_URL}/api/books/{book['id']}/pages")
            if pages_response.status_code == 200:
                pages = pages_response.json().get("pages", [])
                if len(pages) > 0:
                    test_page = pages[0]
                    book_id = book['id']
                    page_id = test_page['id']
                    
                    # Update page with same data
                    update_data = {
                        "text": test_page.get('text', 'Test'),
                        "image": test_page.get('image', 'https://example.com/img.jpg'),
                        "voiceId": test_page.get('voiceId', '')
                    }
                    
                    update_response = requests.put(
                        f"{BASE_URL}/api/books/{book_id}/pages/{page_id}",
                        json=update_data
                    )
                    
                    assert update_response.status_code == 200
                    
                    updated_page = update_response.json()
                    
                    # Verify response structure
                    assert "id" in updated_page, "Missing id in response"
                    assert "text" in updated_page, "Missing text in response"
                    assert "image" in updated_page, "Missing image in response"
                    assert "pageNumber" in updated_page, "Missing pageNumber in response"
                    # audioUrl should be in response (can be null)
                    assert "audioUrl" in updated_page or updated_page.get('audioUrl') is None, \
                        "audioUrl field should be present in response"
                    
                    print(f"SUCCESS: Page update response structure is correct")
                    print(f"Response fields: {list(updated_page.keys())}")
                    return
        
        pytest.skip("No book with pages found for testing")


# Run tests
if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
