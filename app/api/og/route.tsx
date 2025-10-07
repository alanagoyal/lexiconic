import { ImageResponse } from '@vercel/og';

export const runtime = 'edge';

export async function GET(request: Request) {
  const fontData = await fetch(
    new URL('/lexiconic/fonts/PlayfairDisplay-Regular.ttf', process.env.NEXT_PUBLIC_VERCEL_URL || new URL(request.url).origin)
  ).then((res) => res.arrayBuffer());

  // Fetch the world map background image
  const mapImageData = await fetch(
    new URL('/lexiconic/images/world-map-bg.png', process.env.NEXT_PUBLIC_VERCEL_URL || new URL(request.url).origin)
  ).then((res) => res.arrayBuffer());
  
  const base64Map = Buffer.from(mapImageData).toString('base64');
  const mapImageUrl = `data:image/png;base64,${base64Map}`;

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          backgroundImage: `url(${mapImageUrl})`,
          backgroundSize: '100% 100%',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        
        {/* Content area */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            padding: '60px',
            position: 'relative',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            <h1
              style={{
                fontSize: '140px',
                fontWeight: 400,
                letterSpacing: '0.02em',
                color: '#000000',
                margin: 0,
                fontFamily: fontData ? 'Playfair Display' : 'serif',
                lineHeight: 1,
              }}
            >
              LEXICONIC
            </h1>
            <p
              style={{
                fontSize: '36px',
                fontWeight: 400,
                color: '#000000',
                margin: 0,
                fontFamily: 'sans-serif',
                letterSpacing: '0.02em',
              }}
            >
              lek·si·kon·ik
            </p>
          </div>
        </div>

        {/* Bottom banner */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(230, 230, 230, 0.95)',
            padding: '32px 60px',
          }}
        >
          <p
            style={{
              fontSize: '28px',
              fontWeight: 400,
              color: '#000000',
              margin: 0,
              fontFamily: fontData ? 'Playfair Display' : 'serif',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
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
      fonts: fontData
        ? [
            {
              name: 'Playfair Display',
              data: fontData,
              style: 'normal',
              weight: 400,
            },
          ]
        : [],
    }
  );
}
