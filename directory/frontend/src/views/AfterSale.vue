<template>


<div class="after-sale-page">


<el-card>


<template #header>


<div class="header">


<span>
售后审核
</span>


</div>


</template>




<!-- 状态筛选 -->


<div class="search-area">


<el-select

v-model="status"

placeholder="请选择状态"

clearable

style="width:200px"

@change="loadAfterSale"

>


<el-option

label="待审核"

value="APPLIED"

/>


<el-option

label="同意退款"

value="APPROVED"

/>


<el-option

label="拒绝退款"

value="REJECTED"

/>


</el-select>



</div>





<!-- 表格 -->


<el-table

:data="list"

border

>



<el-table-column

prop="id"

label="ID"

width="80"

/>



<el-table-column

prop="after_sale_no"

label="售后编号"

/>



<el-table-column

prop="order_id"

label="订单ID"

/>



<el-table-column

prop="type"

label="类型"

/>



<el-table-column

prop="reason"

label="原因"

/>




<el-table-column

label="状态"

>


<template #default="scope">


<el-tag

v-if="scope.row.status==='APPLIED'"

type="warning"

>
待审核
</el-tag>



<el-tag

v-if="scope.row.status==='APPROVED'"

type="success"

>
同意退款
</el-tag>



<el-tag

v-if="scope.row.status==='REJECTED'"

type="danger"

>
拒绝退款
</el-tag>



</template>


</el-table-column>





<el-table-column

label="操作"

width="220"

>


<template #default="scope">


<el-button

v-if="scope.row.status==='APPLIED'"

type="success"

size="small"

@click="audit(scope.row,'APPROVED')"

>

同意退款

</el-button>



<el-button

v-if="scope.row.status==='APPLIED'"

type="danger"

size="small"

@click="audit(scope.row,'REJECTED')"

>

拒绝

</el-button>



</template>


</el-table-column>




</el-table>





<!-- 分页 -->


<div class="pagination">


<el-pagination

background

layout="prev, pager, next"

:total="total"

:page-size="pageSize"

v-model:current-page="page"

@current-change="loadAfterSale"

/>


</div>




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

getAfterSaleList,

auditAfterSale

}

from "../api/after_sale"



import {

ElMessage,

ElMessageBox

}

from "element-plus"







// 数据列表

const list = ref([])



// 分页

const page = ref(1)

const pageSize = ref(10)

const total = ref(0)




// 状态筛选

const status = ref(null)







// 获取列表


async function loadAfterSale(){



const res = await getAfterSaleList({


    page:page.value,


    page_size:pageSize.value,


    status:status.value


})




list.value =

res.data.data.list || []




total.value =

res.data.data.total || 0



}








// 审核


async function audit(row,resultStatus){



let text = ""


if(resultStatus==='APPROVED'){

    text="确定同意退款吗？"

}else{

    text="确定拒绝退款吗？"

}




await ElMessageBox.confirm(

    text,

    "提示",

    {

        type:"warning"

    }

)





await auditAfterSale(

    row.id,

    {

        status:resultStatus,

        result:

        resultStatus==='APPROVED'

        ?

        "商家同意退款"

        :

        "商家拒绝退款"

    }

)





ElMessage.success(

    "审核完成"

)




loadAfterSale()



}







onMounted(()=>{


    loadAfterSale()


})



</script>








<style scoped>


.after-sale-page{

    padding:20px;

}



.header{

    display:flex;

    justify-content:space-between;

}



.search-area{

    margin-bottom:20px;

}



.pagination{

    margin-top:20px;

    display:flex;

    justify-content:center;

}


</style>
