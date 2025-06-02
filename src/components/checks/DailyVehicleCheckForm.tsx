
"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, CardSection } from '@/components/ui/card'; // Assuming CardSection is a custom or styled div
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import type { Ambulance, RevisionDiariaVehiculo, FuelLevel, TyrePressureStatus, SimplePresenceStatus, EquipmentStatus, YesNoStatus, ExteriorCornerCheck } from '@/types';
import { useAppData } from '@/contexts/AppDataContext';
import { useAuth } from '@/contexts/AuthContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CalendarIcon, Camera, Save, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import Image from 'next/image';

const exteriorCornerCheckSchema = z.object({
  notes: z.string().optional(),
  photoUrl: z.string().url().optional().nullable(), // Ahora es una URL (o Data URL)
});

const revisionDiariaVehiculoSchema = z.object({
  driverFirstName: z.string().min(1, "El nombre del conductor es obligatorio."),
  driverLastName: z.string().min(1, "Los apellidos del conductor son obligatorios."),
  checkDate: z.date({ required_error: "La fecha de la revisión es obligatoria." }),
  ambulanceNumber: z.string(), // Se llenará automáticamente
  paxBagNumber: z.string().min(1, "El número de bolsa PAX es obligatorio."),
  paxFolderPresent: z.enum(['Sí', 'No'], { errorMap: () => ({ message: "Seleccione si la carpeta PAX está presente." }) }),
  
  exteriorFrontRight: exteriorCornerCheckSchema,
  exteriorFrontLeft: exteriorCornerCheckSchema,
  exteriorRearRight: exteriorCornerCheckSchema,
  exteriorRearLeft: exteriorCornerCheckSchema,

  fuelLevel: z.enum(['Lleno', '3/4', '1/2', '1/4', 'Reserva', 'Vacío'], { errorMap: () => ({ message: "Seleccione el nivel de combustible." }) }),
  tyrePressureStatus: z.enum(['OK', 'Baja', 'Alta', 'Revisar'], { errorMap: () => ({ message: "Seleccione el estado de los neumáticos." }) }),
  ambulanceRegistrationPresent: z.enum(['Presente', 'Ausente'], { errorMap: () => ({ message: "Indique si el registro está presente." }) }),
  greenCardInsurancePresent: z.enum(['Presente', 'Ausente'], { errorMap: () => ({ message: "Indique si la tarjeta verde está presente." }) }),
  abnAmroMaestroCardPresent: z.enum(['Presente', 'Ausente'], { errorMap: () => ({ message: "Indique si la tarjeta Maestro está presente." }) }),
  utaTankCardPresent: z.enum(['Presente', 'Ausente'], { errorMap: () => ({ message: "Indique si la tarjeta UTA está presente." }) }),
  ipadStatus: z.enum(['Operacional', 'Defectuoso', 'Ausente'], { errorMap: () => ({ message: "Seleccione el estado del iPad." }) }),

  additionalNotes: z.string().optional(),
});

type RevisionDiariaVehiculoFormValues = z.infer<typeof revisionDiariaVehiculoSchema>;
type CornerName = keyof Pick<RevisionDiariaVehiculoFormValues, 'exteriorFrontRight' | 'exteriorFrontLeft' | 'exteriorRearRight' | 'exteriorRearLeft'>;


const fuelLevelOptions: { value: FuelLevel; label: string }[] = [
  { value: 'Lleno', label: 'Lleno' }, { value: '3/4', label: '3/4' }, { value: '1/2', label: '1/2' },
  { value: '1/4', label: '1/4' }, { value: 'Reserva', label: 'Reserva' }, { value: 'Vacío', label: 'Vacío' },
];
const tyrePressureOptions: { value: TyrePressureStatus; label: string }[] = [
  { value: 'OK', label: 'OK' }, { value: 'Baja', label: 'Baja' }, { value: 'Alta', label: 'Alta' }, { value: 'Revisar', label: 'Revisar' },
];
const simplePresenceOptions: { value: SimplePresenceStatus; label: string }[] = [
  { value: 'Presente', label: 'Presente' }, { value: 'Ausente', label: 'Ausente' },
];
const equipmentStatusOptions: { value: EquipmentStatus; label: string }[] = [
  { value: 'Operacional', label: 'Operacional' }, { value: 'Defectuoso', label: 'Defectuoso' }, { value: 'Ausente', label: 'Ausente' },
];
const yesNoOptions: { value: YesNoStatus; label: string }[] = [
    { value: 'Sí', label: 'Sí' }, { value: 'No', label: 'No' },
];


interface RevisionDiariaVehiculoFormProps {
  ambulance: Ambulance;
}

export function RevisionDiariaVehiculoForm({ ambulance }: RevisionDiariaVehiculoFormProps) {
  const { saveRevisionDiariaVehiculo, getRevisionDiariaVehiculoByAmbulanceId } = useAppData();
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentCornerForPhoto, setCurrentCornerForPhoto] = useState<CornerName | null>(null);


  const existingCheck = useMemo(() => getRevisionDiariaVehiculoByAmbulanceId(ambulance.id), [getRevisionDiariaVehiculoByAmbulanceId, ambulance.id]);

  const form = useForm<RevisionDiariaVehiculoFormValues>({
    resolver: zodResolver(revisionDiariaVehiculoSchema),
    defaultValues: {
      driverFirstName: user?.name?.split(' ')[0] || '',
      driverLastName: user?.name?.split(' ').slice(1).join(' ') || '',
      checkDate: new Date(),
      ambulanceNumber: ambulance.name,
      paxBagNumber: '',
      paxFolderPresent: 'No',
      exteriorFrontRight: { notes: '', photoUrl: null },
      exteriorFrontLeft: { notes: '', photoUrl: null },
      exteriorRearRight: { notes: '', photoUrl: null },
      exteriorRearLeft: { notes: '', photoUrl: null },
      fuelLevel: 'Lleno',
      tyrePressureStatus: 'OK',
      ambulanceRegistrationPresent: 'Presente',
      greenCardInsurancePresent: 'Presente',
      abnAmroMaestroCardPresent: 'Presente',
      utaTankCardPresent: 'Presente',
      ipadStatus: 'Operacional',
      additionalNotes: '',
    },
  });

  useEffect(() => {
    if (existingCheck) {
      const castedCheck = existingCheck as unknown as RevisionDiariaVehiculoFormValues;
      form.reset({
        ...castedCheck,
        checkDate: parseISO(existingCheck.checkDate),
        ambulanceNumber: ambulance.name,
        exteriorFrontRight: { notes: existingCheck.exteriorFrontRight.notes, photoUrl: existingCheck.exteriorFrontRight.photoUrl },
        exteriorFrontLeft: { notes: existingCheck.exteriorFrontLeft.notes, photoUrl: existingCheck.exteriorFrontLeft.photoUrl },
        exteriorRearRight: { notes: existingCheck.exteriorRearRight.notes, photoUrl: existingCheck.exteriorRearRight.photoUrl },
        exteriorRearLeft: { notes: existingCheck.exteriorRearLeft.notes, photoUrl: existingCheck.exteriorRearLeft.photoUrl },
      });
    } else {
        form.reset({ 
            driverFirstName: user?.name?.split(' ')[0] || '',
            driverLastName: user?.name?.split(' ').slice(1).join(' ') || '',
            checkDate: new Date(),
            ambulanceNumber: ambulance.name,
            paxBagNumber: '',
            paxFolderPresent: 'No',
            exteriorFrontRight: { notes: '', photoUrl: null },
            exteriorFrontLeft: { notes: '', photoUrl: null },
            exteriorRearRight: { notes: '', photoUrl: null },
            exteriorRearLeft: { notes: '', photoUrl: null },
            fuelLevel: 'Lleno',
            tyrePressureStatus: 'OK',
            ambulanceRegistrationPresent: 'Presente',
            greenCardInsurancePresent: 'Presente',
            abnAmroMaestroCardPresent: 'Presente',
            utaTankCardPresent: 'Presente',
            ipadStatus: 'Operacional',
            additionalNotes: '',
        });
    }
  }, [existingCheck, form, ambulance.name, user?.name]);

  const onSubmit = (data: RevisionDiariaVehiculoFormValues) => {
    if (!user) {
      toast({ title: "Error de Autenticación", description: "Debes iniciar sesión.", variant: "destructive" });
      return;
    }
    const checkDataToSave: Omit<RevisionDiariaVehiculo, 'id' | 'submittedByUserId'> = {
      ...data,
      ambulanceId: ambulance.id,
      checkDate: format(data.checkDate, "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"), 
      exteriorFrontRight: { notes: data.exteriorFrontRight.notes, photoUrl: data.exteriorFrontRight.photoUrl || undefined },
      exteriorFrontLeft: { notes: data.exteriorFrontLeft.notes, photoUrl: data.exteriorFrontLeft.photoUrl || undefined },
      exteriorRearRight: { notes: data.exteriorRearRight.notes, photoUrl: data.exteriorRearRight.photoUrl || undefined },
      exteriorRearLeft: { notes: data.exteriorRearLeft.notes, photoUrl: data.exteriorRearLeft.photoUrl || undefined },
    };
    
    saveRevisionDiariaVehiculo({ ...checkDataToSave, submittedByUserId: user.id });
    toast({ title: "Revisión Guardada", description: `La revisión diaria para ${ambulance.name} ha sido guardada.` });
  };
  
  const handleTakePhotoClick = (corner: CornerName) => {
    setCurrentCornerForPhoto(corner);
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!currentCornerForPhoto) return;

    const file = event.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          form.setValue(`${currentCornerForPhoto}.photoUrl`, reader.result as string);
          toast({ title: "Foto Seleccionada", description: `Imagen para ${currentCornerForPhoto} cargada.` });
        };
        reader.onerror = () => {
          toast({ title: "Error al leer archivo", description: "No se pudo cargar la imagen.", variant: "destructive" });
        };
        reader.readAsDataURL(file);
      } else {
        toast({ title: "Archivo no válido", description: "Por favor, selecciona un archivo de imagen.", variant: "destructive" });
      }
    }
    setCurrentCornerForPhoto(null); 
    if (event.target) event.target.value = ""; 
  };

  const handleDeletePhoto = (corner: CornerName) => {
    form.setValue(`${corner}.photoUrl`, null);
    toast({ title: "Foto Eliminada", description: `Imagen para ${corner} eliminada.` });
  };


  const cornerFields: { name: CornerName; label: string }[] = [
    { name: 'exteriorFrontRight', label: 'Esquina Delantera Derecha' },
    { name: 'exteriorFrontLeft', label: 'Esquina Delantera Izquierda' },
    { name: 'exteriorRearRight', label: 'Esquina Trasera Derecha' },
    { name: 'exteriorRearLeft', label: 'Esquina Trasera Izquierda' },
  ];


  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>Revisión Diaria de Vehículo para {ambulance.name}</CardTitle>
        <CardDescription>Complete todos los campos relevantes para el inicio de turno.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
            />
            <ScrollArea className="h-[calc(100vh-22rem)] md:h-[calc(100vh-20rem)] pr-4">
              <div className="space-y-6">

                <section className="space-y-4 p-4 border rounded-md">
                  <h3 className="text-lg font-semibold mb-3">Información del Conductor y Vehículo</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="driverFirstName" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre del Conductor</FormLabel>
                        <FormControl><Input placeholder="Nombre" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="driverLastName" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Apellidos del Conductor</FormLabel>
                        <FormControl><Input placeholder="Apellidos" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="checkDate" render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Fecha de la Revisión</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                {field.value ? format(field.value, "PPP", { locale: es }) : <span>Elige una fecha</span>}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar locale={es} mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )} />
                     <FormItem>
                        <FormLabel>Número de Ambulancia</FormLabel>
                        <Input value={ambulance.name} disabled readOnly />
                      </FormItem>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="paxBagNumber" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nº de Bolsa PAX</FormLabel>
                        <FormControl><Input placeholder="Número de identificación" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="paxFolderPresent" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Carpeta PAX Presente</FormLabel>
                        <RadioGroup onValueChange={field.onChange} value={field.value} className="flex items-center space-x-4 pt-2">
                          {yesNoOptions.map(opt => (
                            <FormItem key={opt.value} className="flex items-center space-x-2">
                              <FormControl><RadioGroupItem value={opt.value} id={`paxFolder-${opt.value}`} /></FormControl>
                              <FormLabel htmlFor={`paxFolder-${opt.value}`} className="font-normal">{opt.label}</FormLabel>
                            </FormItem>
                          ))}
                        </RadioGroup>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                </section>

                <section className="space-y-4 p-4 border rounded-md">
                  <h3 className="text-lg font-semibold mb-3">Condiciones del Exterior de la Ambulancia</h3>
                  {cornerFields.map((cornerItem) => {
                    const photoUrl = form.watch(`${cornerItem.name}.photoUrl`);
                    return (
                        <div key={cornerItem.name} className="p-3 border rounded bg-muted/20 space-y-2">
                            <Label className="font-medium">{cornerItem.label}</Label>
                            <FormField control={form.control} name={`${cornerItem.name}.notes`} render={({ field }) => (
                            <FormItem>
                                <FormLabel htmlFor={`${cornerItem.name}-notes`} className="sr-only">Notas {cornerItem.label}</FormLabel>
                                <FormControl>
                                <Textarea id={`${cornerItem.name}-notes`} placeholder="Anotaciones sobre esta esquina..." {...field} className="min-h-[50px]" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )} />
                            <div className="flex items-center gap-2">
                                <Button type="button" variant="outline" size="sm" onClick={() => handleTakePhotoClick(cornerItem.name)}>
                                    <Camera className="mr-2 h-4 w-4" />
                                    {photoUrl ? 'Cambiar Foto' : 'Tomar Foto'}
                                </Button>
                                {photoUrl && (
                                    <Button type="button" variant="ghost" size="sm" onClick={() => handleDeletePhoto(cornerItem.name)} className="text-destructive hover:text-destructive/80">
                                        <Trash2 className="mr-1 h-4 w-4" /> Eliminar Foto
                                    </Button>
                                )}
                            </div>
                             {photoUrl && (
                                <div className="mt-2">
                                    <Image 
                                        src={photoUrl} 
                                        alt={`Foto de ${cornerItem.label}`} 
                                        width={150} 
                                        height={100} 
                                        className="rounded-md object-cover"
                                        data-ai-hint="vehicle damage"
                                    />
                                </div>
                            )}
                        </div>
                    );
                })}
                </section>
                
                <section className="space-y-4 p-4 border rounded-md">
                  <h3 className="text-lg font-semibold mb-3">Lista de Verificación de Ítems</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                    <FormField control={form.control} name="fuelLevel" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nivel de Combustible</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar nivel..." /></SelectTrigger></FormControl>
                          <SelectContent>
                            {fuelLevelOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={form.control} name="tyrePressureStatus" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Presión y Perfil de Neumáticos</FormLabel>
                         <RadioGroup onValueChange={field.onChange} value={field.value} className="flex items-center space-x-2 pt-1 flex-wrap">
                           {tyrePressureOptions.map(opt => (
                            <FormItem key={opt.value} className="flex items-center space-x-1 mr-2">
                              <FormControl><RadioGroupItem value={opt.value} id={`tyre-${opt.value}`} /></FormControl>
                              <FormLabel htmlFor={`tyre-${opt.value}`} className="font-normal text-sm">{opt.label}</FormLabel>
                            </FormItem>
                          ))}
                        </RadioGroup>
                        <FormMessage />
                      </FormItem>
                    )} />

                    {[
                        {name: 'ambulanceRegistrationPresent', label: 'Permiso de Circulación', options: simplePresenceOptions, idPrefix: 'reg'},
                        {name: 'greenCardInsurancePresent', label: 'Tarjeta Verde Seguro', options: simplePresenceOptions, idPrefix: 'green'},
                        {name: 'abnAmroMaestroCardPresent', label: 'Tarjeta Maestro ABN Amro', options: simplePresenceOptions, idPrefix: 'maestro'},
                        {name: 'utaTankCardPresent', label: 'Tarjeta Combustible UTA', options: simplePresenceOptions, idPrefix: 'uta'},
                        {name: 'ipadStatus', label: 'iPad', options: equipmentStatusOptions, idPrefix: 'ipad'},
                    ].map(item => (
                        <FormField key={item.name} control={form.control} name={item.name as keyof RevisionDiariaVehiculoFormValues} render={({ field }) => (
                        <FormItem>
                            <FormLabel>{item.label}</FormLabel>
                            <RadioGroup onValueChange={field.onChange} value={field.value as string} className="flex items-center space-x-2 pt-1 flex-wrap">
                            {item.options.map(opt => (
                                <FormItem key={opt.value} className="flex items-center space-x-1 mr-2">
                                <FormControl><RadioGroupItem value={opt.value} id={`${item.idPrefix}-${opt.value}`} /></FormControl>
                                <FormLabel htmlFor={`${item.idPrefix}-${opt.value}`} className="font-normal text-sm">{opt.label}</FormLabel>
                                </FormItem>
                            ))}
                            </RadioGroup>
                            <FormMessage />
                        </FormItem>
                        )} />
                    ))}
                  </div>
                </section>

                <section className="space-y-2 p-4 border rounded-md">
                  <h3 className="text-lg font-semibold">Notas Adicionales</h3>
                  <FormField control={form.control} name="additionalNotes" render={({ field }) => (
                    <FormItem>
                      <FormLabel htmlFor="additionalNotes-id" className="sr-only">Notas Adicionales</FormLabel>
                      <FormControl><Textarea id="additionalNotes-id" placeholder="Cualquier otra observación o incidencia..." {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </section>
              </div>
            </ScrollArea>
            <CardFooter className="mt-8 p-0 pt-6 flex justify-end">
              <Button type="submit" size="lg" disabled={form.formState.isSubmitting}>
                <Save className="mr-2 h-4 w-4" />
                {form.formState.isSubmitting ? "Guardando..." : (existingCheck ? "Actualizar Revisión" : "Guardar Revisión")}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}


    