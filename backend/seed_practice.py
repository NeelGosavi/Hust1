"""Seed the practice problem bank with a starter set across all three categories.

Run from the backend/ directory:  python seed_practice.py

Idempotent: re-running upserts on (category, title) so it won't create duplicates.
"""

import asyncio
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient
from core.config import settings

STARTER_PROBLEMS = [
    # ---- DSA / LeetCode ----
    {"category": "dsa", "title": "Two Sum", "difficulty": "easy",
     "topics": ["array", "hash-table"], "external_url": "https://leetcode.com/problems/two-sum/",
     "description": "Return indices of the two numbers that add up to a target."},
    {"category": "dsa", "title": "Valid Parentheses", "difficulty": "easy",
     "topics": ["stack", "string"], "external_url": "https://leetcode.com/problems/valid-parentheses/",
     "description": "Determine if the input string of brackets is valid."},
    {"category": "dsa", "title": "Merge Two Sorted Lists", "difficulty": "easy",
     "topics": ["linked-list", "recursion"], "external_url": "https://leetcode.com/problems/merge-two-sorted-lists/",
     "description": "Merge two sorted linked lists into one sorted list."},
    {"category": "dsa", "title": "Longest Substring Without Repeating Characters", "difficulty": "medium",
     "topics": ["string", "sliding-window", "hash-table"],
     "external_url": "https://leetcode.com/problems/longest-substring-without-repeating-characters/",
     "description": "Find the length of the longest substring without repeating characters."},
    {"category": "dsa", "title": "Course Schedule", "difficulty": "medium",
     "topics": ["graph", "topological-sort", "dfs"],
     "external_url": "https://leetcode.com/problems/course-schedule/",
     "description": "Decide whether all courses can be finished given prerequisites."},
    {"category": "dsa", "title": "Median of Two Sorted Arrays", "difficulty": "hard",
     "topics": ["array", "binary-search", "divide-and-conquer"],
     "external_url": "https://leetcode.com/problems/median-of-two-sorted-arrays/",
     "description": "Find the median of two sorted arrays in logarithmic time."},

    # ---- System design ----
    {"category": "system_design", "title": "Design a URL Shortener", "difficulty": "medium",
     "topics": ["hashing", "databases", "caching"], "external_url": None,
     "description": "Design a TinyURL-like service: encoding, storage, redirects, scale."},
    {"category": "system_design", "title": "Design a News Feed", "difficulty": "hard",
     "topics": ["fanout", "caching", "ranking"], "external_url": None,
     "description": "Design a social feed: fan-out on write vs read, ranking, pagination."},
    {"category": "system_design", "title": "Design a Rate Limiter", "difficulty": "medium",
     "topics": ["algorithms", "distributed-systems"], "external_url": None,
     "description": "Design a distributed rate limiter (token bucket / sliding window)."},

    # ---- Interview prep (behavioral / general) ----
    {"category": "interview", "title": "Tell me about yourself", "difficulty": "easy",
     "topics": ["behavioral"], "external_url": None,
     "description": "Craft a concise, structured personal pitch (present-past-future)."},
    {"category": "interview", "title": "Describe a challenging project", "difficulty": "medium",
     "topics": ["behavioral", "STAR"], "external_url": None,
     "description": "Use the STAR method: Situation, Task, Action, Result."},
    {"category": "interview", "title": "Why do you want to work here?", "difficulty": "easy",
     "topics": ["behavioral", "company-research"], "external_url": None,
     "description": "Connect your goals to the company's mission and role specifics."},
]


async def main():
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client[settings.DATABASE_NAME]
    inserted, updated = 0, 0
    for p in STARTER_PROBLEMS:
        p.setdefault("created_by", "seed")
        p.setdefault("created_at", datetime.utcnow())
        result = await db.practice_problems.update_one(
            {"category": p["category"], "title": p["title"]},
            {"$setOnInsert": p},
            upsert=True,
        )
        if result.upserted_id is not None:
            inserted += 1
        else:
            updated += 1
    print(f"Seed complete: {inserted} inserted, {updated} already existed.")
    client.close()


if __name__ == "__main__":
    asyncio.run(main())
