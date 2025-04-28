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
  process.exit(1);
}

// 显示所有配置的destinations
console.log('\n已配置的Destinations:');
if (destinationService && destinationService.credentials && destinationService.credentials.destinations) {
  destinationService.credentials.destinations.forEach(dest => {
    console.log(`\n名称: ${dest.name}`);
    console.log(`URL: ${dest.url}`);
    console.log(`认证类型: ${dest.authentication}`);
    console.log(`类型: ${dest.type}`);
    console.log(`代理类型: ${dest.proxyType}`);
    console.log('----------------------------');
  });
} else {
  console.log('未找到任何destination配置');
}

// 测试调用sap-demo destination
async function testDestination() {
  try {
    const destName = 'sap-demo';
    console.log(`\n开始测试destination: ${destName}`);
    
    // 查找destination配置
    const destination = destinationService.credentials.destinations.find(
      dest => dest.name === destName
    );
    
    if (!destination) {
      throw new Error(`未找到名为 ${destName} 的destination配置`);
    }
    
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