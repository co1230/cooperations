<template>

<div class="product-page">

<el-card>


<template #header>

<div class="header">

<span>商品管理</span>


<el-button
type="primary"
@click="openAddDialog"
>
新增商品
</el-button>


</div>

</template>



<!-- 搜索 -->

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




<!-- 商品表格 -->

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
prop="category_id"
label="分类ID"
/>



<el-table-column
prop="brand_id"
label="品牌ID"
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
width="220"
>


<template #default="scope">


<el-button
size="small"
@click="openEditDialog(scope.row)"
>
编辑
</el-button>



<el-button
size="small"
type="danger"
@click="removeProduct(scope.row.id)"
>
删除
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

@current-change="loadProducts"

/>


</div>


</el-card>





<!-- 新增/编辑弹窗 -->


<el-dialog

v-model="dialogVisible"

:title="dialogTitle"

width="500px"

>


<el-form :model="form">



<el-form-item label="分类ID">

<el-input-number
v-model="form.category_id"
/>

</el-form-item>




<el-form-item label="品牌ID">

<el-input-number
v-model="form.brand_id"
/>

</el-form-item>





<el-form-item label="商品名称">

<el-input
v-model="form.name"
/>

</el-form-item>




<el-form-item label="商品描述">

<el-input

v-model="form.description"

type="textarea"

/>

</el-form-item>





<el-form-item label="价格">

<el-input-number

v-model="form.price"

:min="0"

/>

</el-form-item>





<el-form-item label="库存">

<el-input-number

v-model="form.stock"

:min="0"

/>

</el-form-item>





<el-form-item label="图片URL">

<el-input

v-model="form.image"

/>

</el-form-item>





<el-form-item label="状态">


<el-select
v-model="form.status"
>


<el-option
label="上架"
:value="1"
/>


<el-option
label="下架"
:value="0"
/>


</el-select>


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

@click="submitForm"

>
确定
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

getProductList,

createProduct,

updateProduct,

deleteProduct

}

from "../api/product"



import {

ElMessage,

ElMessageBox

}

from "element-plus"





// 商品列表

const productList = ref([])



// 搜索关键词

const keyword = ref("")



// 分页

const page = ref(1)

const pageSize = ref(10)

const total = ref(0)





// 弹窗

const dialogVisible = ref(false)

const dialogTitle = ref("新增商品")





// 表单

const form = ref({

id:null,

category_id:1,

brand_id:1,

name:"",

description:"",

price:0,

stock:0,

image:"",

status:1

})





// 加载商品列表

async function loadProducts(){


const res = await getProductList({

keyword:keyword.value,

page:page.value,

page_size:pageSize.value

})



productList.value =

res.data.data.list || []



total.value =

res.data.data.total || 0


}






// 打开新增弹窗

function openAddDialog(){


dialogTitle.value="新增商品"



form.value={

id:null,

category_id:1,

brand_id:1,

name:"",

description:"",

price:0,

stock:0,

image:"",

status:1

}



dialogVisible.value=true


}






// 编辑商品

function openEditDialog(row){


dialogTitle.value="编辑商品"



form.value={

...row

}



dialogVisible.value=true


}







// 提交表单

async function submitForm(){


try{


if(form.value.id){


await updateProduct(

form.value.id,

form.value

)


ElMessage.success(
"修改成功"
)


}else{


await createProduct(

form.value

)


ElMessage.success(
"新增成功"
)


}



dialogVisible.value=false


loadProducts()



}catch(error){


ElMessage.error(
"操作失败"
)


}


}






// 删除商品

async function removeProduct(id){


try{


await ElMessageBox.confirm(

"确定删除该商品吗？",

"提示",

{

type:"warning"

}

)



await deleteProduct(id)



ElMessage.success(

"删除成功"

)



loadProducts()



}catch(error){



}

}






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
