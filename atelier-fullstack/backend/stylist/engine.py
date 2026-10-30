"""Built-in styling rules. No network, no AI: colour harmony, dress code, weather, saree handling.

This is the fallback when Claude is not configured, and the 'Quick mix' button.
"""
import random
from dataclasses import dataclass, field
from itertools import product

from .catalog import COLORS, DRESS_CODES, HAIR, KEYWORDS, OCCASIONS

CORE = {"top", "bottom", "dress", "ethnic", "shoes", "layer"}
WHOLE = {"dress", "ethnic"}
BODY = {"top", "bottom", "dress", "ethnic"}
ETHNIC_LAYER_WORDS = ("shawl", "dupatta", "stole", "wrap", "jacket", "nehru", "bandi", "cape", "cardigan", "shrug")


@dataclass
class Context:
    occasion: str = "cafe"
    details: str = ""
    temperature: int = 26
    rain: bool = False
    love: list = field(default_factory=list)
    avoid: list = field(default_factory=list)
    hair_length: str = ""
    hair_texture: str = ""
    rng: random.Random = field(default_factory=random.Random)

    @property
    def effective_occasion(self):
        text = (self.details or "").lower()
        for word, occ in KEYWORDS:
            if word in text:
                return occ
        return self.occasion if self.occasion in OCCASIONS else "cafe"

    @property
    def occ(self):
        return OCCASIONS[self.effective_occasion]


def _name(g):
    return (g.name or "").lower()


def is_saree(g):
    return g.category == "ethnic" and ("saree" in _name(g) or "sari" in _name(g))


def is_blouse(g):
    return g.category == "top" and ("blouse" in _name(g) or "choli" in _name(g))


def _hue_diff(a, b):
    d = abs(a - b) % 360
    return 360 - d if d > 180 else d


def _cap(s):
    return s[:1].upper() + s[1:]


def _accent_colors(items):
    seen = []
    for i in items:
        c = COLORS.get(i.color)
        if c and not c["neutral"] and i.color not in seen:
            seen.append(i.color)
    return seen


def score(items, ctx, has_layers):
    o, t = ctx.occ, ctx.temperature
    s = 0.0
    core = [i for i in items if i.category in CORE]
    fs = [i.formality for i in core]
    avg = sum(fs) / len(fs)
    s -= abs(avg - o["formality"]) * 2.4
    spread = max(fs) - min(fs)
    if spread > 1.5:
        s -= (spread - 1.5) * 1.6

    body = [i for i in items if i.category in BODY]
    w = sum(i.warmth for i in body) / len(body)
    layer = next((i for i in items if i.category == "layer"), None)
    ww = w + (layer.warmth * 0.5 - 0.2 if layer else 0)
    tw = 3 if t < 12 else 2.3 if t < 19 else 1.7 if t < 26 else 1.1
    s -= abs(ww - tw) * 1.6
    if layer and t >= 28 and not ctx.rain:
        s -= 3
    if not layer and has_layers and (t < 16 or ctx.rain):
        s -= 2.5

    acc = _accent_colors(items)
    if len(acc) == 0:
        s += 2
        story = "A neutral palette keeps it easy to wear."
    elif len(acc) == 1:
        s += 3
        story = f"{_cap(acc[0])} is the one colour here, set against neutrals."
    elif len(acc) == 2:
        d = _hue_diff(COLORS[acc[0]]["hue"], COLORS[acc[1]]["hue"])
        if d <= 50:
            s += 1
            story = f"{_cap(acc[0])} and {acc[1]} sit next to each other on the colour wheel."
        elif d >= 150:
            s += 1
            story = f"{_cap(acc[0])} and {acc[1]} are complementary, so each lifts the other."
        else:
            s -= 2
            story = f"{_cap(acc[0])} and {acc[1]} compete with each other."
    else:
        s -= 4
        story = "Three or more colours at once reads busy."

    if sum(1 for i in items if i.pattern not in ("solid", "textured")) >= 2:
        s -= 2.5
    if any(i.category == "ethnic" for i in items) and ctx.effective_occasion in ("festive", "wedding"):
        s += 3
    for i in items:
        if i.color in ctx.love:
            s += 1
        if i.color in ctx.avoid:
            s -= 3

    if ww - tw > 0.8:
        weather = f"It runs warm for {t}°C."
    elif tw - ww > 0.8:
        weather = f"It runs light for {t}°C, so carry a layer."
    else:
        weather = f"Comfortable at {t}°C"
        weather += f", and the {layer.name.lower()} handles the rain." if (ctx.rain and layer) else "."
    return {"total": s + ctx.rng.random() * 0.5, "acc": acc, "avg": avg, "story": story, "weather": weather}


def hair_for(ctx, force=None):
    group = force or ctx.occ["hair"]
    length = ctx.hair_length or "Medium"
    text = HAIR[group].get(length) or HAIR[group]["Medium"]
    if ctx.rain and group != "festive":
        text += " Skip the blowout today, since humidity will undo it."
    if ctx.hair_texture in ("Curly", "Coily"):
        text += " Define your curls with a cream rather than brushing them out."
    return text


def addons(items, wardrobe, ctx):
    o = ctx.occ
    accs = _accent_colors(items)
    picks = []
    for cat in ("watch", "jewellery", "bag", "accessory"):
        best = None
        for g in (x for x in wardrobe if x.category == cat):
            neutral = COLORS.get(g.color, {}).get("neutral", False)
            sc = (
                -abs(g.formality - o["formality"])
                + (0.4 if neutral else (0.6 if g.color in accs else -0.6))
                + (0.5 if g.color in ctx.love else 0)
                - (2 if g.color in ctx.avoid else 0)
                + ctx.rng.random() * 0.3
            )
            if best is None or sc > best[0]:
                best = (sc, g)
        if best and best[0] > -1.2:
            picks.append(best)
    picks.sort(key=lambda p: -p[0])
    return [g for _, g in picks[:3]]


def missing_for(items, wardrobe, extra=()):
    cats = [i.category for i in items]
    has = lambda c: any(g.category == c for g in wardrobe)  # noqa: E731
    out = []
    whole = any(c in WHOLE for c in cats)
    if any(is_saree(i) for i in items) and not any(is_blouse(i) for i in items):
        out.append("a blouse for the saree (add it under Tops and put “blouse” in the name)")
    if not whole:
        if "top" in cats and "bottom" not in cats:
            out.append("a bottom")
        if "bottom" in cats and "top" not in cats:
            out.append("a top")
    if not has("shoes"):
        out.append("footwear")
    if "ethnic" in cats and not has("jewellery"):
        out.append("jewellery")
    for x in extra or ():
        x = str(x).strip()
        if x and not any(x.lower()[:12] in y.lower() for y in out):
            out.append(x)
    return out[:4]


def _title(acc, eth):
    if eth:
        return f"The {eth.name.lower()}"
    if not acc:
        return "Quiet neutrals"
    if len(acc) == 1:
        return f"{_cap(acc[0])} on neutrals"
    if len(acc) == 2:
        return f"{_cap(acc[0])} and {acc[1]}"
    return "Full colour"


def suggest(wardrobe, ctx, count=4):
    """Return up to `count` looks: [{title, items:[Garment], hair, why, tip, missing}]."""
    wardrobe = list(wardrobe)
    by = lambda c: [g for g in wardrobe if g.category == c]  # noqa: E731
    tops, bottoms, dresses, ethnics = by("top"), by("bottom"), by("dress"), by("ethnic")
    layers, shoes = by("layer"), by("shoes")
    blouses = [t for t in tops if is_blouse(t)]

    bases = [[t, b] for t, b in product(tops, bottoms)]
    if tops and not bottoms:
        bases += [[t] for t in tops if not is_blouse(t)]
    if bottoms and not tops:
        bases += [[b] for b in bottoms]
    bases += [[d] for d in dresses]
    for e in ethnics:
        if is_saree(e):
            bases += [[e, b] for b in blouses] if blouses else [[e]]
        else:
            bases.append([e])
    if not bases:
        return []

    shoe_opts = [[s] for s in shoes] or [[]]
    combos = []
    for base in bases:
        ethnic = any(x.category == "ethnic" for x in base)
        usable = [l for l in layers if (not ethnic or any(w in _name(l) for w in ETHNIC_LAYER_WORDS))]
        for s, l in product(shoe_opts, [[]] + [[x] for x in usable]):
            items = base + s + l
            combos.append((score(items, ctx, bool(usable)), items))
    combos.sort(key=lambda c: -c[0]["total"])

    def shared(a, b):
        return sum(1 for x in a if x in b and x.category in BODY)

    chosen, seen = [], set()
    for max_share in (0, 1, 99):
        for sc, items in combos:
            if len(chosen) >= count:
                break
            key = tuple(i.id for i in items)
            if key in seen or any(shared(items, k[1]) > max_share for k in chosen):
                continue
            seen.add(key)
            chosen.append((sc, items))
    if ethnics and not any(any(i.category == "ethnic" for i in items) for _, items in chosen):
        first = next((c for c in combos if any(i.category == "ethnic" for i in c[1])), None)
        if first:
            if len(chosen) >= count:
                chosen[-1] = first
            else:
                chosen.append(first)

    out = []
    for sc, items in chosen:
        items = items + addons(items, wardrobe, ctx)
        eth = next((i for i in items if i.category == "ethnic"), None)
        layer = next((i for i in items if i.category == "layer"), None)
        label = DRESS_CODES.get(int(sc["avg"] + 0.5), "")
        why = (
            f"Reads as {label.lower()}, which suits {ctx.occ['label'].lower()}. {sc['story']} {sc['weather']}"
        )
        if eth:
            tip = f"Keep the jewellery to one statement piece and let the {eth.name.lower()} lead."
        elif layer:
            tip = f"Wear the {layer.name.lower()} open to keep a long line."
        elif any(i.category == "top" for i in items):
            tip = "Half-tuck the top to define the waist."
        else:
            tip = "Add one simple accessory to finish."
        out.append({
            "title": _title(sc["acc"], eth),
            "items": items,
            "hair": hair_for(ctx, "festive" if eth and ctx.occ["formality"] >= 2.5 else None),
            "why": why,
            "tip": tip,
            "missing": missing_for(items, wardrobe),
        })
    return out
