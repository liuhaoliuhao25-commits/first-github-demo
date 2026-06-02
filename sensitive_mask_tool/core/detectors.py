"""敏感信息检测器 — 正则 + 关键词匹配"""
import re
from typing import List, Dict, Tuple, Optional


# ── 预编译正则 ──────────────────────────────────────────

PHONE_PATTERN = re.compile(
    r'(?<!\d)1[3-9]\d{9}(?!\d)'
)

ID_CARD_PATTERN = re.compile(
    r'(?<!\d)\d{17}[\dXx](?!\d)'
)

# 出生日期：支持 1990年1月1日 / 1990-01-01 / 1990.01.01 / 19900101
BIRTH_PATTERN = re.compile(
    r'(?<!\d)('
    r'(19|20)\d{2}[年\-./]\d{1,2}[月\-./]\d{1,2}[日]?'
    r'|(19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])'
    r')(?!\d)'
)

# 住址关键词（分两级：STRONG 用于宽松匹配，避免误判；LOOSE 仅用于完整地址上下文）
ADDR_STRONG = (
    r'(?:省|市|区|县|路|街|道|弄|巷|镇|乡|村|'
    r'小区|花园|大厦|广场)'
)
ADDR_LOOSE = r'(?:栋|单元|室|号|自治区|自治州|地区|街道|开发区|新区)'

# 宽松匹配：必须含 STRONG 关键词（不包含"栋/单元/室"，避免匹配人名/公司名）
ADDRESS_PATTERN = re.compile(
    r'(?:[\u4e00-\u9fff]{3,}(?:' + ADDR_STRONG + r'))'
    r'[\u4e00-\u9fff\d\-\#]{0,25}'
    r'(?:' + ADDR_STRONG + r')?'
    r'(?:[\u4e00-\u9fff\d\-\#]{0,15})'
)

# 完整地址（更严格）：省开头或市开头
FULL_ADDRESS_PATTERN = re.compile(
    r'(?:[\u4e00-\u9fff]{2,}省)?'
    r'(?:[\u4e00-\u9fff]{2,}市)?'
    r'(?:[\u4e00-\u9fff]{2,}(?:区|县|镇|乡))'
    r'[\u4e00-\u9fff\d\-]{2,30}'
    r'(?:路|街|道|巷|弄)'
    r'[\u4e00-\u9fff\d\-]{0,20}'
    r'(?:号)?'
    r'(?:[\u4e00-\u9fff\d\-\#]{0,20})?'
)


# ── 检测器类 ────────────────────────────────────────────

class SensitiveDetector:
    """敏感信息检测器。

    enabled_rules: ['phone', 'id_card', 'birth', 'address']
    custom_keywords: ['张三', '保密项目', ...]
    """

    def __init__(
        self,
        enabled_rules: Optional[List[str]] = None,
        custom_keywords: Optional[List[str]] = None,
    ):
        self.enabled_rules = enabled_rules or []
        self.custom_keywords = [kw for kw in (custom_keywords or []) if kw.strip()]

    # ── 文本检测 ─────────────────────────────────────

    def detect_in_text(self, text: str) -> List[Dict]:
        """在纯文本中检测敏感信息。

        返回: [{"type": "phone", "text": "13800138000", "start": 5, "end": 16}, ...]
        """
        results = []

        if "phone" in self.enabled_rules:
            for m in PHONE_PATTERN.finditer(text):
                results.append({
                    "type": "phone",
                    "text": m.group(),
                    "start": m.start(),
                    "end": m.end(),
                })

        if "id_card" in self.enabled_rules:
            for m in ID_CARD_PATTERN.finditer(text):
                results.append({
                    "type": "id_card",
                    "text": m.group(),
                    "start": m.start(),
                    "end": m.end(),
                })

        if "birth" in self.enabled_rules:
            for m in BIRTH_PATTERN.finditer(text):
                results.append({
                    "type": "birth",
                    "text": m.group(),
                    "start": m.start(),
                    "end": m.end(),
                })

        if "address" in self.enabled_rules:
            for m in FULL_ADDRESS_PATTERN.finditer(text):
                results.append({
                    "type": "address",
                    "text": m.group(),
                    "start": m.start(),
                    "end": m.end(),
                })
            # 宽松匹配补充
            for m in ADDRESS_PATTERN.finditer(text):
                # 去重（与完整地址重叠的跳过）
                if not any(r["start"] <= m.start() < r["end"] for r in results if r["type"] == "address"):
                    results.append({
                        "type": "address",
                        "text": m.group(),
                        "start": m.start(),
                        "end": m.end(),
                    })

        # 自定义关键词
        for kw in self.custom_keywords:
            if not kw:
                continue
            for m in re.finditer(re.escape(kw), text):
                results.append({
                    "type": "keyword",
                    "text": m.group(),
                    "keyword": kw,
                    "start": m.start(),
                    "end": m.end(),
                })

        # 按位置排序，合并重叠区域
        results.sort(key=lambda r: (r["start"], r["end"]))
        return results

    # ── 图片检测（OCR + 正则）────────────────────────

    def detect_in_image(self, image) -> List[Dict]:
        """对图片进行 OCR → 文本检测，返回图像坐标的命中区域。

        参数:
            image: numpy 数组 (BGR 或 RGB)

        返回: [{"type": "phone", "text": "138...", "bbox": (x, y, w, h)}, ...]
        """
        ocr_results = self._ocr_image(image)
        results = []
        for ocr_item in ocr_results:
            text = ocr_item["text"]
            hits = self.detect_in_text(text)
            for hit in hits:
                # 将字符级位置映射到图像bbox（简化：整个OCR区域打码）
                hit["bbox"] = ocr_item["bbox"]
                results.append(hit)
        return results

    def _ocr_image(self, image) -> List[Dict]:
        """对图像运行 OCR，返回文字块列表。

        返回: [{"text": "文字内容", "bbox": (x, y, w, h)}, ...]
        """
        try:
            import pytesseract
            # 获取详细数据：level=6 是词级别
            data = pytesseract.image_to_data(
                image, lang="chi_sim+eng", output_type=pytesseract.Output.DICT
            )
            results = []
            n = len(data["text"])
            current_block = {"text": "", "x": None, "y": None, "w": 0, "h": 0}

            for i in range(n):
                word = data["text"][i].strip()
                if not word:
                    # 遇到空词 → 提交当前块
                    if current_block["text"]:
                        results.append({
                            "text": current_block["text"],
                            "bbox": (
                                current_block["x"],
                                current_block["y"],
                                current_block["w"],
                                current_block["h"],
                            ),
                        })
                        current_block = {"text": "", "x": None, "y": None, "w": 0, "h": 0}
                    continue

                x, y, w, h = (
                    data["left"][i],
                    data["top"][i],
                    data["width"][i],
                    data["height"][i],
                )
                if current_block["x"] is None:
                    current_block = {"text": word, "x": x, "y": y, "w": w, "h": h}
                else:
                    # 扩展bbox合并
                    new_x = min(current_block["x"], x)
                    new_y = min(current_block["y"], y)
                    new_r = max(current_block["x"] + current_block["w"], x + w)
                    new_b = max(current_block["y"] + current_block["h"], y + h)
                    current_block["text"] += " " + word
                    current_block["x"] = new_x
                    current_block["y"] = new_y
                    current_block["w"] = new_r - new_x
                    current_block["h"] = new_b - new_y

            if current_block["text"]:
                results.append({
                    "text": current_block["text"],
                    "bbox": (
                        current_block["x"],
                        current_block["y"],
                        current_block["w"],
                        current_block["h"],
                    ),
                })

            return results
        except ImportError:
            # 无 Tesseract → 返回空
            return []
        except Exception:
            return []

    # ── 便捷方法 ─────────────────────────────────────

    def has_any_rule(self) -> bool:
        return bool(self.enabled_rules or self.custom_keywords)
