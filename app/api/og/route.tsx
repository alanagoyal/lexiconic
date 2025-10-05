import { ImageResponse } from '@vercel/og';

export const runtime = 'edge';

export async function GET() {
  const fontData = await fetch(
    'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400&display=swap'
  ).then((res) => res.text());

  // Extract the actual font URL from the CSS
  const fontUrlMatch = fontData.match(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+\.woff2)\)/);
  const fontUrl = fontUrlMatch?.[1];

  const playfairFont = fontUrl
    ? await fetch(fontUrl).then((res) => res.arrayBuffer())
    : undefined;

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#fafafa',
          padding: '80px',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '40px',
          }}
        >
          <h1
            style={{
              fontSize: '120px',
              fontWeight: 400,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: '#1a1a1a',
              margin: 0,
              fontFamily: playfairFont ? 'Playfair Display' : 'serif',
            }}
          >
            Lexiconic
          </h1>
          <p
            style={{
              fontSize: '32px',
              fontWeight: 400,
              color: '#666666',
              margin: 0,
              fontFamily: playfairFont ? 'Playfair Display' : 'serif',
              letterSpacing: '0.02em',
            }}
          >
            A digital exploration of linguistic untranslatability
          </p>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: playfairFont
        ? [
            {
              name: 'Playfair Display',
              data: playfairFont,
              style: 'normal',
              weight: 400,
            },
          ]
        : [],
    }
  );
}
