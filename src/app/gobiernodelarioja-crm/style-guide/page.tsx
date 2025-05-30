"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";
import React from 'react';

export default function StyleGuidePage() {
  return (
    <div className="container mx-auto py-10 space-y-8 theme-rioja">
      <h1 className="text-4xl font-bold" style={{ color: 'hsl(var(--foreground-rioja))'}}>Guía de Estilos - Gobierno de La Rioja CRM</h1>
      <p className="text-lg text-muted-foreground-rioja" style={{ color: 'hsl(var(--muted-foreground-rioja))'}}>
        Ejemplos de componentes clave con el tema corporativo. La tipografía "Riojana" se simula con la fuente sans-serif del sistema.
      </p>

      {/* Colores */}
      <section>
        <h2 className="text-2xl font-semibold mb-4" style={{ color: 'hsl(var(--foreground-rioja))'}}>Paleta de Colores</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-md text-center" style={{ backgroundColor: 'hsl(var(--primary-rioja))', color: 'hsl(var(--primary-foreground-rioja))'}}>
            Primario (Verde)<br />Pantone 368 C
          </div>
          <div className="p-4 rounded-md text-center border" style={{ backgroundColor: 'hsl(0 0% 100%)', color: 'hsl(var(--foreground-rioja))'}}>
            Blanco Puro
          </div>
          <div className="p-4 rounded-md text-center" style={{ backgroundColor: 'hsl(var(--rioja-gray-hue) var(--rioja-gray-saturation) var(--rioja-gray-lightness))', color: 'hsl(0 0% 100%)'}}>
            Gris Corporativo<br />Pantone 7546 C
          </div>
           <div className="p-4 rounded-md text-center border" style={{ backgroundColor: 'hsl(var(--card-rioja))', color: 'hsl(var(--card-foreground-rioja))'}}>
            Fondo Tarjeta
          </div>
        </div>
      </section>

      {/* Botones */}
      <section>
        <h2 className="text-2xl font-semibold mb-4" style={{ color: 'hsl(var(--foreground-rioja))'}}>Botones</h2>
        <div className="flex flex-wrap gap-4 items-center">
          <Button className="button-primary-rioja">Botón Primario</Button>
          <Button className="button-secondary-rioja">Botón Secundario</Button>
          <Button variant="outline" style={{ borderColor: 'hsl(var(--primary-rioja))', color: 'hsl(var(--primary-rioja))'}}>
            Contorno Primario
          </Button>
           <Button variant="ghost" style={{ color: 'hsl(var(--primary-rioja))'}}>Fantasma</Button>
          <Button variant="link" style={{ color: 'hsl(var(--primary-rioja))'}}>Enlace</Button>
          <Button className="button-primary-rioja" disabled>Primario Deshabilitado</Button>
        </div>
        <div className="mt-4 flex flex-wrap gap-4 items-center">
          <Button size="sm" className="button-primary-rioja">Pequeño</Button>
          <Button size="lg" className="button-primary-rioja">Grande</Button>
        </div>
      </section>

      {/* Tarjetas */}
      <section>
        <h2 className="text-2xl font-semibold mb-4" style={{ color: 'hsl(var(--foreground-rioja))'}}>Tarjetas</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="card-rioja-custom">
            <CardHeader>
              <CardTitle style={{ color: 'hsl(var(--card-foreground-rioja))'}}>Título de la Tarjeta</CardTitle>
              <CardDescription style={{ color: 'hsl(var(--muted-foreground-rioja))'}}>
                Descripción breve del contenido de esta tarjeta. Las tarjetas tienen un borde redondeado de 4px y una sombra suave.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p style={{ color: 'hsl(var(--card-foreground-rioja))'}}>Este es el contenido principal de la tarjeta. Puede incluir texto, listas, o incluso otros componentes anidados.</p>
            </CardContent>
          </Card>
          <Card className="card-rioja-custom">
            <CardHeader>
              <CardTitle style={{ color: 'hsl(var(--primary-rioja))'}}>Tarjeta con Acento Primario</CardTitle>
            </CardHeader>
            <CardContent>
              <p style={{ color: 'hsl(var(--card-foreground-rioja))'}}>Esta tarjeta usa el color primario en el título para destacar.</p>
              <Button className="mt-4 button-primary-rioja w-full">Acción en Tarjeta</Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Formularios */}
      <section>
        <h2 className="text-2xl font-semibold mb-4" style={{ color: 'hsl(var(--foreground-rioja))'}}>Formularios</h2>
        <Card className="card-rioja-custom w-full max-w-md">
          <CardHeader>
            <CardTitle style={{ color: 'hsl(var(--card-foreground-rioja))'}}>Formulario de Ejemplo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="name-sg" style={{ color: 'hsl(var(--foreground-rioja))'}}>Nombre Completo</Label>
              <Input id="name-sg" placeholder="Introduzca su nombre" className="input-rioja-custom" />
              {/* <p className="text-xs text-green-600">Validación inline: ¡Correcto!</p> */}
            </div>
            <div className="space-y-1">
              <Label htmlFor="email-sg" style={{ color: 'hsl(var(--foreground-rioja))'}}>Correo Electrónico</Label>
              <Input type="email" id="email-sg" placeholder="su@email.com" className="input-rioja-custom" />
              <p className="text-xs text-red-500">Error: El correo no es válido.</p>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="terms-sg" style={{ borderColor: 'hsl(var(--primary-rioja))', color: 'hsl(var(--primary-rioja))'}} />
              <Label htmlFor="terms-sg" className="text-sm font-normal" style={{ color: 'hsl(var(--foreground-rioja))'}}>
                Acepto los términos y condiciones
              </Label>
            </div>
            <div>
              <Label className="block mb-2" style={{ color: 'hsl(var(--foreground-rioja))'}}>Opción de Radio</Label>
              <RadioGroup defaultValue="option-one">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="option-one" id="r1-sg" />
                  <Label htmlFor="r1-sg" style={{ color: 'hsl(var(--foreground-rioja))'}}>Opción Uno</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="option-two" id="r2-sg" />
                  <Label htmlFor="r2-sg" style={{ color: 'hsl(var(--foreground-rioja))'}}>Opción Dos</Label>
                </div>
              </RadioGroup>
            </div>
             <div className="flex items-center space-x-2">
              <Switch id="airplane-mode-sg" />
              <Label htmlFor="airplane-mode-sg" style={{ color: 'hsl(var(--foreground-rioja))'}}>Modo Avión</Label>
            </div>
            <Button type="submit" className="w-full button-primary-rioja">Enviar Formulario</Button>
          </CardContent>
        </Card>
      </section>

      {/* Tablas */}
      <section>
        <h2 className="text-2xl font-semibold mb-4" style={{ color: 'hsl(var(--foreground-rioja))'}}>Tablas</h2>
        <Card className="card-rioja-custom">
          <CardHeader>
            <CardTitle style={{ color: 'hsl(var(--card-foreground-rioja))'}}>Listado de Ejemplo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table className="table-rioja-custom">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">ID</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Importe</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">CLI-001</TableCell>
                    <TableCell>Cliente Ejemplo Uno</TableCell>
                    <TableCell>
                        <span className="px-2 py-1 text-xs font-semibold rounded-full" style={{backgroundColor: 'hsl(var(--primary-rioja))', color: 'hsl(var(--primary-foreground-rioja))'}}>Activo</span>
                    </TableCell>
                    <TableCell className="text-right">€2,500.00</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">CLI-002</TableCell>
                    <TableCell>Otro Cliente Más</TableCell>
                    <TableCell>
                        <span className="px-2 py-1 text-xs font-semibold rounded-full" style={{backgroundColor: 'hsl(var(--rioja-gray-hue) var(--rioja-gray-saturation) 50%)', color: 'hsl(0 0% 100%)'}}>Inactivo</span>
                    </TableCell>
                    <TableCell className="text-right">€150.00</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </section>
      
      {/* Alertas y Notificaciones */}
      <section>
        <h2 className="text-2xl font-semibold mb-4" style={{ color: 'hsl(var(--foreground-rioja))'}}>Alertas / Toasts</h2>
        <div className="space-y-4">
          <Alert className="theme-rioja" style={{ backgroundColor: 'hsl(var(--card-rioja))', borderColor: 'hsl(var(--border-rioja))'}}>
            <Terminal className="h-4 w-4" style={{ color: 'hsl(var(--primary-rioja))'}} />
            <AlertTitle style={{ color: 'hsl(var(--primary-rioja))'}}>Información</AlertTitle>
            <AlertDescription style={{ color: 'hsl(var(--muted-foreground-rioja))'}}>
              Esta es una alerta informativa estándar.
            </AlertDescription>
          </Alert>
          <Alert variant="destructive" className="theme-rioja" style={{ backgroundColor: 'hsl(var(--destructive-rioja) / 0.1)', borderColor: 'hsl(var(--destructive-rioja))'}}>
            <Terminal className="h-4 w-4" style={{ color: 'hsl(var(--destructive-rioja))'}} />
            <AlertTitle style={{ color: 'hsl(var(--destructive-rioja))'}}>Error Grave</AlertTitle>
            <AlertDescription style={{ color: 'hsl(var(--destructive-rioja) / 0.8)'}}>
              Algo ha salido mal. Por favor, revisa la acción.
            </AlertDescription>
          </Alert>
        </div>
      </section>

    </div>
  );
}
