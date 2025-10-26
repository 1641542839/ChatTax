"""
Test Australian tax query to verify LLM returns Australian information
"""
import asyncio
from app.services.chat_service import ChatService


async def test_australian_query():
    """Test Australian tax return question"""
    print("=" * 80)
    print("Testing Australian Tax Query")
    print("=" * 80)
    print()
    
    question = "how can i apply tax return"
    print(f"Question: {question}")
    print()
    print("AI Answer:")
    print()
    print("-" * 80)
    
    result = ""
    async for chunk in ChatService.generate_stream_response(
        message=question,
        user_type="individual",
        use_reranking=True
    ):
        result += chunk
        print(chunk, end="", flush=True)
    
    print()
    print("-" * 80)
    print()
    
    # Check if response contains Australian keywords
    australian_keywords = ['australia', 'ato', 'australian taxation office', 'myGov', '.au']
    us_keywords = ['u.s.', 'united states', 'irs', 'internal revenue service']
    
    result_lower = result.lower()
    has_australian = any(keyword.lower() in result_lower for keyword in australian_keywords)
    has_us = any(keyword.lower() in result_lower for keyword in us_keywords)
    
    print("\nValidation:")
    print(f"  Contains Australian references: {'YES ✓' if has_australian else 'NO ✗'}")
    print(f"  Contains U.S. references: {'YES ✗' if has_us else 'NO ✓'}")
    
    if has_australian and not has_us:
        print("\n✅ Test PASSED - Response is about Australian tax")
    else:
        print("\n❌ Test FAILED - Response is not correctly about Australian tax")


if __name__ == "__main__":
    asyncio.run(test_australian_query())
