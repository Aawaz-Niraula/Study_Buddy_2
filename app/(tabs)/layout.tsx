import { MascotProvider } from "@/lib/mascot/MascotContext";
import { AppShell } from "@/components/layout/AppShell";

export default function TabsLayout({ children }: { children: React.ReactNode }) {
  return (
    <MascotProvider>
      <AppShell>{children}</AppShell>
    </MascotProvider>
  );
}
