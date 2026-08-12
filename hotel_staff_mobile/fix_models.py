import os
import re

d = 'e:/Projects/Mobile app/hotel_staff_mobile/lib/models'
for f in os.listdir(d):
    if not f.endswith('.dart'): continue
    path = os.path.join(d, f)
    with open(path, 'r', encoding='utf-8') as file:
        content = file.read()
    
    # Replace id parsing securely
    content = re.sub(
        r"id:\s*json\['id'\]\s*as\s*int\s*,",
        r"id: json['id'] != null ? (int.tryParse(json['id'].toString()) ?? 0) : (json['_id'] != null ? json['_id'].hashCode : 0),",
        content
    )
    
    content = re.sub(
        r"id:\s*json\['id'\]\s*as\s*int\?\s*\?\?\s*0\s*,",
        r"id: json['id'] != null ? (int.tryParse(json['id'].toString()) ?? 0) : (json['_id'] != null ? json['_id'].hashCode : 0),",
        content
    )

    with open(path, 'w', encoding='utf-8') as file:
        file.write(content)

print('Done!')
