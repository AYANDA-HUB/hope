def send_sms_to_parents(message: str, phone_numbers: list[str]):
    """
    Dummy SMS sender. Integrate real SMS gateway here.
    """
    for phone in phone_numbers:
        print(f"Sending SMS to {phone}: {message}")
