import json
cfg = json.load(open('config.json', encoding='utf-8'))
cfg['ocr']['min_text_chars_for_skip'] = 999999
json.dump(cfg, open('config.json', 'w', encoding='utf-8'), indent=2, ensure_ascii=False)
print('OCR threshold: 999999')
