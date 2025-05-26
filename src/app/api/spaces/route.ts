// /api/spaces
import { NextResponse, type NextRequest } from 'next/server';
import { getSpaces, addSpace } from '@/lib/ampularioStore';
import type { Space } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const spaces = getSpaces();
    return NextResponse.json(spaces);
  } catch (error) {
    console.error('API Error GET /api/spaces:', error);
    return NextResponse.json({ error: 'Error al obtener los espacios' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as Omit<Space, 'id'>;
    const { name } = body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json({ error: 'El nombre del espacio es obligatorio y debe ser un string.' }, { status: 400 });
    }

    const newSpace = addSpace({ name });
    return NextResponse.json(newSpace, { status: 201 });
  } catch (error: any) {
    console.error('API Error POST /api/spaces:', error);
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'Cuerpo JSON malformado' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Error al crear el espacio' }, { status: 500 });
  }
}
