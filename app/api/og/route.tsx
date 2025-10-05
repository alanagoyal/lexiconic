import { ImageResponse } from '@vercel/og';

export const runtime = 'edge';

export async function GET() {
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
              fontFamily: 'Playfair Display',
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
              fontFamily: 'Playfair Display',
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
      fonts: [
        {
          name: 'Playfair Display',
          data: await fetch(
            new URL('https://fonts.gstatic.com/s/playfairdisplay/v37/nuFvD-vYSZviVYUb_rj3ij__anPXJzDwcbmjWBN2PKdFvUDQZNLo_U2r.woff')
          ).then((res) => res.arrayBuffer()),
          style: 'normal',
          weight: 400,
        },
      ],
    }
  );
}
