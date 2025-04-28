/**
 * SAP BTP Destination 测试脚本
 * 专门用于在SAP Business Application Studio中测试
 */
const { callDestination } = require('./destination-helper');

console.log('=========== SAP BTP Destination 测试 ===========');
console.log('运行环境信息:');
console.log('当前工作目录:', process.cwd());
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('VCAP_SERVICES是否存在:', !!process.env.VCAP_SERVICES);
console.log('VCAP_APPLICATION是否存在:', !!process.env.VCAP_APPLICATION);

async function testDestination() {
  try {
    console.log('\n开始测试destination服务...');
    console.log('测试目标destination名称: sap-demo');
    
    // 尝试调用sap-demo destination，不添加额外的路径
    const result = await callDestination('sap-demo', '');
    
    // 由于结果可能很大，仅打印部分标识信息
    console.log('调用成功!');
    console.log('响应内容类型:', typeof result);
    
    if (typeof result === 'object') {
      console.log('响应对象概览:', JSON.stringify(result).substring(0, 200) + '...');
    } else if (typeof result === 'string') {
      console.log('响应字符串预览:', result.substring(0, 200) + '...');
    } else {
      console.log('响应内容:', result);
    }
    
    return true;
  } catch (error) {
    console.error('\n测试失败:', error.message);
    if (error.stack) {
      console.error('错误堆栈:', error.stack);
    }
    return false;
  }
}

// 执行测试
testDestination()
  .then(success => {
    console.log('\n=========== 测试结果 ===========');
    console.log(success ? '✅ 测试成功!' : '❌ 测试失败!');
    console.log('===============================');
  })
  .catch(err => {
    console.error('\n=========== 测试异常 ===========');
    console.error('测试过程中发生未捕获错误:', err);
    console.error('================================');
  }); 