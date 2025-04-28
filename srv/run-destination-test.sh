#!/bin/bash
# SAP Business Application Studio 中运行destination测试脚本

echo "===== 开始测试SAP BTP Destination配置 ====="
echo "当前目录: $(pwd)"

# 确保node_modules已安装
if [ ! -d "node_modules" ]; then
  echo "正在安装依赖..."
  npm install
fi

# 运行测试
echo "运行destination测试..."
node test-bas-destination.js

echo "===== 测试完成 =====" 