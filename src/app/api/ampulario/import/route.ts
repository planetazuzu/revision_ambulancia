// /api/ampulario/import
import { NextResponse, type NextRequest } from 'next/server';
import Papa from 'papaparse';
import { addMultipleAmpularioMaterials, getSpaceById } from '@/lib/ampularioStore';
import type { AmpularioMaterial, MaterialRoute } from '@/types';
import { isValid, parseISO, formatISO } from 'date-fns';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No se subió ningún archivo' }, { status: 400 });
    }

    const fileContent = await file.text();

    let importedCount = 0;
    const errors: string[] = [];
    let parseError = false;

    return new Promise((resolve) => {
        Papa.parse<any>(fileContent, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            if (results.errors.length > 0) {
                errors.push(`Errores de parseo CSV: ${results.errors.map(e => e.message).join(', ')}`);
                parseError = true;
            }

            if (parseError) {
                resolve(NextResponse.json({ error: 'Error al parsear el CSV.', details: errors }, { status: 400 }));
                return;
            }

            const materialsToCreate: Omit<AmpularioMaterial, 'id' | 'created_at' | 'updated_at'>[] = [];

            results.data.forEach((row, index) => {
              const { name, dose, unit, quantity, route, expiry_date, space_id } = row;

              if (!name || !space_id) {
                errors.push(`Fila ${index + 2}: Faltan campos obligatorios (name, space_id).`);
                return;
              }

              if (!getSpaceById(space_id)) {
                errors.push(`Fila ${index + 2}: space_id '${space_id}' inválido. El espacio no existe.`);
                return;
              }

              const parsedQuantity = parseInt(quantity, 10);
              if (isNaN(parsedQuantity) || parsedQuantity < 0) {
                errors.push(`Fila ${index + 2}: Cantidad '${quantity}' inválida. Debe ser un entero no negativo.`);
                return;
              }

              const validRoutes: MaterialRoute[] = ["IV/IM", "Nebulizador", "Oral"];
              if (route && !validRoutes.includes(route as MaterialRoute)) {
                  errors.push(`Fila ${index + 2}: Vía '${route}' inválida. Debe ser una de: ${validRoutes.join(', ')}.`);
                  return;
              }

              let formattedExpiryDate: string | undefined = undefined;
              if (expiry_date) {
                let parsedDate = parseISO(expiry_date);
                if (!isValid(parsedDate)) {
                    const parts = expiry_date.split(/[\/\-]/);
                    if (parts.length === 3) {
                        parsedDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`); // DD/MM/YYYY
                        if (!isValid(parsedDate)) {
                            parsedDate = new Date(`${parts[2]}-${parts[0]}-${parts[1]}`); // MM/DD/YYYY
                        }
                    }
                }

                if (isValid(parsedDate)) {
                  formattedExpiryDate = formatISO(parsedDate);
                } else {
                  errors.push(`Fila ${index + 2}: Formato de fecha de caducidad '${expiry_date}' inválido. Use AAAA-MM-DD o asegúrese de que sea una fecha válida.`);
                  return;
                }
              }

              materialsToCreate.push({
                name,
                dose: dose || '',
                unit: unit || '',
                quantity: parsedQuantity,
                route: route as MaterialRoute || 'Oral',
                expiry_date: formattedExpiryDate,
                space_id,
              });
            });

            if (errors.length > 0) {
              resolve(NextResponse.json({ error: 'Errores de validación durante la importación.', details: errors }, { status: 400 }));
              return;
            }

            if (materialsToCreate.length > 0) {
              addMultipleAmpularioMaterials(materialsToCreate);
              importedCount = materialsToCreate.length;
            }

            resolve(NextResponse.json({ imported: importedCount }));
          },
          error: (error: Error) => {
            resolve(NextResponse.json({ error: 'Error al parsear el archivo CSV.', details: error.message }, { status: 400 }));
          }
        });
    });

  } catch (error) {
    console.error('Error API de importación:', error);
    return NextResponse.json({ error: 'Error interno del servidor al procesar el archivo.' }, { status: 500 });
  }
}
