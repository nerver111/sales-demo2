// 加载环境变量和XSUAA配置
const xsenv = require('@sap/xsenv');
xsenv.loadEnv();

// 加载CDS应用
const cds = require('@sap/cds');

// 启动CDS服务
cds.on('bootstrap', app => {
  console.log('服务器启动中，已加载XSUAA配置...');
});

module.exports = cds.server; 