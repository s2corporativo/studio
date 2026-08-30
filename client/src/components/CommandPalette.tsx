import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Moon, Sun } from "lucide-react";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { navigationSections } from "@/lib/navigation";
import { useTheme } from "@/contexts/ThemeContext";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [, setLocation] = useLocation();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(previous => !previous);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const go = (path: string) => {
    setLocation(path);
    setOpen(false);
  };

  return (
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
  );
}
