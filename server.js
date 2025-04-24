// 加载环境变量和XSUAA配置
const xsenv = require('@sap/xsenv');
xsenv.loadEnv();

// 加载CDS应用
const cds = require('@sap/cds');

// 确保认证正确加载
// package.json中已经配置了mock认证，这里确保它被正确应用
const { auth } = cds.env.requires;
if (!auth || !auth.kind) {
  // 如果未配置认证，使用默认的mock认证
  cds.env.requires.auth = { 
    kind: 'mock',
    impl: '@sap/cds/lib/srv/auth/mock' // 明确指定实现路径
  };
}

// 启动CDS服务
cds.on('bootstrap', app => {
  console.log('服务器启动中，已加载XSUAA配置...');
});

module.exports = cds.server; 