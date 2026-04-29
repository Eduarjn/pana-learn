import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle2, Play, Lock, ArrowLeft, Clock, ChevronDown, ChevronUp, Award } from 'lucide-react';

// ERA Brand: #000000 | #14213D | #FCA311 | #E5E5E5 | #FFFFFF
const O = '#FCA311';
const P = '#14213D';
const W = '#FFFFFF';
const A = '#E5E5E5';

interface Video {
  id: string;
  titulo: string;
  url_video: string;
  thumbnail_url: string;
  duracao: number;
  modulo_id: string;
  ordem?: number;
}

const CSS = `
  .cd-page{background:#08111f;min-height:100vh;display:flex;flex-direction:column}
  .cd-topbar{background:#000;border-bottom:1px solid rgba(252,163,17,0.15);padding:0 24px;height:56px;display:flex;align-items:center;gap:16px;position:sticky;top:0;z-index:20;flex-shrink:0}
  .cd-main{display:flex;flex:1;overflow:hidden;height:calc(100vh - 56px)}
  .cd-player-col{flex:1;display:flex;flex-direction:column;overflow-y:auto;background:#08111f}
  .cd-sidebar{width:340px;flex-shrink:0;background:#000;border-left:1px solid rgba(252,163,17,0.12);display:flex;flex-direction:column;overflow:hidden}
  .cd-sidebar-header{padding:16px 18px;border-bottom:1px solid rgba(252,163,17,0.1);flex-shrink:0}
  .cd-sidebar-list{flex:1;overflow-y:auto}
  .cd-sidebar-list::-webkit-scrollbar{width:4px}
  .cd-sidebar-list::-webkit-scrollbar-track{background:#000}
  .cd-sidebar-list::-webkit-scrollbar-thumb{background:rgba(252,163,17,0.25);border-radius:99px}
  .cd-vid-item{display:flex;align-items:center;gap:12;padding:11px 16px;cursor:pointer;border-bottom:1px solid rgba(255,255,255,0.04);transition:background .15s}
  .cd-vid-item:hover{background:rgba(252,163,17,0.06)}
  .cd-vid-item.active{background:rgba(252,163,17,0.1);border-left:3px solid #FCA311}
  .cd-vid-item.active .cd-vid-num{color:#FCA311;font-weight:700}
  .cd-progress-bar{height:4px;background:rgba(252,163,17,0.15);border-radius:99px;overflow:hidden}
  .cd-progress-fill{height:100%;background:linear-gradient(90deg,#FCA311,#e8940f);border-radius:99px;transition:width .4s}
  @keyframes cdFadeIn{from{opacity:0;transform:scale(.98)}to{opacity:1;transform:scale(1)}}
  .cd-player-wrap{animation:cdFadeIn .3s ease}
  @media(max-width:768px){.cd-main{flex-direction:column;height:auto}.cd-sidebar{width:100%;height:auto;border-left:none;border-top:1px solid rgba(252,163,17,0.12)}.cd-sidebar-list{max-height:300px}}
`;

const VideoPlayer: React.FC<{ src: string; key?: string }> = ({ src }) => {
  if (!src) return (
    <div style={{ background: '#000', aspectRatio: '16/9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 14 }}>
      <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'rgba(252,163,17,0.08)', border: '1px solid rgba(252,163,17,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Play style={{ width: 24, height: 24, color: 'rgba(229,229,229,0.3)' }} />
      </div>
      <p style={{ color: 'rgba(229,229,229,0.3)', fontSize: 14 }}>Vídeo não disponível</p>
    </div>
  );

  const isYT = src.includes('youtube.com') || src.includes('youtu.be');
  const getYTEmbed = (url: string) => {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([^&?/]+)/);
    return match ? `https://www.youtube.com/embed/${match[1]}?autoplay=1&rel=0` : url;
  };

  return isYT ? (
    <iframe
      className="cd-player-wrap"
      style={{ width: '100%', aspectRatio: '16/9', border: 'none', display: 'block' }}
      src={getYTEmbed(src)}
      title="Player"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
      allowFullScreen
    />
  ) : (
    <video
      className="cd-player-wrap"
      style={{ width: '100%', aspectRatio: '16/9', background: '#000', display: 'block' }}
      src={src}
      controls
      autoPlay
    />
  );
};

const CursoDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [videos, setVideos] = useState<Video[]>([]);
  const [idx, setIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [watched, setWatched] = useState<Set<string>>(new Set());
  const [courseName, setCourseName] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Buscar nome do curso
        const { data: curso } = await supabase.from('cursos').select('nome').eq('id', id).single();
        if (curso) setCourseName(curso.nome);

        // Buscar módulos
        const { data: modulos } = await supabase.from('modulos').select('id, video_id, ordem').eq('curso_id', id).order('ordem', { ascending: true });
        const videoIds = (modulos || []).map((m: any) => m.video_id).filter(Boolean);

        if (videoIds.length > 0) {
          const { data: vids } = await supabase.from('videos').select('*').in('id', videoIds);
          if (vids) {
            // Ordenar pela ordem dos módulos
            const ordered = (modulos || [])
              .map((m: any) => vids.find((v: any) => v.id === m.video_id))
              .filter(Boolean) as Video[];
            setVideos(ordered);
          }
        }

        // Buscar progresso salvo
        const { data: prog } = await supabase.from('video_progress').select('video_id').eq('curso_id', id);
        if (prog) setWatched(new Set(prog.map((p: any) => p.video_id)));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const markWatched = async (videoId: string) => {
    setWatched(prev => new Set([...prev, videoId]));
    try {
      await supabase.from('video_progress').upsert({ video_id: videoId, curso_id: id }, { onConflict: 'video_id,curso_id' });
    } catch { }
  };

  const current = videos[idx];
  const progress = videos.length > 0 ? Math.round((watched.size / videos.length) * 100) : 0;

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) return (
    <>
      <style>{CSS}</style>
      <div className="cd-page" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="animate-spin" style={{ width: 36, height: 36, border: `2px solid ${O}`, borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto 14px' }} />
          <p style={{ color: 'rgba(229,229,229,0.5)', fontSize: 14 }}>Carregando curso...</p>
        </div>
      </div>
    </>
  );

  if (!videos.length) return (
    <>
      <style>{CSS}</style>
      <div className="cd-page" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(252,163,17,0.08)', border: '1px solid rgba(252,163,17,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Play style={{ width: 22, height: 22, color: 'rgba(229,229,229,0.3)' }} />
          </div>
          <p style={{ color: A, fontWeight: 600, fontSize: 16, marginBottom: 6 }}>Nenhum vídeo encontrado</p>
          <p style={{ color: 'rgba(229,229,229,0.4)', fontSize: 13, marginBottom: 20 }}>Este curso ainda não possui vídeos.</p>
          <button onClick={() => navigate(-1)} style={{ background: O, color: '#000', border: 'none', borderRadius: 10, padding: '9px 20px', fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 7 }}>
            <ArrowLeft style={{ width: 14, height: 14 }} />Voltar
          </button>
        </div>
      </div>
    </>
  );

  return (
    <>
      <style>{CSS}</style>
      <div className="cd-page">

        {/* ── TOPBAR ─────────────────────────────────────────── */}
        <div className="cd-topbar">
          {/* Logo / back */}
          <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(229,229,229,0.6)', fontSize: 13, transition: 'color .15s', padding: 0 }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = O}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'rgba(229,229,229,0.6)'}>
            <ArrowLeft style={{ width: 15, height: 15 }} />
            <span style={{ fontWeight: 600, fontSize: 18, color: O, letterSpacing: '-.01em' }}>ERA</span>
            <span style={{ color: 'rgba(229,229,229,0.3)', fontSize: 11 }}>|</span>
          </button>

          {/* Course name */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ color: A, fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>{courseName}</p>
          </div>

          {/* Progress */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div className="cd-progress-bar" style={{ width: 120 }}>
                <div className="cd-progress-fill" style={{ width: `${progress}%` }} />
              </div>
              <span style={{ fontSize: 12, color: progress === 100 ? '#22c55e' : O, fontWeight: 700, whiteSpace: 'nowrap' }}>
                {progress}%
              </span>
            </div>
            {progress === 100 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 99, background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.25)' }}>
                <Award style={{ width: 12, height: 12, color: '#22c55e' }} />
                <span style={{ fontSize: 11, color: '#22c55e', fontWeight: 700 }}>Concluído!</span>
              </div>
            )}
          </div>
        </div>

        {/* ── MAIN LAYOUT ────────────────────────────────────── */}
        <div className="cd-main">

          {/* Player column */}
          <div className="cd-player-col">
            {/* Video player */}
            <div style={{ background: '#000', position: 'sticky', top: 0, zIndex: 5 }}>
              <VideoPlayer key={current?.id} src={current?.url_video || ''} />
            </div>

            {/* Video info */}
            <div style={{ padding: '22px 28px', flex: 1 }}>
              {/* Number + title */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 20 }}>
                <div style={{ width: 36, height: 36, borderRadius: 9, background: 'rgba(252,163,17,0.1)', border: '1px solid rgba(252,163,17,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                  <span style={{ fontSize: 14, fontWeight: 800, color: O }}>{idx + 1}</span>
                </div>
                <div style={{ flex: 1 }}>
                  <h1 style={{ fontSize: 20, fontWeight: 800, color: W, margin: '0 0 6px', lineHeight: 1.3 }}>{current?.titulo}</h1>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: 'rgba(229,229,229,0.45)' }}>
                      <Clock style={{ width: 13, height: 13 }} />{current?.duracao || 0} min
                    </span>
                    <span style={{ fontSize: 12, color: 'rgba(229,229,229,0.25)' }}>·</span>
                    <span style={{ fontSize: 13, color: 'rgba(229,229,229,0.45)' }}>Aula {idx + 1} de {videos.length}</span>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {!watched.has(current?.id) && (
                  <button onClick={() => markWatched(current.id)}
                    style={{ background: O, color: '#000', border: 'none', borderRadius: 10, padding: '10px 20px', fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7, transition: 'all .18s' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#e8940f'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = O; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}>
                    <CheckCircle2 style={{ width: 15, height: 15 }} />
                    Marcar como concluída
                  </button>
                )}

                {watched.has(current?.id) && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 20px', borderRadius: 10, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)' }}>
                    <CheckCircle2 style={{ width: 15, height: 15, color: '#22c55e' }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#22c55e' }}>Aula concluída</span>
                  </div>
                )}

                {idx < videos.length - 1 && (
                  <button onClick={() => setIdx(i => i + 1)}
                    style={{ background: 'rgba(252,163,17,0.08)', color: O, border: '1px solid rgba(252,163,17,0.22)', borderRadius: 10, padding: '10px 20px', fontWeight: 600, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7, transition: 'all .18s' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(252,163,17,0.16)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'rgba(252,163,17,0.08)'}>
                    Próxima aula →
                  </button>
                )}
              </div>

              {/* Progress bar */}
              <div style={{ marginTop: 28, padding: '16px 20px', borderRadius: 12, background: P, border: '1px solid rgba(252,163,17,0.12)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: A }}>Progresso do curso</span>
                  <span style={{ fontSize: 13, fontWeight: 800, color: O }}>{watched.size}/{videos.length} aulas</span>
                </div>
                <div className="cd-progress-bar">
                  <div className="cd-progress-fill" style={{ width: `${progress}%` }} />
                </div>
                {progress === 100 && (
                  <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 9, background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}>
                    <Award style={{ width: 16, height: 16, color: '#22c55e' }} />
                    <span style={{ fontSize: 13, color: '#22c55e', fontWeight: 600 }}>🎉 Parabéns! Você concluiu este curso.</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── SIDEBAR ──────────────────────────────────────── */}
          <div className="cd-sidebar">
            <div className="cd-sidebar-header">
              <p style={{ fontSize: 13, fontWeight: 700, color: W, margin: '0 0 10px' }}>Conteúdo do curso</p>
              {/* Mini progress */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <div className="cd-progress-bar" style={{ flex: 1 }}>
                  <div className="cd-progress-fill" style={{ width: `${progress}%` }} />
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: O, flexShrink: 0 }}>{progress}%</span>
              </div>
              <p style={{ fontSize: 11, color: 'rgba(229,229,229,0.38)', marginTop: 5 }}>
                {watched.size} de {videos.length} aulas concluídas
              </p>
            </div>

            <div className="cd-sidebar-list">
              {videos.map((v, i) => {
                const isActive = i === idx;
                const isDone = watched.has(v.id);
                return (
                  <div
                    key={v.id}
                    className={`cd-vid-item${isActive ? ' active' : ''}`}
                    onClick={() => setIdx(i)}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.04)', borderLeft: isActive ? `3px solid ${O}` : '3px solid transparent', background: isActive ? 'rgba(252,163,17,0.09)' : 'transparent', transition: 'all .15s' }}
                    onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'rgba(252,163,17,0.05)'; }}
                    onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                  >
                    {/* Status icon */}
                    <div style={{ width: 28, height: 28, borderRadius: 8, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: isDone ? 'rgba(34,197,94,0.12)' : isActive ? 'rgba(252,163,17,0.12)' : 'rgba(255,255,255,0.05)', border: `1px solid ${isDone ? 'rgba(34,197,94,0.25)' : isActive ? 'rgba(252,163,17,0.3)' : 'rgba(255,255,255,0.07)'}` }}>
                      {isDone
                        ? <CheckCircle2 style={{ width: 13, height: 13, color: '#22c55e' }} />
                        : isActive
                          ? <Play style={{ width: 11, height: 11, color: O, marginLeft: 1 }} />
                          : <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(229,229,229,0.4)' }}>{i + 1}</span>
                      }
                    </div>

                    {/* Thumbnail */}
                    {v.thumbnail_url && (
                      <img src={v.thumbnail_url} alt="" style={{ width: 52, height: 34, objectFit: 'cover', borderRadius: 6, flexShrink: 0, opacity: isDone ? .7 : 1 }} />
                    )}

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 12, fontWeight: isActive ? 700 : 500, color: isActive ? O : isDone ? 'rgba(229,229,229,0.55)' : A, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: '0 0 2px' }}>
                        {v.titulo}
                      </p>
                      <p style={{ fontSize: 11, color: 'rgba(229,229,229,0.35)', margin: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Clock style={{ width: 10, height: 10 }} />{v.duracao} min
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CursoDetail;
