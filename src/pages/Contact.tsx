import React, { useState } from 'react';
import type { FormEvent } from 'react';
import PageHero from '../components/ui/PageHero';
import { SectionHeading } from '../components/ui/SectionHeading';
import { Button } from '../components/ui/Button';
import { MapPin, Phone, Mail, Clock } from 'lucide-react';
import { apiUrl, readJsonResponse } from '../lib/api';

const Contact: React.FC = () => {
  const [formStatus, setFormStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitContact = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setFormStatus(null);

    const form = event.currentTarget;
    const values = Object.fromEntries(new FormData(form) as any);

    try {
      const response = await fetch(apiUrl('/api/contact'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      const result = await readJsonResponse(response);
      if (!response.ok) throw new Error(result?.message || 'Gagal mengirim pesan.');

      if (form instanceof HTMLFormElement) form.reset();
      setFormStatus({ type: 'success', message: 'Pesan berhasil dikirim. Terima kasih telah menghubungi kami!' });
    } catch (error) {
      setFormStatus({ type: 'error', message: error instanceof Error ? error.message : 'Tidak dapat terhubung ke server.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-[#FAF6F0] min-h-screen">
      <PageHero 
        title="Hubungi Kami" 
        subtitle="Silakan hubungi kami untuk informasi lebih lanjut" 
        backgroundImage="https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1600&q=80"
      />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          
          {/* Contact Form */}
          <div className="bg-white rounded-xl shadow-sm p-8">
            <SectionHeading title="Kirim Pesan" />
            <form onSubmit={submitContact} className="mt-8 space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-[#23314D] mb-1">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  className="w-full px-4 py-3 rounded-lg border border-[#1B2A4A]/20 focus:ring-2 focus:ring-[#C8A951] focus:border-transparent outline-none transition-all"
                  placeholder="Masukkan nama Anda"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-[#23314D] mb-1">
                  Alamat Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  className="w-full px-4 py-3 rounded-lg border border-[#1B2A4A]/20 focus:ring-2 focus:ring-[#C8A951] focus:border-transparent outline-none transition-all"
                  placeholder="contoh@email.com"
                  required
                />
              </div>

              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-[#23314D] mb-1">
                  Subjek
                </label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  className="w-full px-4 py-3 rounded-lg border border-[#1B2A4A]/20 focus:ring-2 focus:ring-[#C8A951] focus:border-transparent outline-none transition-all"
                  placeholder="Subjek pesan"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-[#23314D] mb-1">
                  Pesan
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={5}
                  className="w-full px-4 py-3 rounded-lg border border-[#1B2A4A]/20 focus:ring-2 focus:ring-[#C8A951] focus:border-transparent outline-none transition-all resize-none"
                  placeholder="Tulis pesan Anda di sini..."
                  required
                ></textarea>
              </div>

              {formStatus && (
                <p className={`rounded-lg p-4 text-sm ${formStatus.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-700'}`}>
                  {formStatus.message}
                </p>
              )}
              
              <Button type="submit" disabled={isSubmitting} className="w-full bg-[#C8A951] hover:bg-[#b09444] text-[#1B2A4A] font-bold py-3 text-lg disabled:opacity-70 disabled:cursor-not-allowed">
                {isSubmitting ? 'Mengirim...' : 'Kirim Pesan'}
              </Button>
            </form>
          </div>

          {/* Contact Info */}
          <div className="space-y-8">
            <div className="bg-[#1B2A4A] rounded-xl shadow-sm p-8 text-[#FAF6F0]">
              <h3 className="text-2xl font-bold mb-6 text-[#C8A951]">Informasi Kontak</h3>
              
              <div className="space-y-6">
                <div className="flex items-start">
                  <MapPin className="w-6 h-6 text-[#C8A951] mr-4 shrink-0 mt-1" />
                  <div>
                    <h4 className="font-bold text-white mb-1">Alamat</h4>
                    <p className="text-[#F3E8D0] leading-relaxed">
                      Kp. Saradan RT. 03/01, Desa Pangkat,<br />
                      Kec. Jayanti, Kab. Tangerang, Banten 15610
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <Phone className="w-6 h-6 text-[#C8A951] mr-4 shrink-0 mt-1" />
                  <div>
                    <h4 className="font-bold text-white mb-1">Telepon</h4>
                    <p className="text-[#F3E8D0]">0812 9922 0831</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <Mail className="w-6 h-6 text-[#C8A951] mr-4 shrink-0 mt-1" />
                  <div>
                    <h4 className="font-bold text-white mb-1">Email</h4>
                    <p className="text-[#F3E8D0]">admin@smkn11kabtang.sch.id</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <Clock className="w-6 h-6 text-[#C8A951] mr-4 shrink-0 mt-1" />
                  <div>
                    <h4 className="font-bold text-white mb-1">Jam Operasional</h4>
                    <p className="text-[#F3E8D0]">Senin - Jumat, 07:00 - 15:00 WIB</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Google Maps Embed */}
            <div className="rounded-xl overflow-hidden h-64 w-full">
              <iframe
                src="https://www.google.com/maps?q=Kp.+Saradan+RT.+03/01,+Pangkat,+Jayanti,+Kabupaten+Tangerang,+Banten+15610&output=embed"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Lokasi SMKN 11 Kabupaten Tangerang"
              />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Contact;
