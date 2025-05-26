// /api/ampulario/alerts
import { NextResponse, type NextRequest } from 'next/server';
import { getAmpularioMaterials, getSpaceById } from '@/lib/ampularioStore';
import type { Alert } from '@/types';
import { differenceInDays, parseISO, format } from 'date-fns';
import { es } from 'date-fns/locale';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const spaceId = searchParams.get('spaceId');

    const materials = getAmpularioMaterials({ spaceId: spaceId || undefined });
    const alerts: Alert[] = [];
    const today = new Date();

    materials.forEach(material => {
      if (material.expiry_date) {
        const expiryDate = parseISO(material.expiry_date);
        const daysUntilExpiry = differenceInDays(expiryDate, today);
        const space = getSpaceById(material.space_id);
        const spaceName = space ? space.name : 'Espacio Desconocido';

        if (daysUntilExpiry < 0) {
          alerts.push({
            id: `alert-amp-exp-${material.id}`,
            type: 'ampulario_expired_material',
            message: `Ampulario: ${material.name} en ${spaceName} caducó el ${format(expiryDate, 'PPP', { locale: es })}.`,
            materialId: material.id,
            spaceId: material.space_id,
            severity: 'high',
            createdAt: today.toISOString(),
          });
        } else if (daysUntilExpiry <= 3) {
          alerts.push({
            id: `alert-amp-expsoon-${material.id}`,
            type: 'ampulario_expiring_soon',
            message: `Ampulario: ${material.name} en ${spaceName} caduca en ${daysUntilExpiry} día(s) el ${format(expiryDate, 'PPP', { locale: es })}.`,
            materialId: material.id,
            spaceId: material.space_id,
            severity: 'medium',
            createdAt: today.toISOString(),
          });
        }
      }
    });

    return NextResponse.json(alerts);
  } catch (error) {
    console.error('API Error GET /api/ampulario/alerts:', error);
    return NextResponse.json({ error: 'Error al obtener alertas del ampulario' }, { status: 500 });
  }
}
