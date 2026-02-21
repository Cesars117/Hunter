import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Hunter - Iniciar Sesión',
  description: 'Inicia sesión en tu cuenta de Hunter',
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
