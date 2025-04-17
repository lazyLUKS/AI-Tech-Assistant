export const metadata = {
  title: 'Local AI Chat',
  description: 'Chat with an AI model about uploaded documents and images.',
};


export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
