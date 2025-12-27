import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verificar autenticação admin
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const YOUTUBE_API_KEY = Deno.env.get("YOUTUBE_API_KEY");
    if (!YOUTUBE_API_KEY) {
      return Response.json({ error: 'YouTube API Key not configured' }, { status: 500 });
    }

    // Buscar canal @artificiallysmarter
    const channelResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=contentDetails,snippet&forUsername=artificiallysmarter&key=${YOUTUBE_API_KEY}`
    );
    
    if (!channelResponse.ok) {
      // Tentar buscar por handle se username não funcionar
      const searchResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&q=@artificiallysmarter&type=channel&key=${YOUTUBE_API_KEY}`
      );
      
      if (!searchResponse.ok) {
        return Response.json({ error: 'Channel not found' }, { status: 404 });
      }
      
      const searchData = await searchResponse.json();
      if (!searchData.items || searchData.items.length === 0) {
        return Response.json({ error: 'Channel not found' }, { status: 404 });
      }
      
      const channelId = searchData.items[0].id.channelId;
      
      // Buscar detalhes do canal com o ID
      const channelDetailsResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/channels?part=contentDetails,snippet&id=${channelId}&key=${YOUTUBE_API_KEY}`
      );
      
      if (!channelDetailsResponse.ok) {
        return Response.json({ error: 'Failed to fetch channel details' }, { status: 500 });
      }
      
      var channelData = await channelDetailsResponse.json();
    } else {
      var channelData = await channelResponse.json();
    }

    if (!channelData.items || channelData.items.length === 0) {
      return Response.json({ error: 'Channel not found' }, { status: 404 });
    }

    const uploadsPlaylistId = channelData.items[0].contentDetails.relatedPlaylists.uploads;

    // Buscar últimos vídeos da playlist de uploads
    const playlistResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=50&key=${YOUTUBE_API_KEY}`
    );

    if (!playlistResponse.ok) {
      return Response.json({ error: 'Failed to fetch videos' }, { status: 500 });
    }

    const playlistData = await playlistResponse.json();
    
    // Buscar detalhes adicionais dos vídeos (estatísticas e duração)
    const videoIds = playlistData.items.map(item => item.snippet.resourceId.videoId).join(',');
    const videosResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=statistics,contentDetails&id=${videoIds}&key=${YOUTUBE_API_KEY}`
    );

    const videosData = await videosResponse.json();
    const videoStats = {};
    videosData.items.forEach(video => {
      videoStats[video.id] = {
        viewCount: parseInt(video.statistics.viewCount || 0),
        likeCount: parseInt(video.statistics.likeCount || 0),
        duration: video.contentDetails.duration
      };
    });

    // Categorizar vídeos baseado em palavras-chave no título/descrição
    const categorizeVideo = (title, description) => {
      const text = (title + ' ' + description).toLowerCase();
      if (text.includes('ai') || text.includes('artificial intelligence') || text.includes('machine learning')) return 'ai';
      if (text.includes('business') || text.includes('strategy') || text.includes('management')) return 'business';
      if (text.includes('innovation') || text.includes('startup') || text.includes('venture')) return 'innovation';
      if (text.includes('education') || text.includes('learning') || text.includes('course')) return 'education';
      return 'general';
    };

    // Processar e salvar vídeos
    let syncedCount = 0;
    for (const item of playlistData.items) {
      const videoId = item.snippet.resourceId.videoId;
      const stats = videoStats[videoId] || {};
      
      // Verificar se vídeo já existe
      const existing = await base44.asServiceRole.entities.YouTubeVideo.filter({ video_id: videoId });
      
      const videoData = {
        video_id: videoId,
        title: item.snippet.title,
        description: item.snippet.description || '',
        thumbnail_url: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default?.url,
        published_at: item.snippet.publishedAt,
        view_count: stats.viewCount || 0,
        like_count: stats.likeCount || 0,
        duration: stats.duration || '',
        category: categorizeVideo(item.snippet.title, item.snippet.description || ''),
        tags: item.snippet.tags || []
      };

      if (existing.length > 0) {
        // Atualizar vídeo existente
        await base44.asServiceRole.entities.YouTubeVideo.update(existing[0].id, videoData);
      } else {
        // Criar novo vídeo
        await base44.asServiceRole.entities.YouTubeVideo.create(videoData);
      }
      
      syncedCount++;
    }

    return Response.json({
      success: true,
      synced: syncedCount,
      message: `Successfully synced ${syncedCount} videos from @artificiallysmarter`
    });

  } catch (error) {
    console.error('Error syncing YouTube videos:', error);
    return Response.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
});