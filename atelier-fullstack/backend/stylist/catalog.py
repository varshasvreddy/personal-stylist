"""Reference data shared by the styling engine, the API and (through /api/meta/) the React app."""
import colorsys

# (key, singular, plural, default dress code 1-5)
CATEGORIES = [
    ("top", "Top", "Tops", 2),
    ("bottom", "Bottom", "Pants & skirts", 2),
    ("ethnic", "Ethnic", "Ethnic wear", 4),
    ("dress", "Dress", "Dresses", 3),
    ("layer", "Layer", "Jackets & layers", 3),
    ("shoes", "Shoes", "Footwear", 3),
    ("watch", "Watch", "Watches", 3),
    ("jewellery", "Jewellery", "Jewellery", 3),
    ("bag", "Bag", "Bags", 3),
    ("accessory", "Accessory", "Accessories", 2),
]
CATEGORY_KEYS = [c[0] for c in CATEGORIES]
CATEGORY_SINGULAR = {c[0]: c[1] for c in CATEGORIES}
CATEGORY_CHOICES = [(c[0], c[2]) for c in CATEGORIES]

DRESS_CODES = {1: "Casual", 2: "Smart casual", 3: "Business casual", 4: "Cocktail", 5: "Formal"}
WEIGHTS = {1: "Light", 2: "Mid", 3: "Heavy"}
PATTERNS = ["solid", "stripes", "check", "print", "textured"]

# name -> (hex, neutral)
_COLORS = {
    "black": ("#1B1B1E", True), "white": ("#F2F2EE", True), "cream": ("#EBDFC7", True),
    "grey": ("#8C919A", True), "charcoal": ("#3C414A", True), "navy": ("#1F3258", True),
    "denim": ("#4F7AA9", True), "camel": ("#B88A55", True), "tan": ("#D3B58C", True),
    "brown": ("#6B4A33", True), "gold": ("#C9A24A", True), "silver": ("#B8BCC4", True),
    "olive": ("#6B6A2E", False), "forest": ("#2E5C45", False), "sage": ("#A4B497", False),
    "teal": ("#1F7978", False), "sky": ("#A8C7E5", False), "lilac": ("#A89AD0", False),
    "burgundy": ("#6D1F2F", False), "rust": ("#AF5129", False), "red": ("#BC2C2C", False),
    "blush": ("#E6B6AF", False), "pink": ("#D9709A", False), "orange": ("#D9772B", False),
    "mustard": ("#D0A02A", False),
}


def _hue(hex_value):
    r, g, b = (int(hex_value[i:i + 2], 16) / 255 for i in (1, 3, 5))
    return colorsys.rgb_to_hsv(r, g, b)[0] * 360


COLORS = {name: {"hex": h, "neutral": n, "hue": _hue(h)} for name, (h, n) in _COLORS.items()}
COLOR_NAMES = list(COLORS)

# key -> label, target dress code, hair group
OCCASIONS = {
    "picnic": {"label": "Picnic", "formality": 1.2, "hair": "relaxed"},
    "cafe": {"label": "Cafe", "formality": 2, "hair": "relaxed"},
    "office": {"label": "Office", "formality": 3, "hair": "polished"},
    "interview": {"label": "Interview", "formality": 3.5, "hair": "polished"},
    "date": {"label": "Date night", "formality": 3.2, "hair": "glam"},
    "party": {"label": "Party", "formality": 3.2, "hair": "glam"},
    "festive": {"label": "Festive", "formality": 4, "hair": "festive"},
    "wedding": {"label": "Wedding", "formality": 4.5, "hair": "festive"},
    "travel": {"label": "Travel", "formality": 1.5, "hair": "relaxed"},
}

# Words in the free-text "tell me more" box that override the chosen occasion.
KEYWORDS = [
    ("wedding", "wedding"), ("reception", "wedding"), ("sangeet", "festive"), ("puja", "festive"),
    ("diwali", "festive"), ("festival", "festive"), ("picnic", "picnic"), ("cafe", "cafe"),
    ("coffee", "cafe"), ("brunch", "cafe"), ("interview", "interview"), ("office", "office"),
    ("meeting", "office"), ("date", "date"), ("dinner", "date"), ("party", "party"),
    ("club", "party"), ("flight", "travel"), ("trip", "travel"),
]

HAIR = {
    "relaxed": {
        "Short": "Tousled and air-dried, with a little texture spray for movement.",
        "Medium": "Loose waves or a low ponytail, with a claw clip in your bag.",
        "Long": "A loose braid or a half-up twist keeps it off your neck.",
    },
    "polished": {
        "Short": "A clean side part, smoothed with a little serum.",
        "Medium": "A sleek low bun, or a neat blowout tucked behind the ears.",
        "Long": "A low sleek bun or a tidy ponytail wrapped at the base.",
    },
    "glam": {
        "Short": "Slicked back or a deep side part with shine.",
        "Medium": "A bouncy blowout with a deep side part.",
        "Long": "Loose Hollywood waves, parted deep on one side.",
    },
    "festive": {
        "Short": "Swept back and neat, with one jewelled pin for shine.",
        "Medium": "A half-up style with soft curls, finished with a few pins.",
        "Long": "A braided bun or a low chignon with flowers or jewelled pins.",
    },
}

STYLES = ["Minimal", "Classic", "Smart casual", "Streetwear", "Sporty", "Boho", "Indo-western", "Edgy"]
FITS = ["Relaxed", "Regular", "Fitted"]
HAIR_LENGTHS = ["Short", "Medium", "Long"]
HAIR_TEXTURES = ["Straight", "Wavy", "Curly", "Coily"]
UNDERTONES = ["Warm", "Cool", "Neutral", "Not sure"]


def meta():
    """Everything the front end needs to draw choices, in one payload."""
    return {
        "categories": [
            {"key": k, "singular": s, "plural": p, "default_formality": f} for k, s, p, f in CATEGORIES
        ],
        "colors": [{"name": n, "hex": c["hex"], "neutral": c["neutral"]} for n, c in COLORS.items()],
        "patterns": PATTERNS,
        "dress_codes": [{"value": k, "label": v} for k, v in DRESS_CODES.items()],
        "weights": [{"value": k, "label": v} for k, v in WEIGHTS.items()],
        "occasions": [{"key": k, "label": v["label"]} for k, v in OCCASIONS.items()],
        "styles": STYLES,
        "fits": FITS,
        "hair_lengths": HAIR_LENGTHS,
        "hair_textures": HAIR_TEXTURES,
        "undertones": UNDERTONES,
    }
