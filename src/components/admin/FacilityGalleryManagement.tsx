import { useEffect, useState } from 'react';
import { Building2, ImagePlus, Loader2, Trash2, Upload } from 'lucide-react';
import { backendApi, resolveImageUrl } from '../../lib/api';
import ImageField from './ImageField';

interface Facility {
  id: string;
  name: string;
  slug: string;
  category: string;
  photo: string;
  photos: string[];
}

export default function FacilityGalleryManagement() {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await backendApi.database.from('facilities').select('*').order('name');
    if (data) setFacilities(data.map((f: any) => ({ ...f, photos: Array.isArray(f.photos) ? f.photos : [] })));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const getAllPhotos = (f: Facility): string[] => {
    return [f.photo, ...(f.photos ?? [])].filter(Boolean);
  };

  const updatePhotos = async (facilityId: string, mainPhoto: string, extraPhotos: string[]) => {
    setSaving(facilityId);
    const { error } = await backendApi.database
      .from('facilities')
      .update({ photo: mainPhoto, photos: extraPhotos })
      .eq('id', facilityId);
    if (!error) {
      setFacilities(prev => prev.map(f =>
        f.id === facilityId ? { ...f, photo: mainPhoto, photos: extraPhotos } : f
      ));
    }
    setSaving(null);
  };

  const addPhoto = (facilityId: string) => {
    setFacilities(prev => prev.map(f =>
      f.id === facilityId ? { ...f, photos: [...(f.photos ?? []), ''] } : f
    ));
    setExpanded(facilityId);
  };

  const removePhoto = (facilityId: string, photoIndex: number) => {
    setFacilities(prev => prev.map(f => {
      if (f.id !== facilityId) return f;
      const newPhotos = [...(f.photos ?? [])];
      newPhotos.splice(photoIndex, 1);
      return { ...f, photos: newPhotos };
    }));
  };

  const removeMainPhoto = (facilityId: string) => {
    setFacilities(prev => prev.map(f =>
      f.id === facilityId ? { ...f, photo: '' } : f
    ));
  };

  const setMainPhoto = (facilityId: string, url: string) => {
    setFacilities(prev => prev.map(f =>
      f.id === facilityId ? { ...f, photo: url } : f
    ));
  };

  const setExtraPhoto = (facilityId: string, index: number, url: string) => {
    setFacilities(prev => prev.map(f => {
      if (f.id !== facilityId) return f;
      const newPhotos = [...(f.photos ?? [])];
      newPhotos[index] = url;
      return { ...f, photos: newPhotos.filter(Boolean) };
    }));
  };

  if (loading) {
    return <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-[#C8A951]" /></div>;
  }

  return (
    <div className="space-y-4">
      <p className="text-[#23314D]">Kelola foto galeri untuk setiap fasilitas sekolah. Klik untuk expand, lalu tambah/hapus foto langsung.</p>

      <div className="grid gap-4 md:grid-cols-2">
        {facilities.map(facility => {
          const allPhotos = getAllPhotos(facility);
          const isExpanded = expanded === facility.id;
          const isSaving = saving === facility.id;

          return (
            <div key={facility.id} className="rounded-xl border border-[#1B2A4A]/10 bg-white shadow-sm overflow-hidden">
              {/* Header — always visible */}
              <button
                type="button"
                onClick={() => setExpanded(isExpanded ? null : facility.id)}
                className="flex w-full items-center gap-3 p-4 text-left hover:bg-[#FAF6F0] transition-colors"
              >
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#EEF1FE] text-[#5B68D6]">
                  <Building2 className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-[#1B2A4A] truncate">{facility.name}</h3>
                  <p className="text-xs text-[#5B7088]">{facility.category || 'Tanpa kategori'} &middot; {allPhotos.length} foto</p>
                </div>
                <div className="flex items-center gap-2">
                  {allPhotos.length > 0 && (
                    <div className="flex -space-x-2">
                      {allPhotos.slice(0, 3).map((url, idx) => (
                        <div key={idx} className="h-8 w-8 overflow-hidden rounded-full border-2 border-white">
                          {resolveImageUrl(url) ? (
                            <img src={resolveImageUrl(url)!} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <div className="h-full w-full bg-gray-200" />
                          )}
                        </div>
                      ))}
                      {allPhotos.length > 3 && (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-[#C8A951] text-[8px] font-bold text-white">
                          +{allPhotos.length - 3}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </button>

              {/* Expanded gallery */}
              {isExpanded && (
                <div className="border-t border-[#1B2A4A]/10 p-4 space-y-4">
                  {/* Main photo */}
                  <div>
                    <p className="mb-2 text-xs font-semibold text-[#5B7088] uppercase tracking-wider">Foto Utama</p>
                    {facility.photo ? (
                      <div className="relative overflow-hidden rounded-lg">
                        {resolveImageUrl(facility.photo) ? (
                          <img src={resolveImageUrl(facility.photo)!} alt="" className="h-40 w-full object-cover" />
                        ) : (
                          <div className="grid h-40 place-items-center bg-gray-100 text-[#5B7088]">Loading...</div>
                        )}
                        <button
                          onClick={() => removeMainPhoto(facility.id)}
                          className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-white hover:bg-black/80"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ) : (
                      <ImageField
                        label=""
                        value=""
                        bucket="photos"
                        onChange={(url) => setMainPhoto(facility.id, url)}
                        hint="Upload foto utama fasilitas"
                      />
                    )}
                  </div>

                  {/* Extra photos */}
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-xs font-semibold text-[#5B7088] uppercase tracking-wider">Foto Tambahan</p>
                      <button
                        onClick={() => addPhoto(facility.id)}
                        className="inline-flex items-center gap-1 rounded-lg border border-[#1B2A4A]/20 px-2.5 py-1 text-xs font-semibold hover:bg-[#FAF6F0]"
                      >
                        <ImagePlus size={14} /> Tambah
                      </button>
                    </div>

                    {(facility.photos ?? []).length === 0 && (
                      <p className="text-xs text-[#5B7088] italic">Belum ada foto tambahan.</p>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                      {(facility.photos ?? []).map((url, idx) => (
                        <div key={idx} className="relative overflow-hidden rounded-lg">
                          {url ? (
                            resolveImageUrl(url) ? (
                              <img src={resolveImageUrl(url)!} alt="" className="h-28 w-full object-cover" />
                            ) : (
                              <div className="grid h-28 place-items-center bg-gray-100 text-[#5B7088] text-xs">Loading...</div>
                            )
                          ) : (
                            <div className="h-28">
                              <ImageField
                                label=""
                                value=""
                                bucket="photos"
                                onChange={(newUrl) => setExtraPhoto(facility.id, idx, newUrl)}
                              />
                            </div>
                          )}
                          {url && (
                            <button
                              onClick={() => removePhoto(facility.id, idx)}
                              className="absolute right-1.5 top-1.5 rounded-full bg-black/60 p-1 text-white hover:bg-black/80"
                            >
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Save button */}
                  <div className="flex justify-end border-t border-[#1B2A4A]/10 pt-3">
                    <button
                      onClick={() => updatePhotos(facility.id, facility.photo, facility.photos ?? [])}
                      disabled={isSaving}
                      className="inline-flex items-center gap-2 rounded-lg bg-[#1B2A4A] px-4 py-2 text-sm font-bold text-white hover:bg-[#15203a] disabled:opacity-60"
                    >
                      {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                      {isSaving ? 'Menyimpan...' : 'Simpan'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
