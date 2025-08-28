"""
Real authentication tests for the Todo API
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from main import app, get_db
from models import Base
from database import get_db


# Create test database
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base.metadata.create_all(bind=engine)


def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)


class TestUserAuthentication:
    """Test user registration and authentication"""
    
    def test_register_new_user(self):
        """Test user can register with valid data"""
        response = client.post(
            "/auth/register",
            json={
                "email": "test@example.com",
                "full_name": "Test User",
                "password": "testpassword123"
            }
        )
        assert response.status_code == 201
        data = response.json()
        assert data["email"] == "test@example.com"
        assert data["full_name"] == "Test User"
        assert "id" in data

    def test_register_duplicate_email_fails(self):
        """Test registration fails with duplicate email"""
        # Register first user
        client.post(
            "/auth/register",
            json={
                "email": "duplicate@example.com",
                "full_name": "First User",
                "password": "password123"
            }
        )
        
        # Try to register with same email
        response = client.post(
            "/auth/register",
            json={
                "email": "duplicate@example.com",
                "full_name": "Second User",
                "password": "password456"
            }
        )
        assert response.status_code == 400
        assert "already registered" in response.json()["detail"]

    def test_login_with_valid_credentials(self):
        """Test user can login with valid credentials"""
        # First register a user
        client.post(
            "/auth/register",
            json={
                "email": "login@example.com",
                "full_name": "Login User",
                "password": "loginpassword"
            }
        )
        
        # Then login
        response = client.post(
            "/auth/login",
            data={
                "email": "login@example.com",
                "password": "loginpassword"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert data["user"]["email"] == "login@example.com"

    def test_login_with_invalid_credentials(self):
        """Test login fails with invalid credentials"""
        response = client.post(
            "/auth/login",
            data={
                "email": "nonexistent@example.com",
                "password": "wrongpassword"
            }
        )
        assert response.status_code == 401
        assert "Incorrect email or password" in response.json()["detail"]

    def test_access_protected_route_without_token(self):
        """Test protected routes require authentication"""
        response = client.get("/auth/me")
        assert response.status_code == 401

    def test_access_protected_route_with_valid_token(self):
        """Test protected routes work with valid token"""
        # Register and login to get token
        client.post(
            "/auth/register",
            json={
                "email": "protected@example.com",
                "full_name": "Protected User",
                "password": "protectedpass"
            }
        )
        
        login_response = client.post(
            "/auth/login",
            data={
                "email": "protected@example.com",
                "password": "protectedpass"
            }
        )
        token = login_response.json()["access_token"]
        
        # Access protected route
        response = client.get(
            "/auth/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == "protected@example.com"
        assert data["full_name"] == "Protected User"
