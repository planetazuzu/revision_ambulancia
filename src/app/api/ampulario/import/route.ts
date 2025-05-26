// /api/ampulario/import
// Note: In a real app, this would interact with a database.
// Here, it interacts with the server-side in-memory store.
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
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const fileContent = await file.text();

    // TODO: Add explicit 'use server' if this were a server action. As an API route, it's server-side by default.
    
    let importedCount = 0;
    const errors: string[] = [];
    let parseError = false;

    return new Promise((resolve) => {
        Papa.parse<any>(fileContent, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            if (results.errors.length > 0) {
                errors.push(`CSV parsing errors: ${results.errors.map(e => e.message).join(', ')}`);
                parseError = true;
            }
            
            if (parseError) {
                resolve(NextResponse.json({ error: 'Failed to parse CSV.', details: errors }, { status: 400 }));
                return;
            }

            const materialsToCreate: Omit<AmpularioMaterial, 'id' | 'created_at' | 'updated_at'>[] = [];

            results.data.forEach((row, index) => {
              const { name, dose, unit, quantity, route, expiry_date, space_id } = row;

              if (!name || !space_id) {
                errors.push(`Row ${index + 2}: Missing required fields (name, space_id).`);
                return;
              }

              if (!getSpaceById(space_id)) {
                errors.push(`Row ${index + 2}: Invalid space_id '${space_id}'. Space does not exist.`);
                return;
              }

              const parsedQuantity = parseInt(quantity, 10);
              if (isNaN(parsedQuantity) || parsedQuantity < 0) {
                errors.push(`Row ${index + 2}: Invalid quantity '${quantity}'. Must be a non-negative integer.`);
                return;
              }
              
              const validRoutes: MaterialRoute[] = ["IV/IM", "Nebulizador", "Oral"];
              if (route && !validRoutes.includes(route as MaterialRoute)) {
                  errors.push(`Row ${index + 2}: Invalid route '${route}'. Must be one of: ${validRoutes.join(', ')}.`);
                  return;
              }

              let formattedExpiryDate: string | undefined = undefined;
              if (expiry_date) {
                // Try to parse various common date formats, e.g., YYYY-MM-DD, DD/MM/YYYY, MM/DD/YYYY
                let parsedDate = parseISO(expiry_date); // Handles YYYY-MM-DD directly
                if (!isValid(parsedDate)) {
                    const parts = expiry_date.split(/[\/\-]/);
                    if (parts.length === 3) {
                        // Attempt DD/MM/YYYY
                        parsedDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
                        if (!isValid(parsedDate)) {
                            // Attempt MM/DD/YYYY
                            parsedDate = new Date(`${parts[2]}-${parts[0]}-${parts[1]}`);
                        }
                    }
                }

                if (isValid(parsedDate)) {
                  formattedExpiryDate = formatISO(parsedDate);
                } else {
                  errors.push(`Row ${index + 2}: Invalid expiry_date format '${expiry_date}'. Please use YYYY-MM-DD or ensure it's a valid date.`);
                  return;
                }
              }

              materialsToCreate.push({
                name,
                dose: dose || '',
                unit: unit || '',
                quantity: parsedQuantity,
                route: route as MaterialRoute || 'Oral', // Default if not specified or handle as error
                expiry_date: formattedExpiryDate,
                space_id,
              });
            });

            if (errors.length > 0) {
              resolve(NextResponse.json({ error: 'Validation errors during import.', details: errors }, { status: 400 }));
              return;
            }

            if (materialsToCreate.length > 0) {
              addMultipleAmpularioMaterials(materialsToCreate);
              importedCount = materialsToCreate.length;
            }
            
            resolve(NextResponse.json({ imported: importedCount }));
          },
          error: (error: Error) => {
            resolve(NextResponse.json({ error: 'Failed to parse CSV file.', details: error.message }, { status: 400 }));
          }
        });
    });

  } catch (error) {
    console.error('Import API error:', error);
    return NextResponse.json({ error: 'Internal server error processing the file.' }, { status: 500 });
  }
}
