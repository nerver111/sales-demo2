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

// 确保在启动前设置正确的认证选项
cds.env.requires = cds.env.requires || {};
cds.env.requires.auth = {
  kind: 'xsuaa'
};

// 在启动时注册我们自定义的认证中间件
cds.on('bootstrap', (app) => {
  console.log('服务器启动中，加载认证中间件...');
  
  // 导入并应用我们自定义的认证模块
  try {
    const setupAuth = require('./srv/auth');
    setupAuth(app);
  } catch (error) {
    console.error('加载认证模块时出错:', error.message);
  }
});

// 启动消息
console.log('XSUAA认证已配置');

module.exports = cds.server; 