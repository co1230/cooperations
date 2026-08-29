<template>

<div class="order-page">


<el-card>


<template #header>

<div class="header">

<span>订单管理</span>

</div>

</template>



<!-- 搜索 -->

<div class="search-area">


<el-input

v-model="keyword"

placeholder="请输入订单号"

style="width:220px"

/>


<el-button

type="primary"

@click="loadOrders"

>

搜索

</el-button>


</div>





<!-- 订单表格 -->

<el-table

:data="orderList"

border

>


<el-table-column

prop="id"

label="ID"

width="80"

/>



<el-table-column

prop="order_no"

label="订单号"

/>



<el-table-column

prop="product_name"

label="商品名称"

/>



<el-table-column

prop="total_amount"

label="订单金额"

/>



<el-table-column

prop="status"

label="订单状态"

>


<template #default="scope">


<el-tag

v-if="scope.row.status==='PAID'"

type="warning"

>

待发货

</el-tag>



<el-tag

v-else-if="scope.row.status==='SHIPPED'"

type="success"

>

已发货

</el-tag>



<el-tag

v-else-if="scope.row.status==='COMPLETED'"

>

已完成

</el-tag>



<el-tag

v-else

type="info"

>

其他

</el-tag>


</template>


</el-table-column>





<el-table-column

prop="tracking_number"

label="物流单号"

/>





<el-table-column

label="操作"

width="150"

>


<template #default="scope">


<el-button

type="primary"

size="small"

v-if="scope.row.status==='PAID'"

@click="openShipDialog(scope.row)"

>

发货

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


@current-change="loadOrders"


/>


</div>



</el-card>






<!-- 发货弹窗 -->


<el-dialog


v-model="dialogVisible"


title="填写物流信息"


width="450px"


>



<el-form :model="shipForm">



<el-form-item label="物流公司">


<el-input

v-model="shipForm.company"

/>


</el-form-item>




<el-form-item label="物流单号">


<el-input

v-model="shipForm.number"

/>


</el-form-item>



</el-form>





<template #footer>


<el-button

@click="dialogVisible=false"

>

取消

</el-button>



<el-button

type="primary"

@click="submitShip"

>

确认发货

</el-button>



</template>



</el-dialog>



</div>


</template>





<script setup>


import {
ref,
onMounted
} from "vue"



import {
getOrderList,
shipOrder
}
from "../api/order"



import {
ElMessage
}
from "element-plus"





// ===============================
// 数据
// ===============================


const orderList = ref([])



const keyword = ref("")



const page = ref(1)



const pageSize = ref(10)



const total = ref(0)





// ===============================
// 发货弹窗
// ===============================


const dialogVisible = ref(false)



const currentOrderId = ref(null)



const shipForm = ref({

company:"",

number:""

})





// ===============================
// 获取订单列表
// ===============================


async function loadOrders(){


const res = await getOrderList({

keyword:keyword.value,

page:page.value,

page_size:pageSize.value

})



orderList.value =

res.data.data.list || []



total.value =

res.data.data.total || 0



}





// ===============================
// 打开发货窗口
// ===============================


function openShipDialog(row){


currentOrderId.value=row.id



shipForm.value={

company:"",

number:""

}



dialogVisible.value=true



}





// ===============================
// 提交发货
// ===============================


async function submitShip(){



await shipOrder(

currentOrderId.value,

{

express_company:
shipForm.value.company,


tracking_number:
shipForm.value.number


}

)



ElMessage.success(

"发货成功"

)



dialogVisible.value=false



loadOrders()



}







onMounted(()=>{


loadOrders()


})



</script>





<style scoped>


.order-page{

padding:20px;

}



.header{

display:flex;

justify-content:space-between;

align-items:center;

}



.search-area{

display:flex;

gap:10px;

margin-bottom:20px;

}



.pagination{

margin-top:20px;

display:flex;

justify-content:center;

}



</style>
