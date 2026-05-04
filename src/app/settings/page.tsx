import { SettingsForm } from "@/components/settings-form";
export const dynamic = "force-dynamic";
export const metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <div className="grid gap-4 max-w-xl">
      <h1 className="text-lg font-semibold">Settings</h1>
      <SettingsForm />
    </div>
  );
}
