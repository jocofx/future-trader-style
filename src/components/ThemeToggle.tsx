import { Moon, Sun } from "lucide-react";
import { useTheme } from "./theme-provider";
import { Button } from "./ui/button";

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <Button variant="glass" size="icon" onClick={toggle} aria-label="Cambiar tema" className="rounded-full">
      {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}
