import { NextRequest, NextResponse } from 'next/server';
import { getEBoekhoudenClient } from '@/lib/eboekhouden';

export async function GET(request: NextRequest) {
  try {
    const client = getEBoekhoudenClient();
    const sessionId = await client.openSession();
    
    try {
      const articles = await client.getArticles(sessionId);
      return NextResponse.json({
        success: true,
        articles: articles
      });
    } finally {
      await client.closeSession(sessionId);
    }
  } catch (error) {
    console.error('E-boekhouden get articles error:', error);
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Onbekende fout bij ophalen artikelen'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const client = getEBoekhoudenClient();
    const sessionId = await client.openSession();
    
    try {
      const articleId = await client.addArticle(sessionId, body);
      return NextResponse.json({
        success: true,
        articleId: articleId,
        message: 'Artikel succesvol toegevoegd'
      });
    } finally {
      await client.closeSession(sessionId);
    }
  } catch (error) {
    console.error('E-boekhouden add article error:', error);
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Onbekende fout bij toevoegen artikel'
    }, { status: 500 });
  }
}
