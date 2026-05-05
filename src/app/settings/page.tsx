import { SettingsForm } from "@/components/settings-form";
export const dynamic = "force-dynamic";
export const metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <div className="grid gap-4 max-w-2xl">
      <header>
        <h1 className="text-lg font-semibold">Settings</h1>
        <p className="text-xs text-muted-foreground">
          All preferences are stored locally in this browser.
        </p>
      </header>
      <SettingsForm />
    </div>
  );
}
