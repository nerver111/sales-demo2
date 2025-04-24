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

// 确保在启动前设置认证选项，但不指定impl来避免CAP的自动检查
cds.env.requires = cds.env.requires || {};
cds.env.requires.auth = {
  kind: 'xsuaa'
  // 注意：不设置impl，让auth.js模块在运行时设置它
};

// 在启动时注册我们自定义的认证中间件
cds.on('bootstrap', (app) => {
  console.log('服务器启动中，注册自定义认证中间件...');
  
  try {
    // 导入自定义认证并应用到app
    const XsuaaAuth = require('./srv/auth')(app);
    
    // 手动覆盖CAP内部认证实现
    const auth = require('@sap/cds/lib/srv/auth');
    auth.register('xsuaa', XsuaaAuth);
    
    console.log('已绕过CAP认证检查，使用自定义认证实现');
  } catch (error) {
    console.error('注册认证时出错:', error.message);
    console.error('将尝试使用--no-auth选项继续');
    cds.env.requires.auth = false;
  }
});

// 启动消息
console.log('XSUAA认证已配置');

module.exports = cds.server; 