/**
 * SAP BTP Destination 简化测试脚本
 * 专门用于在SAP Business Application Studio中测试
 */
const { callDestination } = require('./destination-helper');

async function testDestination() {
  try {
    console.log('开始测试destination服务...');
    
    // 尝试调用sap-demo destination
    const result = await callDestination('sap-demo', '/');
    
    // 由于结果可能很大，仅打印部分标识信息
    console.log('调用成功! 响应大小:', 
      result ? (typeof result === 'string' ? result.substring(0, 100) + '...' : '非文本响应') : '无响应');
    
    return true;
  } catch (error) {
    console.error('测试失败:', error.message);
    return false;
  }
}

// 执行测试
testDestination()
  .then(success => {
    console.log(success ? '✅ 测试成功!' : '❌ 测试失败!');
  })
  .catch(err => {
    console.error('测试过程中发生错误:', err);
  }); 