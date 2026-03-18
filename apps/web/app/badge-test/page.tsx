import { Badge } from "@workspace/ui/components/badge"

export default function BadgeTestPage() {
  return (
    <div className="p-10 space-y-8 bg-background text-foreground min-h-screen">
      <section className="space-y-4">
        <h1 className="text-2xl font-bold">Badge Light Mode Preview</h1>
        <div className="flex flex-wrap gap-4">
          <Badge variant="default">Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="success">Success</Badge>
          <Badge variant="warning">Warning</Badge>
          <Badge variant="destructive">Destructive</Badge>
          <Badge variant="outline">Outline</Badge>
        </div>
      </section>

      <section className="dark space-y-4 bg-slate-900 p-6 rounded-xl">
        <h1 className="text-2xl font-bold text-white">Badge Dark Mode Preview</h1>
        <div className="flex flex-wrap gap-4">
          <Badge variant="default">Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="success">Success</Badge>
          <Badge variant="warning">Warning</Badge>
          <Badge variant="destructive">Destructive</Badge>
          <Badge variant="outline">Outline</Badge>
        </div>
      </section>
    </div>
  )
}
