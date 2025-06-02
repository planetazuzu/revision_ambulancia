"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart, Users, Activity, DollarSign, Home } from "lucide-react";
import { ResponsiveContainer, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend } from 'recharts';
import React from 'react';

// Datos de ejemplo para el gráfico
const chartData = [
  { name: 'Ene', 'Nuevos Clientes': 30, 'Ingresos (€)': 2400 },
  { name: 'Feb', 'Nuevos Clientes': 20, 'Ingresos (€)': 1398 },
  { name: 'Mar', 'Nuevos Clientes': 50, 'Ingresos (€)': 9800 },
  { name: 'Abr', 'Nuevos Clientes': 27, 'Ingresos (€)': 3908 },
  { name: 'May', 'Nuevos Clientes': 60, 'Ingresos (€)': 4800 },
  { name: 'Jun', 'Nuevos Clientes': 23, 'Ingresos (€)': 3800 },
];

// Placeholder para KPIs
const kpiData = [
  { title: "Nuevos Clientes (Mes)", value: "85", icon: Users, change: "+15%", changeType: "positive" },
  { title: "Proyectos Activos", value: "120", icon: Activity, change: "+5", changeType: "positive" },
  { title: "Ingresos (Mes)", value: "€12,450", icon: DollarSign, change: "-2.3%", changeType: "negative" },
  { title: "Tasa de Conversión", value: "25%", icon: BarChart, change: "+1.2%", changeType: "positive" },
];

export default function DashboardCrmPage() {
  return (
    <div className="flex-1 space-y-6 p-4 md:p-6 pt-6 theme-rioja">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight" style={{ color: 'hsl(var(--foreground-rioja))'}}>Dashboard Principal</h2>
        {/* <div className="flex items-center space-x-2">
          <Button className="button-primary-rioja">Exportar</Button>
        </div> */}
      </div>

      {/* Tarjetas KPI */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpiData.map((kpi, index) => (
          <Card key={index} className="card-rioja-custom">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium" style={{ color: 'hsl(var(--card-foreground-rioja))'}}>{kpi.title}</CardTitle>
              <kpi.icon className="h-4 w-4 text-muted-foreground-rioja" style={{ color: 'hsl(var(--muted-foreground-rioja))'}} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" style={{ color: 'hsl(var(--primary-rioja))'}}>{kpi.value}</div>
              <p className={`text-xs ${kpi.changeType === 'positive' ? 'text-green-600' : 'text-red-600'}`}>
                {kpi.change} desde el último mes
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Gráfico de Barras */}
      <Card className="col-span-1 lg:col-span-2 card-rioja-custom">
        <CardHeader>
          <CardTitle style={{ color: 'hsl(var(--card-foreground-rioja))'}}>Rendimiento Mensual</CardTitle>
          <CardDescription style={{ color: 'hsl(var(--muted-foreground-rioja))'}}>Nuevos clientes e ingresos generados en los últimos 6 meses.</CardDescription>
        </CardHeader>
        <CardContent className="pl-2">
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border-rioja))" />
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground-rioja))" />
              <YAxis yAxisId="left" stroke="hsl(var(--muted-foreground-rioja))" />
              <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--muted-foreground-rioja))" />
              <RechartsTooltip
                contentStyle={{ 
                    backgroundColor: 'hsl(var(--popover-rioja))', 
                    borderColor: 'hsl(var(--border-rioja))',
                    color: 'hsl(var(--popover-foreground-rioja))'
                }}
                labelStyle={{ color: 'hsl(var(--popover-foreground-rioja))' }}
              />
              <Legend wrapperStyle={{ color: 'hsl(var(--muted-foreground-rioja))' }}/>
              <Bar yAxisId="left" dataKey="Nuevos Clientes" fill="hsl(var(--primary-rioja))" radius={[4, 4, 0, 0]} />
              <Bar yAxisId="right" dataKey="Ingresos (€)" fill="hsl(var(--secondary-rioja))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
