import re

_SA_ID_PATTERN = re.compile(r"^\d{13}$")


def is_valid_sa_id(value: str) -> bool:
    """South African ID number: 13 digits, last digit is a Luhn check digit."""
    if not _SA_ID_PATTERN.match(value):
        return False

    digits = [int(d) for d in value]
    odd_sum = sum(digits[i] for i in range(0, 12, 2))
    even_digits = "".join(str(digits[i]) for i in range(1, 12, 2))
    even_sum = sum(int(d) for d in str(int(even_digits) * 2))
    check_digit = (10 - (odd_sum + even_sum) % 10) % 10

    return check_digit == digits[12]
