import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTheme } from "@/components/theme-provider"

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const resolved =
    theme === "system"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      : theme
  const label =
    resolved === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      onClick={() => setTheme(resolved === "dark" ? "light" : "dark")}
      aria-label={label}
      title={label}
      className="rounded-full text-muted-foreground"
    >
      {resolved === "dark" ? (
        <Sun className="size-4" />
      ) : (
        <Moon className="size-4" />
      )}
    </Button>
  )
}
