import hashlib
import secrets

# PBKDF2 迭代次数
ITERATIONS = 100000


def hash_password(password: str) -> str:
    """对密码进行 PBKDF2-SHA256 加密，返回格式：pbkdf2_sha256$迭代次数$盐$哈希值"""
    salt = secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac(
        "sha256", password.encode("utf-8"), bytes.fromhex(salt), ITERATIONS
    ).hex()
    return f"pbkdf2_sha256${ITERATIONS}${salt}${digest}"


def verify_password(password: str, hashed: str) -> bool:
    """校验明文密码与存储的哈希值是否匹配"""
    try:
        algorithm, iterations, salt, digest = hashed.split("$")
        if algorithm != "pbkdf2_sha256":
            return False
        new_digest = hashlib.pbkdf2_hmac(
            "sha256", password.encode("utf-8"), bytes.fromhex(salt), int(iterations)
        ).hex()
        return new_digest == digest
    except (ValueError, TypeError):
        return False
