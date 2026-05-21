import pytest


@pytest.mark.asyncio
async def test_create_category(client):
    response = await client.post("/api/v1/categories/", json={
        "name": "Laptops", "description": "Portable computers", "color": "#3B82F6"
    })
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Laptops"
    assert data["color"] == "#3B82F6"


@pytest.mark.asyncio
async def test_create_category_duplicate(client):
    await client.post("/api/v1/categories/", json={"name": "Monitors"})
    response = await client.post("/api/v1/categories/", json={"name": "Monitors"})
    assert response.status_code == 409


@pytest.mark.asyncio
async def test_list_categories(client):
    await client.post("/api/v1/categories/", json={"name": "Phones"})
    await client.post("/api/v1/categories/", json={"name": "Tablets"})
    response = await client.get("/api/v1/categories/")
    assert response.status_code == 200
    assert len(response.json()) == 2


@pytest.mark.asyncio
async def test_update_category(client):
    create = await client.post("/api/v1/categories/", json={"name": "Old Cat"})
    cat_id = create.json()["id"]
    response = await client.put(f"/api/v1/categories/{cat_id}", json={"name": "New Cat"})
    assert response.status_code == 200
    assert response.json()["name"] == "New Cat"


@pytest.mark.asyncio
async def test_delete_category(client):
    create = await client.post("/api/v1/categories/", json={"name": "ToDelete"})
    cat_id = create.json()["id"]
    response = await client.delete(f"/api/v1/categories/{cat_id}")
    assert response.status_code == 204
