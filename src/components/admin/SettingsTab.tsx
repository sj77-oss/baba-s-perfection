import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";

type Setting = {
  id: string;
  key_name: string;
  key_value: string;
};

export default function SettingsTab() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");

  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase
        .from("secrets")
        .select("*")
        .order("key_name");

      if (data) setSettings(data);
    };

    fetchSettings();

    const channel = supabase
      .channel("admin-settings")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "secrets" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setSettings((prev) => [...prev, payload.new as Setting]);
          } else if (payload.eventType === "DELETE") {
            setSettings((prev) =>
              prev.filter((setting) => setting.id !== payload.old.id),
            );
          } else if (payload.eventType === "UPDATE") {
            setSettings((prev) =>
              prev.map((setting) =>
                setting.id === payload.new.id
                  ? (payload.new as Setting)
                  : setting,
              ),
            );
          }
        },
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, []);

  const addSetting = async () => {
    if (!newKey || !newValue) return;

    await supabase.from("secrets").insert([
      {
        key_name: newKey,
        key_value: newValue,
      },
    ]);

    setNewKey("");
    setNewValue("");
  };

  const updateSetting = async (id: string, value: string) => {
    await supabase.from("secrets").update({ key_value: value }).eq("id", id);
  };

  const deleteSetting = async (id: string) => {
    await supabase.from("secrets").delete().eq("id", id);
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4">
        {settings.map((setting) => (
          <div
            key={setting.id}
            className="flex items-center gap-4 p-4 border rounded-lg"
          >
            <div className="flex-1">
              <Label>{setting.key_name}</Label>
              <Input
                value={setting.key_value}
                onChange={(e) => updateSetting(setting.id, e.target.value)}
              />
            </div>
            <Button
              variant="destructive"
              onClick={() => deleteSetting(setting.id)}
            >
              Delete
            </Button>
          </div>
        ))}
      </div>

      <div className="p-4 border rounded-lg space-y-4">
        <h3 className="font-semibold">Add New Setting</h3>
        <div className="grid gap-4">
          <div>
            <Label>Key</Label>
            <Input
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
              placeholder="Enter key name"
            />
          </div>
          <div>
            <Label>Value</Label>
            <Input
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              placeholder="Enter value"
            />
          </div>
          <Button onClick={addSetting}>Add Setting</Button>
        </div>
      </div>
    </div>
  );
}
