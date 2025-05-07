/**
 * SAP BTP Destination 测试脚本
 * 专门用于在SAP Business Application Studio中测试
 */
const xsenv = require('@sap/xsenv');
const { callDestination } = require('./destination-helper');
const fs = require('fs');
const path = require('path');

// 手动设置环境变量
try {
  // 尝试加载default-env.json
  const defaultEnvPath = path.join(__dirname, '..', 'default-env.json');
  if (fs.existsSync(defaultEnvPath)) {
    console.log(`找到环境变量文件: ${defaultEnvPath}`);
    const envContent = fs.readFileSync(defaultEnvPath, 'utf8');
    const envJson = JSON.parse(envContent);
    
    // 直接设置VCAP_SERVICES环境变量
    if (envJson.VCAP_SERVICES) {
      process.env.VCAP_SERVICES = JSON.stringify(envJson.VCAP_SERVICES);
      console.log('已手动设置VCAP_SERVICES环境变量');
    }
  } else {
    console.log(`未找到环境变量文件: ${defaultEnvPath}`);
  }
} catch (err) {
  console.log('设置环境变量失败:', err.message);
}

console.log('=========== SAP BTP Destination 测试 ===========');
console.log('运行环境信息:');
console.log('当前工作目录:', process.cwd());
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('VCAP_SERVICES是否存在:', !!process.env.VCAP_SERVICES);
console.log('VCAP_APPLICATION是否存在:', !!process.env.VCAP_APPLICATION);

// 添加硬编码测试
if (!process.env.VCAP_SERVICES) {
  console.log('未找到VCAP_SERVICES, 添加硬编码配置用于测试');
  // 手动添加destination配置
  process.env.DESTINATION_SAP_DEMO_URL = 'https://httpbin.org/get';
  console.log('已设置DESTINATION_SAP_DEMO_URL环境变量:', process.env.DESTINATION_SAP_DEMO_URL);
}

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

// 新增：测试sap-demo-post destination的POST请求
async function testDestinationPost() {
  try {
    console.log('\n开始测试destination服务...');
    console.log('测试目标destination名称: sap-demo-post (POST)');
    
    // 尝试POST调用sap-demo-post destination
    const result = await callDestination('sap-demo-post', '', {
      method: 'POST',
      data: { foo: 'bar', time: new Date().toISOString() },
      headers: { 'Content-Type': 'application/json' }
    });
    
    console.log('POST调用完成!');
    console.log('响应内容类型:', typeof result);
    if (typeof result === 'object') {
      console.log('POST响应对象概览:', JSON.stringify(result).substring(0, 200) + '...');
    } else if (typeof result === 'string') {
      console.log('POST响应字符串预览:', result.substring(0, 200) + '...');
    } else {
      console.log('POST响应内容:', result);
    }
    return true;
  } catch (error) {
    console.error('\nPOST测试失败:', error.message);
    if (error.stack) {
      console.error('POST错误堆栈:', error.stack);
    }
    return false;
  }
}

// 新增：测试 my-internal-api destination 的 GET 请求
async function testMyInternalApi() {
  try {
    console.log('\n开始测试本地 my-internal-api destination...');
    console.log('测试目标destination名称: my-internal-api (GET)');

    // 尝试GET调用 my-internal-api destination
    const result = await callDestination('my-internal-api', '/api/products', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    console.log('GET调用完成!');
    console.log('响应内容类型:', typeof result);
    if (typeof result === 'object') {
      console.log('GET响应对象概览:', JSON.stringify(result).substring(0, 200) + '...');
    } else if (typeof result === 'string') {
      console.log('GET响应字符串预览:', result.substring(0, 200) + '...');
    } else {
      console.log('GET响应内容:', result);
    }
    return true;
  } catch (error) {
    console.error('\nGET测试失败:', error.message);
    if (error.stack) {
      console.error('GET错误堆栈:', error.stack);
    }
    return false;
  }
}

// 执行测试
testDestination()
  .then(success => {
    console.log('\n=========== 测试结果 ===========');
    console.log(success ? '✅ sap-demo 测试成功!' : '❌ sap-demo 测试失败!');
    console.log('===============================');
    // 测试POST
    return testDestinationPost();
  })
  .then(success => {
    console.log('\n=========== POST测试结果 ===========');
    console.log(success ? '✅ sap-demo-post 测试成功!' : '❌ sap-demo-post 测试失败!');
    console.log('===================================');
    // 新增：测试 my-internal-api
    return testMyInternalApi();
  })
  .then(success => {
    console.log('\n=========== my-internal-api 测试结果 ===========');
    console.log(success ? '✅ my-internal-api 测试成功!' : '❌ my-internal-api 测试失败!');
    console.log('===============================================');
  })
  .catch(err => {
    console.error('\n=========== 测试异常 ===========');
    console.error('测试过程中发生未捕获错误:', err);
    console.error('================================');
  }); 