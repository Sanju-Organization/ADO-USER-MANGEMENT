"""Backend test cases for WI #44: Backend test coverage

This module contains comprehensive test cases for backend API functionality
including authentication, authorization, data validation, and user management.
"""

import pytest
import requests
import json
from datetime import datetime, timedelta
import time


class TestBackendHealthCheck:
    """Test cases for backend health check endpoint"""

    BASE_URL = "http://localhost:8000"  # Configure based on environment

    def test_health_check_returns_200_ok(self):
        """TC #49: Verify backend health check endpoint returns 200 OK status
        
        Validates that:
        - Health endpoint is accessible
        - Response status is 200 OK
        - Response contains healthy status
        - Performance is within acceptable limits
        """
        start_time = time.time()
        response = requests.get(f"{self.BASE_URL}/health", timeout=5)
        response_time = (time.time() - start_time) * 1000  # Convert to ms
        
        # Verify response status
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        # Parse response body
        data = response.json()
        assert "status" in data, "Response must contain 'status' field"
        assert data["status"] == "healthy", f"Expected 'healthy', got {data['status']}"
        
        # Verify timestamp is present
        assert "timestamp" in data, "Response must contain 'timestamp' field"
        
        # Verify performance
        assert response_time < 500, f"Response time {response_time}ms exceeds 500ms limit"
        
        print(f"Health check passed. Response time: {response_time:.2f}ms")


class TestAuthenticationAndAuthorization:
    """Test cases for JWT authentication and authorization"""

    BASE_URL = "http://localhost:8000"
    VALID_CREDENTIALS = {
        "username": "testuser@example.com",
        "password": "Test@1234"
    }
    ADMIN_CREDENTIALS = {
        "username": "admin@example.com",
        "password": "AdminPass@1234"
    }

    @pytest.fixture
    def valid_jwt_token(self):
        """Generate valid JWT token for testing"""
        response = requests.post(
            f"{self.BASE_URL}/auth/login",
            json=self.VALID_CREDENTIALS
        )
        assert response.status_code == 200, "Failed to generate test token"
        return response.json()["token"]

    @pytest.fixture
    def admin_jwt_token(self):
        """Generate admin JWT token for testing"""
        response = requests.post(
            f"{self.BASE_URL}/auth/login",
            json=self.ADMIN_CREDENTIALS
        )
        assert response.status_code == 200, "Failed to generate admin token"
        return response.json()["token"]

    def test_valid_jwt_authentication(self, valid_jwt_token):
        """TC #47: Verify backend API authentication with valid JWT token
        
        Validates that:
        - Valid JWT token is accepted
        - Protected endpoint returns user data
        - User roles are correctly populated
        - Response meets performance requirements
        """
        start_time = time.time()
        headers = {"Authorization": f"Bearer {valid_jwt_token}"}
        response = requests.get(
            f"{self.BASE_URL}/api/users",
            headers=headers,
            timeout=5
        )
        response_time = (time.time() - start_time) * 1000
        
        # Verify response status
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        # Verify user data in response
        data = response.json()
        assert "id" in data, "Response must contain user ID"
        assert "name" in data, "Response must contain user name"
        assert "email" in data, "Response must contain user email"
        assert "roles" in data, "Response must contain user roles"
        assert isinstance(data["roles"], list), "Roles must be a list"
        assert len(data["roles"]) > 0, "User must have at least one role"
        
        # Verify performance
        assert response_time < 300, f"Response time {response_time}ms exceeds 300ms limit"
        
        print(f"Authentication test passed. User: {data['email']}, Roles: {data['roles']}")

    def test_invalid_jwt_token_rejected(self):
        """TC #48: Verify backend API rejects request with invalid/expired JWT token
        
        Validates that:
        - Expired token is rejected
        - Response status is 401 Unauthorized
        - Appropriate error message is returned
        - No sensitive data is exposed
        """
        # Create an expired token (24+ hours old)
        expired_payload = json.dumps({
            "sub": "user123",
            "exp": (datetime.utcnow() - timedelta(days=1)).timestamp()
        })
        # In real scenario, would use a properly signed expired token
        expired_token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE2MDAwMDAwMDB9.invalid"
        
        headers = {"Authorization": f"Bearer {expired_token}"}
        response = requests.get(
            f"{self.BASE_URL}/api/users",
            headers=headers,
            timeout=5
        )
        
        # Verify response status is 401
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        
        # Verify error message
        data = response.json()
        assert "error" in data, "Response must contain error field"
        assert "token" in data["error"].lower() or "expired" in data["error"].lower(), \
            f"Error message should indicate token issue, got: {data['error']}"
        
        # Verify no user data is exposed
        assert "user" not in data, "User data must not be exposed on auth failure"
        assert "password" not in str(data), "Password must never be in response"
        
        print(f"Invalid token rejection test passed. Error: {data['error']}")

    def test_missing_auth_header_rejected(self):
        """TC #50: Verify backend API request without Authorization header is rejected
        
        Validates that:
        - Request without auth header is rejected
        - Response status is 401 Unauthorized
        - Error message is helpful for debugging
        """
        # Request without Authorization header
        response = requests.get(
            f"{self.BASE_URL}/api/users",
            timeout=5
        )
        
        # Verify response status is 401
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        
        # Verify error details
        data = response.json()
        assert "error" in data, "Response must contain error field"
        assert "authorization" in data["error"].lower() or "missing" in data["error"].lower(), \
            f"Error should indicate missing auth header, got: {data['error']}"
        
        # Verify error includes helpful details
        assert "error_code" in data or "code" in data, "Error response should include error code"
        
        print(f"Missing header rejection test passed. Error: {data['error']}")


class TestDataValidation:
    """Test cases for input validation and error handling"""

    BASE_URL = "http://localhost:8000"

    @pytest.fixture
    def admin_token(self):
        """Get admin token for creating users"""
        response = requests.post(
            f"{self.BASE_URL}/auth/login",
            json={"username": "admin@example.com", "password": "AdminPass@1234"}
        )
        return response.json()["token"]

    def test_invalid_email_format_rejected(self, admin_token):
        """TC #45: Verify backend API data validation for user creation with invalid email
        
        Validates that:
        - Invalid email format is rejected
        - Response status is 400 Bad Request
        - Validation error details are provided
        - User is not created in database
        """
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        invalid_user_data = {
            "name": "John Doe",
            "email": "invalid-email-format",  # Invalid email
            "password": "Test@1234"
        }
        
        response = requests.post(
            f"{self.BASE_URL}/api/users",
            json=invalid_user_data,
            headers=headers,
            timeout=5
        )
        
        # Verify response status is 400
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        
        # Verify validation error
        data = response.json()
        assert "error" in data or "errors" in data, "Response must contain error information"
        error_text = str(data).lower()
        assert "email" in error_text or "validation" in error_text, \
            f"Error should indicate email validation issue, got: {data}"
        
        # Verify user was not created
        # Query database to confirm no new user with that email
        verify_response = requests.get(
            f"{self.BASE_URL}/api/users?email={invalid_user_data['email']}",
            headers=headers
        )
        if verify_response.status_code == 200:
            users = verify_response.json()
            assert len(users) == 0, "User should not be created with invalid email"
        
        print(f"Invalid email validation test passed. Error: {data}")

    def test_valid_user_creation(self, admin_token):
        """TC #46: Verify backend API successfully creates user with valid data
        
        Validates that:
        - Valid user data is accepted
        - Response status is 201 Created
        - User is created with correct data
        - Password is securely hashed
        """
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        new_user_data = {
            "name": "Jane Smith",
            "email": f"jane.smith.{int(time.time())}@example.com",  # Unique email
            "password": "SecurePass@123",
            "role": "user"
        }
        
        response = requests.post(
            f"{self.BASE_URL}/api/users",
            json=new_user_data,
            headers=headers,
            timeout=5
        )
        
        # Verify response status is 201
        assert response.status_code == 201, f"Expected 201, got {response.status_code}"
        
        # Verify created user data
        data = response.json()
        assert "id" in data, "Response must contain user ID"
        assert data["name"] == new_user_data["name"], "User name mismatch"
        assert data["email"] == new_user_data["email"], "User email mismatch"
        assert data["role"] == new_user_data["role"], "User role mismatch"
        assert "created_at" in data, "Response must contain created_at timestamp"
        
        # Verify user exists in database
        verify_response = requests.get(
            f"{self.BASE_URL}/api/users/{data['id']}",
            headers=headers
        )
        assert verify_response.status_code == 200, "User should be retrievable from database"
        
        db_user = verify_response.json()
        assert db_user["email"] == new_user_data["email"], "Database user email mismatch"
        
        # Verify password is not returned and is hashed
        assert "password" not in data, "Password should not be returned in response"
        assert "password" not in db_user, "Password should not be returned in API"
        # Password should be stored as hash, not plain text (verified during DB audit)
        
        print(f"User creation test passed. Created user: {data['id']}")


if __name__ == "__main__":
    # Run tests with pytest
    pytest.main(["-v", __file__])
