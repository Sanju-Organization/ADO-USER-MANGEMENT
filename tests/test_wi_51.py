import pytest
import jwt
import requests
from datetime import datetime, timedelta

API_URL = "http://localhost:8000"
JWT_SECRET = "testsecret"

# Test 1: Verify successful login returns JWT token for valid credentials
def test_login_success_valid_credentials():
    payload = {"email": "user1@example.com", "password": "Password123!"}
    resp = requests.post(f"{API_URL}/api/auth/login", json=payload)
    assert resp.status_code == 200
    token = resp.json().get("token")
    assert token
    decoded = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
    assert decoded["email"] == "user1@example.com"
    exp = datetime.utcfromtimestamp(decoded["exp"])
    assert exp > datetime.utcnow() + timedelta(hours=23)

# Test 2: Verify login fails with invalid credentials
def test_login_fail_invalid_credentials():
    payload = {"email": "user1@example.com", "password": "WrongPass!"}
    resp = requests.post(f"{API_URL}/api/auth/login", json=payload)
    assert resp.status_code == 401
    assert "Invalid credentials" in resp.text
    payload = {"email": "nouser@example.com", "password": "Password123!"}
    resp = requests.post(f"{API_URL}/api/auth/login", json=payload)
    assert resp.status_code == 401
    assert "Invalid credentials" in resp.text

# Test 3: Verify login fails with invalid email format
def test_login_fail_invalid_email_format():
    payload = {"email": "useratexample.com", "password": "Password123!"}
    resp = requests.post(f"{API_URL}/api/auth/login", json=payload)
    assert resp.status_code == 400
    assert "Invalid email format" in resp.text

# Test 4: Verify protected endpoint rejects requests without valid JWT
def test_protected_endpoint_requires_jwt():
    resp = requests.get(f"{API_URL}/api/users")
    assert resp.status_code == 401
    expired_token = jwt.encode({"email": "user1@example.com", "exp": datetime.utcnow() - timedelta(hours=1)}, JWT_SECRET, algorithm="HS256")
    headers = {"Authorization": f"Bearer {expired_token}"}
    resp = requests.get(f"{API_URL}/api/users", headers=headers)
    assert resp.status_code == 403

# Test 5: Verify user creation with valid and invalid data
def test_user_creation_valid_and_invalid():
    # Valid
    payload = {"email": "newuser@example.com", "password": "Password123!"}
    resp = requests.post(f"{API_URL}/api/users", json=payload)
    assert resp.status_code == 201
    # Invalid email
    payload = {"email": "bademail", "password": "Password123!"}
    resp = requests.post(f"{API_URL}/api/users", json=payload)
    assert resp.status_code == 400
    assert "Invalid email format" in resp.text
    # Missing password
    payload = {"email": "user2@example.com"}
    resp = requests.post(f"{API_URL}/api/users", json=payload)
    assert resp.status_code == 400
    assert "Password required" in resp.text
