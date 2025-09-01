import { NextRequest, NextResponse } from 'next/server';
import { getEBoekhoudenClient } from '@/lib/eboekhouden';

export async function GET(request: NextRequest) {
  try {
    const client = getEBoekhoudenClient();
    const sessionId = await client.openSession();
    
    try {
      const relations = await client.getRelations(sessionId);
      return NextResponse.json({
        success: true,
        relations: relations
      });
    } finally {
      await client.closeSession(sessionId);
    }
  } catch (error) {
    console.error('E-boekhouden get relations error:', error);
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Onbekende fout bij ophalen relaties'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const client = getEBoekhoudenClient();
    const sessionId = await client.openSession();
    
    try {
      const relationId = await client.addRelation(sessionId, body);
      return NextResponse.json({
        success: true,
        relationId: relationId,
        message: 'Relatie succesvol toegevoegd'
      });
    } finally {
      await client.closeSession(sessionId);
    }
  } catch (error) {
    console.error('E-boekhouden add relation error:', error);
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Onbekende fout bij toevoegen relatie'
    }, { status: 500 });
  }
}
