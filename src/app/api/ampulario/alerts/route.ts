// /api/ampulario/alerts
import { NextResponse, type NextRequest } from 'next/server';
import { getAmpularioMaterials, getSpaceById } from '@/lib/ampularioStore';
import type { Alert } from '@/types';
import { differenceInDays, parseISO, format } from 'date-fns';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const spaceId = searchParams.get('spaceId'); // Optional: filter by spaceId

    const materials = getAmpularioMaterials({ spaceId: spaceId || undefined });
    const alerts: Alert[] = [];
    const today = new Date();

    materials.forEach(material => {
      if (material.expiry_date) {
        const expiryDate = parseISO(material.expiry_date);
        const daysUntilExpiry = differenceInDays(expiryDate, today);
        const space = getSpaceById(material.space_id);
        const spaceName = space ? space.name : 'Unknown Space';

        if (daysUntilExpiry < 0) { // Expired
          alerts.push({
            id: `alert-amp-exp-${material.id}`,
            type: 'ampulario_expired_material',
            message: `Ampulario: ${material.name} in ${spaceName} expired on ${format(expiryDate, 'PPP')}.`,
            materialId: material.id,
            spaceId: material.space_id,
            severity: 'high',
            createdAt: today.toISOString(),
          });
        } else if (daysUntilExpiry <= 3) { // Expiring soon (within 3 days)
          alerts.push({
            id: `alert-amp-expsoon-${material.id}`,
            type: 'ampulario_expiring_soon',
            message: `Ampulario: ${material.name} in ${spaceName} is expiring in ${daysUntilExpiry} day(s) on ${format(expiryDate, 'PPP')}.`,
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
    return NextResponse.json({ error: 'Failed to fetch ampulario alerts' }, { status: 500 });
  }
}
