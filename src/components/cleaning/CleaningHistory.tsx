"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { CleaningLog } from "@/types";
import { format } from "date-fns";

interface CleaningHistoryProps {
  logs: CleaningLog[];
  // In a real app, you'd fetch user names based on responsiblePersonId
  // For now, we'll just show the ID or a mock name.
}

export function CleaningHistory({ logs }: CleaningHistoryProps) {
  if (logs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cleaning History</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No cleaning logs found for this ambulance.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-8 shadow-lg">
      <CardHeader>
        <CardTitle>Cleaning History</CardTitle>
        <CardDescription>Past cleaning records for this ambulance.</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date & Time</TableHead>
                <TableHead>Responsible</TableHead>
                <TableHead>Materials Used</TableHead>
                <TableHead>Observations</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>{format(new Date(log.dateTime), 'PPP p')}</TableCell>
                  <TableCell>{log.responsiblePersonId}</TableCell> {/* Mock: replace with actual name */}
                  <TableCell>{log.materialsUsed}</TableCell>
                  <TableCell>{log.observations || 'N/A'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
