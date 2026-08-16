# -*- coding: utf-8 -*-
"""
gen-manual-screenshots.py
生成用户操作手册的 7 张 UI 截图（使用 Pillow 绘制 UI 模拟图）
"""

import os
from PIL import Image, ImageDraw, ImageFont

OUT_DIR = os.path.join(os.getcwd(), 'docs', 'screenshots')
os.makedirs(OUT_DIR, exist_ok=True)

# 字体路径
FONT_SIMSUN = 'C:\\Windows\\Fonts\\simsun.ttc'
FONT_MSYH = 'C:\\Windows\\Fonts\\msyh.ttc'
FONT_COURIER = 'C:\\Windows\\Fonts\\cour.ttf'

IMG_W, IMG_H = 800, 600
BG_DARK = (30, 15, 45)      # 深紫色背景（类似 Pi 风格）
BG_CARD = (42, 28, 58)       # 卡片色
ACCENT = (147, 51, 234)      # 紫色强调色
GOLD = (243, 193, 54)        # Pi 金色
WHITE = (255, 255, 255)
GRAY = (180, 170, 195)
DARK_TEXT = (220, 210, 235)
LIGHT_GRAY = (100, 90, 115)


def load_font(path, size):
    try:
        return ImageFont.truetype(path, size)
    except Exception:
        return ImageFont.load_default()


def draw_card(draw, x, y, w, h, fill=BG_CARD):
    draw.rounded_rectangle([x, y, x + w, y + h], radius=12, fill=fill)


def draw_text_centered(draw, text, cx, y, font, fill=WHITE):
    bbox = draw.textbbox((0, 0), text, font=font)
    tw = bbox[2] - bbox[0]
    draw.text((cx - tw // 2, y), text, font=font, fill=fill)


def gen_login():
    img = Image.new('RGB', (IMG_W, IMG_H), BG_DARK)
    draw = ImageDraw.Draw(img)
    f_title = load_font(FONT_MSYH, 32)
    f_body = load_font(FONT_SIMSUN, 18)
    f_btn = load_font(FONT_MSYH, 20)
    f_small = load_font(FONT_SIMSUN, 14)
    
    draw_text_centered(draw, '先锋AI智能商户平台', IMG_W // 2, 80, f_title, WHITE)
    draw_text_centered(draw, '请使用 Pi Browser 登录', IMG_W // 2, 130, f_small, GRAY)
    
    cx, cy = IMG_W // 2, 310
    draw_card(draw, cx - 120, cy - 30, 240, 60, ACCENT)
    draw_text_centered(draw, 'Pi 登录', cx, cy - 5, f_btn, WHITE)
    
    draw_text_centered(draw, '由 Pi Network 提供技术支持', IMG_W // 2, 470, f_small, LIGHT_GRAY)
    
    # 装饰元素
    draw.ellipse([40, 80, 70, 110], fill=(147, 51, 234, 60))
    draw.ellipse([700, 450, 760, 510], fill=(243, 193, 54, 40))
    
    path = os.path.join(OUT_DIR, '01-login.png')
    img.save(path)
    print(f'  [OK] {path}')


def gen_dashboard():
    img = Image.new('RGB', (IMG_W, IMG_H), BG_DARK)
    draw = ImageDraw.Draw(img)
    f_title = load_font(FONT_MSYH, 22)
    f_stat = load_font(FONT_MSYH, 36)
    f_label = load_font(FONT_SIMSUN, 14)
    f_item = load_font(FONT_SIMSUN, 16)
    
    draw_text_centered(draw, '客户仪表盘', IMG_W // 2, 30, f_title, WHITE)
    
    # 统计卡片
    stats = [('今日订单', '12', IMG_W // 4), ('本月收入', '1,280 Pi', IMG_W // 2), ('活跃用户', '48', 3 * IMG_W // 4)]
    for label, val, cx in stats:
        draw_card(draw, cx - 110, 70, 220, 100)
        draw_text_centered(draw, val, cx, 85, f_stat, GOLD)
        draw_text_centered(draw, label, cx, 135, f_label, GRAY)
    
    # 服务列表
    y_start = 210
    services = ['基础美甲护理  π 1.5', '精致美甲设计  π 2.0', '手足全套尊享  π 3.0']
    for i, svc in enumerate(services):
        draw_card(draw, 50, y_start + i * 70, IMG_W - 100, 60)
        draw_text_centered(draw, svc, IMG_W // 2, y_start + i * 70 + 18, f_item, WHITE)
    
    path = os.path.join(OUT_DIR, '02-dashboard.png')
    img.save(path)
    print(f'  [OK] {path}')


def gen_ai_chat():
    img = Image.new('RGB', (IMG_W, IMG_H), (20, 10, 35))
    draw = ImageDraw.Draw(img)
    f_title = load_font(FONT_MSYH, 20)
    f_msg = load_font(FONT_SIMSUN, 15)
    f_input = load_font(FONT_SIMSUN, 16)
    f_hint = load_font(FONT_SIMSUN, 12)
    
    draw_text_centered(draw, 'AI 智能助手', IMG_W // 2, 20, f_title, WHITE)
    
    # 聊天消息
    msgs = [
        ('user', '帮我分析本月订单数据', BG_DARK, IMG_W - 280, 60, 260, 40),
        ('ai', '📊 本月共处理 45 笔订单，总收入 1,280 Pi。\n   热门服务：美甲护理（32%）', ACCENT, 40, 120, IMG_W - 250, 70),
        ('user', '有什么优化建议？', BG_DARK, IMG_W - 250, 210, 230, 40),
        ('ai', '💡 建议：1. 增加下午时段预约名额\n   2. 推出套餐优惠提升客单价', ACCENT, 40, 270, IMG_W - 200, 70),
    ]
    for role, text, bg, x, y, w, h in msgs:
        draw_card(draw, x, y, w, h, bg)
        draw.text((x + 12, y + 10), text, font=f_msg, fill=WHITE)
    
    # 输入框
    draw_card(draw, 20, 390, IMG_W - 40, 45, BG_CARD)
    draw.text((35, 400), '输入您的问题...', font=f_input, fill=LIGHT_GRAY)
    
    # 模型选择指示
    draw_text_centered(draw, '当前模型: GPT-4o-mini | 容错: Anthropic → Ollama', IMG_W // 2, 460, f_hint, LIGHT_GRAY)
    draw_text_centered(draw, '页眉：先锋人工智能服务框架软件 V2.0.0', IMG_W // 2, 490, f_hint, LIGHT_GRAY)
    
    path = os.path.join(OUT_DIR, '03-ai-chat.png')
    img.save(path)
    print(f'  [OK] {path}')


def gen_checkout():
    img = Image.new('RGB', (IMG_W, IMG_H), BG_DARK)
    draw = ImageDraw.Draw(img)
    f_title = load_font(FONT_MSYH, 24)
    f_item = load_font(FONT_SIMSUN, 18)
    f_price = load_font(FONT_MSYH, 28)
    f_btn = load_font(FONT_MSYH, 20)
    f_label = load_font(FONT_SIMSUN, 14)
    
    draw_text_centered(draw, '支付确认', IMG_W // 2, 30, f_title, WHITE)
    
    # 服务信息
    draw_card(draw, 50, 70, IMG_W - 100, 80)
    draw.text((80, 85), '基础美甲护理', font=f_item, fill=WHITE)
    draw.text((80, 120), '服务时长：45 分钟', font=f_label, fill=GRAY)
    
    # 金额
    draw_text_centered(draw, '1.5 Pi', IMG_W // 2, 210, f_price, GOLD)
    draw_text_centered(draw, '应付金额', IMG_W // 2, 260, f_label, GRAY)
    
    # 支付按钮
    draw_card(draw, IMG_W // 2 - 120, 320, 240, 60, GOLD)
    draw_text_centered(draw, '确认支付', IMG_W // 2, 342, f_btn, BG_DARK)
    
    draw_text_centered(draw, '请在 Pi 钱包中确认此交易', IMG_W // 2, 420, f_label, GRAY)
    
    path = os.path.join(OUT_DIR, '04-checkout.png')
    img.save(path)
    print(f'  [OK] {path}')


def gen_payment():
    img = Image.new('RGB', (IMG_W, IMG_H), BG_DARK)
    draw = ImageDraw.Draw(img)
    f_title = load_font(FONT_MSYH, 20)
    f_row = load_font(FONT_SIMSUN, 14)
    f_hdr = load_font(FONT_SIMSUN, 13)
    
    draw_text_centered(draw, '支付记录', IMG_W // 2, 25, f_title, WHITE)
    
    # 表头
    headers = ['订单号', '金额', '状态', '时间']
    col_x = [40, 280, 420, 560]
    for h, cx in zip(headers, col_x):
        draw_text_centered(draw, h, cx + 50, 60, f_hdr, GRAY)
    
    rows = [
        ('ORD-001', '1.5 Pi', '已完成', '15:30'),
        ('ORD-002', '2.0 Pi', '待处理', '16:00'),
        ('ORD-003', '3.0 Pi', '已完成', '16:30'),
        ('ORD-004', '1.5 Pi', '已完成', '17:00'),
        ('ORD-005', '2.0 Pi', '已取消', '17:30'),
    ]
    colors = {'已完成': (57, 255, 20, 150), '待处理': (243, 193, 54, 180), '已取消': (192, 57, 43, 180)}
    
    for i, (oid, amt, status, time) in enumerate(rows):
        y = 95 + i * 70
        draw_card(draw, 30, y, IMG_W - 60, 60, (42, 28, 58) if i % 2 == 0 else (50, 35, 65))
        draw.text((col_x[0], y + 22), oid, font=f_row, fill=GRAY)
        draw.text((col_x[1], y + 22), amt, font=f_row, fill=GOLD)
        sc = colors.get(status, (180, 170, 195))
        draw_card(draw, col_x[2], y + 17, 80, 28, sc)
        draw_text_centered(draw, status, col_x[2] + 40, y + 21, f_hdr, WHITE)
        draw.text((col_x[3], y + 22), time, font=f_row, fill=GRAY)
    
    path = os.path.join(OUT_DIR, '05-payment-history.png')
    img.save(path)
    print(f'  [OK] {path}')


def gen_admin_dashboard():
    img = Image.new('RGB', (IMG_W, IMG_H), (240, 238, 245))
    draw = ImageDraw.Draw(img)
    f_title = load_font(FONT_MSYH, 20)
    f_stat_val = load_font(FONT_MSYH, 28)
    f_label = load_font(FONT_SIMSUN, 13)
    f_row = load_font(FONT_SIMSUN, 14)
    f_hdr = load_font(FONT_SIMSUN, 12)
    
    draw_text_centered(draw, '管理后台 - 数据概览', IMG_W // 2, 25, f_title, (30, 30, 50))
    
    stats = [('总订单', '156', IMG_W // 6), ('总收入', '320 Pi', IMG_W // 2), ('活跃租户', '8', 5 * IMG_W // 6)]
    for label, val, cx in stats:
        draw_card(draw, cx - 90, 60, 180, 80, (255, 255, 255))
        draw_text_centered(draw, val, cx, 72, f_stat_val, ACCENT)
        draw_text_centered(draw, label, cx, 112, f_label, (100, 90, 115))
    
    # 表
    headers2 = ['租户', '状态', '使用量', '操作']
    hx = [40, 200, 380, 520]
    for h, cx in zip(headers2, hx):
        draw_text_centered(draw, h, cx + 40, 170, f_hdr, (100, 90, 115))
    
    tenants = [
        ('beauty-01', 'Active', '45%', '管理'),
        ('fitness-02', 'Active', '72%', '管理'),
        ('edu-03', 'Suspended', '—', '管理'),
    ]
    for i, (t, st, us, act) in enumerate(tenants):
        y = 195 + i * 55
        draw_card(draw, 30, y, IMG_W - 60, 45, (255, 255, 255))
        draw.text((hx[0] + 5, y + 14), t, font=f_row, fill=(50, 50, 70))
        st_color = (57, 255, 20, 150) if st == 'Active' else (192, 57, 43, 180)
        draw_card(draw, hx[1], y + 10, 70, 25, st_color)
        draw_text_centered(draw, st, hx[1] + 35, y + 14, f_hdr, WHITE)
        draw.text((hx[2], y + 14), us, font=f_row, fill=(80, 80, 100))
        draw.text((hx[3], y + 14), act, font=f_row, fill=ACCENT)
    
    path = os.path.join(OUT_DIR, '06-admin-dashboard.png')
    img.save(path)
    print(f'  [OK] {path}')


def gen_settings():
    img = Image.new('RGB', (IMG_W, IMG_H), (240, 238, 245))
    draw = ImageDraw.Draw(img)
    f_title = load_font(FONT_MSYH, 20)
    f_section = load_font(FONT_MSYH, 16)
    f_label = load_font(FONT_SIMSUN, 14)
    f_val = load_font(FONT_SIMSUN, 13)
    
    draw_text_centered(draw, '店铺设置', IMG_W // 2, 25, f_title, (30, 30, 50))
    
    panels = [
        ('基础信息', [('商户名称', '美丽时光美甲'), ('联系电话', '138-0000-0000')], 70),
        ('行业皮肤', [('当前皮肤', 'beauty (美容美甲)')], 190),
        ('AI 服务配置', [('主提供商', 'OpenAI (GPT-4o)'), ('Fallback', 'Anthropic → Ollama')], 280),
        ('功能开关', [('预约管理', '已开启'), ('会员方案', '已关闭')], 400),
    ]
    
    for title, items, y in panels:
        draw_card(draw, 40, y, IMG_W - 80, 90 - 10 if title == '基础信息' else 75, (255, 255, 255))
        draw.text((55, y + 10), title, font=f_section, fill=(60, 50, 80))
        for i, (lbl, val) in enumerate(items):
            draw.text((55, y + 38 + i * 22), lbl, font=f_label, fill=(100, 90, 115))
            draw.text((250, y + 38 + i * 22), val, font=f_val, fill=(80, 70, 100))
    
    # Save 按钮
    draw_card(draw, IMG_W // 2 - 120, 500, 240, 50, ACCENT)
    draw_text_centered(draw, '保存设置', IMG_W // 2, 515, f_section, WHITE)
    
    path = os.path.join(OUT_DIR, '07-settings.png')
    img.save(path)
    print(f'  [OK] {path}')


if __name__ == '__main__':
    print('[INFO] Generating screenshots...')
    gen_login()
    gen_dashboard()
    gen_ai_chat()
    gen_checkout()
    gen_payment()
    gen_admin_dashboard()
    gen_settings()
    print(f'[SUCCESS] All screenshots saved to: {OUT_DIR}')
