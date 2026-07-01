"""Seed the practice bank with the curated "DSA Patterns for Big Tech" must-do list.

Run from the backend/ directory:  python seed_mustdo.py

All problems are category="dsa", must_do=True, tagged by pattern. Idempotent:
upserts on (category, title) so duplicates across patterns collapse to one entry
and re-running won't create duplicates.
"""

import asyncio
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient
from core.config import settings

# (pattern, [(title, url, difficulty), ...])
PATTERNS = [
    ("Two Pointers", [
        ("Remove Duplicates from Sorted Array", "https://leetcode.com/problems/remove-duplicates-from-sorted-array/", "easy"),
        ("Reverse String", "https://leetcode.com/problems/reverse-string/", "easy"),
        ("Reverse Words in a String", "https://leetcode.com/problems/reverse-words-in-a-string/", "medium"),
        ("Valid Palindrome II", "https://leetcode.com/problems/valid-palindrome-ii/", "easy"),
        ("Longest Palindromic Substring", "https://leetcode.com/problems/longest-palindromic-substring/", "medium"),
        ("3Sum", "https://leetcode.com/problems/3sum/", "medium"),
    ]),
    ("Sliding Window", [
        ("Longest Substring Without Repeating Characters", "https://leetcode.com/problems/longest-substring-without-repeating-characters/", "medium"),
        ("Minimum Window Substring", "https://leetcode.com/problems/minimum-window-substring/", "hard"),
        ("Permutation in String", "https://leetcode.com/problems/permutation-in-string/", "medium"),
        ("Find All Anagrams in a String", "https://leetcode.com/problems/find-all-anagrams-in-a-string/", "medium"),
        ("Longest Repeating Character Replacement", "https://leetcode.com/problems/longest-repeating-character-replacement/", "medium"),
        ("Longest Substring with At Most K Distinct Characters", "https://leetcode.com/problems/longest-substring-with-at-most-k-distinct-characters/", "medium"),
        ("First Negative Integer in Every Window", "https://www.geeksforgeeks.org/first-negative-integer-every-window-size-k/", "medium"),
        ("Sliding Window Maximum", "https://leetcode.com/problems/sliding-window-maximum/", "hard"),
    ]),
    ("Hash Map / Set", [
        ("Two Sum", "https://leetcode.com/problems/two-sum/", "easy"),
        ("Valid Anagram", "https://leetcode.com/problems/valid-anagram/", "easy"),
        ("Contains Duplicate", "https://leetcode.com/problems/contains-duplicate/", "easy"),
        ("First Unique Character in a String", "https://leetcode.com/problems/first-unique-character-in-a-string/", "easy"),
        ("Group Anagrams", "https://leetcode.com/problems/group-anagrams/", "medium"),
        ("Top K Frequent Elements", "https://leetcode.com/problems/top-k-frequent-elements/", "medium"),
        ("Subarray Sum Equals K", "https://leetcode.com/problems/subarray-sum-equals-k/", "medium"),
        ("First Missing Positive", "https://leetcode.com/problems/first-missing-positive/", "hard"),
    ]),
    ("Binary Search", [
        ("Binary Search", "https://leetcode.com/problems/binary-search/", "easy"),
        ("Find Peak Element", "https://leetcode.com/problems/find-peak-element/", "medium"),
        ("Search Insert Position", "https://leetcode.com/problems/search-insert-position/", "easy"),
        ("Search in Rotated Sorted Array", "https://leetcode.com/problems/search-in-rotated-sorted-array/", "medium"),
        ("Find Minimum in Rotated Sorted Array", "https://leetcode.com/problems/find-minimum-in-rotated-sorted-array/", "medium"),
        ("Koko Eating Bananas", "https://leetcode.com/problems/koko-eating-bananas/", "medium"),
    ]),
    ("Fast & Slow Pointers", [
        ("Middle of the Linked List", "https://leetcode.com/problems/middle-of-the-linked-list/", "easy"),
        ("Linked List Cycle", "https://leetcode.com/problems/linked-list-cycle/", "easy"),
        ("Linked List Cycle II", "https://leetcode.com/problems/linked-list-cycle-ii/", "medium"),
        ("Find the Duplicate Number", "https://leetcode.com/problems/find-the-duplicate-number/", "medium"),
    ]),
    ("Prefix Sum", [
        ("Range Sum Query - Immutable", "https://leetcode.com/problems/range-sum-query-immutable/", "easy"),
        ("Running Sum of 1d Array", "https://leetcode.com/problems/running-sum-of-1d-array/", "easy"),
        ("Find Pivot Index", "https://leetcode.com/problems/find-pivot-index/", "easy"),
        ("Continuous Subarray Sum", "https://leetcode.com/problems/continuous-subarray-sum/", "medium"),
        ("Maximum Size Subarray Sum Equals k", "https://leetcode.com/problems/maximum-size-subarray-sum-equals-k/", "medium"),
        ("Range Sum Query 2D - Immutable", "https://leetcode.com/problems/range-sum-query-2d-immutable/", "medium"),
        ("Binary Subarrays With Sum", "https://leetcode.com/problems/binary-subarrays-with-sum/", "medium"),
        ("Subarray Sums Divisible by K", "https://leetcode.com/problems/subarray-sums-divisible-by-k/", "medium"),
        ("Path Sum III", "https://leetcode.com/problems/path-sum-iii/", "medium"),
    ]),
    ("Monotonic Stack / Queue", [
        ("Daily Temperatures", "https://leetcode.com/problems/daily-temperatures/", "medium"),
        ("Largest Rectangle in Histogram", "https://leetcode.com/problems/largest-rectangle-in-histogram/", "hard"),
        ("Next Greater Element I", "https://leetcode.com/problems/next-greater-element-i/", "easy"),
        ("Next Greater Element II", "https://leetcode.com/problems/next-greater-element-ii/", "medium"),
        ("Next Smaller Element", "https://www.geeksforgeeks.org/next-smaller-element/", "medium"),
    ]),
    ("BFS / DFS", [
        ("Number of Islands", "https://leetcode.com/problems/number-of-islands/", "medium"),
        ("Word Ladder", "https://leetcode.com/problems/word-ladder/", "hard"),
        ("Rotting Oranges", "https://leetcode.com/problems/rotting-oranges/", "medium"),
        ("Surrounded Regions", "https://leetcode.com/problems/surrounded-regions/", "medium"),
        ("Pacific Atlantic Water Flow", "https://leetcode.com/problems/pacific-atlantic-water-flow/", "medium"),
        ("Binary Tree Inorder Traversal", "https://leetcode.com/problems/binary-tree-inorder-traversal/", "easy"),
        ("Binary Tree Preorder Traversal", "https://leetcode.com/problems/binary-tree-preorder-traversal/", "easy"),
        ("Binary Tree Postorder Traversal", "https://leetcode.com/problems/binary-tree-postorder-traversal/", "easy"),
        ("Binary Tree Level Order Traversal", "https://leetcode.com/problems/binary-tree-level-order-traversal/", "medium"),
        ("Validate Binary Search Tree", "https://leetcode.com/problems/validate-binary-search-tree/", "medium"),
        ("Lowest Common Ancestor of a Binary Tree", "https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-tree/", "medium"),
        ("Lowest Common Ancestor of a Binary Search Tree", "https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-search-tree/", "medium"),
    ]),
    ("Backtracking", [
        ("Word Search", "https://leetcode.com/problems/word-search/", "medium"),
        ("Subsets", "https://leetcode.com/problems/subsets/", "medium"),
        ("Subsets II", "https://leetcode.com/problems/subsets-ii/", "medium"),
        ("Permutations", "https://leetcode.com/problems/permutations/", "medium"),
        ("Permutations II", "https://leetcode.com/problems/permutations-ii/", "medium"),
        ("Combination Sum", "https://leetcode.com/problems/combination-sum/", "medium"),
        ("Combination Sum II", "https://leetcode.com/problems/combination-sum-ii/", "medium"),
        ("N-Queens", "https://leetcode.com/problems/n-queens/", "hard"),
        ("Palindrome Partitioning", "https://leetcode.com/problems/palindrome-partitioning/", "medium"),
        ("Letter Combinations of a Phone Number", "https://leetcode.com/problems/letter-combinations-of-a-phone-number/", "medium"),
    ]),
    ("Heap / Priority Queue", [
        ("Kth Largest Element in a Stream", "https://leetcode.com/problems/kth-largest-element-in-a-stream/", "easy"),
        ("Last Stone Weight", "https://leetcode.com/problems/last-stone-weight/", "easy"),
        ("Kth Largest Element in an Array", "https://leetcode.com/problems/kth-largest-element-in-an-array/", "medium"),
        ("Top K Frequent Words", "https://leetcode.com/problems/top-k-frequent-words/", "medium"),
        ("K Closest Points to Origin", "https://leetcode.com/problems/k-closest-points-to-origin/", "medium"),
        ("Task Scheduler", "https://leetcode.com/problems/task-scheduler/", "medium"),
        ("Reorganize String", "https://leetcode.com/problems/reorganize-string/", "medium"),
        ("Merge k Sorted Lists", "https://leetcode.com/problems/merge-k-sorted-lists/", "hard"),
        ("Find Median from Data Stream", "https://leetcode.com/problems/find-median-from-data-stream/", "hard"),
    ]),
    ("Interval Merging", [
        ("Meeting Rooms", "https://leetcode.com/problems/meeting-rooms/", "easy"),
        ("Meeting Rooms II", "https://leetcode.com/problems/meeting-rooms-ii/", "medium"),
        ("Merge Intervals", "https://leetcode.com/problems/merge-intervals/", "medium"),
        ("Insert Interval", "https://leetcode.com/problems/insert-interval/", "medium"),
        ("Non-overlapping Intervals", "https://leetcode.com/problems/non-overlapping-intervals/", "medium"),
        ("Minimum Number of Arrows to Burst Balloons", "https://leetcode.com/problems/minimum-number-of-arrows-to-burst-balloons/", "medium"),
        ("Car Pooling", "https://leetcode.com/problems/car-pooling/", "medium"),
        ("Employee Free Time", "https://leetcode.com/problems/employee-free-time/", "hard"),
        ("My Calendar III", "https://leetcode.com/problems/my-calendar-iii/", "hard"),
    ]),
    ("Dynamic Programming", [
        ("Climbing Stairs", "https://leetcode.com/problems/climbing-stairs/", "easy"),
        ("House Robber", "https://leetcode.com/problems/house-robber/", "medium"),
        ("Coin Change", "https://leetcode.com/problems/coin-change/", "medium"),
        ("Word Break", "https://leetcode.com/problems/word-break/", "medium"),
        ("Edit Distance", "https://leetcode.com/problems/edit-distance/", "medium"),
        ("Unique Paths", "https://leetcode.com/problems/unique-paths/", "medium"),
        ("Longest Increasing Subsequence", "https://leetcode.com/problems/longest-increasing-subsequence/", "medium"),
        ("Partition Equal Subset Sum", "https://leetcode.com/problems/partition-equal-subset-sum/", "medium"),
        ("Target Sum", "https://leetcode.com/problems/target-sum/", "medium"),
        ("Decode Ways", "https://leetcode.com/problems/decode-ways/", "medium"),
        ("Longest Common Subsequence", "https://leetcode.com/problems/longest-common-subsequence/", "medium"),
        ("Minimum Path Sum", "https://leetcode.com/problems/minimum-path-sum/", "medium"),
        ("Maximum Subarray", "https://leetcode.com/problems/maximum-subarray/", "medium"),
        ("Best Time to Buy and Sell Stock", "https://leetcode.com/problems/best-time-to-buy-and-sell-stock/", "easy"),
    ]),
    ("Bit Manipulation", [
        ("Single Number", "https://leetcode.com/problems/single-number/", "easy"),
        ("Number of 1 Bits", "https://leetcode.com/problems/number-of-1-bits/", "easy"),
        ("Reverse Bits", "https://leetcode.com/problems/reverse-bits/", "easy"),
        ("Power of Two", "https://leetcode.com/problems/power-of-two/", "easy"),
        ("Missing Number", "https://leetcode.com/problems/missing-number/", "easy"),
        ("Single Number II", "https://leetcode.com/problems/single-number-ii/", "medium"),
        ("Bitwise AND of Numbers Range", "https://leetcode.com/problems/bitwise-and-of-numbers-range/", "medium"),
        ("Sum of Two Integers", "https://leetcode.com/problems/sum-of-two-integers/", "medium"),
        ("Counting Bits", "https://leetcode.com/problems/counting-bits/", "easy"),
        ("Maximum XOR of Two Numbers in an Array", "https://leetcode.com/problems/maximum-xor-of-two-numbers-in-an-array/", "medium"),
    ]),
    ("Trie", [
        ("Implement Trie (Prefix Tree)", "https://leetcode.com/problems/implement-trie-prefix-tree/", "medium"),
        ("Design Add and Search Words Data Structure", "https://leetcode.com/problems/design-add-and-search-words-data-structure/", "medium"),
        ("Word Search II", "https://leetcode.com/problems/word-search-ii/", "hard"),
    ]),
]


async def main():
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client[settings.DATABASE_NAME]
    inserted, existed = 0, 0
    for pattern, problems in PATTERNS:
        for title, url, difficulty in problems:
            doc = {
                "category": "dsa",
                "title": title,
                "difficulty": difficulty,
                "topics": [pattern],
                "description": f"Must-do DSA problem — pattern: {pattern}.",
                "external_url": url,
                "must_do": True,
                "created_by": "seed",
                "created_at": datetime.utcnow(),
            }
            result = await db.practice_problems.update_one(
                {"category": "dsa", "title": title},
                {"$set": {"must_do": True, "external_url": url, "topics": [pattern], "difficulty": difficulty},
                 "$setOnInsert": {"category": "dsa", "title": title,
                                  "description": doc["description"], "created_by": "seed",
                                  "created_at": doc["created_at"]}},
                upsert=True,
            )
            if result.upserted_id is not None:
                inserted += 1
            else:
                existed += 1
    total = await db.practice_problems.count_documents({"must_do": True})
    print(f"Seed complete: {inserted} inserted, {existed} updated. Must-do total: {total}")
    client.close()


if __name__ == "__main__":
    asyncio.run(main())
