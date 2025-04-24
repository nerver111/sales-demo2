// 加载环境变量和XSUAA配置
const xsenv = require('@sap/xsenv');

// 确保加载环境变量
try {
  xsenv.loadEnv();
} catch (err) {
  console.log('无法加载.env文件，将使用默认环境变量');
}

// 加载CDS应用
const cds = require('@sap/cds');

// 强制使用指定的auth实现
cds.env.requires = cds.env.requires || {};
cds.env.requires.auth = {
  kind: 'xsuaa',
  impl: '@sap/cds/lib/srv/auth/passport'  // 明确指定使用passport实现XSUAA认证
};

console.log('已配置XSUAA认证');

// 启动CDS服务
cds.on('bootstrap', app => {
  console.log('服务器启动中，认证配置已应用...');
  
  // 注册Passport认证中间件
  const passport = require('passport');
  const xssec = require('@sap/xssec');
  const JWTStrategy = xssec.JWTStrategy;
  
  // 从环境变量中获取XSUAA服务配置
  let xsuaaService = null;
  try {
    xsuaaService = xsenv.getServices({ xsuaa: {tag: 'xsuaa'} }).xsuaa;
    console.log('成功获取XSUAA服务配置');
  } catch (err) {
    console.log('无法获取XSUAA服务配置，将使用mock配置');
    // 创建一个模拟的XSUAA服务以避免启动错误
    xsuaaService = {
      uaadomain: 'localhost',
      clientid: 'mock-client',
      clientsecret: 'mock-secret',
      url: 'http://localhost'
    };
  }
  
  // 配置Passport
  passport.use(new JWTStrategy(xsuaaService));
  app.use(passport.initialize());
});

module.exports = cds.server; 