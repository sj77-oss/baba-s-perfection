import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";

interface ChatSettingsProps {
  onSave?: (settings: {
    darkMode: boolean;
    fontSize: number;
    notifications: boolean;
  }) => void;
}

const ChatSettings = ({ onSave = () => {} }: ChatSettingsProps) => {
  const [darkMode, setDarkMode] = useState(false);
  const [fontSize, setFontSize] = useState(16);
  const [notifications, setNotifications] = useState(true);

  const handleSave = () => {
    onSave({ darkMode, fontSize, notifications });
  };

  return (
    <Card className="w-full max-w-md mx-auto border shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl">Chat Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="dark-mode">Dark Mode</Label>
            <p className="text-sm text-gray-500">
              Switch between light and dark theme
            </p>
          </div>
          <Switch
            id="dark-mode"
            checked={darkMode}
            onCheckedChange={setDarkMode}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="font-size">Font Size</Label>
            <span className="text-sm font-medium">{fontSize}px</span>
          </div>
          <Slider
            id="font-size"
            min={12}
            max={24}
            step={1}
            value={[fontSize]}
            onValueChange={(value) => setFontSize(value[0])}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="notifications">Notifications</Label>
            <p className="text-sm text-gray-500">
              Receive notifications for new messages
            </p>
          </div>
          <Switch
            id="notifications"
            checked={notifications}
            onCheckedChange={setNotifications}
          />
        </div>

        <Button className="w-full" onClick={handleSave}>
          Save Settings
        </Button>
      </CardContent>
    </Card>
  );
};

export default ChatSettings;
