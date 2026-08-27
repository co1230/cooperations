/* =========================================================
 * 青岚商城 · 商家后台
 * 成员 D - Merchant Management
 *
 * 当前版本：
 * 1. 使用 localStorage 模拟数据库
 * 2. 商家只能看到自己的商品和订单
 * 3. 支持商品上下架、库存管理
 * 4. 支持订单发货、填写物流
 * 5. 支持售后审核
 * 6. 支持经营数据统计
 *
 * 后续接 PHP + MySQL 时：
 * 主要将 localStorage 数据操作替换为 fetch API。
 * ========================================================= */


/* =========================================================
 * 一、基础数据
 * ========================================================= */

const MERCHANT_STORAGE = {
    PRODUCTS: 'ecom_products',
    ORDERS: 'ecom_orders',
    AFTER_SALES: 'ecom_after_sales'
};


/* =========================================================
 * 二、演示数据
 * ========================================================= */

/*
 * A 当前演示账号：
 *
 * merchant@demo.com
 * id = 2
 *
 * 所以这里 merchantId = 2 的数据属于当前演示商家。
 */

const seedMerchantProducts = [
    {
        id: 101,
        merchantId: 2,
        name: '轻氧保温杯',
        sku: 'QY-B001',
        description: '316不锈钢 · 450ml',
        price: 129,
        stock: 50,
        status: 'ON_SALE',
        createdAt: '2026-08-20'
    },
    {
        id: 102,
        merchantId: 2,
        name: '原木桌面收纳架',
        sku: 'QY-H002',
        description: '北美黑胡桃 · 手工打磨',
        price: 119,
        stock: 12,
        status: 'ON_SALE',
        createdAt: '2026-08-18'
    },
    {
        id: 103,
        merchantId: 2,
        name: '亚麻午睡毯',
        sku: 'QY-T003',
        description: '亲肤透气 · 四季可用',
        price: 169,
        stock: 0,
        status: 'OFF_SALE',
        createdAt: '2026-08-15'
    },
    {
        id: 104,
        merchantId: 2,
        name: '手冲咖啡分享壶',
        sku: 'QY-C004',
        description: '耐热玻璃 · 600ml',
        price: 128,
        stock: 36,
        status: 'ON_SALE',
        createdAt: '2026-08-12'
    },
    {
        id: 105,
        merchantId: 2,
        name: '月影氛围台灯',
        sku: 'QY-L005',
        description: '三档暖光 · 无级调节',
        price: 219,
        stock: 8,
        status: 'ON_SALE',
        createdAt: '2026-08-10'
    }
];


const seedMerchantOrders = [
    {
        id: 201,
        orderNo: 'Q20260826001',
        merchantId: 2,
        buyerName: '林小满',
        receiverName: '林小满',
        receiverPhone: '138****8888',
        receiverAddress: '北京市朝阳区示例路 88 号',
        productName: '轻氧保温杯',
        quantity: 1,
        totalAmount: 129,
        orderStatus: 'PAID',
        afterSaleStatus: 'NONE',
        logisticsCompany: '',
        trackingNumber: '',
        createdAt: '2026-08-26 10:30:00',
        paidAt: '2026-08-26 10:35:00',
        shippedAt: null
    },
    {
        id: 202,
        orderNo: 'Q20260825088',
        merchantId: 2,
        buyerName: '陈先生',
        receiverName: '陈先生',
        receiverPhone: '139****6666',
        receiverAddress: '上海市浦东新区示例街 18 号',
        productName: '原木桌面收纳架',
        quantity: 2,
        totalAmount: 238,
        orderStatus: 'SHIPPED',
        afterSaleStatus: 'APPLIED',
        logisticsCompany: '顺丰速运',
        trackingNumber: 'SF20260825001',
        createdAt: '2026-08-25 09:20:00',
        paidAt: '2026-08-25 09:30:00',
        shippedAt: '2026-08-25 14:20:00'
    },
    {
        id: 203,
        orderNo: 'Q20260824036',
        merchantId: 2,
        buyerName: '周女士',
        receiverName: '周女士',
        receiverPhone: '137****5555',
        receiverAddress: '杭州市西湖区示例路 6 号',
        productName: '亚麻午睡毯',
        quantity: 1,
        totalAmount: 169,
        orderStatus: 'PENDING_PAYMENT',
        afterSaleStatus: 'NONE',
        logisticsCompany: '',
        trackingNumber: '',
        createdAt: '2026-08-24 15:40:00',
        paidAt: null,
        shippedAt: null
    },
    {
        id: 204,
        orderNo: 'Q20260822019',
        merchantId: 2,
        buyerName: '王先生',
        receiverName: '王先生',
        receiverPhone: '136****3333',
        receiverAddress: '广州市天河区示例路 12 号',
        productName: '手冲咖啡分享壶',
        quantity: 1,
        totalAmount: 128,
        orderStatus: 'COMPLETED',
        afterSaleStatus: 'REFUNDED',
        logisticsCompany: '中通快递',
        trackingNumber: 'ZT20260822088',
        createdAt: '2026-08-22 11:00:00',
        paidAt: '2026-08-22 11:10:00',
        shippedAt: '2026-08-22 15:00:00'
    },
    {
        id: 205,
        orderNo: 'Q20260821015',
        merchantId: 2,
        buyerName: '赵女士',
        receiverName: '赵女士',
        receiverPhone: '135****2222',
        receiverAddress: '南京市鼓楼区示例路 20 号',
        productName: '月影氛围台灯',
        quantity: 1,
        totalAmount: 219,
        orderStatus: 'PAID',
        afterSaleStatus: 'NONE',
        logisticsCompany: '',
        trackingNumber: '',
        createdAt: '2026-08-21 16:20:00',
        paidAt: '2026-08-21 16:25:00',
        shippedAt: null
    }
];


const seedMerchantAfterSales = [
    {
        id: 301,
        ticketNo: 'AS20260825001',
        orderId: 202,
        orderNo: 'Q20260825088',
        merchantId: 2,
        buyerName: '陈先生',
        productName: '原木桌面收纳架',
        type: 'REFUND_ONLY',
        status: 'APPLIED',
        reason: '商品存在瑕疵',
        description: '收到商品后发现桌角有明显划痕。',
        requestedAmount: 238,
        merchantReply: '',
        createdAt: '2026-08-26 09:10:00'
    }
];


/* =========================================================
 * 三、localStorage 工具
 * ========================================================= */

function merchantGetData(key, seed) {

    const saved = localStorage.getItem(key);

    if (saved) {
        try {
            return JSON.parse(saved);
        } catch (error) {
            console.warn('商家数据解析失败：', error);
        }
    }

    localStorage.setItem(key, JSON.stringify(seed));

    return JSON.parse(JSON.stringify(seed));
}


function merchantSaveData(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}


function getMerchantProducts() {
    return merchantGetData(
        MERCHANT_STORAGE.PRODUCTS,
        seedMerchantProducts
    );
}


function getMerchantOrders() {
    return merchantGetData(
        MERCHANT_STORAGE.ORDERS,
        seedMerchantOrders
    );
}


function getMerchantAfterSales() {
    return merchantGetData(
        MERCHANT_STORAGE.AFTER_SALES,
        seedMerchantAfterSales
    );
}


/* =========================================================
 * 四、工具函数
 * ========================================================= */

function merchantMoney(value) {
    return `¥ ${Number(value || 0).toFixed(2)}`;
}


function merchantStatusText(status) {

    const map = {
        DRAFT: '草稿',
        ON_SALE: '在售',
        OFF_SALE: '已下架',

        PENDING_PAYMENT: '待付款',
        PAID: '待发货',
        SHIPPED: '已发货',
        COMPLETED: '已完成',
        CANCELLED: '已取消',
        CLOSED: '已关闭',

        NONE: '无售后',
        APPLIED: '待审核',
        PROCESSING: '处理中',
        APPROVED: '已同意',
        REJECTED: '已拒绝',
        REFUNDING: '退款中',
        REFUNDED: '已退款',
        BUYER_SHIPPED: '买家已寄回',

        REFUND_ONLY: '仅退款',
        RETURN_REFUND: '退货退款',
        EXCHANGE: '换货'
    };

    return map[status] || status;
}


function merchantBadge(status) {

    let type = 'green';

    if (
        status === 'PENDING_PAYMENT' ||
        status === 'APPLIED' ||
        status === 'PROCESSING'
    ) {
        type = 'orange';
    }

    if (
        status === 'REJECTED' ||
        status === 'CANCELLED' ||
        status === 'CLOSED'
    ) {
        type = 'red';
    }

    return `<span class="badge ${type}">
        ${merchantStatusText(status)}
    </span>`;
}


function merchantFormatDate(date) {

    if (!date) return '-';

    return String(date).replace('T', ' ').slice(0, 16);
}


/* =========================================================
 * 五、商家后台入口
 * ========================================================= */

function merchantDashboard(user) {

    renderMerchantShell(
        user,
        'overview'
    );
}


/* =========================================================
 * 六、商家后台统一框架
 * ========================================================= */

function renderMerchantShell(user, page = 'overview') {

    if (!user || user.role !== 'MERCHANT') {
        return;
    }

    const products = getMerchantProducts()
        .filter(item => item.merchantId === user.id);

    const orders = getMerchantOrders()
        .filter(item => item.merchantId === user.id);

    const afterSales = getMerchantAfterSales()
        .filter(item => item.merchantId === user.id);

    const content = getMerchantPageContent(
        user,
        page,
        products,
        orders,
        afterSales
    );

    app.innerHTML = `
        <div class="shell merchant-shell">

            <aside class="side">

                <div class="logo">
                    QINGLAN
                </div>

                <div class="role-tag">
                    商家
                </div>

                <nav class="nav merchant-nav">

                    <button
                        class="${page === 'overview' ? 'active' : ''}"
                        data-page="overview"
                        data-icon="⌂"
                    >
                        经营概览
                    </button>

                    <button
                        class="${page === 'products' ? 'active' : ''}"
                        data-page="products"
                        data-icon="▦"
                    >
                        商品管理
                    </button>

                    <button
                        class="${page === 'orders' ? 'active' : ''}"
                        data-page="orders"
                        data-icon="◎"
                    >
                        订单管理
                    </button>

                    <button
                        class="${page === 'afterSales' ? 'active' : ''}"
                        data-page="afterSales"
                        data-icon="◇"
                    >
                        售后管理
                    </button>

                    <button
                        class="${page === 'settings' ? 'active' : ''}"
                        data-page="settings"
                        data-icon="⚙"
                    >
                        店铺设置
                    </button>

                    <button
                        class="logout"
                        id="merchantLogout"
                        data-icon="↪"
                    >
                        退出登录
                    </button>

                </nav>

            </aside>


            <main class="main">

                <header class="top">

                    <div>
                        <h2>
                            ${content.title}
                        </h2>

                        <p>
                            ${content.subtitle}
                        </p>
                    </div>

                    <div class="avatar">
                        ${(user.name || '商').slice(0, 1)}
                    </div>

                </header>

                ${content.html}

            </main>

        </div>
    `;


    /* -------------------------
     * 左侧菜单
     * ------------------------- */

    document
        .querySelectorAll('.merchant-nav button[data-page]')
        .forEach(button => {

            button.onclick = () => {

                const targetPage = button.dataset.page;

                renderMerchantShell(
                    user,
                    targetPage
                );

            };

        });


    /* -------------------------
     * 退出
     * ------------------------- */

    const logoutButton =
        document.querySelector('#merchantLogout');

    if (logoutButton) {

        logoutButton.onclick = () => {

            sessionStorage.removeItem(
                'ecom_session'
            );

            if (typeof authView === 'function') {
                authView();
            }
        };
    }


    /* -------------------------
     * 页面业务事件
     * ------------------------- */

    bindMerchantPageEvents(
        user,
        page
    );
}


/* =========================================================
 * 七、根据页面返回内容
 * ========================================================= */

function getMerchantPageContent(
    user,
    page,
    products,
    orders,
    afterSales
) {

    switch (page) {

        case 'products':

            return {
                title: '商品管理',
                subtitle: '管理商品信息、库存以及上下架状态',
                html: renderMerchantProducts(products)
            };


        case 'orders':

            return {
                title: '订单管理',
                subtitle: '及时处理订单并完成发货',
                html: renderMerchantOrders(orders)
            };


        case 'afterSales':

            return {
                title: '售后管理',
                subtitle: '审核买家的退款、退货及换货申请',
                html: renderMerchantAfterSales(afterSales)
            };


        case 'settings':

            return {
                title: '店铺设置',
                subtitle: '管理你的店铺基本信息',
                html: renderMerchantSettings(user)
            };


        case 'overview':
        default:

            return {
                title: '商家工作台',
                subtitle: '今天也要认真经营，及时处理每一笔订单',
                html: renderMerchantOverview(
                    products,
                    orders,
                    afterSales
                )
            };
    }
}


/* =========================================================
 * 八、经营概览
 * ========================================================= */

function renderMerchantOverview(
    products,
    orders,
    afterSales
) {

    const salesOrders = orders.filter(order =>
        ['PAID', 'SHIPPED', 'COMPLETED'].includes(
            order.orderStatus
        )
    );

    const totalSales = salesOrders.reduce(
        (sum, order) =>
            sum + Number(order.totalAmount || 0),
        0
    );

    const pendingShipment = orders.filter(
        order => order.orderStatus === 'PAID'
    ).length;

    const onSaleProducts = products.filter(
        product => product.status === 'ON_SALE'
    ).length;

    const pendingAfterSales = afterSales.filter(
        item =>
            item.status === 'APPLIED' ||
            item.status === 'PROCESSING'
    ).length;


    const recentOrders = [...orders]
        .sort((a, b) =>
            String(b.createdAt)
                .localeCompare(String(a.createdAt))
        )
        .slice(0, 5);


    return `

        <section class="stats">

            <article class="stat">
                <span>累计销售额</span>
                <strong>${merchantMoney(totalSales)}</strong>
            </article>

            <article class="stat">
                <span>待发货</span>
                <strong>${pendingShipment}</strong>
            </article>

            <article class="stat">
                <span>在售商品</span>
                <strong>${onSaleProducts}</strong>
            </article>

            <article class="stat">
                <span>售后待处理</span>
                <strong>${pendingAfterSales}</strong>
            </article>

        </section>


        <section class="panel">

            <div class="panel-head">

                <h3>
                    近期订单
                </h3>

                <span class="badge green">
                    实时概览
                </span>

            </div>


            <div class="table-wrap">

                <table>

                    <thead>

                        <tr>
                            <th>订单编号</th>
                            <th>商品</th>
                            <th>买家</th>
                            <th>金额</th>
                            <th>订单状态</th>
                            <th>售后状态</th>
                        </tr>

                    </thead>

                    <tbody>

                        ${
                            recentOrders.length
                                ? recentOrders.map(order => `

                                    <tr>

                                        <td>
                                            ${order.orderNo}
                                        </td>

                                        <td>
                                            ${order.productName}
                                            × ${order.quantity}
                                        </td>

                                        <td>
                                            ${order.buyerName}
                                        </td>

                                        <td>
                                            ${merchantMoney(order.totalAmount)}
                                        </td>

                                        <td>
                                            ${merchantBadge(order.orderStatus)}
                                        </td>

                                        <td>
                                            ${merchantBadge(order.afterSaleStatus)}
                                        </td>

                                    </tr>

                                `).join('')
                                :
                                `
                                    <tr>
                                        <td colspan="6">
                                            <div class="empty">
                                                暂无订单
                                            </div>
                                        </td>
                                    </tr>
                                `
                        }

                    </tbody>

                </table>

            </div>

        </section>


        <section class="panel">

            <div class="panel-head">

                <h3>
                    商家经营数据
                </h3>

            </div>

            <div class="merchant-summary-grid">

                <div>
                    <span>订单总数</span>
                    <strong>${orders.length}</strong>
                </div>

                <div>
                    <span>已完成订单</span>
                    <strong>
                        ${
                            orders.filter(
                                x => x.orderStatus === 'COMPLETED'
                            ).length
                        }
                    </strong>
                </div>

                <div>
                    <span>库存商品数</span>
                    <strong>
                        ${
                            products.reduce(
                                (sum, x) =>
                                    sum + Number(x.stock || 0),
                                0
                            )
                        }
                    </strong>
                </div>

                <div>
                    <span>售后工单</span>
                    <strong>${afterSales.length}</strong>
                </div>

            </div>

        </section>
    `;
}


/* =========================================================
 * 九、商品管理
 * ========================================================= */

function renderMerchantProducts(products) {

    return `

        <section class="panel">

            <div class="panel-head">

                <h3>
                    商品列表
                </h3>

                <button
                    class="btn btn-primary merchant-add-product"
                    id="addMerchantProduct"
                    style="width:auto;margin-top:0"
                >
                    + 新增商品
                </button>

            </div>


            <div class="merchant-toolbar">

                <input
                    id="productSearch"
                    class="input"
                    placeholder="搜索商品名称或 SKU"
                >

                <select
                    id="productStatusFilter"
                    class="input"
                >
                    <option value="ALL">
                        全部状态
                    </option>

                    <option value="ON_SALE">
                        在售
                    </option>

                    <option value="OFF_SALE">
                        已下架
                    </option>

                    <option value="DRAFT">
                        草稿
                    </option>
                </select>

            </div>


            <div class="table-wrap">

                <table>

                    <thead>

                        <tr>
                            <th>商品</th>
                            <th>SKU</th>
                            <th>价格</th>
                            <th>库存</th>
                            <th>状态</th>
                            <th>操作</th>
                        </tr>

                    </thead>


                    <tbody id="merchantProductTable">

                        ${
                            products.length
                                ? products.map(
                                    renderMerchantProductRow
                                ).join('')
                                :
                                `
                                    <tr>
                                        <td colspan="6">
                                            <div class="empty">
                                                暂无商品
                                            </div>
                                        </td>
                                    </tr>
                                `
                        }

                    </tbody>

                </table>

            </div>

        </section>
    `;
}


function renderMerchantProductRow(product) {

    return `

        <tr>

            <td>

                <strong>
                    ${product.name}
                </strong>

                <div class="merchant-subtext">
                    ${product.description || ''}
                </div>

            </td>

            <td>
                ${product.sku}
            </td>

            <td>
                ${merchantMoney(product.price)}
            </td>

            <td>

                <span
                    class="${product.stock <= 5 ? 'stock-warning' : ''}"
                >
                    ${product.stock}
                </span>

            </td>

            <td>
                ${merchantBadge(product.status)}
            </td>

            <td>

                <div class="merchant-actions">

                    <button
                        class="merchant-btn"
                        data-action="edit-product"
                        data-id="${product.id}"
                    >
                        编辑
                    </button>

                    <button
                        class="merchant-btn"
                        data-action="stock-product"
                        data-id="${product.id}"
                    >
                        库存
                    </button>

                    ${
                        product.status === 'ON_SALE'
                            ?
                            `
                                <button
                                    class="merchant-btn danger"
                                    data-action="off-sale"
                                    data-id="${product.id}"
                                >
                                    下架
                                </button>
                            `
                            :
                            `
                                <button
                                    class="merchant-btn success"
                                    data-action="on-sale"
                                    data-id="${product.id}"
                                >
                                    上架
                                </button>
                            `
                    }

                </div>

            </td>

        </tr>
    `;
}


/* =========================================================
 * 十、订单管理
 * ========================================================= */

function renderMerchantOrders(orders) {

    return `

        <section class="panel">

            <div class="panel-head">

                <h3>
                    商家订单
                </h3>

                <span class="badge green">
                    ${orders.length} 个订单
                </span>

            </div>


            <div class="merchant-toolbar">

                <select
                    id="orderStatusFilter"
                    class="input"
                >

                    <option value="ALL">
                        全部订单
                    </option>

                    <option value="PENDING_PAYMENT">
                        待付款
                    </option>

                    <option value="PAID">
                        待发货
                    </option>

                    <option value="SHIPPED">
                        已发货
                    </option>

                    <option value="COMPLETED">
                        已完成
                    </option>

                    <option value="CANCELLED">
                        已取消
                    </option>

                </select>

            </div>


            <div class="table-wrap">

                <table>

                    <thead>

                        <tr>
                            <th>订单编号</th>
                            <th>商品</th>
                            <th>买家</th>
                            <th>金额</th>
                            <th>下单时间</th>
                            <th>订单状态</th>
                            <th>操作</th>
                        </tr>

                    </thead>


                    <tbody id="merchantOrderTable">

                        ${orders
                            .map(renderMerchantOrderRow)
                            .join('')}

                    </tbody>

                </table>

            </div>

        </section>
    `;
}


function renderMerchantOrderRow(order) {

    return `

        <tr>

            <td>
                <strong>
                    ${order.orderNo}
                </strong>
            </td>

            <td>
                ${order.productName}
                × ${order.quantity}
            </td>

            <td>
                ${order.buyerName}
            </td>

            <td>
                ${merchantMoney(order.totalAmount)}
            </td>

            <td>
                ${merchantFormatDate(order.createdAt)}
            </td>

            <td>
                ${merchantBadge(order.orderStatus)}
            </td>

            <td>

                <div class="merchant-actions">

                    <button
                        class="merchant-btn"
                        data-action="view-order"
                        data-id="${order.id}"
                    >
                        详情
                    </button>

                    ${
                        order.orderStatus === 'PAID'
                            ?
                            `
                                <button
                                    class="merchant-btn success"
                                    data-action="ship-order"
                                    data-id="${order.id}"
                                >
                                    发货
                                </button>
                            `
                            :
                            ''
                    }

                </div>

            </td>

        </tr>
    `;
}


/* =========================================================
 * 十一、订单详情
 * ========================================================= */

function showMerchantOrderDetail(order) {

    const modal = document.createElement('div');

    modal.className = 'merchant-modal';

    modal.innerHTML = `

        <div class="merchant-modal-card">

            <div class="merchant-modal-header">

                <h3>
                    订单详情
                </h3>

                <button
                    class="merchant-modal-close"
                >
                    ×
                </button>

            </div>


            <div class="merchant-detail-grid">

                <div>
                    <span>订单编号</span>
                    <strong>${order.orderNo}</strong>
                </div>

                <div>
                    <span>订单状态</span>
                    <strong>
                        ${merchantStatusText(order.orderStatus)}
                    </strong>
                </div>

                <div>
                    <span>买家</span>
                    <strong>${order.buyerName}</strong>
                </div>

                <div>
                    <span>商品</span>
                    <strong>
                        ${order.productName} × ${order.quantity}
                    </strong>
                </div>

                <div>
                    <span>订单金额</span>
                    <strong>
                        ${merchantMoney(order.totalAmount)}
                    </strong>
                </div>

                <div>
                    <span>下单时间</span>
                    <strong>
                        ${merchantFormatDate(order.createdAt)}
                    </strong>
                </div>

            </div>


            <div class="merchant-detail-section">

                <h4>
                    收货信息
                </h4>

                <p>
                    ${order.receiverName}
                    ·
                    ${order.receiverPhone}
                </p>

                <p>
                    ${order.receiverAddress}
                </p>

            </div>


            <div class="merchant-detail-section">

                <h4>
                    物流信息
                </h4>

                ${
                    order.logisticsCompany
                        ?
                        `
                            <p>
                                ${order.logisticsCompany}
                                ·
                                ${order.trackingNumber}
                            </p>
                        `
                        :
                        `
                            <p class="merchant-subtext">
                                暂未发货
                            </p>
                        `
                }

            </div>

        </div>
    `;


    document.body.appendChild(modal);


    modal.querySelector(
        '.merchant-modal-close'
    ).onclick = () => {
        modal.remove();
    };


    modal.onclick = event => {

        if (event.target === modal) {
            modal.remove();
        }

    };
}


/* =========================================================
 * 十二、发货
 * ========================================================= */

function showMerchantShipModal(order) {

    const modal = document.createElement('div');

    modal.className = 'merchant-modal';

    modal.innerHTML = `

        <div class="merchant-modal-card">

            <div class="merchant-modal-header">

                <h3>
                    订单发货
                </h3>

                <button
                    class="merchant-modal-close"
                >
                    ×
                </button>

            </div>


            <p>
                订单：
                <strong>
                    ${order.orderNo}
                </strong>
            </p>

            <p>
                商品：
                ${order.productName}
                × ${order.quantity}
            </p>


            <label>
                物流公司
            </label>

            <select
                id="shipCompany"
                class="input"
            >

                <option value="">
                    请选择物流公司
                </option>

                <option value="顺丰速运">
                    顺丰速运
                </option>

                <option value="中通快递">
                    中通快递
                </option>

                <option value="圆通速递">
                    圆通速递
                </option>

                <option value="申通快递">
                    申通快递
                </option>

                <option value="韵达快递">
                    韵达快递
                </option>

                <option value="京东物流">
                    京东物流
                </option>

            </select>


            <label>
                物流单号
            </label>

            <input
                id="trackingNumber"
                class="input"
                placeholder="请输入物流单号"
            >


            <button
                id="confirmShip"
                class="btn btn-primary"
            >
                确认发货
            </button>

        </div>
    `;


    document.body.appendChild(modal);


    modal.querySelector(
        '.merchant-modal-close'
    ).onclick = () => {
        modal.remove();
    };


    modal.querySelector(
        '#confirmShip'
    ).onclick = () => {

        const company =
            modal.querySelector(
                '#shipCompany'
            ).value;

        const tracking =
            modal.querySelector(
                '#trackingNumber'
            ).value.trim();


        if (!company) {
            alert('请选择物流公司');
            return;
        }

        if (!tracking) {
            alert('请输入物流单号');
            return;
        }


        const orders = getMerchantOrders();

        const target = orders.find(
            item => item.id === order.id
        );

        if (!target) {
            alert('订单不存在');
            return;
        }


        target.orderStatus = 'SHIPPED';

        target.logisticsCompany = company;

        target.trackingNumber = tracking;

        target.shippedAt =
            new Date().toISOString();


        merchantSaveData(
            MERCHANT_STORAGE.ORDERS,
            orders
        );


        modal.remove();

        renderMerchantShell(
            getCurrentMerchant(),
            'orders'
        );

        alert('订单已发货');
    };
}


/* =========================================================
 * 十三、售后管理
 * ========================================================= */

function renderMerchantAfterSales(afterSales) {

    return `

        <section class="panel">

            <div class="panel-head">

                <h3>
                    售后工单
                </h3>

                <span class="badge green">
                    ${afterSales.length} 个工单
                </span>

            </div>


            <div class="table-wrap">

                <table>

                    <thead>

                        <tr>
                            <th>工单编号</th>
                            <th>订单编号</th>
                            <th>商品</th>
                            <th>买家</th>
                            <th>类型</th>
                            <th>申请金额</th>
                            <th>状态</th>
                            <th>操作</th>
                        </tr>

                    </thead>


                    <tbody>

                        ${
                            afterSales.length
                                ?
                                afterSales
                                    .map(
                                        renderMerchantAfterSaleRow
                                    )
                                    .join('')
                                :
                                `
                                    <tr>
                                        <td colspan="8">
                                            <div class="empty">
                                                暂无售后工单
                                            </div>
                                        </td>
                                    </tr>
                                `
                        }

                    </tbody>

                </table>

            </div>

        </section>
    `;
}


function renderMerchantAfterSaleRow(item) {

    return `

        <tr>

            <td>
                ${item.ticketNo}
            </td>

            <td>
                ${item.orderNo}
            </td>

            <td>
                ${item.productName}
            </td>

            <td>
                ${item.buyerName}
            </td>

            <td>
                ${merchantStatusText(item.type)}
            </td>

            <td>
                ${merchantMoney(item.requestedAmount)}
            </td>

            <td>
                ${merchantBadge(item.status)}
            </td>

            <td>

                <div class="merchant-actions">

                    <button
                        class="merchant-btn"
                        data-action="view-after-sale"
                        data-id="${item.id}"
                    >
                        查看
                    </button>

                    ${
                        item.status === 'APPLIED'
                            ?
                            `
                                <button
                                    class="merchant-btn success"
                                    data-action="approve-after-sale"
                                    data-id="${item.id}"
                                >
                                    同意
                                </button>

                                <button
                                    class="merchant-btn danger"
                                    data-action="reject-after-sale"
                                    data-id="${item.id}"
                                >
                                    拒绝
                                </button>
                            `
                            :
                            ''
                    }

                </div>

            </td>

        </tr>
    `;
}


/* =========================================================
 * 十四、售后详情
 * ========================================================= */

function showMerchantAfterSaleDetail(item) {

    const modal = document.createElement('div');

    modal.className = 'merchant-modal';

    modal.innerHTML = `

        <div class="merchant-modal-card">

            <div class="merchant-modal-header">

                <h3>
                    售后申请详情
                </h3>

                <button
                    class="merchant-modal-close"
                >
                    ×
                </button>

            </div>


            <div class="merchant-detail-grid">

                <div>
                    <span>售后单号</span>
                    <strong>
                        ${item.ticketNo}
                    </strong>
                </div>

                <div>
                    <span>订单编号</span>
                    <strong>
                        ${item.orderNo}
                    </strong>
                </div>

                <div>
                    <span>买家</span>
                    <strong>
                        ${item.buyerName}
                    </strong>
                </div>

                <div>
                    <span>售后类型</span>
                    <strong>
                        ${merchantStatusText(item.type)}
                    </strong>
                </div>

                <div>
                    <span>申请金额</span>
                    <strong>
                        ${merchantMoney(item.requestedAmount)}
                    </strong>
                </div>

                <div>
                    <span>当前状态</span>
                    <strong>
                        ${merchantStatusText(item.status)}
                    </strong>
                </div>

            </div>


            <div class="merchant-detail-section">

                <h4>
                    售后原因
                </h4>

                <p>
                    ${item.reason}
                </p>

            </div>


            <div class="merchant-detail-section">

                <h4>
                    问题描述
                </h4>

                <p>
                    ${item.description || '买家未填写详细描述'}
                </p>

            </div>


            ${
                item.status === 'APPLIED'
                    ?
                    `
                        <div class="merchant-detail-section">

                            <label>
                                商家回复
                            </label>

                            <textarea
                                id="merchantReply"
                                class="input merchant-textarea"
                                placeholder="请输入给买家的处理意见"
                            ></textarea>

                            <div class="merchant-actions merchant-after-actions">

                                <button
                                    class="merchant-btn success"
                                    id="approveAfterSale"
                                >
                                    同意售后
                                </button>

                                <button
                                    class="merchant-btn danger"
                                    id="rejectAfterSale"
                                >
                                    拒绝售后
                                </button>

                            </div>

                        </div>
                    `
                    :
                    ''
            }

        </div>
    `;


    document.body.appendChild(modal);


    modal.querySelector(
        '.merchant-modal-close'
    ).onclick = () => {
        modal.remove();
    };


    const approveButton =
        modal.querySelector(
            '#approveAfterSale'
        );

    const rejectButton =
        modal.querySelector(
            '#rejectAfterSale'
        );


    if (approveButton) {

        approveButton.onclick = () => {

            handleMerchantAfterSale(
                item.id,
                'APPROVED',
                modal
            );

        };

    }


    if (rejectButton) {

        rejectButton.onclick = () => {

            handleMerchantAfterSale(
                item.id,
                'REJECTED',
                modal
            );

        };

    }
}


/* =========================================================
 * 十五、处理售后
 * ========================================================= */

function handleMerchantAfterSale(
    id,
    status,
    modal
) {

    const replyInput =
        modal.querySelector(
            '#merchantReply'
        );

    const reply =
        replyInput
            ? replyInput.value.trim()
            : '';


    if (!reply) {

        alert(
            status === 'APPROVED'
                ? '请填写同意售后的处理意见'
                : '请填写拒绝售后的原因'
        );

        return;
    }


    const afterSales =
        getMerchantAfterSales();


    const target =
        afterSales.find(
            item => item.id === id
        );


    if (!target) {

        alert('售后工单不存在');

        return;
    }


    target.status = status;

    target.merchantReply = reply;

    target.updatedAt =
        new Date().toISOString();


    merchantSaveData(
        MERCHANT_STORAGE.AFTER_SALES,
        afterSales
    );


    /*
     * 同时更新对应订单的售后状态
     */

    const orders =
        getMerchantOrders();


    const order =
        orders.find(
            item => item.id === target.orderId
        );


    if (order) {

        order.afterSaleStatus =
            status === 'APPROVED'
                ? 'APPROVED'
                : 'REJECTED';

        merchantSaveData(
            MERCHANT_STORAGE.ORDERS,
            orders
        );
    }


    modal.remove();


    renderMerchantShell(
        getCurrentMerchant(),
        'afterSales'
    );


    alert(
        status === 'APPROVED'
            ? '已同意售后申请'
            : '已拒绝售后申请'
    );
}


/* =========================================================
 * 十六、店铺设置
 * ========================================================= */

function renderMerchantSettings(user) {

    const saved =
        JSON.parse(
            localStorage.getItem(
                `merchant_settings_${user.id}`
            ) || 'null'
        ) || {
            shopName: user.name || '山屿生活馆',
            phone: '',
            description: '认真挑选每一件日常好物。'
        };


    return `

        <section class="panel merchant-settings">

            <div class="panel-head">

                <h3>
                    店铺信息
                </h3>

            </div>


            <label>
                店铺名称
            </label>

            <input
                id="shopName"
                class="input"
                value="${saved.shopName}"
            >


            <label>
                联系电话
            </label>

            <input
                id="shopPhone"
                class="input"
                value="${saved.phone}"
                placeholder="请输入联系电话"
            >


            <label>
                店铺介绍
            </label>

            <textarea
                id="shopDescription"
                class="input merchant-textarea"
            >${saved.description}</textarea>


            <button
                id="saveMerchantSettings"
                class="btn btn-primary"
                style="width:auto"
            >
                保存设置
            </button>

        </section>
    `;
}


/* =========================================================
 * 十七、商品新增 / 编辑
 * ========================================================= */

function showMerchantProductModal(
    user,
    product = null
) {

    const isEdit = Boolean(product);

    const modal =
        document.createElement('div');

    modal.className =
        'merchant-modal';


    modal.innerHTML = `

        <div class="merchant-modal-card">

            <div class="merchant-modal-header">

                <h3>
                    ${isEdit ? '编辑商品' : '新增商品'}
                </h3>

                <button
                    class="merchant-modal-close"
                >
                    ×
                </button>

            </div>


            <label>
                商品名称
            </label>

            <input
                id="productName"
                class="input"
                value="${product?.name || ''}"
                placeholder="请输入商品名称"
            >


            <label>
                SKU
            </label>

            <input
                id="productSku"
                class="input"
                value="${product?.sku || ''}"
                placeholder="例如 QY-B006"
            >


            <label>
                商品描述
            </label>

            <input
                id="productDescription"
                class="input"
                value="${product?.description || ''}"
                placeholder="请输入商品描述"
            >


            <label>
                商品价格
            </label>

            <input
                id="productPrice"
                class="input"
                type="number"
                min="0"
                step="0.01"
                value="${product?.price ?? ''}"
                placeholder="0.00"
            >


            <label>
                商品库存
            </label>

            <input
                id="productStock"
                class="input"
                type="number"
                min="0"
                step="1"
                value="${product?.stock ?? 0}"
                placeholder="0"
            >


            <button
                id="saveMerchantProduct"
                class="btn btn-primary"
            >
                ${isEdit ? '保存修改' : '创建商品'}
            </button>

        </div>
    `;


    document.body.appendChild(modal);


    modal.querySelector(
        '.merchant-modal-close'
    ).onclick = () => {
        modal.remove();
    };


    modal.querySelector(
        '#saveMerchantProduct'
    ).onclick = () => {

        const name =
            modal.querySelector(
                '#productName'
            ).value.trim();

        const sku =
            modal.querySelector(
                '#productSku'
            ).value.trim();

        const description =
            modal.querySelector(
                '#productDescription'
            ).value.trim();

        const price =
            Number(
                modal.querySelector(
                    '#productPrice'
                ).value
            );

        const stock =
            Number(
                modal.querySelector(
                    '#productStock'
                ).value
            );


        if (!name) {
            alert('请输入商品名称');
            return;
        }

        if (!sku) {
            alert('请输入 SKU');
            return;
        }

        if (!Number.isFinite(price) || price < 0) {
            alert('请输入正确的商品价格');
            return;
        }

        if (!Number.isInteger(stock) || stock < 0) {
            alert('请输入正确的库存数量');
            return;
        }


        const products =
            getMerchantProducts();


        /*
         * SKU 不允许重复
         */

        const duplicate =
            products.some(
                item =>
                    item.sku === sku &&
                    item.id !== product?.id
            );


        if (duplicate) {

            alert(
                'SKU 已存在，请使用其他 SKU'
            );

            return;
        }


        if (isEdit) {

            const target =
                products.find(
                    item =>
                        item.id === product.id
                );


            if (!target) {
                alert('商品不存在');
                return;
            }


            target.name = name;
            target.sku = sku;
            target.description = description;
            target.price = price;
            target.stock = stock;

        } else {

            products.push({

                id: Date.now(),

                merchantId: user.id,

                name,

                sku,

                description,

                price,

                stock,

                status: 'DRAFT',

                createdAt:
                    new Date()
                        .toISOString()
                        .slice(0, 10)

            });

        }


        merchantSaveData(
            MERCHANT_STORAGE.PRODUCTS,
            products
        );


        modal.remove();


        renderMerchantShell(
            user,
            'products'
        );


        alert(
            isEdit
                ? '商品修改成功'
                : '商品创建成功，当前为草稿状态'
        );
    };
}


/* =========================================================
 * 十八、库存修改
 * ========================================================= */

function changeMerchantStock(
    user,
    product
) {

    const value =
        prompt(
            `请输入「${product.name}」的新库存数量：`,
            product.stock
        );


    if (value === null) {
        return;
    }


    const stock =
        Number(value);


    if (
        !Number.isInteger(stock) ||
        stock < 0
    ) {

        alert(
            '库存必须是大于等于 0 的整数'
        );

        return;
    }


    const products =
        getMerchantProducts();


    const target =
        products.find(
            item =>
                item.id === product.id
        );


    if (!target) {
        alert('商品不存在');
        return;
    }


    target.stock = stock;


    merchantSaveData(
        MERCHANT_STORAGE.PRODUCTS,
        products
    );


    renderMerchantShell(
        user,
        'products'
    );
}


/* =========================================================
 * 十九、上下架
 * ========================================================= */

function toggleMerchantProductStatus(
    user,
    product
) {

    const products =
        getMerchantProducts();


    const target =
        products.find(
            item =>
                item.id === product.id
        );


    if (!target) {
        alert('商品不存在');
        return;
    }


    if (target.status === 'ON_SALE') {

        target.status = 'OFF_SALE';

    } else {

        if (target.stock <= 0) {

            alert(
                '当前商品库存为 0，无法上架'
            );

            return;
        }

        target.status = 'ON_SALE';
    }


    merchantSaveData(
        MERCHANT_STORAGE.PRODUCTS,
        products
    );


    renderMerchantShell(
        user,
        'products'
    );
}


/* =========================================================
 * 二十、页面事件绑定
 * ========================================================= */

function bindMerchantPageEvents(
    user,
    page
) {


    /* -------------------------
     * 商品管理
     * ------------------------- */

    if (page === 'products') {

        const addButton =
            document.querySelector(
                '#addMerchantProduct'
            );


        if (addButton) {

            addButton.onclick = () => {

                showMerchantProductModal(
                    user
                );

            };

        }


        document
            .querySelectorAll(
                '[data-action="edit-product"]'
            )
            .forEach(button => {

                button.onclick = () => {

                    const id =
                        Number(
                            button.dataset.id
                        );


                    const product =
                        getMerchantProducts()
                            .find(
                                item =>
                                    item.id === id
                            );


                    if (product) {

                        showMerchantProductModal(
                            user,
                            product
                        );

                    }

                };

            });


        document
            .querySelectorAll(
                '[data-action="stock-product"]'
            )
            .forEach(button => {

                button.onclick = () => {

                    const id =
                        Number(
                            button.dataset.id
                        );


                    const product =
                        getMerchantProducts()
                            .find(
                                item =>
                                    item.id === id
                            );


                    if (product) {

                        changeMerchantStock(
                            user,
                            product
                        );

                    }

                };

            });


        document
            .querySelectorAll(
                '[data-action="on-sale"], [data-action="off-sale"]'
            )
            .forEach(button => {

                button.onclick = () => {

                    const id =
                        Number(
                            button.dataset.id
                        );


                    const product =
                        getMerchantProducts()
                            .find(
                                item =>
                                    item.id === id
                            );


                    if (product) {

                        toggleMerchantProductStatus(
                            user,
                            product
                        );

                    }

                };

            });


        const searchInput =
            document.querySelector(
                '#productSearch'
            );


        const statusFilter =
            document.querySelector(
                '#productStatusFilter'
            );


        const renderFilteredProducts =
            () => {

                const keyword =
                    (
                        searchInput?.value || ''
                    )
                    .trim()
                    .toLowerCase();


                const status =
                    statusFilter?.value ||
                    'ALL';


                const products =
                    getMerchantProducts()
                        .filter(
                            item =>
                                item.merchantId === user.id
                        )
                        .filter(item => {

                            const matchKeyword =
                                !keyword ||
                                item.name
                                    .toLowerCase()
                                    .includes(keyword) ||
                                item.sku
                                    .toLowerCase()
                                    .includes(keyword);


                            const matchStatus =
                                status === 'ALL' ||
                                item.status === status;


                            return (
                                matchKeyword &&
                                matchStatus
                            );

                        });


                const table =
                    document.querySelector(
                        '#merchantProductTable'
                    );


                if (table) {

                    table.innerHTML =
                        products.length
                            ?
                            products
                                .map(
                                    renderMerchantProductRow
                                )
                                .join('')
                            :
                            `
                                <tr>
                                    <td colspan="6">
                                        <div class="empty">
                                            没有找到相关商品
                                        </div>
                                    </td>
                                </tr>
                            `;

                    bindMerchantPageEvents(
                        user,
                        'products'
                    );
                }
            };


        if (searchInput) {
            searchInput.oninput =
                renderFilteredProducts;
        }


        if (statusFilter) {
            statusFilter.onchange =
                renderFilteredProducts;
        }

    }


    /* -------------------------
     * 订单管理
     * ------------------------- */

    if (page === 'orders') {

        document
            .querySelectorAll(
                '[data-action="view-order"]'
            )
            .forEach(button => {

                button.onclick = () => {

                    const id =
                        Number(
                            button.dataset.id
                        );


                    const order =
                        getMerchantOrders()
                            .find(
                                item =>
                                    item.id === id
                            );


                    if (order) {

                        showMerchantOrderDetail(
                            order
                        );

                    }

                };

            });


        document
            .querySelectorAll(
                '[data-action="ship-order"]'
            )
            .forEach(button => {

                button.onclick = () => {

                    const id =
                        Number(
                            button.dataset.id
                        );


                    const order =
                        getMerchantOrders()
                            .find(
                                item =>
                                    item.id === id
                            );


                    if (order) {

                        showMerchantShipModal(
                            order
                        );

                    }

                };

            });


        const orderFilter =
            document.querySelector(
                '#orderStatusFilter'
            );


        if (orderFilter) {

            orderFilter.onchange = () => {

                const status =
                    orderFilter.value;


                const orders =
                    getMerchantOrders()
                        .filter(
                            item =>
                                item.merchantId === user.id
                        )
                        .filter(
                            item =>
                                status === 'ALL' ||
                                item.orderStatus === status
                        );


                const table =
                    document.querySelector(
                        '#merchantOrderTable'
                    );


                if (table) {

                    table.innerHTML =
                        orders
                            .map(
                                renderMerchantOrderRow
                            )
                            .join('');


                    bindMerchantPageEvents(
                        user,
                        'orders'
                    );

                }

            };

        }

    }


    /* -------------------------
     * 售后管理
     * ------------------------- */

    if (page === 'afterSales') {

        document
            .querySelectorAll(
                '[data-action="view-after-sale"]'
            )
            .forEach(button => {

                button.onclick = () => {

                    const id =
                        Number(
                            button.dataset.id
                        );


                    const item =
                        getMerchantAfterSales()
                            .find(
                                record =>
                                    record.id === id
                            );


                    if (item) {

                        showMerchantAfterSaleDetail(
                            item
                        );

                    }

                };

            });


        document
            .querySelectorAll(
                '[data-action="approve-after-sale"]'
            )
            .forEach(button => {

                button.onclick = () => {

                    const id =
                        Number(
                            button.dataset.id
                        );


                    const item =
                        getMerchantAfterSales()
                            .find(
                                record =>
                                    record.id === id
                            );


                    if (item) {

                        const reply =
                            prompt(
                                '请输入同意售后的处理意见：'
                            );


                        if (!reply) {
                            return;
                        }


                        const afterSales =
                            getMerchantAfterSales();


                        const target =
                            afterSales.find(
                                record =>
                                    record.id === id
                            );


                        target.status =
                            'APPROVED';

                        target.merchantReply =
                            reply;


                        merchantSaveData(
                            MERCHANT_STORAGE.AFTER_SALES,
                            afterSales
                        );


                        renderMerchantShell(
                            user,
                            'afterSales'
                        );

                    }

                };

            });


        document
            .querySelectorAll(
                '[data-action="reject-after-sale"]'
            )
            .forEach(button => {

                button.onclick = () => {

                    const id =
                        Number(
                            button.dataset.id
                        );


                    const reply =
                        prompt(
                            '请输入拒绝售后的原因：'
                        );


                    if (!reply) {
                        return;
                    }


                    const afterSales =
                        getMerchantAfterSales();


                    const target =
                        afterSales.find(
                            record =>
                                record.id === id
                        );


                    if (!target) {
                        return;
                    }


                    target.status =
                        'REJECTED';

                    target.merchantReply =
                        reply;


                    merchantSaveData(
                        MERCHANT_STORAGE.AFTER_SALES,
                        afterSales
                    );


                    renderMerchantShell(
                        user,
                        'afterSales'
                    );

                };

            });

    }


    /* -------------------------
     * 店铺设置
     * ------------------------- */

    if (page === 'settings') {

        const saveButton =
            document.querySelector(
                '#saveMerchantSettings'
            );


        if (saveButton) {

            saveButton.onclick = () => {

                const data = {

                    shopName:
                        document
                            .querySelector(
                                '#shopName'
                            )
                            .value
                            .trim(),

                    phone:
                        document
                            .querySelector(
                                '#shopPhone'
                            )
                            .value
                            .trim(),

                    description:
                        document
                            .querySelector(
                                '#shopDescription'
                            )
                            .value
                            .trim()

                };


                localStorage.setItem(

                    `merchant_settings_${user.id}`,

                    JSON.stringify(data)

                );


                alert(
                    '店铺设置保存成功'
                );

            };

        }

    }
}


/* =========================================================
 * 二十一、获取当前商家
 * ========================================================= */

function getCurrentMerchant() {

    const session =
        sessionStorage.getItem(
            'ecom_session'
        );


    if (!session) {
        return null;
    }


    try {

        return JSON.parse(session);

    } catch (error) {

        return null;

    }
}


/* =========================================================
 * 二十二、提供给 app.js 的入口
 * ========================================================= */

/*
 * 如果 A 后续把 app.js 改成：
 *
 * function routeUser(user){
 *
 *     if(user.role === 'BUYER'){
 *         storeHome(user);
 *     }
 *
 *     else if(user.role === 'MERCHANT'){
 *         merchantDashboard(user);
 *     }
 *
 *     else if(user.role === 'ADMIN'){
 *         adminDashboard(user);
 *     }
 * }
 *
 * 那么这里就可以直接调用。
 */


/* =========================================================
 * 二十三、调试入口
 * ========================================================= */

/*
 * 如果你暂时想单独测试商家后台，可以在浏览器控制台执行：
 *
 * merchantDashboard({
 *     id: 2,
 *     name: '山屿生活馆',
 *     email: 'merchant@demo.com',
 *     role: 'MERCHANT'
 * });
 *
 */
