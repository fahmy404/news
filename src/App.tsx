/// <reference types="vite/client" />
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { Activity, Clock, Globe, AlertTriangle, Terminal, Wifi, RefreshCw, ExternalLink } from 'lucide-react';
import { cn } from './lib/utils';

// ============================================================================
// 🔧 إعدادات الـ APIs الخاصة بك (YOUR API CONFIGURATION)
// ============================================================================
// قم بتغيير هذه الروابط لتتوافق مع الـ 3 APIs الخاصة بك.
// إذا كان لديك API Key، يمكنك إضافته في الـ headers داخل دالة الـ fetcher في الأسفل.

interface NewsItem {
  id: string;
  title: string;
  url: string;
  date: string;
  source: string;
}

interface ApiSource {
  id: string;
  name: string;
  url: string;
  color: string;
  borderColor: string;
  bgColor: string;
  iconColor: string;
  mapper: (data: any) => NewsItem[];
}


const getApiUrl = (envUrl: string | undefined, fallback: string) => {
  if (!envUrl) return fallback;
  const cleanUrl = envUrl.replace(/^["']|["']$/g, '').trim();
  if (!cleanUrl || !cleanUrl.startsWith('http')) return fallback;
  return cleanUrl;
};

const API_SOURCES: ApiSource[] = [
  {
    id: 'api-1',
    name: 'SOURCE ALPHA (Space)',
    url: getApiUrl(import.meta.env.VITE_NEWS_API_1_URL, 'https://api.spaceflightnewsapi.net/v4/articles/?limit=15'),
    color: 'text-emerald-400',
    borderColor: 'border-emerald-500/30',
    bgColor: 'bg-emerald-500/10',
    iconColor: 'text-emerald-500',
    // قم بتعديل هذه الدالة لتتناسب مع شكل البيانات الراجعة من الـ API الأول الخاص بك
    mapper: (data: any) => {
      const items = Array.isArray(data?.results) ? data.results 
                  : Array.isArray(data?.data) ? data.data 
                  : Array.isArray(data) ? data 
                  : [];
                  
      return items.slice(0, 15).map((item: any) => ({
        id: item.id?.toString() || item.title || Math.random().toString(),
        title: item.title || 'No Title',
        url: item.url || '#',
        date: item.published_at || item.updated_at || new Date().toISOString(),
        source: item.news_site || item.source?.name || 'Space News'
      }));
    }
  },
  {
    id: 'api-2',
    name: 'SOURCE BETA (Tech)',
    url: getApiUrl(import.meta.env.VITE_NEWS_API_2_URL, 'https://dev.to/api/articles?per_page=15'),
    color: 'text-cyan-400',
    borderColor: 'border-cyan-500/30',
    bgColor: 'bg-cyan-500/10',
    iconColor: 'text-cyan-500',
    // قم بتعديل هذه الدالة لتتناسب مع شكل البيانات الراجعة من الـ API الثاني الخاص بك
    mapper: (data: any) => {
      const items = Array.isArray(data) ? data 
                  : Array.isArray(data?.data) ? data.data 
                  : Array.isArray(data?.results) ? data.results 
                  : [];
                  
      return items.slice(0, 15).map((item: any) => ({
        id: item.id?.toString() || item.title || Math.random().toString(),
        title: item.title || 'No Title',
        url: item.url || '#',
        date: item.published_at || item.updated_at || new Date().toISOString(),
        source: item.user?.name || item.source?.name || 'Tech News'
      }));
    }
  },
  {
    id: 'api-3',
    name: 'SOURCE GAMMA (Crypto)',
    url: getApiUrl(import.meta.env.VITE_NEWS_API_3_URL, 'https://min-api.cryptocompare.com/data/v2/news/?lang=EN'),
    color: 'text-amber-400',
    borderColor: 'border-amber-500/30',
    bgColor: 'bg-amber-500/10',
    iconColor: 'text-amber-500',
    // قم بتعديل هذه الدالة لتتناسب مع شكل البيانات الراجعة من الـ API الثالث الخاص بك
    mapper: (data: any) => {
      // Handle different possible response formats (Data, data, results, or direct array)
      const items = Array.isArray(data?.Data) ? data.Data 
                  : Array.isArray(data?.data) ? data.data 
                  : Array.isArray(data?.results) ? data.results 
                  : Array.isArray(data) ? data 
                  : [];
                  
      return items.slice(0, 15).map((item: any) => ({
        id: item.id || item.title || Math.random().toString(),
        title: item.title || 'No Title',
        url: item.url || '#',
        date: item.published_on ? new Date(item.published_on * 1000).toISOString() : (item.published_at || item.updated_at || new Date().toISOString()),
        source: item.source_info?.name || item.source || item.news_site || 'Crypto News'
      }));
    }
  }
];

// ============================================================================
// 🖥️ مكونات واجهة المستخدم (UI COMPONENTS)
// ============================================================================

function NewsColumn({ source }: { source: ApiSource; key?: string | number }) {
  const [news, setNews] = useState<NewsItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchNews = async () => {
    setLoading(true);
    setError(null);
    try {
      // إذا كان الـ API الخاص بك يحتاج إلى Headers (مثل Authorization)، أضفها هنا:
      // const response = await fetch(source.url, { headers: { 'Authorization': 'Bearer YOUR_KEY' } });
      const response = await fetch(source.url);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      
      const mappedData = source.mapper(data);
      setNews(mappedData);
      setLastUpdated(new Date());
    } catch (err: any) {
      console.error(`Error fetching ${source.name}:`, err);
      setError(err.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
    // Refresh every 60 seconds
    const interval = setInterval(fetchNews, 60000);
    return () => clearInterval(interval);
  }, [source.url]);

  const getHostname = (url: string) => {
    try {
      return new URL(url).hostname;
    } catch {
      return url || 'UNKNOWN';
    }
  };

  return (
    <div className="flex flex-col h-full border border-zinc-800 bg-zinc-950/50 rounded-lg overflow-hidden relative">
      {/* Column Header */}
      <div className={cn("flex items-center justify-between p-3 border-b", source.borderColor, source.bgColor)}>
        <div className="flex items-center gap-2">
          <Activity className={cn("w-4 h-4", source.iconColor)} />
          <h2 className={cn("font-mono font-bold text-sm tracking-wider", source.color)}>
            {source.name}
          </h2>
        </div>
        <div className="flex items-center gap-3">
          {loading && <RefreshCw className={cn("w-3 h-3 animate-spin", source.color)} />}
          <div className="flex items-center gap-1.5">
            <div className={cn("w-2 h-2 rounded-full", error ? "bg-red-500" : (loading ? "bg-yellow-500" : "bg-green-500 animate-pulse"))} />
            <span className="text-[10px] font-mono text-zinc-400 uppercase">
              {error ? 'ERR' : (loading ? 'SYNC' : 'LIVE')}
            </span>
          </div>
        </div>
      </div>

      {/* Connection Info */}
      <div className="px-3 py-1.5 bg-zinc-900 border-b border-zinc-800 flex justify-between items-center text-[10px] font-mono text-zinc-500">
        <span className="truncate max-w-[200px]" title={source.url}>ENDP: {getHostname(source.url)}</span>
        <span>UPD: {lastUpdated ? format(lastUpdated, 'HH:mm:ss') : '--:--:--'}</span>
      </div>

      {/* News List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        <AnimatePresence mode="popLayout">
          {error ? (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="p-4 border border-red-900/50 bg-red-950/20 rounded text-red-400 text-xs font-mono flex items-start gap-2"
            >
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold mb-1">CONNECTION FAILURE</p>
                <p className="opacity-80">{error}</p>
              </div>
            </motion.div>
          ) : (
            news.map((item, index) => (
              <motion.a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                key={item.id + index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  "block p-3 rounded border border-zinc-800/50 bg-zinc-900/30 hover:bg-zinc-800 transition-colors group",
                  "hover:border-zinc-700"
                )}
              >
                <div className="flex justify-between items-start mb-2 gap-2">
                  <span className={cn("text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300", source.color)}>
                    {item.source || 'UNKNOWN'}
                  </span>
                  <span className="text-[10px] font-mono text-zinc-500 shrink-0">
                    {item.date ? format(new Date(item.date), 'HH:mm:ss') : '--:--'}
                  </span>
                </div>
                <h3 className="text-sm font-sans text-zinc-200 group-hover:text-white leading-snug mb-2">
                  {item.title}
                </h3>
                <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                  <ExternalLink className="w-3 h-3 text-zinc-500" />
                </div>
              </motion.a>
            ))
          )}
        </AnimatePresence>
        
        {!loading && !error && news.length === 0 && (
          <div className="text-center p-8 text-zinc-600 font-mono text-xs">
            NO DATA RECEIVED
          </div>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#050505] text-zinc-300 font-sans flex flex-col relative selection:bg-emerald-500/30">
      {/* Global Scanline Effect */}
      <div className="scanline pointer-events-none" />

      {/* Top Navigation / Command Header */}
      <header className="h-14 border-b border-zinc-800 bg-zinc-950 flex items-center justify-between px-4 shrink-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-zinc-900 border border-zinc-800 flex items-center justify-center">
            <Globe className="w-4 h-4 text-zinc-400" />
          </div>
          <div>
            <h1 className="font-mono font-bold text-sm tracking-widest text-zinc-100">GLOBAL NEWS COMMAND</h1>
            <p className="font-mono text-[10px] text-zinc-500 tracking-widest">MULTI-SOURCE INTELLIGENCE DASHBOARD</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 px-3 py-1 rounded bg-zinc-900 border border-zinc-800">
            <Terminal className="w-3 h-3 text-emerald-500" />
            <span className="font-mono text-xs text-emerald-500">SYSTEM ONLINE</span>
          </div>
          <div className="flex items-center gap-2 font-mono text-sm text-zinc-300">
            <Clock className="w-4 h-4 text-zinc-500" />
            <span>{format(time, 'yyyy-MM-dd')}</span>
            <span className="text-white font-bold w-[70px] text-right">{format(time, 'HH:mm:ss')}</span>
            <span className="text-zinc-600 text-xs">UTC{format(time, 'xxx')}</span>
          </div>
        </div>
      </header>

      {/* Main Grid */}
      <main className="flex-1 p-4 grid grid-cols-1 md:grid-cols-3 gap-4 min-h-0 z-10">
        {API_SOURCES.map((source) => (
          <NewsColumn key={source.id} source={source} />
        ))}
      </main>

      {/* Bottom Ticker */}
      <footer className="h-8 border-t border-zinc-800 bg-zinc-950 flex items-center shrink-0 z-10">
        <div className="px-3 border-r border-zinc-800 h-full flex items-center bg-zinc-900 shrink-0">
          <span className="font-mono text-[10px] font-bold text-red-500 tracking-widest flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            LIVE FEED
          </span>
        </div>
        <div className="ticker-wrap h-full flex items-center font-mono text-xs text-zinc-400">
          <div className="ticker">
            <span className="mx-4 text-zinc-600">///</span>
            AWAITING INCOMING TRANSMISSIONS...
            <span className="mx-4 text-zinc-600">///</span>
            MONITORING 3 ACTIVE ENDPOINTS...
            <span className="mx-4 text-zinc-600">///</span>
            ALL SYSTEMS NOMINAL...
            <span className="mx-4 text-zinc-600">///</span>
            AWAITING INCOMING TRANSMISSIONS...
            <span className="mx-4 text-zinc-600">///</span>
            MONITORING 3 ACTIVE ENDPOINTS...
            <span className="mx-4 text-zinc-600">///</span>
            ALL SYSTEMS NOMINAL...
          </div>
        </div>
      </footer>
    </div>
  );
}
