# backend/test_db.py

import asyncio
from core.database import connect_to_mongo, get_db, check_db_connection

async def test_connection():
    print("🔄 Testing database connection...")
    try:
        await connect_to_mongo()
        db = get_db()
        
        # Test insert
        test_collection = db.test
        result = await test_collection.insert_one({"test": "connection"})
        print(f"✅ Test document inserted: {result.inserted_id}")
        
        # Clean up
        await test_collection.delete_one({"_id": result.inserted_id})
        print("✅ Database connection test passed!")
        
    except Exception as e:
        print(f"❌ Database connection test failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_connection())