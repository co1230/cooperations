<template>

  <div class="dashboard">

```
<h2>商家后台首页</h2>


<!-- 数据概览 -->

<el-row :gutter="20">


  <el-col :span="6">

    <el-card>

      <div class="card-title">
        商品总数
      </div>

      <div class="number">
        {{ data.productCount }}
      </div>

    </el-card>

  </el-col>



  <el-col :span="6">

    <el-card>

      <div class="card-title">
        上架商品
      </div>

      <div class="number">
        {{ data.onlineProduct }}
      </div>

    </el-card>

  </el-col>



  <el-col :span="6">

    <el-card>

      <div class="card-title">
        待发货订单
      </div>

      <div class="number">
        {{ data.pendingOrder }}
      </div>

    </el-card>

  </el-col>



  <el-col :span="6">

    <el-card>

      <div class="card-title">
        待审核售后
      </div>

      <div class="number">
        {{ data.pendingAfterSale }}
      </div>

    </el-card>

  </el-col>


</el-row>





<!-- 快捷入口 -->


<el-card class="quick">


  <template #header>

    <span>
      快捷管理
    </span>

  </template>



  <el-button
    type="primary"
    @click="$router.push('/product')"
  >

    商品管理

  </el-button>




  <el-button
    type="success"
    @click="$router.push('/order')"
  >

    订单管理

  </el-button>





  <el-button
    type="warning"
    @click="$router.push('/after-sale')"
  >

    售后审核

  </el-button>





  <el-button
    type="danger"
    @click="$router.push('/statistics')"
  >

    营收统计

  </el-button>


</el-card>






<!-- 系统说明 -->


<el-card class="notice">


  <template #header>

    <span>
      系统说明
    </span>

  </template>


  <p>
    欢迎进入电商平台商家后台。
  </p>


  <p>
    当前系统支持：
  </p>


  <ul>

    <li>
      商品上下架管理
    </li>


    <li>
      商品库存管理
    </li>


    <li>
      商家订单发货
    </li>


    <li>
      售后退款审核
    </li>


    <li>
      店铺营收统计
    </li>

  </ul>


</el-card>
```

  </div>

</template>

<script setup>


import {
  reactive
} from "vue"



// 当前先使用模拟数据
// 后续可以连接 statistics/dashboard 接口


const data = reactive({

  productCount: 3,

  onlineProduct: 2,

  pendingOrder: 1,

  pendingAfterSale: 1

})



</script>

<style scoped>


.dashboard {

  padding: 20px;

}



h2 {

  margin-bottom: 20px;

}



.card-title {

  font-size: 16px;

  color: #666;

}



.number {

  margin-top: 15px;

  font-size: 32px;

  font-weight: bold;

}



.quick {

  margin-top: 25px;

}



.notice {

  margin-top: 25px;

}



</style>

