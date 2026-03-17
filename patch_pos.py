with open("apps/web/app/dashboard/pos/pos-client.tsx", "r") as f:
    content = f.read()

import re
content = re.sub(
    r"if \(filteredMedicines\.length === 1\) \{\n                      addToCart\(filteredMedicines\[0\]\)",
    """if (filteredMedicines.length === 1 && filteredMedicines[0]) {
                      addToCart(filteredMedicines[0])""",
    content,
    flags=re.DOTALL
)

with open("apps/web/app/dashboard/pos/pos-client.tsx", "w") as f:
    f.write(content)
