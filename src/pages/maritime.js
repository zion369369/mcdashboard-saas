import { useState } from 'react';
import { getSession } from 'next-auth/react';
import { AccountLayout } from '@/layouts/AccountLayout';
import MaritimeDashboard from '@/components/MaritimeDashboard';

const Maritime = ({ session }) => {
  return (
    <AccountLayout session={session}>
      <MaritimeDashboard />
    </AccountLayout>
  );
};

export const getServerSideProps = async (context) => {
  const session = await getSession(context);

  if (!session) {
    return {
      redirect: {
        destination: '/auth/login',
        permanent: false,
      },
    };
  }

  return {
    props: { session },
  };
};

export default Maritime;
