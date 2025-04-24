// 加载环境变量和XSUAA配置
const xsenv = require('@sap/xsenv');

try {
  // 尝试加载XSUAA服务配置
  xsenv.loadEnv();
  // 安全地获取XSUAA服务实例
  const services = xsenv.getServices({
    xsuaa: { tag: 'xsuaa' }
  });
  console.log('已找到XSUAA服务配置');
} catch (err) {
  console.log('未找到XSUAA服务配置，将使用mock认证:', err.message);
}

// 加载CDS应用
const cds = require('@sap/cds');

// 判断环境类型，确定认证策略
const isProductionEnv = process.env.NODE_ENV === 'production';
const isCloudFoundry = process.env.VCAP_APPLICATION ? true : false;

// 根据环境选择认证方式
if (isCloudFoundry) {
  // Cloud Foundry环境，使用XSUAA
  console.log('运行在Cloud Foundry环境，使用XSUAA认证');
  // XSUAA配置已在package.json中设置为 { "kind": "xsuaa" }
} else {
  // 本地开发环境，使用mock认证
  console.log('运行在本地环境，使用mock认证');
  cds.env.requires.auth = { 
    kind: 'mock',
    impl: '@sap/cds/lib/srv/auth/mock'
  };
}

// 启动CDS服务
cds.on('bootstrap', app => {
  console.log('服务器启动中，已加载认证配置...');
});

module.exports = cds.server; 