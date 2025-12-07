
import React, { useState } from 'react';
import { HardHat, ArrowRight, Lock, Mail, Loader2, AlertCircle } from 'lucide-react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../services/firebase';

interface LoginProps {
  onLoginSuccess: (user: any) => void;
  onDemoMode: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess, onDemoMode }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!auth) {
      setError("Firebase yapılandırması eksik. Lütfen 'Demo Modu'nu kullanın.");
      return;
    }

    setIsLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      onLoginSuccess(userCredential.user);
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/invalid-credential') {
        setError('E-posta veya şifre hatalı.');
      } else {
        setError('Giriş yapılırken bir hata oluştu. ' + err.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-900 relative overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&q=80&w=2531" 
          alt="Construction Site" 
          className="w-full h-full object-cover opacity-20"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/80 to-slate-900/40"></div>
      </div>

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md p-8">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-orange-600 rounded-2xl mb-6 shadow-lg shadow-orange-900/50">
            <HardHat size={48} className="text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">SiteMaster</h1>
          <p className="text-slate-400 text-lg">Yeni Nesil Şantiye Yönetim Platformu</p>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-200 p-3 rounded-xl flex items-center gap-2 text-sm">
                <AlertCircle size={16} />
                {error}
              </div>
            )}
            
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-300 ml-1">E-Posta</label>
              <div className="relative">
                <Mail className="absolute left-4 top-3.5 text-slate-500" size={20} />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="isim@sirket.com"
                  className="w-full bg-slate-900/50 border border-slate-700 text-white rounded-xl py-3 pl-12 pr-4 outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all placeholder:text-slate-600"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-300 ml-1">Şifre</label>
              <div className="relative">
                <Lock className="absolute left-4 top-3.5 text-slate-500" size={20} />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-900/50 border border-slate-700 text-white rounded-xl py-3 pl-12 pr-4 outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all placeholder:text-slate-600"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-orange-900/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {isLoading ? <Loader2 className="animate-spin" /> : 'Giriş Yap'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-white/10 text-center">
            <p className="text-slate-400 text-sm mb-4">Hesabınız yok mu veya denemek mi istiyorsunuz?</p>
            <button 
              onClick={onDemoMode}
              className="w-full bg-white/5 hover:bg-white/10 text-white border border-white/10 font-medium py-3 rounded-xl transition-all flex items-center justify-center gap-2 group"
            >
              Demo Olarak İncele
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
        
        <div className="mt-8 text-center">
          <p className="text-slate-500 text-xs">
            &copy; 2024 SiteMaster A.Ş. Tüm hakları saklıdır.
            <br />
            v2.0.1 (SaaS Edition)
          </p>
        </div>
      </div>
    </div>
  );
};
