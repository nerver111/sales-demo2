// 加载环境变量
const xsenv = require('@sap/xsenv');
try {
  xsenv.loadEnv();
} catch (err) {
  console.log('无法加载环境变量文件，将使用系统环境变量');
}

// 加载CDS应用
const cds = require('@sap/cds');

// 检查命令行参数
const noAuth = process.argv.includes('--no-auth');
console.log('认证状态:', noAuth ? '已禁用 (--no-auth)' : '已启用');

// 我们不做任何认证配置修改，而是让命令行参数决定
// 如果使用 --no-auth 参数，CDS将自动禁用认证

// 在启动时添加自定义用户处理中间件（而不是认证中间件）
cds.on('bootstrap', (app) => {
  if (!noAuth) {
    try {
      console.log('服务器启动中，设置用户信息中间件...');
      
      // 添加用户信息中间件（不涉及认证）
      app.use((req, res, next) => {
        // 确保有一个用户对象
        if (!req.user) {
          req.user = { 
            id: 'anonymous', 
            name: 'Anonymous User',
            roles: ['anonymous']
          };
        }
        next();
      });
    } catch (error) {
      console.error('添加中间件时出错:', error.message);
    }
  }
});

module.exports = cds.server; 