def detect_language(text: str) -> str:
    # Dictionary of unique/common keywords for each official language
    # ISO 639-1 codes used as keys
    sa_languages = {
        "zu": ["ngicela", "ngoba", "umsebenzi", "isikole", "yebo", "sawubona"], # isiZulu
        "xh": ["molo", "enkosi", "namhlanje", "ukutya", "isixhosa", "bhala"],    # isiXhosa
        "af": ["baie", "dankie", "skool", "werk", "goeie", "asseblief"],        # Afrikaans
        "nso": ["thobela", "re a leboga", "sekolo", "modiro", "pudi"],          # Sepedi (Northern Sotho)
        "tn": ["dumela", "re a leboga", "tsela", "pula", "itumele"],            # Setswana
        "st": ["dumelang", "ke a leboha", "tsatsi", "hodimo", "lefatshe"],       # Sesotho (Southern Sotho)
        "ts": ["avuxeni", "ndzi ri", "tlangela", "ndza khensa", "mati"],         # Xitsonga
        "ss": ["sawubona", "ngiyabonga", "emanti", "umsebenti", "kantsi"],       # siSwati
        "ve": ["ndi matsheloni", "ndavhuwa", "vhutshilo", "madi", "tshikolo"],   # Tshivenda
        "nr": ["lotjhani", "ngiyathokoza", "irherho", "isikolo", "amanzi"],      # isiNdebele
        "sgn": ["sign", "deaf", "hand", "gesture", "sasl"],                     # SA Sign Language (keywords)
        "en": ["hello", "please", "thank", "school", "work", "explain"]        # English
    }

    text_lower = text.lower()

    # Check for matches
    for lang_code, keywords in sa_languages.items():
        for word in keywords:
            if word in text_lower:
                return lang_code

    # Default to English if no local keywords are found
    return "en"