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
import { Badge } from "../components/ui/badge";

const TeamView = () => {
  const { team, hireMember } = useGameStore();

  const getSkillBadgeVariant = (level) => {
    if (level > 7) return "success";
    if (level > 4) return "warning";
    return "destructive";
  };

  return (
    <div className="p-4 h-full overflow-y-auto">
      <Card className="bg-gray-800 border-gray-700 text-white">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Team Management</CardTitle>
          <Button onClick={() => hireMember("Engineer")}>Hire Engineer</Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-gray-600 hover:bg-gray-700">
                <TableHead className="text-gray-300">Name</TableHead>
                <TableHead className="text-gray-300">Role</TableHead>
                <TableHead className="text-gray-300">Salary</TableHead>
                <TableHead className="text-gray-300">Skills</TableHead>
                <TableHead className="text-gray-300">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {team.map((member) => (
                <TableRow key={member.id} className="border-gray-700 hover:bg-gray-750">
                  <TableCell>{member.name}</TableCell>
                  <TableCell>{member.role}</TableCell>
                  <TableCell>${member.salary.toLocaleString()}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(member.skills).map(([skill, level]) => (
                        <Badge
                          key={skill}
                          variant={getSkillBadgeVariant(level)}
                          className="text-xs"
                        >
                          {skill}: {level}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>{member.status}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default TeamView;

