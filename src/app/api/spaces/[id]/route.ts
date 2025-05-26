// /api/spaces/[id]
import { NextResponse, type NextRequest } from 'next/server';
import { getSpaceById, updateSpace, deleteSpace } from '@/lib/ampularioStore';
import type { Space } from '@/types';

interface RouteParams {
  params: { id: string };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    const space = getSpaceById(id);
    if (!space) {
      return NextResponse.json({ error: 'Espacio no encontrado' }, { status: 404 });
    }
    return NextResponse.json(space);
  } catch (error) {
    console.error(`API Error GET /api/spaces/${params.id}:`, error);
    return NextResponse.json({ error: 'Error al obtener el espacio' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    const body = await request.json() as Partial<Omit<Space, 'id'>>;
    const { name } = body;

    if (name !== undefined && (typeof name !== 'string' || name.trim() === '')) {
      return NextResponse.json({ error: 'El nombre del espacio debe ser un string no vacío.' }, { status: 400 });
    }
    
    if (Object.keys(body).length === 0) {
        return NextResponse.json({ error: 'No se proporcionaron campos para actualizar.' }, { status: 400 });
    }

    const updatedSpace = updateSpace(id, body);

    if (!updatedSpace) {
      return NextResponse.json({ error: 'Espacio no encontrado o actualización fallida' }, { status: 404 });
    }
    return NextResponse.json(updatedSpace);
  } catch (error: any) {
    console.error(`API Error PUT /api/spaces/${params.id}:`, error);
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'Cuerpo JSON malformado' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Error al actualizar el espacio' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    const success = deleteSpace(id);
    if (!success) {
      // This could be because the space was not found or because it's in use.
      // The store currently logs a warning for "in use", we can make this more specific.
      const spaceExists = !!getSpaceById(id);
      if (!spaceExists) {
        return NextResponse.json({ error: 'Espacio no encontrado' }, { status: 404 });
      }
      return NextResponse.json({ error: 'No se pudo eliminar el espacio. Podría estar en uso.' }, { status: 400 });
    }
    return NextResponse.json({ message: 'Espacio eliminado correctamente' }, { status: 200 });
  } catch (error) {
    console.error(`API Error DELETE /api/spaces/${params.id}:`, error);
    return NextResponse.json({ error: 'Error al eliminar el espacio' }, { status: 500 });
  }
}
