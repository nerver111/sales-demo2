<template>
  <div>
    <el-form :inline="true" size="small" class="filter-form">
      <el-form-item label="计划年度">
        <el-select v-model="filters.year" placeholder="请选择">
          <el-option v-for="y in years" :key="y" :label="y" :value="y"/>
        </el-select>
      </el-form-item>
      <el-form-item label="计划类型">
        <el-select v-model="filters.planType" placeholder="请选择">
          <el-option v-for="t in planTypes" :key="t" :label="t" :value="t"/>
        </el-select>
      </el-form-item>
      <el-form-item label="销售类型">
        <el-select v-model="filters.salesType" placeholder="请选择">
          <el-option v-for="t in salesTypes" :key="t" :label="t" :value="t"/>
        </el-select>
      </el-form-item>
      <el-form-item label="NKA">
        <el-select v-model="filters.nkaType" placeholder="请选择">
          <el-option v-for="t in nkaTypes" :key="t" :label="t" :value="t"/>
        </el-select>
      </el-form-item>
      <el-button type="primary" @click="fetchData">搜索</el-button>
      <el-button @click="resetFilters">重置</el-button>
    </el-form>
    <el-table :data="tableData" style="width: 100%">
      <el-table-column prop="name" label="计划名称"/>
      <el-table-column prop="owner" label="责任人"/>
      <el-table-column prop="status" label="状态">
        <template #default="scope">
          <el-tag :type="statusType(scope.row.status)">{{ scope.row.status }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="updatedAt" label="更新时间"/>
      <el-table-column prop="stoppedAt" label="截止时间"/>
      <el-table-column label="操作">
        <template #default="scope">
          <el-link>查看</el-link>
          <el-link>编辑</el-link>
          <el-link>下载</el-link>
          <el-link>历史变更</el-link>
          <el-link>审批记录</el-link>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script>
import axios from 'axios'
export default {
  data() {
    return {
      filters: { year: '', planType: '', salesType: '', nkaType: '' },
      years: [2024, 2025, 2026],
      planTypes: ['Standard', '...'],
      salesTypes: ['Sales', '...'],
      nkaTypes: ['NKA', '...'],
      tableData: []
    }
  },
  methods: {
    fetchData() {
      axios.get('/odata/v4/SalesPlanService/SalesPlans', { params: this.filters })
        .then(res => { this.tableData = res.data.value })
    },
    resetFilters() {
      this.filters = { year: '', planType: '', salesType: '', nkaType: '' }
      this.fetchData()
    },
    statusType(status) {
      switch (status) {
        case '已准备': return 'success'
        case '未提交': return 'warning'
        case '已提交': return 'info'
        case '已全部提交': return 'success'
        case '已全部驳回': return 'danger'
        default: return ''
      }
    }
  },
  mounted() {
    this.fetchData()
  }
}
</script>