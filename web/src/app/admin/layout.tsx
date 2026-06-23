export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // TODO: Cognito auth guard
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}
