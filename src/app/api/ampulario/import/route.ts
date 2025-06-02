
// /api/ampulario/import
import { NextResponse, type NextRequest } from 'next/server';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { addMultipleAmpularioMaterials, getSpaceById } from '@/lib/ampularioStore';
import type { AmpularioMaterial, MaterialRoute } from '@/types';
import { isValid, parseISO, formatISO, parse } from 'date-fns';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No se subió ningún archivo' }, { status: 400 });
    }

    const isExcel = file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || file.name.endsWith('.xlsx');
    const isCsv = file.type === 'text/csv' || file.name.endsWith('.csv');

    if (!isExcel && !isCsv) {
        return NextResponse.json({ error: 'Formato de archivo no soportado. Por favor, sube un archivo CSV o Excel (.xlsx).' }, { status: 400 });
    }

    let importedCount = 0;
    const errorsList: string[] = [];
    let dataRows: any[] = [];

    if (isExcel) {
        const bytes = await file.arrayBuffer();
        const workbook = XLSX.read(bytes, { type: 'buffer', cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        dataRows = XLSX.utils.sheet_to_json(worksheet, {
            raw: false, 
            dateNF: 'yyyy-mm-dd' 
        });
    } else { // CSV
        const fileContent = await file.text();
        const parseResult = Papa.parse<any>(fileContent, {
            header: true,
            skipEmptyLines: true,
        });

        if (parseResult.errors.length > 0) {
            errorsList.push(`Errores de parseo CSV: ${parseResult.errors.map(e => e.message).join(', ')}`);
            return NextResponse.json({ error: 'Error al parsear el CSV.', details: errorsList }, { status: 400 });
        }
        dataRows = parseResult.data;
    }
    
    const materialsToCreate: Omit<AmpularioMaterial, 'id' | 'created_at' | 'updated_at'>[] = [];

    dataRows.forEach((row, index) => {
      const { name, dose, unit, quantity, route, expiry_date, space_id, min_stock_level } = row;

      if (!name || !space_id) {
        errorsList.push(`Fila ${index + 2}: Faltan campos obligatorios (name, space_id).`);
        return;
      }

      if (!getSpaceById(space_id)) {
        errorsList.push(`Fila ${index + 2}: space_id '${space_id}' inválido. El espacio no existe.`);
        return;
      }

      const parsedQuantity = parseInt(quantity, 10);
      if (isNaN(parsedQuantity) || parsedQuantity < 0) {
        errorsList.push(`Fila ${index + 2}: Cantidad '${quantity}' inválida. Debe ser un entero no negativo.`);
        return;
      }

      let parsedMinStockLevel: number | undefined = undefined;
      if (min_stock_level !== undefined && min_stock_level !== null && min_stock_level !== '') {
        parsedMinStockLevel = parseInt(min_stock_level, 10);
        if (isNaN(parsedMinStockLevel) || parsedMinStockLevel < 0) {
          errorsList.push(`Fila ${index + 2}: Nivel mínimo de stock '${min_stock_level}' inválido. Debe ser un entero no negativo.`);
          return;
        }
      }


      const validRoutes: MaterialRoute[] = ["IV/IM", "Nebulizador", "Oral"];
      if (route && !validRoutes.includes(route as MaterialRoute)) {
          errorsList.push(`Fila ${index + 2}: Vía '${route}' inválida. Debe ser una de: ${validRoutes.join(', ')}.`);
          return;
      }

      let formattedExpiryDate: string | undefined = undefined;
      if (expiry_date) {
        let parsedDate: Date | null = null;
        if (expiry_date instanceof Date && isValid(expiry_date)) { 
            parsedDate = expiry_date;
        } else if (typeof expiry_date === 'string') {
            parsedDate = parseISO(expiry_date); 
            if (!isValid(parsedDate)) {
                const parts = expiry_date.split(/[\/\-]/);
                if (parts.length === 3) {
                    const day = parseInt(parts[0], 10);
                    const month = parseInt(parts[1], 10);
                    const year = parseInt(parts[2], 10);
                    if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
                        parsedDate = new Date(year, month - 1, day);
                        if (!isValid(parsedDate)) {
                            parsedDate = new Date(year, day - 1, month);
                        }
                    }
                }
            }
        } else if (typeof expiry_date === 'number') { 
            const excelEpoch = new Date(1899, 11, 30); 
            parsedDate = new Date(excelEpoch.getTime() + expiry_date * 24 * 60 * 60 * 1000);
        }

        if (parsedDate && isValid(parsedDate)) {
          formattedExpiryDate = formatISO(parsedDate);
        } else {
          errorsList.push(`Fila ${index + 2}: Formato de fecha de caducidad '${expiry_date}' inválido o no reconocible. Use AAAA-MM-DD, DD/MM/AAAA o asegúrese de que sea una fecha válida.`);
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
        minStockLevel: parsedMinStockLevel,
      });
    });

    if (errorsList.length > 0) {
      return NextResponse.json({ error: 'Errores de validación durante la importación.', details: errorsList }, { status: 400 });
    }

    if (materialsToCreate.length > 0) {
      addMultipleAmpularioMaterials(materialsToCreate);
      importedCount = materialsToCreate.length;
    }

    return NextResponse.json({ imported: importedCount });

  } catch (error) {
    console.error('Error API de importación:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error interno del servidor al procesar el archivo.';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
