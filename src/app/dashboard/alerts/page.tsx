"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAppData } from "@/contexts/AppDataContext";
import type { Alert } from "@/types";
import { format } from "date-fns";
import { AlertTriangle, Wrench, ShieldAlert, Info } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function AlertsPage() {
  const { alerts, getAmbulanceById } = useAppData();

  const getIconForAlertType = (type: Alert['type'], severity: Alert['severity']) => {
    let colorClass = "text-muted-foreground";
    if (severity === 'high') colorClass = "text-destructive";
    else if (severity === 'medium') colorClass = "text-orange-500"; // Using a direct orange here for visibility

    switch (type) {
      case 'review_pending': return <Wrench className={`h-5 w-5 ${colorClass}`} />;
      case 'expiring_soon': return <ShieldAlert className={`h-5 w-5 ${colorClass}`} />;
      case 'expired_material': return <AlertTriangle className={`h-5 w-5 ${colorClass}`} />;
      default: return <Info className={`h-5 w-5 ${colorClass}`} />;
    }
  };

  const sortedAlerts = [...alerts].sort((a, b) => {
    const severityOrder = { high: 0, medium: 1, low: 2 };
    if (severityOrder[a.severity] !== severityOrder[b.severity]) {
      return severityOrder[a.severity] - severityOrder[b.severity];
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

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
            {sortedAlerts.length > 0 
              ? `Showing ${sortedAlerts.length} alert(s).` 
              : "No active alerts. System is running smoothly!"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sortedAlerts.length > 0 ? (
            <ScrollArea className="h-[calc(100vh-20rem)] rounded-md border"> {/* Adjust height as needed */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">Type</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead>Ambulance</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedAlerts.map((alert) => {
                    const ambulance = alert.ambulanceId ? getAmbulanceById(alert.ambulanceId) : null;
                    return (
                      <TableRow key={alert.id} className={alert.severity === 'high' ? 'bg-destructive/5 hover:bg-destructive/10' : (alert.severity === 'medium' ? 'bg-orange-500/5 hover:bg-orange-500/10' : '')}>
                        <TableCell>{getIconForAlertType(alert.type, alert.severity)}</TableCell>
                        <TableCell className="font-medium">{alert.message}</TableCell>
                        <TableCell>{ambulance ? ambulance.name : 'N/A'}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold capitalize
                            ${alert.severity === 'high' ? 'bg-destructive text-destructive-foreground' : 
                              alert.severity === 'medium' ? 'bg-orange-500 text-white' : 
                              'bg-muted text-muted-foreground'}`}>
                            {alert.severity}
                          </span>
                        </TableCell>
                        <TableCell>{format(new Date(alert.createdAt), 'PPP')}</TableCell>
                        <TableCell className="text-right">
                          {alert.ambulanceId && (
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/dashboard/ambulances/${alert.ambulanceId}/review`}>View Details</Link>
                            </Button>
                          )}
                           {/* Placeholder for material-specific link if needed */}
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
