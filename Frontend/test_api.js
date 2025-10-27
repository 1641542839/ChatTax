/**
 * Checklist API 集成测试
 * 在浏览器控制台中运行此代码测试 API 连接
 */

// 测试 API 基础 URL
const API_BASE = 'http://localhost:8000'

// 测试数据
const testUserId = 1
const testIdentityInfo = {
  employment_status: 'employed',
  income_sources: ['salary', 'investment'],
  has_dependents: true,
  has_investment: true,
  has_rental_property: false,
  is_first_time_filer: false,
  additional_info: {
    industry: 'technology',
    location: 'NSW',
  }
}

// 测试函数
async function testChecklistAPI() {
  console.log('🧪 开始测试 Checklist API...\n')
  
  try {
    // 1. 测试生成清单
    console.log('1️⃣ 测试生成清单...')
    const generateResponse = await fetch(`${API_BASE}/api/checklist/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: testUserId,
        identity_info: testIdentityInfo
      })
    })
    
    if (!generateResponse.ok) {
      throw new Error(`生成失败: ${generateResponse.status}`)
    }
    
    const checklist = await generateResponse.json()
    console.log(`✅ 生成成功！清单 ID: ${checklist.id}`)
    console.log(`   任务数量: ${checklist.items.length}`)
    console.log(`   第一个任务: ${checklist.items[0].title}\n`)
    
    const checklistId = checklist.id
    
    // 2. 测试获取清单
    console.log('2️⃣ 测试获取清单...')
    const getResponse = await fetch(
      `${API_BASE}/api/checklist/${checklistId}?user_id=${testUserId}`
    )
    
    if (!getResponse.ok) {
      throw new Error(`获取失败: ${getResponse.status}`)
    }
    
    const retrievedChecklist = await getResponse.json()
    console.log(`✅ 获取成功！清单 ID: ${retrievedChecklist.id}`)
    console.log(`   任务数量: ${retrievedChecklist.items.length}\n`)
    
    // 3. 测试更新状态
    console.log('3️⃣ 测试更新任务状态...')
    const firstItemId = checklist.items[0].id
    const updateResponse = await fetch(
      `${API_BASE}/api/checklist/${checklistId}/status?user_id=${testUserId}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item_id: firstItemId,
          status: 'doing'
        })
      }
    )
    
    if (!updateResponse.ok) {
      throw new Error(`更新失败: ${updateResponse.status}`)
    }
    
    const updatedChecklist = await updateResponse.json()
    const updatedItem = updatedChecklist.items.find(item => item.id === firstItemId)
    console.log(`✅ 更新成功！`)
    console.log(`   任务: ${updatedItem.title}`)
    console.log(`   新状态: ${updatedItem.status}\n`)
    
    // 4. 测试获取用户清单列表
    console.log('4️⃣ 测试获取用户所有清单...')
    const listResponse = await fetch(
      `${API_BASE}/api/checklist/user/${testUserId}`
    )
    
    if (!listResponse.ok) {
      throw new Error(`获取列表失败: ${listResponse.status}`)
    }
    
    const checklists = await listResponse.json()
    console.log(`✅ 获取成功！用户共有 ${checklists.length} 个清单\n`)
    
    console.log('🎉 所有测试通过！\n')
    console.log('📋 测试总结:')
    console.log(`   - 生成清单: ✅`)
    console.log(`   - 获取清单: ✅`)
    console.log(`   - 更新状态: ✅`)
    console.log(`   - 获取列表: ✅`)
    console.log(`\n💡 你可以访问 http://localhost:3000/checklist 查看清单`)
    
    return {
      success: true,
      checklistId,
      totalItems: checklist.items.length,
      totalChecklists: checklists.length
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message)
    console.error('\n🔧 请确认:')
    console.error('   1. 后端服务运行中: uvicorn main:app --reload')
    console.error('   2. API 地址正确: http://localhost:8000')
    console.error('   3. 数据库已初始化')
    
    return {
      success: false,
      error: error.message
    }
  }
}

// 导出测试函数（可在控制台运行）
if (typeof window !== 'undefined') {
  window.testChecklistAPI = testChecklistAPI
  console.log('💡 在浏览器控制台运行: testChecklistAPI()')
}

export default testChecklistAPI
