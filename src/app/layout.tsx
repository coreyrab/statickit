// Root layout - minimal wrapper that passes children to locale layout
// The actual HTML structure is in [locale]/layout.tsx

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
