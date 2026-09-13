import React, { useEffect, useState } from 'react';
import PageHero from '../../components/ui/PageHero';
import {
  ShieldCheck, Lightbulb, Users, Award, Loader2,
  Heart, Star, Target, Zap, BookOpen, Globe, Handshake,
  Sparkles, TrendingUp, Compass, Shield, CheckCircle, Rocket,
} from 'lucide-react';
import { backendApi, resolveImageUrl } from '../../lib/api';

const ICON_MAP: Record<string, React.FC<{ size?: number }>> = {
  ShieldCheck, Lightbulb, Users, Award,
  Heart, Star, Target, Zap, BookOpen, Globe, Handshake,
  Sparkles, TrendingUp, Compass, Shield, CheckCircle, Rocket,
};

const DEFAULT_ICONS = [ShieldCheck, Lightbulb, Users, Award];

interface VisiMisiData {
  visi?: string;
  misi?: string[];
  nilai_inti?: { title: string; description: string; icon?: string; icon_image?: string }[];
}

const VisionMission: React.FC = () => {
  const [data, setData] = useState<VisiMisiData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    backendApi.database
      .from('content_records')
      .select('data')
      .eq('content_type', 'home')
      .limit(1)
      .maybeSingle()
      .then((result: any) => {
        if (cancelled) return;
        if (result.data?.data) {
          const parsed = typeof result.data.data === 'string'
            ? JSON.parse(result.data.data)
            : result.data.data;
          setData(parsed?.visi_misi ?? null);
        }
        setLoading(false);
      })
      .catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <main className="bg-[#FAF6F0] min-h-screen">
        <PageHero
          title="Visi & Misi"
          subtitle="Arah dan tujuan pendidikan SMKN 11 Kabupaten Tangerang"
          backgroundImage="https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1600&q=80"
        />
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-[#C8A951]" />
        </div>
      </main>
    );
  }

  const visi = data?.visi ?? '';
  const misi = data?.misi ?? [];
  const nilaiInti = data?.nilai_inti ?? [];

  return (
    <main className="bg-[#FAF6F0] min-h-screen">
      <PageHero
        title="Visi & Misi"
        subtitle="Arah dan tujuan pendidikan SMKN 11 Kabupaten Tangerang"
        backgroundImage="https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1600&q=80"
      />
      <section className="py-16 md:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="mb-20">
          <div className="bg-[#1B2A4A] text-[#FAF6F0] rounded-2xl p-6 sm:p-10 md:p-16 text-center shadow-lg">
            <h2 className="text-3xl md:text-4xl font-bold text-[#C8A951] mb-8 uppercase tracking-wider">Visi</h2>
            {visi ? (
              <p className="text-xl md:text-2xl text-white leading-relaxed font-medium">
                &ldquo;{visi}&rdquo;
              </p>
            ) : (
              <p className="text-xl text-white/60 italic">Belum ada data visi.</p>
            )}
          </div>
        </div>

        <div className="mb-20">
          <h2 className="text-3xl font-bold text-[#1B2A4A] text-center mb-12">Misi Sekolah</h2>
          {misi.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {misi.map((mission, index) => (
                <div key={index} className="flex items-start bg-white p-6 rounded-lg shadow-sm">
                  <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-[#C8A951] text-white font-bold text-lg mr-4">
                    {index + 1}
                  </div>
                  <p className="text-[#23314D] leading-relaxed pt-1">
                    {mission}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-[#5B7088] italic">Belum ada data misi.</p>
          )}
        </div>

        <div>
          <h2 className="text-3xl font-bold text-[#1B2A4A] text-center mb-12">Nilai Inti</h2>
          {nilaiInti.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {nilaiInti.map((value, index) => {
                const customImageUrl = resolveImageUrl(value.icon_image);
                const iconName = value.icon && value.icon !== 'custom' ? value.icon : '';
                const Icon = ICON_MAP[iconName] ?? DEFAULT_ICONS[index % DEFAULT_ICONS.length];
                return (
                  <div key={index} className="bg-white p-6 sm:p-8 rounded-lg shadow-sm text-center flex flex-col items-center">
                    <div className="w-16 h-16 rounded-full bg-[#FAF6F0] text-[#C8A951] flex items-center justify-center mb-6 overflow-hidden">
                      {customImageUrl ? (
                        <img src={customImageUrl} alt={value.title} className="h-full w-full object-contain" />
                      ) : (
                        <Icon size={32} />
                      )}
                    </div>
                    <h3 className="text-xl font-bold text-[#1B2A4A] mb-3">{value.title}</h3>
                    <p className="text-[#23314D]">{value.description}</p>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-center text-[#5B7088] italic">Belum ada data nilai inti.</p>
          )}
        </div>
      </section>
    </main>
  );
};

export default VisionMission;
