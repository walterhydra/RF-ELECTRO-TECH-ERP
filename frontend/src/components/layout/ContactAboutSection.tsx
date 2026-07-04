import React from 'react';
import { Send, Map, Headphones, Award, Phone, Mail } from 'lucide-react';

export default function ContactAboutSection() {
  return (
    <section className="py-24 px-6 relative bg-slate-50 overflow-hidden">
      {/* Subtle Dot Pattern Background */}
      <div 
        className="absolute inset-0 z-0 opacity-40 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(#cbd5e1 2px, transparent 2px)',
          backgroundSize: '30px 30px'
        }}
      />
      
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-20">
          
          {/* Left Column - Map and Quote */}
          <div className="flex-1 flex flex-col gap-6">
            <div className="flex items-start">
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3.5 rounded-full font-bold shadow-lg transition-all flex items-center gap-2">
                Get a Quote
                <Send className="w-4 h-4" />
              </button>
            </div>
            
            <div className="relative bg-white rounded-3xl overflow-hidden shadow-xl border border-slate-200">
              {/* EDIT: Google Maps Iframe URL */}
              <iframe 
                src="https://maps.google.com/maps?q=Plot+No+106,+Sector+Ecotech+12,+Greater+Noida,+G.+B.+Nagar,+U.p&ll=28.511321,77.53237&z=10&output=embed" 
                className="w-full h-[300px] lg:h-[450px]" 
                style={{ border: 0 }} 
                allowFullScreen={true} 
                loading="lazy" 
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
              
              <div className="absolute top-4 left-4">
                {/* EDIT: Google Maps Link */}
                <a 
                  href="https://google.com/maps?ll=28.511321,77.53237&z=10&t=m&hl=en-IN&gl=US&mapclient=embed&q=Plot+No+106,+Sector+Ecotech+12,+Greater+Noida,+G.+B.+Nagar,+U.p" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="bg-white/90 backdrop-blur text-slate-800 hover:text-blue-600 px-4 py-2 rounded-lg font-semibold shadow-md flex items-center gap-2 text-sm transition-colors"
                >
                  <Map className="w-4 h-4" />
                  Open in Maps
                </a>
              </div>
            </div>
          </div>
          
          {/* Right Column - Content */}
          <div className="flex-1 flex flex-col justify-center gap-10">
            {/* Paragraph with red line */}
            <div className="border-l-4 border-red-500 pl-6">
              {/* EDIT: Company paragraph text */}
              <p className="text-lg text-slate-700 leading-relaxed font-medium">
                We believe that integrity is the hallmark of all employees, hence we strive to foster a family team spirit in our employees with a positive attitude. We are totally committed to the highest level of customer satisfaction by delivering the highest quality PCBs.
              </p>
            </div>
            
            {/* Features Card */}
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-100 flex flex-col sm:flex-row gap-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                  <Headphones className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">24/7 Hours</h4>
                  <p className="text-sm text-slate-500">Customer Support</p>
                </div>
              </div>
              
              <div className="hidden sm:block w-[1px] bg-slate-100 self-stretch"></div>
              
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                  <Award className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">Premium Quality</h4>
                  <p className="text-sm text-slate-500">Services provided</p>
                </div>
              </div>
            </div>
            
            {/* Contact CTA */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 bg-slate-900 p-8 rounded-2xl text-white shadow-xl">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                  <Phone className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-400 font-medium mb-1">Call us for information</p>
                  {/* EDIT: Phone number */}
                  <a href="tel:+919205009707" className="text-2xl font-bold hover:text-blue-400 transition-colors">
                    +91 9205009707
                  </a>
                </div>
              </div>
              
              {/* EDIT: Email address */}
              <a 
                href="mailto:info@company.com" 
                className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-md"
              >
                <Mail className="w-5 h-5" />
                Mail us
              </a>
            </div>
          </div>
          
        </div>
      </div>
    </section>
  );
}
