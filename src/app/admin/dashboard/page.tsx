import dynamic from 'next/dynamic';
import DashboardAuthWrapper from './DashboardAuthWrapper';

const DashboardClient = dynamic(() => import('./DashboardClient'), { ssr: false });

export const revalidate = 0;

export default function Page() {
  // Render the dashboard client immediately; client will fetch data lazily.
  return (
    <DashboardAuthWrapper>
      <DashboardClient collections={[]} total={0} initialError={null} />
    </DashboardAuthWrapper>
  );
}