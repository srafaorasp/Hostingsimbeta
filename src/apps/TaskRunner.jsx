import React, { useState } from "react";
import useGameStore from "../store/gameStore";
import { Button } from "../components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { CheckCircle, Clock, XCircle } from "lucide-react";

const TaskRunner = () => {
  const { scripts, tasks, scheduleTask } = useGameStore();
  const [selectedScript, setSelectedScript] = useState("");
  const [interval, setInterval] = useState(10); // Default 10 seconds

  const handleSchedule = () => {
    if (selectedScript && interval > 0) {
      scheduleTask(selectedScript, interval * 1000);
    }
  };

  const isTaskScheduled = (scriptId) => {
    return tasks.some((task) => task.scriptId === scriptId);
  };

  const getTaskStatus = (scriptId) => {
    const task = tasks.find((t) => t.scriptId === scriptId);
    if (!task) return { text: "Not Scheduled", color: "text-gray-400", icon: XCircle };
    // This logic is simplified; a real implementation would be more robust
    return { text: "Scheduled", color: "text-blue-400", icon: Clock };
  };

  return (
    <div className="p-4 h-full overflow-y-auto">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-1">
          <Card className="bg-gray-800 border-gray-700 text-white">
            <CardHeader>
              <CardTitle>Schedule a New Task</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="script-select">Script</Label>
                <Select onValueChange={setSelectedScript}>
                  <SelectTrigger className="w-full bg-gray-700 border-gray-600">
                    <SelectValue placeholder="Select a script" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 text-white border-gray-600">
                    {scripts.map((script) => (
                      <SelectItem
                        key={script.id}
                        value={script.id}
                        disabled={isTaskScheduled(script.id)}
                      >
                        {script.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="interval-input">Interval (seconds)</Label>
                <Input
                  id="interval-input"
                  type="number"
                  value={interval}
                  onChange={(e) => setInterval(Number(e.target.value))}
                  min="1"
                  className="bg-gray-700 border-gray-600"
                />
              </div>
              <Button
                onClick={handleSchedule}
                disabled={!selectedScript || isTaskScheduled(selectedScript)}
                className="w-full"
              >
                {isTaskScheduled(selectedScript) ? "Already Scheduled" : "Schedule"}
              </Button>
            </CardContent>
          </Card>
        </div>
        <div className="md:col-span-2">
          <Card className="bg-gray-800 border-gray-700 text-white">
            <CardHeader>
              <CardTitle>Scheduled Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-600">
                    <TableHead className="text-gray-300">Script</TableHead>
                    <TableHead className="text-gray-300">Interval</TableHead>
                    <TableHead className="text-gray-300">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tasks.map((task) => {
                    const script = scripts.find((s) => s.id === task.scriptId);
                    const status = getTaskStatus(task.scriptId);
                    const StatusIcon = status.icon;

                    return (
                      <TableRow key={task.id} className="border-gray-700">
                        <TableCell>{script ? script.name : "Unknown"}</TableCell>
                        <TableCell>{task.interval / 1000}s</TableCell>
                        <TableCell className={status.color}>
                          <div className="flex items-center">
                            <StatusIcon className="h-4 w-4 mr-2" />
                            {status.text}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TaskRunner;

