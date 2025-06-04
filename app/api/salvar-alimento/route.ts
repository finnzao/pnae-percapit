import { NextResponse } from 'next/server';
import { alimentoSchema } from '@/app/api/types'; // ajuste o caminho conforme seu projeto

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();

    const parsed = alimentoSchema.parse(body);

    console.log('[API] ALIMENTO ORIGINAL', body);
    return NextResponse.json({ ok: true, recebido: parsed }, { status: 200 });

  } catch (error) {
    console.error('[API] Erro ao processar JSON:', error);
    console.log('[API] Body recebido (inválido):', body);

    return NextResponse.json({ ok: false, error: 'JSON INVÁLIDO' }, { status: 400 });
  }
}
