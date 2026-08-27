class BizException(Exception):
    """业务异常：由全局异常处理器统一转为 {code, message, data} 响应"""

    def __init__(self, message: str = "业务处理失败", code: int = 400):
        self.message = message
        self.code = code
        super().__init__(message)
