"""文件工具 — 批量遍历 / 分类 / 输出路径"""


def classify_files(paths):
    """将文件路径列表分类为 PDF 和图片"""
    pdf_exts = {".pdf"}
    img_exts = {".jpg", ".jpeg", ".png", ".bmp", ".tiff", ".tif"}
    pdfs, imgs = [], []
    for p in paths:
        ext = p.lower().rsplit(".", 1)[-1] if "." in p else ""
        if f".{ext}" in pdf_exts:
            pdfs.append(p)
        elif f".{ext}" in img_exts:
            imgs.append(p)
    return pdfs, imgs
