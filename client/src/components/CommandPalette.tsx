import { useEffect, useState, useCallback } from "react";
import { useLocation } from "wouter";
import { Moon, Sun, Search } from "lucide-react";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { navigationSections } from "@/lib/navigation";
import { useTheme } from "@/contexts/ThemeContext";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [, setLocation] = useLocation();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      // Only respond to Cmd+K / Ctrl+K
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(previous => !previous);
      }
      // Close on Escape
      if (event.key === "Escape") {
        setOpen(false);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const go = useCallback((path: string) => {
    setLocation(path);
    setOpen(false);
  }, [setLocation]);

  return (
    <>
      {/* Trigger button - only opens on click, never auto-opens */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 h-9 px-3 rounded-lg border border-border bg-muted/50 hover:bg-muted text-sm text-muted-foreground transition-colors"
        aria-label="Abrir busca rápida (Ctrl+K)"
      >
        <Search className="w-4 h-4" />
        <span className="hidden sm:inline">Buscar...</span>
        <kbd className="hidden sm:inline-flex h-5 items-center gap-0.5 rounded border bg-background px-1 text-[10px] font-medium">
          ⌘K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen} title="Busca rápida" description="Navegue pelo Social Studio ou alterne o tema">
        <CommandInput placeholder="Buscar uma tela ou ação..." />
        <CommandList>
          <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
          <CommandGroup heading="Ações">
            <CommandItem onSelect={() => { toggleTheme?.(); setOpen(false); }}>
              {theme === "light" ? <Moon /> : <Sun />}
              <span>{theme === "light" ? "Ativar modo escuro" : "Ativar modo claro"}</span>
            </CommandItem>
          </CommandGroup>
          {navigationSections.map(section => (
            <CommandGroup key={section.label} heading={section.label}>
              {section.items.map(item => (
                <CommandItem key={item.path} onSelect={() => go(item.path)}>
                  <item.icon />
                  <span>{item.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          ))}
        </CommandList>
      </CommandDialog>
    </>
  );
}
