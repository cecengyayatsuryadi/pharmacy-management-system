import re

with open("apps/web/app/dashboard/settings/organization/organization-form.tsx", "r") as f:
    content = f.read()

content = content.replace(
    'import { SaveIcon, Loader2Icon, Building2Icon } from "lucide-react"',
    'import { SaveIcon, Loader2Icon, Building2Icon } from "lucide-react"\nimport type { Organization } from "@workspace/database"'
)

content = content.replace(
    'export function OrganizationForm({ organization }: { organization: any }) {',
    'export function OrganizationForm({ organization }: { organization: Organization }) {'
)

with open("apps/web/app/dashboard/settings/organization/organization-form.tsx", "w") as f:
    f.write(content)
