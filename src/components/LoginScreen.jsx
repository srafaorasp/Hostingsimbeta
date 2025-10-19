import React from 'react';
import useGameStore from '../store/gameStore';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { startingScenarios } from '../data';
import Logo from './Logo';


const LoginScreen = () => {
  const { login, setSelectedScenario, selectedScenario } = useGameStore();

  const handleScenarioChange = (value) => {
    setSelectedScenario(value);
  };

  const handleLogin = () => {
    login();
  };

  const selectedScenarioDetails = startingScenarios.find(s => s.id === selectedScenario);

  return (
    <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
      <Card className="w-full max-w-md bg-gray-800 border-gray-700">
        <CardHeader className="text-center">
            <div className="mx-auto w-24 h-24">
                <Logo />
            </div>
          <CardTitle className="text-3xl font-bold">Hosting Sim</CardTitle>
          <CardDescription>Select your starting scenario to begin.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Select onValueChange={handleScenarioChange} defaultValue={selectedScenario}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a scenario" />
              </SelectTrigger>
              <SelectContent>
                {startingScenarios.map((scenario) => (
                  <SelectItem key={scenario.id} value={scenario.id}>
                    {scenario.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedScenarioDetails && (
              <div className="p-4 border border-gray-600 rounded-md">
                <p className="text-sm text-gray-400">{selectedScenarioDetails.description}</p>
                <p className="text-lg font-bold text-green-400 mt-2">
                  Starting Cash: ${selectedScenarioDetails.startingCash.toLocaleString()}
                </p>
              </div>
            )}
            <Button onClick={handleLogin} className="w-full" disabled={!selectedScenario}>
              Start Game
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginScreen;

