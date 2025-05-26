
"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAppData } from "@/contexts/AppDataContext";
import type { Alert as AppAlert, Space } from "@/types"; // Renamed to avoid conflict with Lucide Alert
import { format, parseISO } from "date-fns";
import { AlertTriangle, Wrench, ShieldAlert, Info, ArchiveBox, PackageWarning } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function AlertsPage() {
  const { alerts: contextAlerts, getAmbulanceById } = useAppData();
  const [ampularioAlerts, setAmpularioAlerts] = useState<AppAlert[]>([]);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [allAlerts, setAllAlerts] = useState<AppAlert[]>([]);
  const [isLoadingAmpularioAlerts, setIsLoadingAmpularioAlerts] = useState(true);
  const [isLoadingSpaces, setIsLoadingSpaces] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchSpacesAndAmpularioAlerts = async () => {
      setIsLoadingSpaces(true);
      setIsLoadingAmpularioAlerts(true);
      try {
        const spacesResponse = await fetch('/api/spaces');
        if (!spacesResponse.ok) throw new Error('No se pudieron cargar los espacios');
        const spacesData: Space[] = await spacesResponse.json();
        setSpaces(spacesData);
      } catch (error: any) {
        toast({ title: "Error", description: `No se pudieron cargar los espacios: ${error.message}`, variant: "destructive" });
      } finally {
        setIsLoadingSpaces(false);
      }

      try {
        const alertsResponse = await fetch('/api/ampulario/alerts');
        if (!alertsResponse.ok) throw new Error('No se pudieron cargar las alertas del Ampulario');
        const alertsData: AppAlert[] = await alertsResponse.json();
        setAmpularioAlerts(alertsData);
      } catch (error: any) {
        toast({ title: "Error", description: `No se pudieron cargar las alertas del Ampulario: ${error.message}`, variant: "destructive" });
      } finally {
        setIsLoadingAmpularioAlerts(false);
      }
    };

    fetchSpacesAndAmpularioAlerts();
  }, [toast]);

  useEffect(() => {
    const combinedAlerts = [...contextAlerts, ...ampularioAlerts];
    const sortedAlerts = combinedAlerts.sort((a, b) => {
        const severityOrder = { high: 0, medium: 1, low: 2 };
        if (severityOrder[a.severity] !== severityOrder[b.severity]) {
        return severityOrder[a.severity] - severityOrder[b.severity];
        }
        return parseISO(b.createdAt).getTime() - parseISO(a.createdAt).getTime();
    });
    setAllAlerts(sortedAlerts);
  }, [contextAlerts, ampularioAlerts]);


  const getIconForAlertType = (type: AppAlert['type'], severity: AppAlert['severity']) => {
    let colorClass = "text-muted-foreground"; // Default for low or undefined
    if (severity === 'high') colorClass = "text-destructive";
    else if (severity === 'medium') colorClass = "text-orange-500";

    switch (type) {
      case 'review_pending': return <Wrench className={`h-5 w-5 ${colorClass}`} />;
      case 'expiring_soon': return <ShieldAlert className={`h-5 w-5 ${colorClass}`} />;
      case 'expired_material': return <AlertTriangle className={`h-5 w-5 ${colorClass}`} />;
      case 'ampulario_expiring_soon': return <PackageWarning className={`h-5 w-5 ${colorClass}`} />;
      case 'ampulario_expired_material': return <ArchiveBox className={`h-5 w-5 ${colorClass}`} />;
      default: return <Info className={`h-5 w-5 ${colorClass}`} />;
    }
  };

  const severityText = (severity: AppAlert['severity']) => {
    switch(severity) {
      case 'high': return 'Alta';
      case 'medium': return 'Media';
      case 'low': return 'Baja';
      default: return severity;
    }
  }

  const isLoading = isLoadingAmpularioAlerts || isLoadingSpaces;

  return (
    <div>
      <PageHeader
        title="Alertas del Sistema"
        description="Resumen de tareas pendientes, caducidad de materiales y otras notificaciones importantes."
      />

      <Card>
        <CardHeader>
          <CardTitle>Todas las Alertas</CardTitle>
          <CardDescription>
            {isLoading && "Cargando alertas..."}
            {!isLoading && (allAlerts.length > 0
              ? `Mostrando ${allAlerts.length} alerta(s).`
              : "No hay alertas activas. ¡El sistema funciona correctamente!")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
             <div className="text-center py-10">
              <Info className="mx-auto h-12 w-12 text-muted-foreground animate-pulse" />
              <p className="mt-4 text-lg font-medium">Cargando Alertas...</p>
            </div>
          ) : allAlerts.length > 0 ? (
            <ScrollArea className="h-[calc(100vh-20rem)] rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">Tipo</TableHead>
                    <TableHead>Mensaje</TableHead>
                    <TableHead>Contexto</TableHead> {/* Ambulance or Space Name */}
                    <TableHead>Gravedad</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead className="text-right">Acción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allAlerts.map((alert) => {
                    const ambulance = alert.ambulanceId ? getAmbulanceById(alert.ambulanceId) : null;
                    const space = alert.spaceId ? spaces.find(s => s.id === alert.spaceId) : null;
                    const contextName = ambulance 
                                        ? ambulance.name 
                                        : (space 
                                            ? space.name 
                                            : (alert.spaceId ? `Espacio ID: ${alert.spaceId}` : 'Sistema'));
                    
                    return (
                      <TableRow key={alert.id} className={alert.severity === 'high' ? 'bg-destructive/5 hover:bg-destructive/10' : (alert.severity === 'medium' ? 'bg-orange-500/5 hover:bg-orange-500/10' : '')}>
                        <TableCell>{getIconForAlertType(alert.type, alert.severity)}</TableCell>
                        <TableCell className="font-medium">{alert.message}</TableCell>
                        <TableCell>{contextName}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold capitalize
                            ${alert.severity === 'high' ? 'bg-destructive text-destructive-foreground' :
                              alert.severity === 'medium' ? 'bg-orange-500 text-white' :
                              'bg-muted text-muted-foreground'}`}>
                            {severityText(alert.severity)}
                          </span>
                        </TableCell>
                        <TableCell>{format(parseISO(alert.createdAt), 'PPP')}</TableCell>
                        <TableCell className="text-right">
                          {alert.ambulanceId && (
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/dashboard/ambulances/${alert.ambulanceId}/review`}>Ver Ambulancia</Link>
                            </Button>
                          )}
                           {alert.type.startsWith('ampulario_') && alert.spaceId && (
                             <Button variant="outline" size="sm" asChild>
                              <Link href={`/dashboard/ampulario?spaceId=${alert.spaceId}&materialId=${alert.materialId}`}>Ver Ampulario</Link>
                            </Button>
                           )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </ScrollArea>
          ) : (
            <div className="text-center py-10">
              <Info className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-lg font-medium">¡Todo en orden!</p>
              <p className="text-muted-foreground">No hay alertas pendientes en este momento.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
