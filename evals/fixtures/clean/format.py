from decimal import Decimal


def parse_amounts(orders: list[dict]) -> dict[str, Decimal]:
    return {order["id"]: Decimal(order["amount"]) for order in orders}
