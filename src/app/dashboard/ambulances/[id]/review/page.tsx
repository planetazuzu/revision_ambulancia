"use client";

import { useParams, useRouter } from 'next/navigation';
import { useAppData } from '@/contexts/AppDataContext';
import { MechanicalReviewForm } from '@/components/reviews/MechanicalReviewForm';

export default function MechanicalReviewPage() {
  const params = useParams();
  const router = useRouter();
  const { getAmbulanceById } = useAppData();
  const id = typeof params.id === 'string' ? params.id : '';

  const ambulance = getAmbulanceById(id);

  if (!ambulance) {
    return <p>Ambulancia no encontrada.</p>;
  }

  return (
    <div>
      <MechanicalReviewForm ambulance={ambulance} />
    </div>
  );
}
