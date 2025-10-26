"""
Test real-time streaming from backend
"""
import asyncio
import aiohttp
import json


async def test_streaming():
    """Test if backend is really streaming or buffering"""
    print("Testing streaming from backend...")
    print("=" * 80)
    
    url = "http://localhost:8000/api/chat/stream"
    payload = {
        "message": "how can i apply tax return"
    }
    
    chunk_count = 0
    start_time = asyncio.get_event_loop().time()
    last_chunk_time = start_time
    
    async with aiohttp.ClientSession() as session:
        async with session.post(url, json=payload) as response:
            print(f"Response status: {response.status}")
            print(f"Content-Type: {response.headers.get('Content-Type')}")
            print()
            print("Receiving chunks (showing timing):")
            print("-" * 80)
            
            async for line in response.content:
                current_time = asyncio.get_event_loop().time()
                time_since_start = current_time - start_time
                time_since_last = current_time - last_chunk_time
                
                decoded = line.decode('utf-8').strip()
                if decoded.startswith('data: '):
                    try:
                        data = json.loads(decoded[6:])
                        if data.get('type') == 'chunk':
                            chunk_count += 1
                            content = data.get('content', '')
                            print(f"[{time_since_start:.2f}s | +{time_since_last:.3f}s] Chunk {chunk_count}: {content[:50]}...")
                            last_chunk_time = current_time
                        elif data.get('type') == 'done':
                            print(f"\n[{time_since_start:.2f}s] Stream completed!")
                            print(f"Total chunks: {chunk_count}")
                    except json.JSONDecodeError:
                        pass
    
    total_time = asyncio.get_event_loop().time() - start_time
    print()
    print("=" * 80)
    print(f"Total time: {total_time:.2f}s")
    print(f"Average time between chunks: {(total_time / chunk_count):.3f}s")
    print()
    
    if chunk_count > 10 and total_time > 2:
        print("✅ STREAMING WORKS - Multiple chunks received over time")
    else:
        print("❌ NOT STREAMING - Data came all at once or too few chunks")


if __name__ == "__main__":
    asyncio.run(test_streaming())
