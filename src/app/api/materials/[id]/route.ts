// /api/materials/[id]
import { NextResponse, type NextRequest } from 'next/server';
import { getAmpularioMaterialById, updateAmpularioMaterial, deleteAmpularioMaterial } from '@/lib/ampularioStore';
import type { MaterialRoute } from '@/types';

interface RouteParams {
  params: { id: string };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    const material = getAmpularioMaterialById(id);
    if (!material) {
      return NextResponse.json({ error: 'Material no encontrado' }, { status: 404 });
    }
    return NextResponse.json(material);
  } catch (error) {
    console.error(`API Error GET /api/materials/${params.id}:`, error);
    return NextResponse.json({ error: 'Error al obtener el material' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    const body = await request.json();
    const { quantity, expiry_date, name, dose, unit, route, space_id } = body;

    const updates: Partial<Pick<import('@/types').AmpularioMaterial, 'quantity' | 'expiry_date' | 'name' | 'dose' | 'unit' | 'route' | 'space_id'>> = {};
    if (quantity !== undefined) {
        if (typeof quantity !== 'number' || quantity < 0) {
            return NextResponse.json({ error: 'La cantidad debe ser un número no negativo.' }, { status: 400 });
        }
        updates.quantity = quantity;
    }
    if (expiry_date !== undefined) updates.expiry_date = expiry_date;
    if (name !== undefined) updates.name = name;
    if (dose !== undefined) updates.dose = dose;
    if (unit !== undefined) updates.unit = unit;
    if (route !== undefined) {
        const validRoutes: MaterialRoute[] = ["IV/IM", "Nebulizador", "Oral"];
        if (!validRoutes.includes(route as MaterialRoute)) {
            return NextResponse.json({ error: `Vía inválida. Debe ser una de: ${validRoutes.join(', ')}.` }, { status: 400 });
        }
        updates.route = route;
    }
    if (space_id !== undefined) updates.space_id = space_id;


    if (Object.keys(updates).length === 0) {
        return NextResponse.json({ error: 'No se proporcionaron campos para actualizar.' }, { status: 400 });
    }

    const updatedMaterial = updateAmpularioMaterial(id, updates);

    if (!updatedMaterial) {
      return NextResponse.json({ error: 'Material no encontrado o actualización fallida' }, { status: 404 });
    }
    return NextResponse.json(updatedMaterial);
  } catch (error) {
    console.error(`API Error PUT /api/materials/${params.id}:`, error);
    return NextResponse.json({ error: 'Error al actualizar el material' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    const success = deleteAmpularioMaterial(id);
    if (!success) {
      return NextResponse.json({ error: 'Material no encontrado' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Material eliminado correctamente' }, { status: 200 });
  } catch (error) {
    console.error(`API Error DELETE /api/materials/${params.id}:`, error);
    return NextResponse.json({ error: 'Error al eliminar el material' }, { status: 500 });
  }
}
