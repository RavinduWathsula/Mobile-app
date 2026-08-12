import os
import re

d = 'e:/Projects/Mobile app/hotel_staff_mobile/lib/models'
for f in os.listdir(d):
    if not f.endswith('.dart'): continue
    path = os.path.join(d, f)
    with open(path, 'r', encoding='utf-8') as file:
        content = file.read()

    # Replace "as int"
    content = re.sub(r"as\s*int\s*,", r"!= null ? (int.tryParse(json['\g<0>'.split(\"'\")[1]].toString()) ?? 0) : 0,", content)
    # wait this regex is wrong because \g<0> won't contain the key.
    
    pass
