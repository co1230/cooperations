<template>


<div class="statistics-page">


<el-card>


<template #header>


<div class="header">


<span>
商家营收统计
</span>


<el-button

type="primary"

@click="loadStatistics"

>

刷新

</el-button>


</div>


</template>





<!-- 数据卡片 -->


<div class="card-container">



<el-card class="stat-card">


<div class="title">

总销售额

</div>


<div class="number">

¥ {{ statistics.total_income }}

</div>


</el-card>





<el-card class="stat-card">


<div class="title">

已完成订单金额

</div>


<div class="number">

¥ {{ statistics.completed_income }}

</div>


</el-card>





<el-card class="stat-card">


<div class="title">

订单总数量

</div>


<div class="number">

{{ statistics.order_count }}

</div>


</el-card>





<el-card class="stat-card">


<div class="title">

今日收入

</div>


<div class="number">

¥ {{ statistics.today_income }}

</div>


</el-card>



</div>







<!-- 月收入趋势 -->


<el-divider>


月收入趋势

</el-divider>





<el-table

:data="statistics.monthly_income"

border

>


<el-table-column

prop="month"

label="月份"

/>



<el-table-column

prop="amount"

label="收入金额"

/>



</el-table>





</el-card>


</div>


</template>







<script setup>


import {

ref,

onMounted

}

from "vue"



import {

getStatistics

}

from "../api/statistics"





const statistics = ref({


    total_income:0,


    completed_income:0,


    order_count:0,


    completed_order_count:0,


    today_income:0,


    monthly_income:[]


})







async function loadStatistics(){


    const res = await getStatistics()



    statistics.value =

    res.data.data



}







onMounted(()=>{


    loadStatistics()


})



</script>







<style scoped>


.statistics-page{


    padding:20px;


}





.header{


    display:flex;


    justify-content:space-between;


    align-items:center;


}






.card-container{


    display:flex;


    gap:20px;


    flex-wrap:wrap;


    margin-bottom:30px;


}





.stat-card{


    width:220px;


}





.title{


    color:#666;


    margin-bottom:15px;


}




.number{


    font-size:26px;


    font-weight:bold;


}




</style>
