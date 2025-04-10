import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";

export default function WelcomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center">
            Welcome to Hello-Trello
          </CardTitle>
          <CardDescription className="text-center">
            Your simple and powerful task management solution
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-center text-gray-600">
            Organize your tasks, collaborate with your team, and get things done efficiently with Hello-Trello.
          </p>
          <div className="flex justify-center">
            <Button 
              asChild
              className="group"
            >
              <a href="/login">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}