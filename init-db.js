/**
 * 数据库初始化脚本
 * 用于手动初始化数据库并加载CSV文件
 * 
 * 使用方法:
 * node init-db.js
 */

const cds = require('@sap/cds');
const { exec } = require('child_process');

console.log('开始初始化数据库...');

// 清理旧数据库文件
exec('rm -f db.sqlite', (error) => {
  if (error) {
    console.log('警告: 无法删除旧数据库文件 (可能不存在)');
  } else {
    console.log('已清理旧数据库文件');
  }
  
  // 部署数据库模型
  console.log('正在部署数据库模型...');
  
  // 使用CDS部署命令创建数据库并加载初始数据
  exec('cds deploy --to sqlite:db.sqlite --with-mocks', (error, stdout, stderr) => {
    if (error) {
      console.error(`部署出错: ${error.message}`);
      return;
    }
    
    if (stderr) {
      console.error(`部署警告: ${stderr}`);
    }
    
    console.log(stdout);
    console.log('数据库初始化完成');
    console.log('现在您可以使用 "npm run watch" 或 "cds watch --no-auth" 来启动应用');
  });
}); 