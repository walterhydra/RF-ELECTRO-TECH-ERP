'use client';

import React, { useEffect, useState } from 'react';
import { Package } from 'lucide-react';

export default function CustomerProducts() {
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchProducts() {
      try {
        setIsLoading(true);
        const token = localStorage.getItem('token');
        const res = await fetch('http://localhost:3001/api/v1/portal/products', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          setProducts(data);
        }
      } catch (error) {
        console.error('Failed to fetch products:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchProducts();
  }, []);

  if (isLoading) {
    return <div className="text-slate-400">Loading products...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white mb-6">My Products</h1>
      
      {products.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-8 text-center">
          <div className="text-slate-400">No products found for your account.</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {products.map((product) => (
            <div key={product.id} className="bg-slate-900 border border-slate-800 rounded-lg p-6">
              <div className="flex flex-row items-start justify-between pb-2 border-b border-slate-800">
                <div>
                  <h3 className="text-lg font-bold text-white">{product.name}</h3>
                  <div className="text-sm text-slate-400 font-mono mt-1">Code: {product.code}</div>
                </div>
                <div className="px-2 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/30 rounded-full text-xs font-medium">
                  {product.specCardNo}
                </div>
              </div>
              <div className="mt-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-500">Rev No:</span>
                    <div className="text-slate-300 font-medium">{product.revisionNo}</div>
                  </div>
                  <div>
                    <span className="text-slate-500">PCB Size:</span>
                    <div className="text-slate-300 font-medium">{product.pcbSize}</div>
                  </div>
                  <div>
                    <span className="text-slate-500">Layers:</span>
                    <div className="text-slate-300 font-medium">{product.layers}</div>
                  </div>
                  <div>
                    <span className="text-slate-500">Thickness:</span>
                    <div className="text-slate-300 font-medium">{product.thicknessMm} mm</div>
                  </div>
                  <div>
                    <span className="text-slate-500">Copper Wt:</span>
                    <div className="text-slate-300 font-medium">{product.copperWeight}</div>
                  </div>
                  <div>
                    <span className="text-slate-500">Surface Finish:</span>
                    <div className="text-slate-300 font-medium">{product.surfaceFinish}</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
