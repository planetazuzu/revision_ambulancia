"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppData } from "@/contexts/AppDataContext";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { AlertTriangle, Ambulance, Box, CheckCircle, ShieldAlert, Sparkles, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function DashboardPage() {
  const { user } = useAuth();
  const { alerts, ambulances, generateAlerts } = useAppData();

  // Ensure alerts are up-to-date when component mounts or dependencies change.
  // generateAlerts is already called in AppDataContext on data change, so direct call might be redundant
  // but can be useful if specific re-triggering logic is needed on this page.

  const highSeverityAlerts = alerts.filter(alert => alert.severity === 'high');
  const mediumSeverityAlerts = alerts.filter(alert => alert.severity === 'medium');

  const getIconForAlertType = (type: string) => {
    switch (type) {
      case 'review_pending': return <Wrench className="h-5 w-5 text-yellow-500" />;
      case 'expiring_soon': return <ShieldAlert className="h-5 w-5 text-yellow-500" />;
      case 'expired_material': return <AlertTriangle className="h-5 w-5 text-red-500" />;
      default: return <AlertTriangle className="h-5 w-5 text-muted-foreground" />;
    }
  };
  
  const getAmbulanceStatus = (ambulance: typeof ambulances[0]) => {
    if (!ambulance.mechanicalReviewCompleted) return { text: "Needs Mechanical Review", Icon: Wrench, color: "text-orange-500", path: `/dashboard/ambulances/${ambulance.id}/review` };
    if (!ambulance.cleaningCompleted) return { text: "Needs Cleaning", Icon: Sparkles, color: "text-blue-500", path: `/dashboard/ambulances/${ambulance.id}/cleaning` };
    if (!ambulance.inventoryCompleted) return { text: "Needs Inventory Check", Icon: Box, color: "text-purple-500", path: `/dashboard/ambulances/${ambulance.id}/inventory` };
    return { text: "All Checks Completed", Icon: CheckCircle, color: "text-green-500", path: `/dashboard/ambulances/${ambulance.id}/review`};
  }

  return (
    <div className="container mx-auto py-2">
      <PageHeader 
        title={`Welcome, ${user?.name || 'User'}!`}
        description="Here's an overview of your ambulance fleet status."
      />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Urgent Alerts</CardTitle>
            <CardDescription>Immediate attention required for these items.</CardDescription>
          </CardHeader>
          <CardContent>
            {highSeverityAlerts.length > 0 ? (
              <ScrollArea className="h-[200px]">
              <ul className="space-y-3">
                {highSeverityAlerts.map(alert => (
                  <li key={alert.id} className="flex items-start gap-3 p-3 bg-destructive/10 rounded-md">
                    {getIconForAlertType(alert.type)}
                    <div>
                      <p className="font-medium text-sm text-destructive">{alert.message}</p>
                      {alert.ambulanceId && (
                         <Button variant="link" size="sm" className="p-0 h-auto text-destructive hover:text-destructive/80" asChild>
                            <Link href={`/dashboard/ambulances/${alert.ambulanceId}/review`}>View Ambulance</Link>
                         </Button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
              </ScrollArea>
            ) : (
              <p className="text-muted-foreground">No high severity alerts. Great job!</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pending Actions</CardTitle>
            <CardDescription>Items that need your attention soon.</CardDescription>
          </CardHeader>
          <CardContent>
             {mediumSeverityAlerts.length > 0 ? (
              <ScrollArea className="h-[200px]">
              <ul className="space-y-3">
                {mediumSeverityAlerts.map(alert => (
                  <li key={alert.id} className="flex items-start gap-3 p-3 bg-accent/10 rounded-md">
                    {getIconForAlertType(alert.type)}
                     <div>
                      <p className="font-medium text-sm text-accent-foreground-dark">{alert.message}</p> {/* Assuming a dark variant for accent fg */}
                       {alert.ambulanceId && (
                         <Button variant="link" size="sm" className="p-0 h-auto text-accent-foreground-dark hover:text-accent/80" asChild>
                            <Link href={`/dashboard/ambulances/${alert.ambulanceId}/review`}>View Ambulance</Link>
                         </Button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
              </ScrollArea>
            ) : (
              <p className="text-muted-foreground">No medium severity alerts currently.</p>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Ambulance Status Overview</CardTitle>
            <CardDescription>Quick view of current tasks for each ambulance.</CardDescription>
          </CardHeader>
          <CardContent>
            {ambulances.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {ambulances.map(ambulance => {
                  const status = getAmbulanceStatus(ambulance);
                  return (
                    <Card key={ambulance.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Ambulance className="h-6 w-6 text-primary" />
                          {ambulance.name}
                        </CardTitle>
                        <CardDescription>{ambulance.licensePlate}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-2">
                          <status.Icon className={`h-5 w-5 ${status.color}`} />
                          <p className={`text-sm font-medium ${status.color}`}>{status.text}</p>
                        </div>
                      </CardContent>
                      <CardFooter>
                        <Button asChild className="w-full">
                           <Link href={status.path}>
                             {status.text === "All Checks Completed" ? "View Details" : "Proceed to Task"}
                           </Link>
                        </Button>
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <p className="text-muted-foreground">No ambulances registered yet. <Link href="/dashboard/ambulances" className="text-primary hover:underline">Add an ambulance</Link> to get started.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
