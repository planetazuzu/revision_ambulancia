// /api/materials
import { NextResponse, type NextRequest } from 'next/server';
import { addAmpularioMaterial, getAmpularioMaterials } from '@/lib/ampularioStore';
import type { MaterialRoute } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, dose, unit, quantity, route, expiry_date, space_id } = body;

    if (!name || !space_id || quantity === undefined || !route) {
      return NextResponse.json({ error: 'Missing required fields: name, space_id, quantity, route' }, { status: 400 });
    }
    
    // Basic validation
    if (typeof quantity !== 'number' || quantity < 0) {
        return NextResponse.json({ error: 'Quantity must be a non-negative number.' }, { status: 400 });
    }
    const validRoutes: MaterialRoute[] = ["IV/IM", "Nebulizador", "Oral"];
    if (!validRoutes.includes(route as MaterialRoute)) {
        return NextResponse.json({ error: `Invalid route. Must be one of: ${validRoutes.join(', ')}.` }, { status: 400 });
    }


    const newMaterialData = {
      name,
      dose: dose || '',
      unit: unit || '',
      quantity,
      route,
      expiry_date, // Should be ISO string or undefined
      space_id,
    };

    const newMaterial = addAmpularioMaterial(newMaterialData);
    return NextResponse.json(newMaterial, { status: 201 });
  } catch (error) {
    console.error('API Error POST /api/materials:', error);
    return NextResponse.json({ error: 'Failed to create material' }, { status: 500 });
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
    return NextResponse.json({ error: 'Failed to fetch materials' }, { status: 500 });
  }
}
