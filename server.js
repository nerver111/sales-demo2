// 加载环境变量
const xsenv = require('@sap/xsenv');
try {
  xsenv.loadEnv();
} catch (err) {
  console.log('无法加载环境变量文件，将使用系统环境变量');
}

// 获取destination服务实例
let destinationService;
try {
  destinationService = xsenv.getServices({ destination: { tag: 'destination' } }).destination;
  console.log('已成功加载destination服务配置');
} catch (err) {
  console.warn('未找到destination服务配置, 将使用默认值:', err.message);
  // 创建一个默认的destination服务对象用于本地开发
  destinationService = {
    credentials: {
      destinations: [
        {
          name: "local-service",
          url: "http://localhost:8080",
          authentication: "NoAuthentication"
        }
      ]
    }
  };
}

// 加载CDS应用
const cds = require('@sap/cds');

// 检查命令行参数
const noAuth = process.argv.includes('--no-auth');
console.log('认证状态:', noAuth ? '已禁用 (--no-auth)' : '已启用');

// 配置服务器和会话
cds.on('bootstrap', (app) => {
  // 添加会话支持
  const session = require('express-session');
  app.use(session({
    secret: 'sales-app-secret',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 } // 1天
  }));

  // 添加JSON解析中间件，用于处理登录请求
  const bodyParser = require('body-parser');
  app.use(bodyParser.json());

  // 添加CORS支持
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    
    // 处理预检请求
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // 在非认证模式下，添加用户信息中间件
  if (noAuth) {
    try {
      console.log('服务器启动中，设置用户信息中间件...');
      
      // 添加用户信息中间件（不涉及认证）
      app.use((req, res, next) => {
        // 确保有一个用户对象
        if (!req.user) {
          req.user = { 
            id: 'anonymous', 
            name: 'Anonymous User',
            roles: ['anonymous', 'viewer', 'editor', 'admin'],
            locale: 'zh',
            tenant: 'devtenant'
          };
          // 添加角色检查函数
          req.user.is = function(role) {
            return this.roles.includes(role);
          };
        }
        next();
      });
    } catch (error) {
      console.error('添加中间件时出错:', error.message);
    }
  }

  console.log('注册服务处理程序...');
});

// 拦截错误请求
cds.on('error', (err, req) => {
  console.error(`处理请求时出错: ${err.message}`);
  // 仅在开发模式下显示完整错误信息
  if (process.env.NODE_ENV !== 'production') {
    console.error(err.stack);
  }
});

// 服务初始化后
cds.on('served', async () => {
  // 获取销售服务
  const salesService = await cds.connect.to('SalesService');
  
  // 注册外部服务模块
  try {
    const externalServiceHandler = require('./srv/external-service');
    await externalServiceHandler(salesService);
    console.log('已注册外部服务处理程序');
  } catch (error) {
    console.error('注册外部服务处理程序失败:', error.message);
  }
});

module.exports = cds.server; 