
// /api/ampulario/alerts
import { NextResponse, type NextRequest } from 'next/server';
import { getAmpularioMaterials, getSpaceById } from '@/lib/ampularioStore';
import type { Alert, AlertType } from '@/types';
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
      const space = getSpaceById(material.space_id);
      const spaceName = space ? space.name : 'Espacio Desconocido';

      // Expiry Alerts
      if (material.expiry_date) {
        const expiryDate = parseISO(material.expiry_date);
        const daysUntilExpiry = differenceInDays(expiryDate, today);

        if (daysUntilExpiry < 0) {
          alerts.push({
            id: `alert-amp-exp-${material.id}`,
            type: 'ampulario_expired_material',
            message: `Material Central: ${material.name} en ${spaceName} caducó el ${format(expiryDate, 'PPP', { locale: es })}.`,
            materialId: material.id,
            spaceId: material.space_id,
            severity: 'high',
            createdAt: today.toISOString(),
          });
        } else if (daysUntilExpiry <= 3) { // Keep this at 3 days or adjust as needed for central inventory
          alerts.push({
            id: `alert-amp-expsoon-${material.id}`,
            type: 'ampulario_expiring_soon',
            message: `Material Central: ${material.name} en ${spaceName} caduca en ${daysUntilExpiry} día(s) el ${format(expiryDate, 'PPP', { locale: es })}.`,
            materialId: material.id,
            spaceId: material.space_id,
            severity: 'medium',
            createdAt: today.toISOString(),
          });
        }
      }

      // Low Stock Alerts for Central Inventory
      if (material.minStockLevel !== undefined && material.quantity <= material.minStockLevel) {
        alerts.push({
          id: `alert-lowstock-central-${material.id}`,
          type: 'low_stock_central',
          message: `Stock bajo en Inventario Central: ${material.name} en ${spaceName}. Actual: ${material.quantity}, Mín: ${material.minStockLevel}.`,
          materialId: material.id,
          spaceId: material.space_id,
          severity: material.quantity === 0 && material.minStockLevel > 0 ? 'high' : 'medium',
          createdAt: today.toISOString(),
        });
      }
    });

    // Sort alerts, e.g., by severity then date
    alerts.sort((a, b) => {
      const severityOrder: Record<Alert['severity'], number> = { high: 0, medium: 1, low: 2 };
      if (severityOrder[a.severity] !== severityOrder[b.severity]) {
        return severityOrder[a.severity] - severityOrder[b.severity];
      }
      return parseISO(b.createdAt).getTime() - parseISO(a.createdAt).getTime();
    });


    return NextResponse.json(alerts);
  } catch (error) {
    console.error('API Error GET /api/ampulario/alerts:', error);
    return NextResponse.json({ error: 'Error al obtener alertas del inventario central' }, { status: 500 });
  }
}
