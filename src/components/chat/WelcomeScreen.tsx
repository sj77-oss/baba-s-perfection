import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Zap, Shield, Bot } from "lucide-react";

interface WelcomeScreenProps {
  onStartChat?: () => void;
}

const WelcomeScreen = ({ onStartChat = () => {} }: WelcomeScreenProps) => {
  const features = [
    {
      icon: Bot,
      title: "AI-Powered Assistant",
      description: "Get instant help with our advanced AI chatbot",
    },
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Real-time responses and seamless interactions",
    },
    {
      icon: Shield,
      title: "Secure & Private",
      description: "Your conversations are encrypted and private",
    },
    {
      icon: MessageSquare,
      title: "Smart Conversations",
      description: "Natural language processing for better understanding",
    },
  ];

  return (
    <Card className="w-full max-w-4xl mx-auto border shadow-sm bg-white">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">
          Welcome to AI Chat Assistant
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <p className="text-center text-gray-600">
          Start a conversation with our AI assistant to get help, answers, and
          insights.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {features.map((feature, index) => (
            <div
              key={index}
              className="p-4 rounded-lg border border-gray-100 bg-gray-50 flex items-start space-x-3"
            >
              <div className="bg-blue-100 p-2 rounded-md">
                <feature.icon className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">{feature.title}</h3>
                <p className="text-sm text-gray-500">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-center pt-4">
          <Button size="lg" onClick={onStartChat}>
            <MessageSquare className="mr-2 h-5 w-5" />
            Start a New Chat
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default WelcomeScreen;
