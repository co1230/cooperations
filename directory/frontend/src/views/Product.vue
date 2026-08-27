<template>
  <div class="product-page">

    <el-card>

      <template #header>

        <div class="header">

          <span>商品管理</span>

          <el-button
            type="primary"
            @click="loadProducts"
          >
            刷新商品
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

        <el-button
          type="primary"
          @click="loadProducts"
        >
          搜索
        </el-button>

      </div>



      <!-- 商品列表 -->

      <el-table
        :data="productList"
        border
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
        >

          <template #default="scope">

            <el-button
              type="danger"
              size="small"
              @click="removeProduct(scope.row.id)"
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

import { ref,onMounted } from "vue"

import {
  getProductList,
  deleteProduct
} from "../api/product"



// 搜索关键字

const keyword = ref("");



// 商品数据

const productList = ref([])



// 加载商品

async function loadProducts(){


  try{


    const res = await getProductList({

      keyword:keyword.value,

      page:1,

      page_size:10

    })


    /*
      根据你的后端返回结构调整

      可能:
      res.data.data.list

      或:
      res.data.list
    */


    productList.value =
      res.data.data.list || []


  }catch(error){

    console.log("获取商品失败",error)

  }


}



// 删除商品

async function removeProduct(id){


  await deleteProduct(id)


  loadProducts()

}



// 页面打开自动加载

onMounted(()=>{

  loadProducts()

})


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
