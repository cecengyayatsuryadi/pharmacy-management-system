with open("apps/web/lib/actions/inventory.ts", "r") as f:
    content = f.read()

import re
content = re.sub(
    r"const total = Number\(totalCount\.count\)",
    "const total = Number(totalCount?.count ?? 0)",
    content,
    flags=re.DOTALL
)

with open("apps/web/lib/actions/inventory.ts", "w") as f:
    f.write(content)
