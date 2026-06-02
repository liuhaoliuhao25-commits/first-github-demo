"""边界框合并工具 — 被 PDF/图片 处理器共用"""
from typing import List, Tuple

BBox = Tuple[int, int, int, int]  # (x, y, w, h)


def merge_bboxes(bboxes: List[BBox], iou_thresh: float = 0.25) -> List[BBox]:
    """合并重叠的边界框，消除重复检测区域。

    贪心算法：遍历每个框，将其与后续重叠框合并。
    """
    if not bboxes:
        return []
    merged: List[BBox] = []
    used = [False] * len(bboxes)

    for i, b1 in enumerate(bboxes):
        if used[i]:
            continue
        x1, y1, w1, h1 = b1
        for j, b2 in enumerate(bboxes):
            if i == j or used[j]:
                continue
            x2, y2, w2, h2 = b2
            # 计算 IoU
            ix = max(0, min(x1 + w1, x2 + w2) - max(x1, x2))
            iy = max(0, min(y1 + h1, y2 + h2) - max(y1, y2))
            inter = ix * iy
            union = w1 * h1 + w2 * h2 - inter
            if union > 0 and inter / union > iou_thresh:
                # 合并为外包矩形
                nx = min(x1, x2)
                ny = min(y1, y2)
                nw = max(x1 + w1, x2 + w2) - nx
                nh = max(y1 + h1, y2 + h2) - ny
                x1, y1, w1, h1 = nx, ny, nw, nh
                used[j] = True
        merged.append((x1, y1, w1, h1))
        used[i] = True

    return merged
