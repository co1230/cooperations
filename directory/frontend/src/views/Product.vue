<template>
  <div class="product-page">

    <el-card>
      <template #header>
        <div class="header">
          <span>商品管理</span>

          <el-button type="primary">
            新增商品
          </el-button>
        </div>
      </template>


      <!-- 搜索区域 -->
      <div class="search-area">

        <el-input
          v-model="keyword"
          placeholder="请输入商品名称"
          style="width:220px"
        />

        <el-button type="primary">
          搜索
        </el-button>

      </div>


      <!-- 商品表格 -->
      <el-table
        :data="productList"
        border
        style="width:100%"
      >

        <el-table-column
          prop="id"
          label="ID"
          width="80"
        />

        <el-table-column
          prop="name"
          label="商品名称"
        />


        <el-table-column
          prop="price"
          label="价格"
        />


        <el-table-column
          prop="stock"
          label="库存"
        />


        <el-table-column
          prop="status"
          label="状态"
        >
          <template #default="scope">

            <el-tag
              v-if="scope.row.status===1"
              type="success"
            >
              上架
            </el-tag>

            <el-tag
              v-else
              type="danger"
            >
              下架
            </el-tag>

          </template>

        </el-table-column>


        <el-table-column
          label="操作"
          width="180"
        >

          <template #default>

            <el-button
              size="small"
            >
              编辑
            </el-button>


            <el-button
              size="small"
              type="danger"
            >
              删除
            </el-button>

          </template>

        </el-table-column>


      </el-table>


    </el-card>


  </div>
</template>



<script setup>

import { ref } from "vue"


// 搜索关键字
const keyword = ref("")


// 商品数据
const productList = ref([
  {
    id:1,
    name:"苹果 iPhone 16",
    price:7999,
    stock:20,
    status:1
  },
  {
    id:2,
    name:"华为 Mate 70",
    price:5999,
    stock:15,
    status:0
  }
])


</script>



<style scoped>

.product-page{
  padding:20px;
}


.header{
  display:flex;
  justify-content:space-between;
  align-items:center;
}


.search-area{
  margin-bottom:20px;
  display:flex;
  gap:10px;
}


</style>
