import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Payment',
  description: 'Complete your payment securely',
  robots: 'noindex, nofollow',
};

export default function RazorpayCheckoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
