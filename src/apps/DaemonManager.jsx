import React from "react";
import useGameStore from "../store/gameStore";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Play, StopCircle } from "lucide-react";

const DaemonManager = () => {
  const { servers, daemons, toggleDaemon, addLog } = useGameStore();

  const handleToggle = (daemonId) => {
    const daemon = daemons.find((d) => d.id === daemonId);
    if (daemon) {
      toggleDaemon(daemonId);
      addLog({
        source: "System",
        message: `Daemon '${daemon.name}' on server ${daemon.serverId} has been ${
          daemon.running ? "stopped" : "started"
        }.`,
      });
    }
  };

  return (
    <div className="p-4 h-full overflow-y-auto">
      <Card className="bg-gray-800 border-gray-700 text-white">
        <CardHeader>
          <CardTitle>Daemon Manager</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-gray-600">
                <TableHead className="text-gray-300">Daemon</TableHead>
                <TableHead className="text-gray-300">Server</TableHead>
                <TableHead className="text-gray-300">Status</TableHead>
                <TableHead className="text-right text-gray-300">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {daemons.map((daemon) => (
                <TableRow key={daemon.id} className="border-gray-700">
                  <TableCell>{daemon.name}</TableCell>
                  <TableCell>{daemon.serverId}</TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        daemon.running
                          ? "bg-green-500/20 text-green-400"
                          : "bg-red-500/20 text-red-400"
                      }`}
                    >
                      {daemon.running ? "Running" : "Stopped"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggle(daemon.id)}
                    >
                      {daemon.running ? (
                        <StopCircle className="h-4 w-4 mr-2" />
                      ) : (
                        <Play className="h-4 w-4 mr-2" />
                      )}
                      {daemon.running ? "Stop" : "Start"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default DaemonManager;

