// 加载环境变量和XSUAA配置
const xsenv = require('@sap/xsenv');

// 确保加载环境变量
try {
  xsenv.loadEnv();
} catch (err) {
  console.log('无法加载环境变量文件，将使用系统环境变量');
}

// 加载CDS应用
const cds = require('@sap/cds');

// 最简方式 - 强制禁用CAP的内置认证，改为自定义中间件
// 这样可以完全绕过CAP的认证检查
cds.env.requires.auth = false;

// 在启动时添加自定义认证中间件
cds.on('bootstrap', (app) => {
  console.log('服务器启动中，禁用CAP内置认证，使用自定义认证...');
  
  try {
    // 使用我们定义的auth模块作为一个普通的Express中间件
    const setupAuth = require('./srv/auth');
    setupAuth(app);
  } catch (error) {
    console.error('添加认证中间件时出错:', error.message);
  }
});

// 启动消息
console.log('XSUAA认证已配置');

module.exports = cds.server; 