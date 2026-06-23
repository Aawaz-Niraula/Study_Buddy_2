import { MascotProvider } from "@/lib/mascot/MascotContext";
import { StudyDataProvider } from "@/lib/StudyDataContext";
import { AppShell } from "@/components/layout/AppShell";

export default function TabsLayout({ children }: { children: React.ReactNode }) {
  return (
    <MascotProvider>
      <StudyDataProvider>
        <AppShell>{children}</AppShell>
      </StudyDataProvider>
    </MascotProvider>
  );
}
