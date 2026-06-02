"""敏感词检测器 — 正则 + 关键词匹配"""
import re
from typing import List, Dict, Optional

# ── 预编译正则 ──────────────────────────────────────

# 允许数字间有空格（PDF提取常插入空格）
PHONE = re.compile(r'(?<!\d)1\s*[3-9]\s*\d\s*\d\s*\d\s*\d\s*\d\s*\d\s*\d\s*\d\s*\d(?!\d)')
ID_CARD = re.compile(r'(?<!\d)\d\s*\d\s*\d\s*\d\s*\d\s*\d\s*\d\s*\d\s*\d\s*\d\s*\d\s*\d\s*\d\s*\d\s*\d\s*\d\s*\d\s*[\dXx](?!\d)')
BIRTH = re.compile(
    r'(?<!\d)('
    r'(19|20)\d{2}\s*[年\-./]\s*\d{1,2}\s*[月\-./]\s*\d{1,2}\s*[日]?'
    r'|(19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])'
    r')(?!\d)'
)
EMAIL = re.compile(r'[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}')
URL = re.compile(r'https?://[^\s]{4,}|www\.[^\s]{4,}')
# 统一社会信用代码：18位字母数字（不含I,O,Z,S,V）
CREDIT_CODE = re.compile(r'(?<!\w)[0-9A-HJ-NPQRTUWXY]{18}(?!\w)')

# CJK + 空格/换行的单元（非贪婪匹配直到地址关键词边界）
_CW = r'[\u4e00-\u9fff\s\n]'  # CJK 或空白字符

# 地址关键词
_ADDR_STRONG = r'(?:省|市|区|县|路|街|道|弄|巷|镇|乡|村|小区|花园|大厦|广场)'
ADDR_LOOSE = re.compile(
    _CW + r'{3,}?(?:' + _ADDR_STRONG + r')'
    r'[\u4e00-\u9fff\d\-\#\s\n]{0,25}'
    r'(?:' + _ADDR_STRONG + r')?[\u4e00-\u9fff\d\-\#\s\n]{0,15}'
)
# 严格地址：省?市?区/县/镇/乡+路/街/道+号
ADDR_STRICT = re.compile(
    r'(?:' + _CW + r'{2,}?省)?[\s\n]*'
    r'(?:' + _CW + r'{2,}?市)?[\s\n]*'
    + _CW + r'{2,}?(?:区|县|镇|乡)'
    r'[\u4e00-\u9fff\d\-\s\n]{2,30}?(?:路|街|道|巷|弄)'
    r'[\u4e00-\u9fff\d\-\s\n]{0,20}?(?:号)?[\u4e00-\u9fff\d\-\#\s\n]{0,20}'
)


class Detector:
    """敏感信息检测器。

    rules: ['phone','id_card','birth','address'] 子集
    keywords: 自定义敏感词列表
    """

    def __init__(self, rules: List[str] = None, keywords: List[str] = None):
        self.rules = rules or []
        self.keywords = [k for k in (keywords or []) if k.strip()]

    @property
    def active(self) -> bool:
        return bool(self.rules or self.keywords)

    # ── 文本检测 ─────────────────────────────────

    def scan_text(self, text: str) -> List[Dict]:
        """返回 [{"type":"phone","text":"138...","start":0,"end":11}, ...]"""
        hits = []

        if "phone" in self.rules:
            for m in PHONE.finditer(text):
                hits.append(_hit("phone", m))

        if "id_card" in self.rules:
            for m in ID_CARD.finditer(text):
                hits.append(_hit("id_card", m))

        if "birth" in self.rules:
            for m in BIRTH.finditer(text):
                hits.append(_hit("birth", m))

        if "email" in self.rules:
            for m in EMAIL.finditer(text):
                hits.append(_hit("email", m))

        if "url" in self.rules:
            for m in URL.finditer(text):
                hits.append(_hit("url", m))

        if "credit_code" in self.rules:
            for m in CREDIT_CODE.finditer(text):
                hits.append(_hit("credit_code", m))

        if "address" in self.rules:
            for m in ADDR_STRICT.finditer(text):
                hits.append(_hit("address", m))
            for m in ADDR_LOOSE.finditer(text):
                if not any(r["start"] <= m.start() < r["end"] for r in hits if r["type"] == "address"):
                    hits.append(_hit("address", m))

        for kw in self.keywords:
            for m in re.finditer(re.escape(kw), text):
                h = _hit("keyword", m)
                h["keyword"] = kw
                hits.append(h)

        hits.sort(key=lambda r: (r["start"], r["end"]))
        return hits

    # ── 图片检测（OCR）────────────────────────────

    def scan_image(self, image) -> List[Dict]:
        """OCR → 正则匹配，返回图像坐标的命中区域。"""
        ocr = self._ocr(image)
        hits = []
        for item in ocr:
            for h in self.scan_text(item["text"]):
                h["bbox"] = item["bbox"]
                hits.append(h)
        return hits

    def _ocr(self, image) -> List[Dict]:
        """返回 [{"text":"...", "bbox":(x,y,w,h)}, ...]"""
        try:
            import pytesseract
            data = pytesseract.image_to_data(image, lang="chi_sim+eng", output_type=pytesseract.Output.DICT)
            results, block = [], {"text": "", "x": None, "y": None, "w": 0, "h": 0}
            n = len(data["text"])
            for i in range(n):
                word = data["text"][i].strip()
                if not word:
                    if block["text"]:
                        results.append({"text": block["text"], "bbox": (block["x"], block["y"], block["w"], block["h"])})
                        block = {"text": "", "x": None, "y": None, "w": 0, "h": 0}
                    continue
                x, y, w, h = data["left"][i], data["top"][i], data["width"][i], data["height"][i]
                if block["x"] is None:
                    block = {"text": word, "x": x, "y": y, "w": w, "h": h}
                else:
                    nx = min(block["x"], x); ny = min(block["y"], y)
                    nr = max(block["x"] + block["w"], x + w); nb = max(block["y"] + block["h"], y + h)
                    block["text"] += " " + word
                    block["x"] = nx; block["y"] = ny; block["w"] = nr - nx; block["h"] = nb - ny
            if block["text"]:
                results.append({"text": block["text"], "bbox": (block["x"], block["y"], block["w"], block["h"])})
            return results
        except Exception:
            return []


def _hit(kind: str, match: re.Match) -> Dict:
    return {"type": kind, "text": match.group(), "start": match.start(), "end": match.end()}
