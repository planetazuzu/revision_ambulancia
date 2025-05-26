"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { CleaningLog } from "@/types";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface CleaningHistoryProps {
  logs: CleaningLog[];
}

export function CleaningHistory({ logs }: CleaningHistoryProps) {
  if (logs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Historial de Limpieza</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No se encontraron registros de limpieza para esta ambulancia.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-8 shadow-lg">
      <CardHeader>
        <CardTitle>Historial de Limpieza</CardTitle>
        <CardDescription>Registros de limpieza anteriores para esta ambulancia.</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha y Hora</TableHead>
                <TableHead>Responsable</TableHead>
                <TableHead>Materiales Usados</TableHead>
                <TableHead>Observaciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>{format(new Date(log.dateTime), 'PPP p', { locale: es })}</TableCell>
                  <TableCell>{log.responsiblePersonId}</TableCell>
                  <TableCell>{log.materialsUsed}</TableCell>
                  <TableCell>{log.observations || 'N/D'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
