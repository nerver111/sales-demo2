const express = require('express');
const ExcelJS = require('exceljs');
const path = require('path');
const app = express();

app.get('/download-template', async (req, res) => {
  // 1. 读取模板
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(path.join(__dirname, 'templates/template.xlsx'));
  const worksheet = workbook.getWorksheet(1); // 默认第一个sheet

  // 2. 查询数据库，获取1-12月数据
  // 这里用假数据举例
  const monthData = [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1100, 1200];

  // 3. 填充数据到模板（假设1-12月在B2到M2）
  for (let i = 0; i < 12; i++) {
    worksheet.getCell(2, i + 3).value = monthData[i]; // 第2行，第2-13列
  }

  // 4. 计算全年合计（B2:M2求和，填到A2）
  worksheet.getCell('B2').value = { formula: 'SUM(C2:N2)' };

  // 5. 导出并返回
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename=filled_template.xlsx');
  await workbook.xlsx.write(res);
  res.end();
});

app.listen(3000, () => {
  console.log('Server started on port 3000');
});