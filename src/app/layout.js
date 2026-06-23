import './globals.css'

export const metadata = {
  title: 'Sangam Yadav - Full Stack & Android Developer',
  description: 'Inside the Mind of a Builder - Interactive 3D Portfolio',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}