# 销售计划管理应用

这是一个简单的销售计划管理应用，使用SAP CAP（Cloud Application Programming Model）构建。

## 功能特点

- 销售计划的列表展示
- 销售计划的详细信息查看
- 新增销售计划
- 编辑销售计划
- 更改销售计划状态（标记为已完成/取消）
- 商品管理与销售计划关联
- 销售计划商品关联管理

## 数据模型

### 销售计划（SalesPlans）
- ID：计划编号
- title：计划标题
- description：计划描述
- startDate：开始日期
- endDate：结束日期
- targetAmount：目标销售量
- unit：单位
- status：状态（草稿/进行中/已完成/已取消）
- responsiblePerson：负责人
- remarks：备注
- items：关联的商品（多对多关系）

### 商品（Products）
- ID：商品编号
- name：商品名称
- description：商品描述
- price：商品价格
- currency：货币
- category：商品类别
- sku：商品编码
- stock：库存数量
- unit：单位
- imageUrl：商品图片URL
- salesPlans：关联的销售计划（多对多关系）

### 销售计划商品关联（SalesPlanItems）
- ID：关联ID（UUID）
- salesPlan：关联的销售计划
- product：关联的商品
- quantity：计划销售数量
- targetPrice：目标售价
- discount：折扣
- notes：备注

## 实体关系

- 一个销售计划可以包含多个商品
- 一个商品可以出现在多个销售计划中
- 销售计划与商品之间是多对多关系，通过SalesPlanItems实现

## 安装与运行

1. 确保已安装Node.js (14+)和npm
2. 安装CAP CLI工具：`npm i -g @sap/cds-dk`
3. 克隆本仓库
4. 运行 `npm install` 安装依赖
5. 运行 `cds watch` 启动开发服务器

## 使用方法

访问以下URL：

- 销售计划列表与管理：http://localhost:4004/app/vue/index.html
- 数据服务API：http://localhost:4004/sales

## 技术栈

- 后端：SAP CAP (Node.js)
- 数据库：SQLite (开发环境)
- 前端：Vue.js 3
- UI：Primitive UI CSS框架 