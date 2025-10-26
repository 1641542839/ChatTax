"""
测试RAG聊天流功能

运行: cd Backend && python test_chat_rag.py
"""
import asyncio
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app.services.chat_service import ChatService

async def test_chat():
    print("\n" + "="*80)
    print("🧪 测试 RAG 聊天流式响应")
    print("="*80 + "\n")
    
    # 测试查询
    test_message = "I am a developer, what tax deductions can I have?"
    
    print(f"📝 问题: {test_message}\n")
    print("💬 AI回答:\n")
    print("-" * 80)
    
    try:
        # 生成流式响应
        async for chunk in ChatService.generate_stream_response(
            message=test_message,
            user_type="individual",
            use_reranking=True
        ):
            print(chunk, end='', flush=True)
        
        print("\n" + "-" * 80)
        print("\n✅ 测试完成！")
        
    except Exception as e:
        print(f"\n\n❌ 错误: {e}")
        import traceback
        traceback.print_exc()
        
        print("\n💡 可能的问题:")
        print("   1. OpenAI API密钥未设置或无效")
        print("   2. 向量存储未初始化")
        print("   3. Cross-encoder模型下载中（首次运行需要时间）")

if __name__ == "__main__":
    asyncio.run(test_chat())
