"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAppData } from "@/contexts/AppDataContext";
import type { Alert as AppAlert } from "@/types"; // Renamed to avoid conflict with Lucide Alert
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
  const [allAlerts, setAllAlerts] = useState<AppAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchAmpularioAlerts = async () => {
      try {
        // Assuming default space or all spaces for alerts overview.
        // Adjust API call if specific space filtering is needed here.
        const response = await fetch('/api/ampulario/alerts');
        if (!response.ok) throw new Error('Failed to fetch Ampulario alerts');
        const data: AppAlert[] = await response.json();
        setAmpularioAlerts(data);
      } catch (error: any) {
        toast({ title: "Error", description: `Could not load Ampulario alerts: ${error.message}`, variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };

    fetchAmpularioAlerts();
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
    else if (severity === 'medium') colorClass = "text-orange-500"; // Using a direct orange

    switch (type) {
      case 'review_pending': return <Wrench className={`h-5 w-5 ${colorClass}`} />;
      case 'expiring_soon': return <ShieldAlert className={`h-5 w-5 ${colorClass}`} />;
      case 'expired_material': return <AlertTriangle className={`h-5 w-5 ${colorClass}`} />;
      case 'ampulario_expiring_soon': return <PackageWarning className={`h-5 w-5 ${colorClass}`} />;
      case 'ampulario_expired_material': return <ArchiveBox className={`h-5 w-5 ${colorClass}`} />;
      default: return <Info className={`h-5 w-5 ${colorClass}`} />;
    }
  };


  return (
    <div>
      <PageHeader
        title="System Alerts"
        description="Overview of pending tasks, material expiry, and other important notifications."
      />

      <Card>
        <CardHeader>
          <CardTitle>All Alerts</CardTitle>
          <CardDescription>
            {isLoading && "Loading alerts..."}
            {!isLoading && (allAlerts.length > 0 
              ? `Showing ${allAlerts.length} alert(s).` 
              : "No active alerts. System is running smoothly!")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
             <div className="text-center py-10">
              <Info className="mx-auto h-12 w-12 text-muted-foreground animate-pulse" />
              <p className="mt-4 text-lg font-medium">Loading Alerts...</p>
            </div>
          ) : allAlerts.length > 0 ? (
            <ScrollArea className="h-[calc(100vh-20rem)] rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">Type</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead>Context</TableHead> {/* Ambulance or Space */}
                    <TableHead>Severity</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allAlerts.map((alert) => {
                    const ambulance = alert.ambulanceId ? getAmbulanceById(alert.ambulanceId) : null;
                    const contextName = ambulance ? ambulance.name : (alert.spaceId ? `Space ID: ${alert.spaceId}` : 'System');
                    // TODO: Fetch space name if alert.spaceId exists for better display

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
                            {alert.severity}
                          </span>
                        </TableCell>
                        <TableCell>{format(parseISO(alert.createdAt), 'PPP')}</TableCell>
                        <TableCell className="text-right">
                          {alert.ambulanceId && (
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/dashboard/ambulances/${alert.ambulanceId}/review`}>View Ambulance</Link>
                            </Button>
                          )}
                           {alert.type.startsWith('ampulario_') && alert.spaceId && (
                             <Button variant="outline" size="sm" asChild>
                              <Link href={`/dashboard/ampulario?spaceId=${alert.spaceId}&materialId=${alert.materialId}`}>View Ampulario</Link>
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
              <p className="mt-4 text-lg font-medium">All Clear!</p>
              <p className="text-muted-foreground">There are no pending alerts at the moment.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
