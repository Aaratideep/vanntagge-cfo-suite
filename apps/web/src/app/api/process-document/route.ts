import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // In a real application, you would verify an auth token from the headers here
    // const authHeader = req.headers.get('authorization');
    // if (!verifyAuth(authHeader)) return new NextResponse('Unauthorized', { status: 401 });

    const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || 'http://localhost:8000';
    
    const response = await fetch(`${PYTHON_SERVICE_URL}/api/process`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Python service error:', errorText);
      return NextResponse.json(
        { error: `Python service returned status ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
    
  } catch (error: any) {
    console.error('Next.js API route error:', error);
    return NextResponse.json(
      { error: 'Failed to proxy request to Python service', details: error.message },
      { status: 500 }
    );
  }
}
