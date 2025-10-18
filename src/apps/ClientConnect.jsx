import React from "react";
import useGameStore from "../store/gameStore";
import { CLIENT_CONTRACTS } from "../data";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";

const ClientConnect = () => {
  // In a real implementation, this would be tied to game state
  const contracts = CLIENT_CONTRACTS;

  return (
    <div className="p-4 h-full overflow-y-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {contracts.map((contract) => (
          <Card
            key={contract.id}
            className="bg-gray-800 border-gray-700 text-white flex flex-col"
          >
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>{contract.name}</CardTitle>
                  <CardDescription className="text-gray-400">
                    Client: {contract.client}
                  </CardDescription>
                </div>
                <Badge variant="success">
                  ${contract.reward.toLocaleString()}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="flex-grow">
              <p className="text-sm text-gray-300">{contract.description}</p>
              <div className="mt-4">
                <h4 className="text-xs font-semibold text-gray-400 mb-2">
                  REQUIREMENTS
                </h4>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(contract.requirements.skills).map(
                    ([skill, level]) => (
                      <Badge key={skill} variant="secondary">
                        {skill}: Lvl {level}
                      </Badge>
                    )
                  )}
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full">Accept Contract</Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ClientConnect;
