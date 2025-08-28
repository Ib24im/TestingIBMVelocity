"""
Real todo functionality tests for the Todo API
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from main import app, get_db
from models import Base


# Create test database
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_todos.db"
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


@pytest.fixture
def auth_headers():
    """Create a user and return auth headers"""
    # Register user
    client.post(
        "/auth/register",
        json={
            "email": "todouser@example.com",
            "full_name": "Todo User",
            "password": "todopassword"
        }
    )
    
    # Login to get token
    login_response = client.post(
        "/auth/login",
        data={
            "email": "todouser@example.com",
            "password": "todopassword"
        }
    )
    token = login_response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


class TestTodoOperations:
    """Test CRUD operations for todos"""
    
    def test_create_todo_success(self, auth_headers):
        """Test creating a new todo"""
        response = client.post(
            "/todos",
            json={
                "title": "Test Todo Item",
                "description": "This is a test todo",
                "priority": "high",
                "category": "work"
            },
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "Test Todo Item"
        assert data["description"] == "This is a test todo"
        assert data["priority"] == "high"
        assert data["category"] == "work"
        assert data["completed"] is False
        assert "id" in data

    def test_create_todo_minimal_data(self, auth_headers):
        """Test creating todo with minimal required data"""
        response = client.post(
            "/todos",
            json={
                "title": "Minimal Todo"
            },
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "Minimal Todo"
        assert data["priority"] == "medium"  # default
        assert data["category"] == "personal"  # default

    def test_create_todo_without_auth_fails(self):
        """Test creating todo without authentication fails"""
        response = client.post(
            "/todos",
            json={
                "title": "Unauthorized Todo"
            }
        )
        assert response.status_code == 401

    def test_get_todos_list(self, auth_headers):
        """Test getting list of todos"""
        # Create a few todos first
        for i in range(3):
            client.post(
                "/todos",
                json={
                    "title": f"Todo {i+1}",
                    "priority": "medium",
                    "category": "personal"
                },
                headers=auth_headers
            )
        
        response = client.get("/todos", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 3
        assert all("title" in todo for todo in data)

    def test_get_single_todo(self, auth_headers):
        """Test getting a specific todo by ID"""
        # Create a todo
        create_response = client.post(
            "/todos",
            json={
                "title": "Specific Todo",
                "description": "For testing get by ID"
            },
            headers=auth_headers
        )
        todo_id = create_response.json()["id"]
        
        # Get the todo
        response = client.get(f"/todos/{todo_id}", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "Specific Todo"
        assert data["description"] == "For testing get by ID"

    def test_update_todo(self, auth_headers):
        """Test updating a todo"""
        # Create a todo
        create_response = client.post(
            "/todos",
            json={
                "title": "Original Title",
                "completed": False
            },
            headers=auth_headers
        )
        todo_id = create_response.json()["id"]
        
        # Update the todo
        response = client.put(
            f"/todos/{todo_id}",
            json={
                "title": "Updated Title",
                "completed": True,
                "priority": "high"
            },
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "Updated Title"
        assert data["completed"] is True
        assert data["priority"] == "high"

    def test_delete_todo(self, auth_headers):
        """Test deleting a todo"""
        # Create a todo
        create_response = client.post(
            "/todos",
            json={
                "title": "Todo to Delete"
            },
            headers=auth_headers
        )
        todo_id = create_response.json()["id"]
        
        # Delete the todo
        response = client.delete(f"/todos/{todo_id}", headers=auth_headers)
        assert response.status_code == 200
        
        # Verify it's deleted
        get_response = client.get(f"/todos/{todo_id}", headers=auth_headers)
        assert get_response.status_code == 404

    def test_filter_todos_by_priority(self, auth_headers):
        """Test filtering todos by priority"""
        # Create todos with different priorities
        client.post("/todos", json={"title": "High Priority", "priority": "high"}, headers=auth_headers)
        client.post("/todos", json={"title": "Low Priority", "priority": "low"}, headers=auth_headers)
        
        # Filter by high priority
        response = client.get("/todos?priority=high", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert all(todo["priority"] == "high" for todo in data)

    def test_filter_todos_by_completion(self, auth_headers):
        """Test filtering todos by completion status"""
        # Create completed and incomplete todos
        client.post("/todos", json={"title": "Incomplete Todo"}, headers=auth_headers)
        create_response = client.post("/todos", json={"title": "Complete Todo"}, headers=auth_headers)
        todo_id = create_response.json()["id"]
        client.put(f"/todos/{todo_id}", json={"completed": True}, headers=auth_headers)
        
        # Filter by completed status
        response = client.get("/todos?completed=true", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert all(todo["completed"] is True for todo in data)
