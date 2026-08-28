<template>

  <div class="layout">


    <!-- 左侧菜单 -->

    <el-aside width="220px" class="sidebar">


      <div class="logo">

        商家管理后台

      </div>



      <el-menu

        router

        :default-active="$route.path"

      >


        <el-menu-item index="/product">

          <el-icon>
            <Goods />
          </el-icon>

          <span>商品管理</span>

        </el-menu-item>





        <el-menu-item index="/order">


          <el-icon>
            <List />
          </el-icon>


          <span>订单管理</span>


        </el-menu-item>





        <el-menu-item index="/after-sale">


          <el-icon>
            <Service />
          </el-icon>


          <span>售后审核</span>


        </el-menu-item>





        <el-menu-item index="/statistics">


          <el-icon>
            <DataAnalysis />
          </el-icon>


          <span>营收统计</span>


        </el-menu-item>



      </el-menu>


    </el-aside>






    <!-- 右侧内容 -->


    <el-container>


      <!-- 顶部 -->

      <el-header class="header">


        <span>

          电商平台商家中心

        </span>


      </el-header>






      <!-- 页面显示区域 -->


      <el-main class="content">


        <router-view />


      </el-main>



    </el-container>



  </div>


</template>






<script setup>


import {

  Goods,

  List,

  Service,

  DataAnalysis


} from "@element-plus/icons-vue"



</script>







<style scoped>


.layout {


  display:flex;

  width:100%;

  height:100vh;

  background:#f5f5f5;


}





.sidebar {


  background:#ffffff;

  border-right:1px solid #ddd;


}





.logo {


  height:60px;

  display:flex;

  align-items:center;

  justify-content:center;

  font-size:20px;

  font-weight:bold;

  border-bottom:1px solid #eee;


}







.el-menu {


  border-right:none;


}







.header {


  height:60px;

  display:flex;

  align-items:center;

  padding-left:20px;

  background:#ffffff;

  border-bottom:1px solid #ddd;

  font-size:18px;

  font-weight:bold;


}







.content {


  padding:20px;

  overflow:auto;


}



</style>
