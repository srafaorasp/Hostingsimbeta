import React from 'react';
import { useGameStore } from '../store/gameStore';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { isps } from '../data';

const ISPConnect = () => {
  const { player, signIspContract, cancelIspContract } = useGameStore();
  const contract = player.ispContract;

  if (contract) {
    const provider = isps.find(p => p.id === contract.providerId);
    return (
      <div className="p-4 h-full flex flex-col">
        <h2 className="text-xl font-bold mb-4">Current Internet Contract</h2>
        <Card className="bg-gray-800 border-gray-700 text-white">
          <CardHeader>
            <CardTitle>{provider.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-300">
              You have an active internet contract with {provider.name}.
            </p>
            <div className="mt-4 space-y-2">
              <p><strong>Speed:</strong> {contract.speed} Gbps</p>
              <p><strong>Monthly Cost:</strong> ${contract.cost.toLocaleString()}</p>
              <p><strong>Contract Signed:</strong> {new Date(contract.signDate).toLocaleDateString()}</p>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="destructive" onClick={cancelIspContract}>
              Cancel Contract
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 h-full flex flex-col">
      <h2 className="text-xl font-bold mb-4">Available Internet Service Providers</h2>
      <div className="space-y-4 overflow-y-auto">
        {isps.map((isp) => (
          <Card key={isp.id} className="bg-gray-800 border-gray-700 text-white">
            <CardHeader>
              <CardTitle>{isp.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300">{isp.description}</p>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <p className="font-semibold text-lg">{isp.speed} Gbps</p>
                  <p className="text-sm text-gray-400">Speed</p>
                </div>
                <div>
                  <p className="font-semibold text-lg">${isp.cost.toLocaleString()}</p>
                  <p className="text-sm text-gray-400">Monthly Cost</p>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full bg-green-600 hover:bg-green-700"
                onClick={() => signIspContract(isp.id)}
              >
                Sign Contract
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ISPConnect;
