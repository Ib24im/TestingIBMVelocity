"""
Integration smoke tests - End-to-end API functionality
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from main import app, get_db
from models import Base


# Create test database
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_smoke.db"
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


class TestAPIHealthAndIntegration:
    """End-to-end smoke tests for API integration"""
    
    def test_api_health_check(self):
        """Test API is running and responsive"""
        response = client.get("/")
        assert response.status_code == 200 or response.status_code == 404  # Either root exists or doesn't

    def test_complete_user_workflow(self):
        """Test complete user registration -> login -> todo creation workflow"""
        # Step 1: Register a new user
        register_response = client.post(
            "/auth/register",
            json={
                "email": "workflow@example.com",
                "full_name": "Workflow User",
                "password": "workflowpass123"
            }
        )
        assert register_response.status_code == 200  # FastAPI returns 200 for successful registration
        user_data = register_response.json()
        assert user_data["email"] == "workflow@example.com"
        
        # Step 2: Login with the user
        login_response = client.post(
            "/auth/login",
            data={
                "email": "workflow@example.com",
                "password": "workflowpass123"
            }
        )
        assert login_response.status_code == 200
        token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Step 3: Create a todo
        todo_response = client.post(
            "/todos",
            json={
                "title": "Complete Integration Test",
                "description": "This is a full workflow test",
                "priority": "high",
                "category": "work"
            },
            headers=headers
        )
        assert todo_response.status_code == 200
        todo_data = todo_response.json()
        assert todo_data["title"] == "Complete Integration Test"
        
        # Step 4: Get user's todos
        todos_response = client.get("/todos", headers=headers)
        assert todos_response.status_code == 200
        todos = todos_response.json()
        assert len(todos) >= 1
        assert any(todo["title"] == "Complete Integration Test" for todo in todos)
        
        # Step 5: Mark todo as complete
        todo_id = todo_data["id"]
        update_response = client.put(
            f"/todos/{todo_id}",
            json={"completed": True},
            headers=headers
        )
        assert update_response.status_code == 200
        updated_todo = update_response.json()
        assert updated_todo["completed"] is True

    def test_todo_categories_and_priorities(self):
        """Test that all todo categories and priorities work correctly"""
        # Create user for testing
        register_response = client.post(
            "/auth/register",
            json={
                "email": "categories@example.com",
                "full_name": "Categories User",
                "password": "categoriespass"
            }
        )
        assert register_response.status_code == 200
        
        login_response = client.post(
            "/auth/login",
            data={
                "email": "categories@example.com",
                "password": "categoriespass"
            }
        )
        token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Test all priorities
        priorities = ["low", "medium", "high"]
        for priority in priorities:
            response = client.post(
                "/todos",
                json={
                    "title": f"Todo with {priority} priority",
                    "priority": priority
                },
                headers=headers
            )
            assert response.status_code == 200
            assert response.json()["priority"] == priority
        
        # Test all categories
        categories = ["personal", "work", "shopping", "health", "other"]
        for category in categories:
            response = client.post(
                "/todos",
                json={
                    "title": f"Todo in {category} category",
                    "category": category
                },
                headers=headers
            )
            assert response.status_code == 200
            assert response.json()["category"] == category

    def test_data_validation_and_error_handling(self):
        """Test API properly validates data and handles errors"""
        # Test invalid registration data
        response = client.post(
            "/auth/register",
            json={
                "email": "invalid-email",  # Invalid email format
                "full_name": "",  # Empty name
                "password": "123"  # Too short password
            }
        )
        assert response.status_code == 422  # Validation error
        
        # Create valid user for further tests
        valid_register = client.post(
            "/auth/register",
            json={
                "email": "validation@example.com",
                "full_name": "Validation User",
                "password": "validpass123"
            }
        )
        assert valid_register.status_code == 200
        
        login_response = client.post(
            "/auth/login",
            data={
                "email": "validation@example.com",
                "password": "validpass123"
            }
        )
        token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Test invalid todo data
        response = client.post(
            "/todos",
            json={
                "title": "",  # Empty title should fail
                "priority": "invalid_priority",  # Invalid priority
                "category": "invalid_category"  # Invalid category
            },
            headers=headers
        )
        assert response.status_code == 422  # Validation error

    def test_authentication_security(self):
        """Test authentication and authorization security"""
        # Test accessing todos without authentication
        response = client.get("/todos")
        assert response.status_code == 401
        
        # Test accessing todos with invalid token
        response = client.get(
            "/todos",
            headers={"Authorization": "Bearer invalid_token"}
        )
        assert response.status_code in [401, 403]  # Could be Unauthorized or Forbidden
        
        # Test user can only access their own todos
        # Create two users
        reg1 = client.post("/auth/register", json={"email": "user1@example.com", "full_name": "User 1", "password": "pass1"})
        reg2 = client.post("/auth/register", json={"email": "user2@example.com", "full_name": "User 2", "password": "pass2"})
        assert reg1.status_code == 200
        assert reg2.status_code == 200
        
        # Get tokens for both users
        login1 = client.post("/auth/login", data={"email": "user1@example.com", "password": "pass1"})
        login2 = client.post("/auth/login", data={"email": "user2@example.com", "password": "pass2"})
        
        token1 = login1.json()["access_token"]
        token2 = login2.json()["access_token"]
        
        headers1 = {"Authorization": f"Bearer {token1}"}
        headers2 = {"Authorization": f"Bearer {token2}"}
        
        # User 1 creates a todo
        todo_response = client.post(
            "/todos",
            json={"title": "User 1 Todo"},
            headers=headers1
        )
        todo_id = todo_response.json()["id"]
        
        # User 2 tries to access User 1's todo
        response = client.get(f"/todos/{todo_id}", headers=headers2)
        assert response.status_code == 404  # Should not find todo belonging to another user