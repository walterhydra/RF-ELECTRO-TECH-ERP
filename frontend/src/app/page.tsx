"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Phone, Mail, MapPin, ChevronRight, CheckCircle, Star, Shield, Zap, TrendingDown, X, Facebook, Twitter, Globe, Linkedin, ArrowUp, MessageCircle } from 'lucide-react';
import VideoBackground from '@/components/layout/VideoBackground';
import ContactAboutSection from '@/components/layout/ContactAboutSection';
import { motion, AnimatePresence } from 'framer-motion';

export default function LandingPage() {
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  const products = [
    { name: 'MULTILAYER PCB', img: '/Assets/ChatGPT Image Jul 4, 2026, 04_04_14 PM (1).png', desc: 'Ideal for complex circuits. Consists of 3 or more layers of conductive material, allowing for high-density routing and superior performance in advanced electronics.' },
    { name: 'RF PCB', img: '/Assets/ChatGPT Image Jul 4, 2026, 04_04_15 PM (2).png', desc: 'High-frequency boards designed for radio frequency applications. Manufactured with specialized materials to ensure low signal loss and controlled impedance.' },
    { name: 'SS FLEX PCB', img: '/Assets/ChatGPT Image Jul 4, 2026, 04_04_15 PM (3).png', desc: 'Single-Sided Flexible PCBs provide excellent flexibility and space-saving capabilities, perfect for dynamic bending applications and compact devices.' },
    { name: 'DOUBLE SIDED PCB', img: '/Assets/ChatGPT Image Jul 4, 2026, 04_04_15 PM (4).png', desc: 'Features conductive layers on both sides of the substrate. Offers increased circuit density compared to single-sided boards, suitable for a wide range of industrial applications.' },
    { name: 'METAL CORE PCB', img: '/Assets/ChatGPT Image Jul 4, 2026, 04_04_16 PM (5).png', desc: 'Utilizes a base metal material for superior heat dissipation. Essential for high-power LED lighting and automotive applications where thermal management is critical.' },
    { name: 'SINGLE SIDED PCB', img: '/Assets/ChatGPT Image Jul 4, 2026, 04_04_16 PM (6).png', desc: 'The most cost-effective solution for simple circuits. Features a single conductive layer, ideal for low-density applications and consumer electronics.' }
  ];

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900">
      {/* Navbar */}
      <nav className="absolute top-0 left-0 w-full z-50 flex flex-col md:flex-row justify-between items-center p-6 lg:px-12 gap-4">
        <div className="flex items-center gap-3">
           <Image src="/Assets/logo-1.png" alt="RF Electrotech Logo" width={220} height={60} priority className="object-contain opacity-90" />
        </div>
        <div className="flex flex-wrap items-center justify-center md:justify-end gap-6">
          <div className="hidden lg:flex items-center gap-2 text-sm font-semibold text-white drop-shadow-md">
            <MapPin className="w-4 h-4" />
            <span className="truncate max-w-[200px] xl:max-w-none" title="Plot No 106, Sector Ecotech 12, Greater Noida, C. B. Nagar, U.p">Plot No 106, Sector Ecotech 12, Greater Noida</span>
          </div>
          <a href="mailto:info@rfelectrotech.com" className="hidden md:flex items-center gap-2 text-sm font-semibold text-white hover:text-blue-200 transition-colors drop-shadow-md">
            <Mail className="w-4 h-4" />
            info@rfelectrotech.com
          </a>
          <a href="tel:+919205009707" className="hidden sm:flex items-center gap-2 text-sm font-semibold text-white hover:text-blue-200 transition-colors drop-shadow-md">
            <Phone className="w-4 h-4" />
            +91 9205009707
          </a>
          <Link href="/login" className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-semibold text-sm transition-all shadow-sm ml-2">
            ERP Login
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-slate-900 pt-32 pb-20 px-6 relative overflow-hidden min-h-screen flex flex-col justify-center">
        
        <VideoBackground />
        
        <div className="max-w-4xl mx-auto text-center space-y-6 relative z-10">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white drop-shadow-md">
            Precision PCB Manufacturing <br className="hidden md:block" /> <span className="text-blue-400 drop-shadow-md">You Can Trust.</span>
          </h1>
          <p className="text-lg text-slate-200 font-medium max-w-2xl mx-auto drop-shadow-md">
            Delivering high-volume circuit board production and rapid prototyping with exceptional quality and consistency.
          </p>
          <div className="pt-4 flex justify-center gap-4">
            <Link href="/login" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3.5 rounded-xl font-bold transition-all shadow-lg flex items-center gap-2">
              Access ERP Portal <ChevronRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <motion.section 
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.7 }}
        className="py-24 px-6 max-w-7xl mx-auto relative"
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1px] h-24 bg-gradient-to-b from-transparent to-slate-200" />
        <div className="text-center mb-16 pt-8">
          <span className="text-blue-600 font-bold tracking-wider uppercase text-sm mb-3 block">Why Choose Us</span>
          <h2 className="text-4xl md:text-5xl font-extrabold mb-4 text-slate-900 tracking-tight">The RF Electrotech Advantage</h2>
          <p className="text-slate-500 max-w-2xl mx-auto text-lg">We deliver the highest standards in PCB manufacturing through rigorous quality control and optimized processes.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { icon: Shield, title: "Higher Quality", desc: "Rigorous testing and inspection at every stage ensures superior product reliability.", color: "from-emerald-400 to-teal-500", light: "bg-emerald-50 text-emerald-600 border-emerald-100" },
            { icon: Zap, title: "Fast Lead Time", desc: "Rapid prototyping and optimized production lines to meet your tightest deadlines.", color: "from-blue-500 to-indigo-600", light: "bg-blue-50 text-blue-600 border-blue-100" },
            { icon: TrendingDown, title: "Lower Cost", desc: "Efficient manufacturing processes that deliver exceptional value without compromising quality.", color: "from-amber-400 to-orange-500", light: "bg-amber-50 text-amber-600 border-amber-100" }
          ].map((feature, i) => (
            <motion.div 
              key={i} 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className="group relative bg-white p-10 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col items-start hover:-translate-y-2 transition-all duration-300 hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br opacity-5 group-hover:opacity-10 transition-opacity rounded-bl-full" />
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-8 border ${feature.light} shadow-sm group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-slate-900 group-hover:text-blue-600 transition-colors">{feature.title}</h3>
              <p className="text-slate-500 leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Products - Dark Tech Theme */}
      <section className="py-24 px-6 bg-[#0B1120] relative overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <span className="text-blue-400 font-bold tracking-wider uppercase text-sm mb-3 block">Manufacturing Capabilities</span>
            <h2 className="text-4xl md:text-5xl font-extrabold mb-4 text-white tracking-tight">Our Products</h2>
            <p className="text-slate-400 max-w-2xl mx-auto text-lg">Comprehensive PCB solutions for diverse industry needs, manufactured to exact specifications.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 max-w-7xl mx-auto px-4">
            {products.map((product, i) => (
              <motion.div 
                key={product.name} 
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6, delay: i * 0.1, ease: "easeOut" }}
                onClick={() => setSelectedProduct(product)}
                className="group relative cursor-pointer"
              >
                <div className="relative w-full rounded-2xl overflow-hidden bg-white/5 border border-slate-700/50 group-hover:border-blue-500/50 shadow-xl group-hover:shadow-[0_0_30px_rgba(59,130,246,0.15)] transition-all duration-500">
                  <Image 
                    src={product.img} 
                    alt={product.name} 
                    width={800}
                    height={800}
                    className="w-full h-auto object-contain transform group-hover:scale-[1.02] transition-transform duration-500 ease-out" 
                  />
                  
                  {/* Subtle overlay that fades in on hover */}
                  <div className="absolute inset-0 bg-blue-900/0 group-hover:bg-blue-900/10 transition-colors duration-500" />
                  
                  {/* Centered Action Button */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 scale-95 group-hover:scale-100 pointer-events-none">
                    <div className="w-16 h-16 rounded-full bg-blue-600/90 text-white flex items-center justify-center shadow-[0_10px_20px_rgba(37,99,235,0.4)] backdrop-blur-sm">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <motion.section 
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.7 }}
        className="py-24 px-6 bg-gradient-to-b from-white to-slate-50 relative"
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <span className="text-blue-600 font-bold tracking-wider uppercase text-sm mb-3 block">Client Success</span>
            <h2 className="text-4xl md:text-5xl font-extrabold mb-4 text-slate-900 tracking-tight">Trusted by Industry Leaders</h2>
            <p className="text-slate-500 max-w-2xl mx-auto text-lg">Don't just take our word for it. Here's what our partners have to say.</p>
          </div>
          <div className="grid lg:grid-cols-3 gap-8">
            {[
              { quote: "R F Electrotech's expertise in PCB assembly and testing has significantly improved our product's reliability. Their transparent communication and responsive support team make them an invaluable partner.", author: "Rajiv Dubey", role: "Happy Client" },
              { quote: "We needed a reliable partner for our high-volume circuit board production. R F Electrotech delivered exceptional quality, consistency, and on-time delivery, helping us meet our customers demands.", author: "Vinay Raj", role: "Happy Client" },
              { quote: "R F Electrotech's rapid prototyping capabilities and flexible production volumes have been instrumental in supporting our product development lifecycle. Their commitment to quality is unparalleled.", author: "Satisfied Partner", role: "Happy Client" }
            ].map((testimonial, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
                className="bg-white p-10 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col justify-between relative hover:-translate-y-1 transition-transform duration-300"
              >
                <div className="absolute top-10 right-10 text-slate-100">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M14.017 18L14.017 10.609C14.017 4.905 17.748 1.039 23 0L23.995 2.151C21.563 3.068 20 5.789 20 8H24V18H14.017ZM0 18V10.609C0 4.905 3.748 1.038 9 0L9.996 2.151C7.563 3.068 6 5.789 6 8H9.983L9.983 18L0 18Z" /></svg>
                </div>
                <div className="relative z-10">
                  <div className="flex gap-1 text-amber-400 mb-8">
                    {[...Array(5)].map((_, j) => <Star key={j} className="w-5 h-5 fill-current" />)}
                  </div>
                  <p className="text-slate-600 text-lg italic mb-8 leading-relaxed font-medium">"{testimonial.quote}"</p>
                </div>
                <div className="flex items-center gap-4 relative z-10 pt-6 border-t border-slate-100">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xl">
                    {testimonial.author.charAt(0)}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">{testimonial.author}</div>
                    <div className="text-sm text-slate-500">{testimonial.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Contact & About Section */}
      <ContactAboutSection />

      {/* Footer */}
      <footer className="bg-[#111827] text-slate-300 relative mt-24">
        {/* Overlapping Logo */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-36 h-36 bg-white rounded-full flex items-center justify-center shadow-lg z-20">
          <Image src="/Assets/Screenshot_2026-07-04_162637-removebg-preview.png" alt="RF Electrotech Logo Icon" width={130} height={130} className="object-contain scale-125" />
        </div>
        
        {/* Subtle architectural overlay */}
        <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_25%,rgba(255,255,255,0.2)_50%,transparent_50%,transparent_75%,rgba(255,255,255,0.2)_75%,rgba(255,255,255,0.2)_100%)] bg-[length:20px_20px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 pt-28 pb-16 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
            
            {/* About Us */}
            <div className="space-y-6">
              <h4 className="text-white text-xl font-bold tracking-wide">About Us</h4>
              <p className="text-sm leading-relaxed text-slate-400 font-medium">
                R.F. ELECTROTECH established in the year 1992 is one of the leading prototype & production manufacturer of PCB in India.
              </p>
              <div className="pt-2">
                <h5 className="text-white font-bold mb-2 text-sm">Open Hours:</h5>
                <p className="text-sm text-slate-400">Mon - Sat: 8 am - 5 pm,</p>
                <p className="text-sm text-slate-400">Sunday: CLOSED</p>
              </div>
            </div>

            {/* Quick Links */}
            <div className="space-y-6">
              <h4 className="text-white text-xl font-bold tracking-wide">Quick Links</h4>
              <ul className="space-y-3">
                {['Home', 'About Us', 'Our Products', 'Career', 'Why Choose Us', 'Contact Us'].map((link) => (
                  <li key={link}>
                    <a href="#" className="text-sm text-slate-400 hover:text-white transition-colors">{link}</a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Our Products */}
            <div className="space-y-6">
              <h4 className="text-white text-xl font-bold tracking-wide">Our Products</h4>
              <ul className="space-y-3">
                {['SINGLE SIDED PCB', 'METAL CORE PCB', 'DOUBLE SIDED PCB', 'MULTILAYER PCB', 'RF PCB', 'SS FLEX PCB'].map((link) => (
                  <li key={link}>
                    <a href="#" className="text-sm text-slate-400 hover:text-white transition-colors">{link}</a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Official info */}
            <div className="space-y-6">
              <h4 className="text-white text-xl font-bold tracking-wide">Official info:</h4>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-400 leading-relaxed">Plot No 106, Sector Ecotech 12, Greater Noida, G. B. Nagar, U.p</span>
                </li>
                <li className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-blue-400 shrink-0" />
                  <span className="text-sm text-slate-400">Call Us: +91 9205009707</span>
                </li>
                <li className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-blue-400 shrink-0" />
                  <a href="mailto:info@rfelectrotech.com" className="text-sm text-slate-400 hover:text-white">info@rfelectrotech.com</a>
                </li>
              </ul>
              <div className="flex gap-4 pt-2">
                <a href="#" className="text-slate-400 hover:text-white transition-colors"><Facebook className="w-5 h-5" /></a>
                <a href="#" className="text-slate-400 hover:text-white transition-colors"><Twitter className="w-5 h-5" /></a>
                <a href="#" className="text-slate-400 hover:text-white transition-colors"><Globe className="w-5 h-5" /></a>
                <a href="#" className="text-slate-400 hover:text-white transition-colors"><Linkedin className="w-5 h-5" /></a>
              </div>
            </div>

          </div>
        </div>

        {/* Bottom Bar */}
        <div className="bg-[#090D14] py-6 relative z-10">
          <div className="max-w-7xl mx-auto px-6 text-center">
            <p className="text-sm text-slate-400">2026 © All rights reserved by <strong className="text-white">Blooms Solutions</strong></p>
          </div>
        </div>

        {/* Floating Actions */}
        <div className="fixed bottom-6 left-6 z-[90]">
          <a href="https://wa.me/919205009707" target="_blank" rel="noopener noreferrer" className="bg-[#4ade80] hover:bg-[#22c55e] text-white px-5 py-3 rounded-full flex items-center gap-2 shadow-lg transition-transform hover:scale-105 font-medium">
            <MessageCircle className="w-5 h-5" />
            Hi, how can I help?
          </a>
        </div>
        <div className="fixed bottom-6 right-6 z-[90]">
          <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="bg-blue-400 hover:bg-blue-500 text-white p-4 rounded-full shadow-lg transition-transform hover:scale-110 flex items-center justify-center">
            <ArrowUp className="w-5 h-5" />
          </button>
        </div>
      </footer>

      {/* Product Details Drawer */}
      <AnimatePresence>
        {selectedProduct && (
          <div className="fixed inset-0 z-[100] flex justify-end">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 bg-[#0B1120]/60 backdrop-blur-sm" 
              onClick={() => setSelectedProduct(null)}
            />
            
            <motion.div 
              initial={{ x: "100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative w-full max-w-xl h-full bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col z-10 overflow-y-auto"
            >
              {/* Sticky Header */}
              <div className="sticky top-0 z-20 flex justify-between items-center p-6 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800">
                <h3 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-900/50 border border-blue-700/50 flex items-center justify-center shrink-0">
                    <CheckCircle className="w-5 h-5 text-blue-400" />
                  </div>
                  {selectedProduct.name}
                </h3>
                <button 
                  onClick={() => setSelectedProduct(null)}
                  className="w-10 h-10 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center hover:bg-slate-700 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {/* Drawer Content */}
              <div className="p-6 flex-grow flex flex-col gap-8">
                <div className="relative w-full rounded-2xl overflow-hidden bg-white/5 p-4 border border-slate-800 shadow-inner">
                  <Image 
                    src={selectedProduct.img} 
                    alt={selectedProduct.name} 
                    width={1200}
                    height={1200}
                    className="w-full h-auto object-contain rounded-xl" 
                  />
                </div>
                
                <div className="space-y-6">
                  <h4 className="text-sm font-bold text-blue-500 uppercase tracking-widest">Product Details</h4>
                  
                  <motion.div 
                    className="text-slate-300 text-lg leading-relaxed flex flex-wrap gap-x-[0.25em]"
                    initial="hidden"
                    animate="visible"
                    variants={{
                      hidden: { opacity: 0 },
                      visible: {
                        opacity: 1,
                        transition: { staggerChildren: 0.03, delayChildren: 0.2 }
                      }
                    }}
                  >
                    {selectedProduct.desc.split(" ").map((word: string, i: number) => (
                      <motion.span 
                        key={i} 
                        variants={{
                          hidden: { opacity: 0, y: 10 },
                          visible: { opacity: 1, y: 0 }
                        }}
                      >
                        {word}
                      </motion.span>
                    ))}
                  </motion.div>
                </div>
              </div>
              
              {/* Sticky Footer */}
              <div className="p-6 border-t border-slate-800 bg-slate-900/50 mt-auto sticky bottom-0">
                <button 
                  onClick={() => setSelectedProduct(null)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 rounded-xl font-bold transition-colors shadow-lg shadow-blue-900/20"
                >
                  Close Details
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
