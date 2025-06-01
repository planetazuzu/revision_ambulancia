
"use client";

import React, { useState } from 'react';

interface MechanicalReviewFormData {
  fecha: string;
  kilometros: number | string;
  aceite: 'OK' | 'Requiere atención' | '';
  frenos: 'OK' | 'Requiere atención' | '';
  luces: 'OK' | 'Requiere atención' | '';
  neumaticos: 'OK' | 'Requiere atención' | '';
  rotativosSirenas: 'OK' | 'Requiere atención' | '';
  balaOxigeno1: 'OK' | 'Vacía' | 'Requiere reemplazo' | '';
  balaOxigeno2: 'OK' | 'Vacía' | 'Requiere reemplazo' | '';
  calefaccion: 'OK' | 'No funciona' | '';
  aireAcondicionado: 'OK' | 'No funciona' | '';
  tieneIncidencias: boolean;
  observaciones?: string;
  fotosIncidencias?: File[];
  revisadoPor: string;
}

const initialFormData: MechanicalReviewFormData = {
  fecha: '',
  kilometros: '',
  aceite: '',
  frenos: '',
  luces: '',
  neumaticos: '',
  rotativosSirenas: '',
  balaOxigeno1: '',
  balaOxigeno2: '',
  calefaccion: '',
  aireAcondicionado: '',
  tieneIncidencias: false,
  observaciones: '',
  fotosIncidencias: [],
  revisadoPor: '',
};

export default function MechanicalReviewForm() {
  const [formData, setFormData] = useState<MechanicalReviewFormData>(initialFormData);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const { checked } = e.target as HTMLInputElement;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFormData(prev => ({ ...prev, fotosIncidencias: Array.from(e.target.files) }));
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const dataToSubmit = {
        ...formData,
        kilometros: formData.kilometros === '' ? 0 : Number(formData.kilometros)
    };
    console.log(JSON.stringify(dataToSubmit, null, 2));
    // Aquí podrías añadir lógica para enviar los datos a un backend o similar
    alert('Revisión enviada. Mira la consola para ver el JSON.');
    // Opcionalmente, resetear el formulario:
    // setFormData(initialFormData); 
  };

  const commonSelectOptions = [
    { value: '', label: 'Seleccionar...' },
    { value: 'OK', label: 'OK' },
    { value: 'Requiere atención', label: 'Requiere Atención' },
  ];

  const oxygenOptions = [
    { value: '', label: 'Seleccionar...' },
    { value: 'OK', label: 'OK' },
    { value: 'Vacía', label: 'Vacía' },
    { value: 'Requiere reemplazo', label: 'Requiere Reemplazo' },
  ];

  const hvacOptions = [
    { value: '', label: 'Seleccionar...' },
    { value: 'OK', label: 'OK' },
    { value: 'No funciona', label: 'No Funciona' },
  ];

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 lg:p-8 bg-card text-card-foreground rounded-lg shadow-md">
      <h1 className="text-2xl font-semibold mb-6 text-center">Revisión Mecánica de Ambulancia</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="fecha" className="block text-sm font-medium mb-1">Fecha</label>
            <input
              type="date"
              name="fecha"
              id="fecha"
              value={formData.fecha}
              onChange={handleChange}
              required
              className="w-full p-2 border border-input rounded-md shadow-sm focus:ring-primary focus:border-primary"
            />
          </div>
          <div>
            <label htmlFor="kilometros" className="block text-sm font-medium mb-1">Kilómetros</label>
            <input
              type="number"
              name="kilometros"
              id="kilometros"
              value={formData.kilometros}
              onChange={handleChange}
              placeholder="Ej: 123456"
              required
              className="w-full p-2 border border-input rounded-md shadow-sm focus:ring-primary focus:border-primary"
            />
          </div>
        </div>

        {[
          { name: 'aceite', label: 'Aceite', options: commonSelectOptions },
          { name: 'frenos', label: 'Frenos', options: commonSelectOptions },
          { name: 'luces', label: 'Luces', options: commonSelectOptions },
          { name: 'neumaticos', label: 'Neumáticos', options: commonSelectOptions },
          { name: 'rotativosSirenas', label: 'Rotativos y Sirenas', options: commonSelectOptions },
          { name: 'balaOxigeno1', label: 'Bala de Oxígeno 1', options: oxygenOptions },
          { name: 'balaOxigeno2', label: 'Bala de Oxígeno 2', options: oxygenOptions },
          { name: 'calefaccion', label: 'Calefacción', options: hvacOptions },
          { name: 'aireAcondicionado', label: 'Aire Acondicionado', options: hvacOptions },
        ].map(field => (
          <div key={field.name}>
            <label htmlFor={field.name} className="block text-sm font-medium mb-1">{field.label}</label>
            <select
              name={field.name}
              id={field.name}
              value={formData[field.name as keyof Omit<MechanicalReviewFormData, 'tieneIncidencias' | 'observaciones' | 'fotosIncidencias' | 'revisadoPor' | 'fecha' | 'kilometros'>]}
              onChange={handleChange}
              required
              className="w-full p-2 border border-input rounded-md shadow-sm focus:ring-primary focus:border-primary bg-background"
            >
              {field.options.map(opt => (
                <option key={opt.value} value={opt.value} disabled={opt.value === ''}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        ))}

        <div className="flex items-center">
          <input
            type="checkbox"
            name="tieneIncidencias"
            id="tieneIncidencias"
            checked={formData.tieneIncidencias}
            onChange={handleChange}
            className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary mr-2"
          />
          <label htmlFor="tieneIncidencias" className="text-sm font-medium">¿Tiene incidencias?</label>
        </div>

        {formData.tieneIncidencias && (
          <>
            <div>
              <label htmlFor="observaciones" className="block text-sm font-medium mb-1">Observaciones</label>
              <textarea
                name="observaciones"
                id="observaciones"
                rows={4}
                value={formData.observaciones}
                onChange={handleChange}
                placeholder="Describa las incidencias encontradas..."
                className="w-full p-2 border border-input rounded-md shadow-sm focus:ring-primary focus:border-primary"
              />
            </div>
            <div>
              <label htmlFor="fotosIncidencias" className="block text-sm font-medium mb-1">Fotos de Incidencias</label>
              <input
                type="file"
                name="fotosIncidencias"
                id="fotosIncidencias"
                onChange={handleFileChange}
                multiple
                accept="image/*"
                className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
              />
              {formData.fotosIncidencias && formData.fotosIncidencias.length > 0 && (
                <div className="mt-2 text-xs text-muted-foreground">
                  {formData.fotosIncidencias.length} archivo(s) seleccionado(s):
                  <ul className="list-disc pl-5">
                    {formData.fotosIncidencias.map(file => (
                      <li key={file.name}>{file.name} ({(file.size / 1024).toFixed(2)} KB)</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </>
        )}

        <div>
          <label htmlFor="revisadoPor" className="block text-sm font-medium mb-1">Revisado por</label>
          <input
            type="text"
            name="revisadoPor"
            id="revisadoPor"
            value={formData.revisadoPor}
            onChange={handleChange}
            placeholder="Nombre del revisor"
            required
            className="w-full p-2 border border-input rounded-md shadow-sm focus:ring-primary focus:border-primary"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold py-2 px-4 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
        >
          Guardar Revisión
        </button>
      </form>
    </div>
  );
}

    