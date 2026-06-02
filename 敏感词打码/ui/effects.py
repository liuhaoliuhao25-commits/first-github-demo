"""视觉效果工具 — 阴影、动画"""
from PySide6.QtWidgets import (
    QGraphicsDropShadowEffect, QWidget, QGraphicsOpacityEffect
)
from PySide6.QtCore import (
    QPropertyAnimation, QEasingCurve, QPoint, QSize, QParallelAnimationGroup,
    QSequentialAnimationGroup, QTimer, Property, QObject
)
from PySide6.QtGui import QColor


def card_shadow(widget: QWidget, blur=20, offset=(0, 2), color=QColor(0, 0, 0, 40)):
    """给 widget 添加卡片阴影效果。"""
    shadow = QGraphicsDropShadowEffect(widget)
    shadow.setBlurRadius(blur)
    shadow.setXOffset(offset[0])
    shadow.setYOffset(offset[1])
    shadow.setColor(color)
    widget.setGraphicsEffect(shadow)
    return shadow


def fade_in(widget: QWidget, duration=300):
    """淡入动画。"""
    effect = QGraphicsOpacityEffect(widget)
    widget.setGraphicsEffect(effect)
    effect.setOpacity(0)
    anim = QPropertyAnimation(effect, b"opacity")
    anim.setDuration(duration)
    anim.setStartValue(0)
    anim.setEndValue(1)
    anim.setEasingCurve(QEasingCurve.OutCubic)
    anim.start()
    return anim


def press_feedback(widget: QWidget, scale=0.95, duration=120):
    """按钮按下缩放反馈（调用后需手动触发恢复）。

    用法:
        anim = press_feedback(btn)
        anim.start()
    """
    anim = QPropertyAnimation(widget, b"geometry")
    geo = widget.geometry()
    dw = int(geo.width() * (1 - scale) / 2)
    dh = int(geo.height() * (1 - scale) / 2)
    anim.setDuration(duration)
    anim.setStartValue(geo)
    anim.setEndValue(geo.adjusted(dw, dh, -dw, -dh))
    anim.setEasingCurve(QEasingCurve.OutQuad)
    return anim


def slide_in(widget: QWidget, direction="up", duration=350):
    """滑入动画。"""
    anim = QPropertyAnimation(widget, b"pos")
    start = widget.pos()
    if direction == "up":
        start_pos = start + QPoint(0, 30)
    elif direction == "down":
        start_pos = start - QPoint(0, 30)
    elif direction == "left":
        start_pos = start + QPoint(30, 0)
    else:
        start_pos = start - QPoint(30, 0)

    anim.setDuration(duration)
    anim.setStartValue(start_pos)
    anim.setEndValue(start)
    anim.setEasingCurve(QEasingCurve.OutCubic)
    return anim


class PulseEffect(QObject):
    """脉冲动画（加载指示器的呼吸效果）。"""

    def __init__(self, widget: QWidget):
        super().__init__()
        self._widget = widget
        self._effect = QGraphicsOpacityEffect(widget)
        widget.setGraphicsEffect(self._effect)
        self._effect.setOpacity(0.4)
        self._anim = QPropertyAnimation(self._effect, b"opacity")
        self._anim.setDuration(800)
        self._anim.setStartValue(0.4)
        self._anim.setEndValue(1.0)
        self._anim.setEasingCurve(QEasingCurve.InOutSine)
        self._anim.setLoopCount(-1)  # 无限循环

    def start(self):
        self._anim.start()

    def stop(self):
        self._anim.stop()
        self._effect.setOpacity(0.4)
