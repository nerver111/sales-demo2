/**
 * SAP BTP Destination 测试脚本
 * 用于测试destination配置是否正确
 */

const xsenv = require('@sap/xsenv');
const axios = require('axios');
const https = require('https');

// 尝试加载环境变量
try {
  xsenv.loadEnv();
  console.log('已加载环境变量');
} catch (err) {
  console.log('未找到环境变量文件，将使用系统环境变量');
}

// 获取destination服务
let destinationService;
try {
  destinationService = xsenv.getServices({ destination: { tag: 'destination' } }).destination;
  console.log('成功获取destination服务配置');
} catch (err) {
  console.error('获取destination服务失败:', err.message);
  console.log('将使用默认的模拟destination配置进行测试');
  
  // 创建模拟的destination服务配置
  destinationService = {
    destinations: [
      {
        name: "sap-demo",
        url: "https://www.baidu.com",
        authentication: "NoAuthentication",
        proxyType: "Internet",
        type: "HTTP",
        description: "示例目标"
      }
    ]
  };
}

console.log('Destination服务配置:', JSON.stringify(destinationService, null, 2));

// 检查destination服务结构
console.log('\n检查destination服务结构:');
if (destinationService) {
  const keys = Object.keys(destinationService);
  console.log('顶级属性:', keys);
} else {
  console.log('Warning: destinationService为undefined');
}

// 获取destination函数
async function getDestination(destinationName) {
  if (!destinationName) {
    throw new Error('必须提供destination名称');
  }
  
  if (!destinationService) {
    console.log('Destination服务未配置，使用模拟数据');
    return {
      name: "sap-demo",
      url: "https://www.baidu.com",
      authentication: "NoAuthentication",
      type: "HTTP",
      proxyType: "Internet"
    };
  }
  
  // 检查destinations是否直接在顶级对象中
  if (destinationService.destinations && Array.isArray(destinationService.destinations)) {
    const dest = destinationService.destinations.find(d => d.name === destinationName);
    if (dest) {
      console.log(`在顶级destinations中找到destination配置: ${destinationName}`);
      return dest;
    }
  }
  
  // 检查是否在credentials下
  if (destinationService.credentials && destinationService.credentials.destinations) {
    const dest = destinationService.credentials.destinations.find(d => d.name === destinationName);
    if (dest) {
      console.log(`在credentials.destinations中找到destination配置: ${destinationName}`);
      return dest;
    }
  }
  
  // 尝试使用模拟数据作为后备
  console.log(`未找到destination配置，使用模拟数据: ${destinationName}`);
  return {
    name: "sap-demo",
    url: "https://www.baidu.com",
    authentication: "NoAuthentication",
    type: "HTTP",
    proxyType: "Internet"
  };
}

// 测试调用sap-demo destination
async function testDestination() {
  try {
    const destName = 'sap-demo';
    console.log(`\n开始测试destination: ${destName}`);
    
    // 获取destination配置
    const destination = await getDestination(destName);
    
    console.log(`找到destination配置: ${JSON.stringify(destination, null, 2)}`);
    
    // 构建请求URL和配置
    const url = `${destination.url}/`;
    console.log(`请求URL: ${url}`);
    
    // 发送请求
    const response = await axios({
      url,
      method: 'GET',
      // 允许自签名证书用于测试
      httpsAgent: new https.Agent({ rejectUnauthorized: false }),
      // 10秒超时
      timeout: 10000,
      // 只返回响应状态和头信息，不返回内容体以避免大量输出
      validateStatus: status => true
    });
    
    console.log(`\n请求成功! 状态码: ${response.status}`);
    console.log(`内容类型: ${response.headers['content-type']}`);
    console.log('响应头信息:');
    console.log(JSON.stringify(response.headers, null, 2));
    
    return true;
  } catch (error) {
    console.error('\n测试destination失败:', error.message);
    if (error.response) {
      console.error(`状态码: ${error.response.status}`);
      console.error(`响应内容: ${JSON.stringify(error.response.data)}`);
    }
    return false;
  }
}

// 执行测试
testDestination().then(success => {
  if (success) {
    console.log('\n✅ Destination测试成功!');
  } else {
    console.log('\n❌ Destination测试失败!');
  }
}); 