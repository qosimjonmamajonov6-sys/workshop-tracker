import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = '/api';

function App() {
  const [data, setData] = useState({
    materials: [],
    products: [],
    workers: [],
    logs: []
  });
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ productId: '', amount: '', workerId: '' });
  const [tab, setTab] = useState('dashboard');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await axios.get(`${API_BASE}/stats`);
      setData(res.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleProduce = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE}/produce`, form);
      alert('Muvaffaqiyatli bajarildi!');
      setForm({ productId: '', amount: '', workerId: '' });
      fetchData();
    } catch (err) {
      alert('Xatolik: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleAddMaterial = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const materialData = {
      name: formData.get('name'),
      quantity: parseFloat(formData.get('quantity')),
      unit: formData.get('unit'),
      price: parseFloat(formData.get('price'))
    };
    try {
      await axios.post(`${API_BASE}/materials`, materialData);
      alert('Xomashyo muvaffaqiyatli qo\'shildi!');
      e.target.reset();
      fetchData();
    } catch (err) {
      alert('Xatolik: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleAddWorker = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const workerData = {
      name: formData.get('name'),
      payRate: parseFloat(formData.get('payRate'))
    };
    try {
      await axios.post(`${API_BASE}/workers`, workerData);
      alert('Ishchi muvaffaqiyatli qo\'shildi!');
      e.target.reset();
      fetchData();
    } catch (err) {
      alert('Xatolik: ' + (err.response?.data?.error || err.message));
    }
  };


  if (loading) return <div className="flex items-center justify-center h-screen bg-slate-900 text-white text-2xl font-bold">Yuklanmoqda...</div>;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 glass border-r border-slate-800 p-6 hidden md:block">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center text-white text-xl">
            🏗️
          </div>
          <h2 className="text-xl font-bold text-white uppercase tracking-wider">Sex Manager</h2>
        </div>
        
        <nav className="space-y-2">
          {['dashboard', 'materials', 'products', 'workers'].map((item) => (
            <button
              key={item}
              onClick={() => setTab(item)}
              className={`w-full text-left px-4 py-3 rounded-lg capitalize transition-all ${
                tab === item ? 'bg-primary-600 text-white shadow-lg' : 'hover:bg-slate-800'
              }`}
            >
              {item === 'dashboard' ? '📊 Boshqaruv' : 
               item === 'materials' ? '📦 Ombor' : 
               item === 'products' ? '🛍️ Mahsulotlar' : '👥 Ishchilar'}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="md:ml-64 p-8">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white capitalize">
            {tab === 'dashboard' ? 'Boshqaruv' : 
             tab === 'materials' ? 'Ombor' : 
             tab === 'products' ? 'Mahsulotlar' : 'Ishchilar'} Paneli
          </h1>
          <div className="glass px-4 py-2 rounded-full text-sm">Bugun: {new Date().toLocaleDateString('uz-UZ')}</div>
        </header>

        {tab === 'dashboard' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="stat-card-gradient-1 p-6 rounded-2xl shadow-xl">
                <p className="text-blue-100 text-sm mb-1 uppercase font-semibold">Tayyor Mahsulotlar</p>
                <h3 className="text-3xl font-bold text-white">{data.products.reduce((a, b) => a + (b.stock || 0), 0)} ta</h3>
              </div>
              <div className="stat-card-gradient-2 p-6 rounded-2xl shadow-xl">
                <p className="text-emerald-100 text-sm mb-1 uppercase font-semibold">Ishchilar</p>
                <h3 className="text-3xl font-bold text-white">{data.workers.length} ta</h3>
              </div>
              <div className="stat-card-gradient-3 p-6 rounded-2xl shadow-xl">
                <p className="text-red-100 text-sm mb-1 uppercase font-semibold">Xomashyo turlari</p>
                <h3 className="text-3xl font-bold text-white">{data.materials.length} tur</h3>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Production Form */}
              <section className="glass rounded-2xl p-6">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <span className="text-primary-400">🔥</span> Kunlik Ishlab Chiqarish
                </h3>
                <form onSubmit={handleProduce} className="space-y-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Mahsulotni tanlang</label>
                    <select
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-primary-500"
                      value={form.productId}
                      onChange={(e) => setForm({ ...form, productId: e.target.value })}
                      required
                    >
                      <option value="">Tanlang...</option>
                      {data.products.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Kim ishlab chiqardi?</label>
                    <select
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-primary-500"
                      value={form.workerId}
                      onChange={(e) => setForm({ ...form, workerId: e.target.value })}
                      required
                    >
                      <option value="">Tanlang...</option>
                      {data.workers.map(w => <option key={w._id} value={w._id}>{w.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Miqdor</label>
                    <input
                      type="number"
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-primary-500"
                      placeholder="0"
                      value={form.amount}
                      onChange={(e) => setForm({ ...form, amount: e.target.value })}
                      required
                    />
                  </div>
                  <button type="submit" className="btn-primary w-full py-4 text-lg">Saqlash</button>
                </form>
              </section>

              {/* Logs */}
              <section className="glass rounded-2xl p-6 overflow-hidden">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <span className="text-primary-400">📜</span> So'nggi Amallar
                </h3>
                <div className="overflow-x-auto h-[400px]">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-slate-500 text-sm border-b border-slate-800">
                        <th className="pb-3 font-medium">Sana</th>
                        <th className="pb-3 font-medium">Ishchi</th>
                        <th className="pb-3 font-medium">Mahsulot</th>
                        <th className="pb-3 font-medium">Miqdor</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      {data.logs.map((log) => (
                        <tr key={log._id} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                          <td className="py-3 text-slate-400">{new Date(log.date).toLocaleDateString()}</td>
                          <td className="py-3 font-semibold">{log.worker?.name}</td>
                          <td className="py-3">{log.product?.name}</td>
                          <td className="py-3 text-primary-400">+{log.amount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          </div>
        )}

        {tab === 'materials' && (
          <div className="space-y-8 animate-in slide-in-from-bottom duration-500">
            <section className="glass rounded-2xl p-6">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <span className="text-primary-400">➕</span> Yangi Xomashyo Qo'shish
              </h3>
              <form onSubmit={handleAddMaterial} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <input name="name" placeholder="Nomi (Masalan: Mato)" className="bg-slate-800 border border-slate-700 rounded-lg p-3 text-white" required />
                <input name="quantity" type="number" placeholder="Miqdori" className="bg-slate-800 border border-slate-700 rounded-lg p-3 text-white" required />
                <input name="unit" placeholder="Birlik (kg, metr...)" className="bg-slate-800 border border-slate-700 rounded-lg p-3 text-white" required />
                <input name="price" type="number" placeholder="Narxi" className="bg-slate-800 border border-slate-700 rounded-lg p-3 text-white" required />
                <button type="submit" className="btn-primary col-span-full md:col-span-1">Qo'shish</button>
              </form>
            </section>

            <section className="glass rounded-2xl p-6">
              <h3 className="text-xl font-bold mb-6">Ombor Qoldig'i</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {data.materials.map(mat => (
                  <div key={mat._id} className="bg-slate-800/50 p-5 rounded-xl border border-slate-700">
                    <h4 className="text-lg font-bold text-white mb-2">{mat.name}</h4>
                    <div className="flex justify-between items-end">
                      <div>
                        <span className="text-slate-500 text-xs block mb-1 uppercase tracking-wider">Mavjud</span>
                        <span className="text-2xl font-bold text-emerald-400">{mat.quantity} {mat.unit}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-500 text-xs block mb-1 uppercase tracking-wider">Narx</span>
                        <span className="text-sm font-semibold text-slate-300">{mat.price.toLocaleString()} UZS</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {tab === 'products' && (
          <div className="space-y-8 animate-in slide-in-from-left duration-500">
            <section className="glass rounded-2xl p-6">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <span className="text-primary-400">🛍️</span> Yangi Mahsulot (Kalkulyatsiya)
              </h3>
              <form onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const materialsList = formData.get('ingredients').split(',').map(i => {
                  const [id, qty] = i.split(':');
                  return { material: id.trim(), quantity: parseFloat(qty) };
                });
                try {
                  await axios.post(`${API_BASE}/products`, {
                    name: formData.get('name'),
                    ingredients: materialsList
                  });
                  alert('Mahsulot yaratildi!');
                  e.target.reset();
                  fetchData();
                } catch (err) { alert(err.message); }
              }} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input name="name" placeholder="Mahsulot nomi (Masalan: Ko'ylak)" className="bg-slate-800 border border-slate-700 rounded-lg p-3 text-white" required />
                  <input name="ingredients" placeholder="Tarkibi (ID:Miqdor, ID:Miqdor)" className="bg-slate-800 border border-slate-700 rounded-lg p-3 text-white" required />
                </div>
                <p className="text-xs text-slate-500 italic">* Masalan: 65ed123...:1.5, 65ed456...:2 (Material ID:Kerakli miqdor)</p>
                <button type="submit" className="btn-primary w-full md:w-auto px-10">Yaratish</button>
              </form>
            </section>

            <section className="glass rounded-2xl p-6">
              <h3 className="text-xl font-bold mb-6">Mavjud Mahsulotlar</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {data.products.map(p => (
                  <div key={p._id} className="bg-slate-800/50 p-5 rounded-xl border border-slate-700">
                    <div className="flex justify-between items-start mb-4">
                      <h4 className="text-lg font-bold text-white">{p.name}</h4>
                      <span className="text-xs font-mono text-slate-500">ID: {p._id}</span>
                    </div>
                    <div className="space-y-2">
                       <p className="text-sm text-slate-400">Tarkibi:</p>
                       {p.ingredients.map((ing, i) => (
                         <div key={i} className="flex justify-between text-xs border-b border-slate-700 pb-1">
                           <span>{ing.material?.name || 'Noma\'lum'}</span>
                           <span>{ing.quantity} {ing.material?.unit}</span>
                         </div>
                       ))}
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-700 flex justify-between">
                      <span className="text-sm text-slate-400">Tayyor zaxira:</span>
                      <span className="font-bold text-primary-400">{p.stock || 0} ta</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {tab === 'workers' && (
          <div className="space-y-8 animate-in slide-in-from-right duration-500">
            <section className="glass rounded-2xl p-6">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <span className="text-primary-400">👤</span> Yangi Ishchi Qo'shish
              </h3>
              <form onSubmit={handleAddWorker} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input name="name" placeholder="Ism-sharif" className="bg-slate-800 border border-slate-700 rounded-lg p-3 text-white" required />
                <input name="payRate" type="number" placeholder="Stavka (1 dona uchun)" className="bg-slate-800 border border-slate-700 rounded-lg p-3 text-white" required />
                <button type="submit" className="btn-primary">Qo'shish</button>
              </form>
            </section>

            <section className="glass rounded-2xl p-6">
              <h3 className="text-xl font-bold mb-6">Xodimlar Balansi</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-800/50">
                    <tr className="text-slate-400 text-sm">
                      <th className="p-4 rounded-tl-xl text-xs uppercase tracking-widest">Ism-sharif</th>
                      <th className="p-4 text-xs uppercase tracking-widest">Stavka</th>
                      <th className="p-4 text-xs uppercase tracking-widest">Haqdorlik (UZS)</th>
                      <th className="p-4 rounded-tr-xl text-xs uppercase tracking-widest">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.workers.map(w => (
                      <tr key={w._id} className="border-b border-slate-800 transition-colors hover:bg-slate-800/30">
                        <td className="p-4 font-bold text-white">{w.name}</td>
                        <td className="p-4 text-slate-400">{w.payRate.toLocaleString()}</td>
                        <td className="p-4 text-emerald-400 font-bold">{w.balance.toLocaleString()}</td>
                        <td className="p-4 text-xs">
                          <span className="bg-emerald-500/10 text-emerald-500 px-2 py-1 rounded-full border border-emerald-500/20">Active</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
