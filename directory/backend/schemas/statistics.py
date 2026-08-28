from typing import List

from pydantic import BaseModel



# ==============================
# 月收入数据
# ==============================

class MonthlyIncome(BaseModel):

    month:str

    amount:float






# ==============================
# 营收统计返回
# ==============================

class StatisticsResponse(BaseModel):


    # 总销售额

    total_income:float



    # 已完成订单金额

    completed_income:float



    # 总订单数量

    order_count:int



    # 已完成订单数量

    completed_order_count:int



    # 今日收入

    today_income:float



    # 月收入趋势

    monthly_income:List[MonthlyIncome]
