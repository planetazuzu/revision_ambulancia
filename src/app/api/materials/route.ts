
// /api/materials
import { NextResponse, type NextRequest } from 'next/server';
import { addAmpularioMaterial, getAmpularioMaterials } from '@/lib/ampularioStore';
import type { MaterialRoute } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, dose, unit, quantity, route, expiry_date, space_id, minStockLevel } = body;

    if (!name || !space_id || quantity === undefined || !route) {
      return NextResponse.json({ error: 'Faltan campos obligatorios: nombre, espacio, cantidad, vía' }, { status: 400 });
    }

    if (typeof quantity !== 'number' || quantity < 0) {
        return NextResponse.json({ error: 'La cantidad debe ser un número no negativo.' }, { status: 400 });
    }
    if (minStockLevel !== undefined && (typeof minStockLevel !== 'number' || minStockLevel < 0)) {
        return NextResponse.json({ error: 'El nivel mínimo de stock debe ser un número no negativo.' }, { status: 400 });
    }

    const validRoutes: MaterialRoute[] = ["IV/IM", "Nebulizador", "Oral"];
    if (!validRoutes.includes(route as MaterialRoute)) {
        return NextResponse.json({ error: `Vía inválida. Debe ser una de: ${validRoutes.join(', ')}.` }, { status: 400 });
    }

    const newMaterialData = {
      name,
      dose: dose || '',
      unit: unit || '',
      quantity,
      route,
      expiry_date,
      space_id,
      minStockLevel: minStockLevel,
    };

    const newMaterial = addAmpularioMaterial(newMaterialData);
    return NextResponse.json(newMaterial, { status: 201 });
  } catch (error) {
    console.error('API Error POST /api/materials:', error);
    return NextResponse.json({ error: 'Error al crear el material' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const spaceId = searchParams.get('spaceId') || undefined;
    const routeName = searchParams.get('routeName') as MaterialRoute | undefined;
    const nameQuery = searchParams.get('nameQuery') || undefined;

    const materials = getAmpularioMaterials({ spaceId, routeName, nameQuery });
    return NextResponse.json(materials);
  } catch (error) {
    console.error('API Error GET /api/materials:', error);
    return NextResponse.json({ error: 'Error al obtener los materiales' }, { status: 500 });
  }
}
