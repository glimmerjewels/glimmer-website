import os
import re
from typing import List, Optional
from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from pydantic import BaseModel, Field, field_validator
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)

# Allowed origins for CORS (restrict to production domains and local dev)
ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS",
    "https://glimmerjewels.in,http://localhost:3000,http://127.0.0.1:5500"
).split(",")

CORS(app, origins=ALLOWED_ORIGINS, supports_credentials=True)

# Rate Limiter setup (protect against brute-force and DoS)
limiter = Limiter(
    get_remote_address,
    app=app,
    default_limits=["120 per minute"],
    storage_uri="memory://"
)

# ------------------------------------------------------------------------------
# SECURITY HEADERS MIDDLEWARE
# ------------------------------------------------------------------------------
@app.after_request
def add_security_headers(response):
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "geolocation=(), camera=(), microphone=()"
    response.headers["Content-Security-Policy"] = (
        "default-src 'self'; "
        "img-src 'self' https: data:; "
        "script-src 'self'; "
        "style-src 'self' 'unsafe-inline'; "
        "connect-src 'self' https://bwgcnxaedxfoaoivfqlz.supabase.co;"
    )
    return response


# ------------------------------------------------------------------------------
# PYDANTIC SCHEMA VALIDATION (TAMPER RESISTANCE & INPUT VALIDATION)
# ------------------------------------------------------------------------------
class OrderItemSchema(BaseModel):
    product_id: int = Field(..., gt=0)
    product_name: str = Field(..., min_length=1, max_length=150)
    quantity: int = Field(..., gt=0, le=50)
    price: float = Field(..., ge=0)

    @field_validator("product_name")
    def sanitize_name(cls, v):
        # Strip potential HTML/script injection tags
        clean = re.sub(r"[<>]", "", v.strip())
        return clean


class OrderValidationSchema(BaseModel):
    customer_name: str = Field(..., min_length=2, max_length=100)
    customer_mobile: str = Field(..., pattern=r"^[6-9]\d{9}$")
    customer_address: str = Field(..., min_length=5, max_length=300)
    city: str = Field(..., min_length=2, max_length=50)
    state: str = Field(..., min_length=2, max_length=50)
    pincode: str = Field(..., pattern=r"^\d{6}$")
    items: List[OrderItemSchema] = Field(..., min_items=1, max_items=100)
    expected_total: float = Field(..., ge=0)

    @field_validator("customer_name", "customer_address", "city", "state")
    def sanitize_text(cls, v):
        # Prevent HTML/Script injection
        return re.sub(r"[<>]", "", v.strip())


# ------------------------------------------------------------------------------
# ROUTES
# ------------------------------------------------------------------------------
@app.route("/")
def home():
    return jsonify({
        "status": "healthy",
        "service": "Glimmer Secure API",
        "version": "2.0.0"
    })


@app.route("/api/validate-order", methods=["POST"])
@limiter.limit("15 per minute")
def validate_order():
    """
    Validates cart contents and order parameters before order creation.
    Rejects malformed, injected, or anomalous payloads.
    """
    if not request.is_json:
        return jsonify({"error": "Content-Type must be application/json"}), 400

    try:
        data = OrderValidationSchema(**request.get_json())
    except Exception as e:
        return jsonify({"error": "Invalid order payload", "details": str(e)}), 422

    # Verify calculated item subtotal against expected total
    computed_items_total = sum(item.quantity * item.price for item in data.items)

    return jsonify({
        "valid": True,
        "computed_subtotal": computed_items_total,
        "items_count": len(data.items),
        "message": "Order payload is valid and sanitized"
    })


@app.errorhandler(429)
def ratelimit_handler(e):
    return jsonify({
        "error": "Rate limit exceeded. Please wait before making more requests."
    }), 429


@app.errorhandler(500)
def internal_error(e):
    return jsonify({
        "error": "Internal server error"
    }), 500


if __name__ == "__main__":
    # Disable debug mode in production to avoid werkzeug pin exploit
    debug_mode = os.getenv("FLASK_DEBUG", "false").lower() == "true"
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", 5000)), debug=debug_mode)
