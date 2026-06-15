import { useEffect, useLayoutEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { heroStagger, heroEntrance, ctaGlow, pressEffect, liftOnHover } from '@/lib/motion-variants';
import { RotatingWords } from '@/components/ui/animated-hero';

const LANDING_CSS = `
/* Fonts loaded via <link> in index.html — removed render-blocking @import */

.lp-root *, .lp-root *::before, .lp-root *::after { box-sizing: border-box; }
.lp-root { font-family: 'Inter', system-ui, sans-serif; color: #374151; -webkit-font-smoothing: antialiased; }
.lp-root a { text-decoration: none; color: inherit; }
.lp-root ul { list-style: none; padding: 0; margin: 0; }
.lp-root button { cursor: pointer; font-family: inherit; border: none; outline: none; }
.lp-root input { font-family: inherit; outline: none; border: none; }
.lp-root p { margin: 0; }
.lp-root h1, .lp-root h2, .lp-root h3, .lp-root h4 { margin: 0; }

.lp-container { width: 100%; max-width: 1200px; margin: 0 auto; padding: 0 20px; }
.lp-tag { display: inline-block; background: rgba(65,123,90,0.12); color: #417B5A; font-size: 0.78rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; padding: 6px 14px; border-radius: 50px; margin-bottom: 16px; }
.lp-title { font-size: clamp(1.8rem, 4vw, 2.6rem); font-weight: 700; color: #1F2041; line-height: 1.2; margin-bottom: 12px; font-family: 'Quicksand', 'Inter', sans-serif; }
.lp-subtitle { font-size: 1.05rem; color: #6B7280; max-width: 560px; line-height: 1.6; margin: 0; }
.lp-center { text-align: center; }
.lp-center .lp-subtitle { margin: 0 auto; }

.lp-fade { opacity: 0; transform: translateY(28px); transition: opacity 0.6s ease, transform 0.6s ease; }
.lp-fade.lp-visible { opacity: 1; transform: translateY(0); }

/* NAVBAR */
.lp-nav { position: fixed; top: 0; left: 0; right: 0; z-index: 1000; padding: 16px 0; transition: background 0.25s ease, box-shadow 0.25s ease, padding 0.25s ease; }
.lp-nav.lp-scrolled { background: #fff; box-shadow: 0 2px 16px rgba(75,63,114,0.09); padding: 10px 0; }
.lp-nav-inner { display: flex; align-items: center; justify-content: space-between; gap: 24px; }
.lp-logo { display: flex; align-items: center; gap: 8px; transition: opacity 0.25s; }
.lp-logo-sym { display: none; }
.lp-logo-img { height: 34px; object-fit: contain; display: block; }
.lp-logo-img-dark { display: block; }
.lp-logo-img-light { display: none; }
.lp-nav.lp-scrolled .lp-logo-img-dark { display: none; }
.lp-nav.lp-scrolled .lp-logo-img-light { display: block; }
.lp-nav-links { display: flex; align-items: center; gap: 6px; }
.lp-nav-links a { padding: 8px 14px; border-radius: 8px; font-size: 0.92rem; font-weight: 500; color: rgba(255,255,255,0.85); transition: all 0.25s; }
.lp-nav.lp-scrolled .lp-nav-links a { color: #374151; }
.lp-nav-links a:hover { color: #fff; background: rgba(255,255,255,0.12); }
.lp-nav.lp-scrolled .lp-nav-links a:hover { color: #4B3F72; background: #F4F3FA; }
.lp-nav-actions { display: flex; align-items: center; gap: 10px; }
.lp-btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 10px 20px; border-radius: 8px; font-size: 0.9rem; font-weight: 600; transition: all 0.25s; cursor: pointer; }
.lp-btn-ow { border: 1.5px solid rgba(255,255,255,0.6); color: #fff; background: transparent; }
.lp-btn-ow:hover { background: rgba(255,255,255,0.1); border-color: #fff; }
/* navbar com fundo branco (rolada): botão outline-white vira grape p/ legibilidade */
.lp-nav.lp-scrolled .lp-btn-ow { border-color: #4B3F72; color: #4B3F72; }
.lp-nav.lp-scrolled .lp-btn-ow:hover { background: #F4F3FA; border-color: #4B3F72; }
.lp-btn-op { border: 1.5px solid #4B3F72; color: #4B3F72; background: transparent; }
.lp-btn-op:hover { background: #F4F3FA; }
.lp-btn-g { background: #417B5A; color: #fff; border: none; }
.lp-btn-g:hover { background: #356848; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(65,123,90,0.35); }
.lp-btn-dark { background: #4B3F72; color: #fff; border: none; }
.lp-btn-dark:hover { background: #1F2041; transform: translateY(-1px); }
.lp-btn-lg { padding: 14px 28px; font-size: 1rem; border-radius: 10px; }

.lp-ham { display: none; flex-direction: column; gap: 5px; cursor: pointer; padding: 6px; background: none; border: none; }
.lp-ham span { display: block; width: 22px; height: 2px; background: #fff; border-radius: 2px; transition: all 0.3s; }
.lp-nav.lp-scrolled .lp-ham span { background: #1F2041; }
.lp-ham.open span:nth-child(1) { transform: translateY(7px) rotate(45deg); }
.lp-ham.open span:nth-child(2) { opacity: 0; }
.lp-ham.open span:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }
.lp-mob { display: none; position: fixed; top: 66px; left: 0; right: 0; background: #fff; padding: 16px 20px 24px; box-shadow: 0 8px 32px rgba(0,0,0,0.1); flex-direction: column; gap: 4px; z-index: 999; }
.lp-mob.open { display: flex; }
.lp-mob a { padding: 12px 16px; border-radius: 8px; font-weight: 500; color: #374151; }
.lp-mob a:hover { background: #F4F3FA; color: #4B3F72; }
.lp-mob-actions { display: flex; flex-direction: column; gap: 10px; margin-top: 12px; padding-top: 12px; border-top: 1px solid #E5E7EB; }
.lp-mob-actions .lp-btn { width: 100%; justify-content: center; }

/* HERO */
.lp-hero { min-height: 100vh; display: flex; align-items: center; padding: 120px 0 80px; background: linear-gradient(135deg, #1F2041 0%, #4B3F72 100%); position: relative; overflow: hidden; }
.lp-hero-pat { position: absolute; inset: 0; pointer-events: none; }
.lp-hero-inner { display: grid; grid-template-columns: 1fr 1fr; gap: 60px; align-items: center; position: relative; z-index: 1; }
.lp-badge { display: inline-flex; align-items: center; gap: 8px; background: rgba(65,123,90,0.18); border: 1px solid rgba(65,123,90,0.35); color: #D0CEBA; font-size: 0.82rem; font-weight: 600; padding: 7px 16px; border-radius: 50px; margin-bottom: 24px; }
.lp-h1 { font-size: clamp(2.2rem, 5vw, 3.4rem); font-weight: 700; color: #fff; line-height: 1.15; margin-bottom: 20px; font-family: 'Quicksand', 'Inter', sans-serif; }
.lp-hsub { font-size: 1.08rem; color: rgba(255,255,255,0.72); line-height: 1.7; margin-bottom: 36px; max-width: 500px; }
.lp-ctas { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 48px; }
.lp-trust { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
.lp-trust-txt { font-size: 0.85rem; color: rgba(255,255,255,0.55); font-weight: 500; }
.lp-trust-logos { display: flex; gap: 10px; flex-wrap: wrap; }
.lp-trust-pill { background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.15); padding: 6px 14px; border-radius: 6px; font-size: 0.78rem; font-weight: 600; color: rgba(255,255,255,0.5); letter-spacing: 0.04em; }

/* MOCKUP */
.lp-mock { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); border-radius: 16px; padding: 20px; backdrop-filter: blur(8px); display: flex; flex-direction: column; gap: 14px; }
.lp-mock-hdr { display: flex; align-items: center; gap: 10px; margin-bottom: 4px; }
.lp-dots { display: flex; gap: 6px; }
.lp-dot { width: 10px; height: 10px; border-radius: 50%; }
.lp-dot:nth-child(1) { background: #FF5F56; }
.lp-dot:nth-child(2) { background: #FFBD2E; }
.lp-dot:nth-child(3) { background: #27C93F; }
.lp-titlebar { flex: 1; height: 8px; background: rgba(255,255,255,0.12); border-radius: 4px; }
.lp-mc { background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; padding: 16px; }
.lp-mc-lbl { font-size: 0.7rem; color: rgba(255,255,255,0.5); text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 6px; }
.lp-mc-title { font-size: 0.9rem; color: #fff; font-weight: 600; margin-bottom: 12px; }
.lp-prog-bg { height: 6px; background: rgba(255,255,255,0.15); border-radius: 3px; overflow: hidden; margin-bottom: 6px; }
.lp-prog-fill { height: 100%; background: linear-gradient(90deg, #417B5A, #D0CEBA); border-radius: 3px; width: 72%; }
.lp-prog-lbl { display: flex; justify-content: space-between; font-size: 0.72rem; color: rgba(255,255,255,0.5); }
.lp-cert-row { display: flex; align-items: center; gap: 12px; }
.lp-cert-ico { width: 36px; height: 36px; background: rgba(65,123,90,0.25); border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.lp-cert-ico svg { width: 18px; height: 18px; color: #417B5A; }
.lp-cert-name { font-size: 0.85rem; color: #fff; font-weight: 600; }
.lp-cert-date { font-size: 0.72rem; color: rgba(255,255,255,0.45); margin-top: 2px; }
.lp-cert-badge { margin-left: auto; background: rgba(65,123,90,0.25); color: #D0CEBA; font-size: 0.68rem; font-weight: 700; padding: 3px 9px; border-radius: 50px; white-space: nowrap; }
.lp-chart-lbl { font-size: 0.72rem; color: rgba(255,255,255,0.5); margin-bottom: 8px; }
.lp-chart { display: flex; align-items: flex-end; gap: 6px; height: 50px; }
.lp-bar { flex: 1; background: rgba(65,123,90,0.35); border-radius: 3px 3px 0 0; }
.lp-bar.act { background: #417B5A; }
.lp-stats { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.lp-stat { background: rgba(255,255,255,0.06); border-radius: 8px; padding: 10px; text-align: center; }
.lp-stat-n { font-size: 1.2rem; font-weight: 800; color: #417B5A; }
.lp-stat-l { font-size: 0.68rem; color: rgba(255,255,255,0.45); margin-top: 2px; }

/* SECTIONS */
.lp-sec { padding: 88px 0; }
.lp-seg-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; margin-top: 48px; }
.lp-seg-card { border: 1.5px solid #E5E7EB; border-radius: 12px; padding: 28px 24px; transition: all 0.25s; }
.lp-seg-card:hover { border-color: #417B5A; box-shadow: 0 4px 20px rgba(65,123,90,0.12); transform: translateY(-2px); }
.lp-seg-ico { width: 48px; height: 48px; background: #F4F3FA; border-radius: 10px; display: flex; align-items: center; justify-content: center; margin-bottom: 16px; }
.lp-seg-ico svg { width: 24px; height: 24px; color: #4B3F72; }
.lp-seg-name { font-size: 1rem; font-weight: 700; color: #1F2041; margin-bottom: 6px; }
.lp-seg-desc { font-size: 0.875rem; color: #6B7280; line-height: 1.5; }

/* NUMBERS */
.lp-num-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 32px; margin-top: 48px; }
.lp-num-item { display: flex; align-items: center; gap: 18px; }
.lp-num-ico { width: 52px; height: 52px; background: rgba(65,123,90,0.12); border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.lp-num-ico svg { width: 26px; height: 26px; color: #417B5A; }
.lp-num-val { font-size: 2.2rem; font-weight: 900; color: #417B5A; line-height: 1; margin-bottom: 4px; }
.lp-num-lbl { font-size: 0.88rem; color: #6B7280; font-weight: 500; }

/* TABS */
.lp-tabs-hdr { display: flex; gap: 6px; background: #F4F3FA; border-radius: 10px; padding: 5px; margin: 36px 0 32px; max-width: fit-content; }
.lp-tab-btn { padding: 10px 24px; border-radius: 8px; font-size: 0.92rem; font-weight: 600; color: #6B7280; background: transparent; transition: all 0.25s; cursor: pointer; }
.lp-tab-btn.active { background: #fff; color: #4B3F72; box-shadow: 0 2px 8px rgba(75,63,114,0.12); }
.lp-tab-cont { display: none; }
.lp-tab-cont.active { display: grid; grid-template-columns: repeat(2, 1fr); gap: 18px; }
.lp-feat { display: flex; align-items: flex-start; gap: 14px; padding: 18px; border: 1.5px solid #E5E7EB; border-radius: 10px; }
.lp-check { width: 24px; height: 24px; background: rgba(65,123,90,0.12); border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 1px; }
.lp-check svg { width: 13px; height: 13px; color: #417B5A; }
.lp-ft { font-size: 0.92rem; font-weight: 700; color: #1F2041; margin-bottom: 3px; }
.lp-fd { font-size: 0.83rem; color: #6B7280; line-height: 1.5; }

/* STEPS */
.lp-steps { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0; margin-top: 48px; position: relative; }
.lp-steps::before { content: ''; position: absolute; top: 28px; left: calc(12.5% + 14px); right: calc(12.5% + 14px); height: 2px; background: linear-gradient(90deg, #417B5A, #4B3F72); z-index: 0; }
.lp-step { text-align: center; padding: 0 16px; position: relative; z-index: 1; }
.lp-step-n { width: 56px; height: 56px; border-radius: 50%; background: #417B5A; color: #fff; font-size: 1.3rem; font-weight: 900; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; box-shadow: 0 4px 16px rgba(65,123,90,0.35); }
.lp-step-t { font-size: 1rem; font-weight: 700; color: #1F2041; margin-bottom: 8px; }
.lp-step-d { font-size: 0.85rem; color: #6B7280; line-height: 1.6; }

/* BLOG */
.lp-blog-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; margin-top: 48px; }
.lp-blog-card { border: 1.5px solid #E5E7EB; border-radius: 12px; overflow: hidden; transition: all 0.25s; }
.lp-blog-card:hover { box-shadow: 0 4px 24px rgba(75,63,114,0.10); transform: translateY(-3px); }
.lp-blog-stripe { height: 5px; }
.lp-blog-body { padding: 24px; }
.lp-blog-tag { display: inline-block; font-size: 0.72rem; font-weight: 700; padding: 4px 10px; border-radius: 50px; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.06em; }
.lp-blog-tag.purple { background: rgba(75,63,114,0.1); color: #4B3F72; }
.lp-blog-tag.green { background: rgba(65,123,90,0.12); color: #417B5A; }
.lp-blog-tag.blue { background: rgba(59,130,246,0.1); color: #3B82F6; }
.lp-blog-title { font-size: 1rem; font-weight: 700; color: #1F2041; line-height: 1.4; margin-bottom: 10px; }
.lp-blog-sum { font-size: 0.85rem; color: #6B7280; line-height: 1.6; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.lp-blog-date { font-size: 0.78rem; color: #6B7280; margin-top: 14px; }
.lp-blog-cta { text-align: center; margin-top: 40px; }

/* PLANS */
.lp-toggle { display: flex; align-items: center; justify-content: center; gap: 16px; margin: 32px 0 40px; }
.lp-tog-lbl { font-size: 0.92rem; font-weight: 600; color: #6B7280; }
.lp-tog-lbl.active { color: #4B3F72; }
.lp-tog-sw { width: 48px; height: 26px; background: #E5E7EB; border-radius: 13px; position: relative; cursor: pointer; transition: background 0.3s; }
.lp-tog-sw.annual { background: #417B5A; }
.lp-tog-knob { position: absolute; top: 3px; left: 3px; width: 20px; height: 20px; background: #fff; border-radius: 50%; transition: transform 0.3s; box-shadow: 0 1px 4px rgba(0,0,0,0.15); }
.lp-tog-sw.annual .lp-tog-knob { transform: translateX(22px); }
.lp-ann-badge { background: rgba(65,123,90,0.15); color: #417B5A; font-size: 0.75rem; font-weight: 700; padding: 3px 10px; border-radius: 50px; }
.lp-plans { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
.lp-plan { background: #fff; border: 1.5px solid #E5E7EB; border-radius: 14px; padding: 32px 28px; position: relative; transition: all 0.25s; }
.lp-plan:hover { transform: translateY(-3px); }
.lp-plan.featured { border-color: #4B3F72; box-shadow: 0 8px 40px rgba(75,63,114,0.15); }
.lp-plan-badge { position: absolute; top: -13px; left: 50%; transform: translateX(-50%); background: #4B3F72; color: #fff; font-size: 0.75rem; font-weight: 700; padding: 4px 16px; border-radius: 50px; white-space: nowrap; }
.lp-plan-name { font-size: 1rem; font-weight: 700; color: #6B7280; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 12px; }
.lp-plan-price { font-size: 2.4rem; font-weight: 900; color: #1F2041; }
.lp-plan-old { font-size: 1rem; color: #6B7280; text-decoration: line-through; margin-right: 6px; display: none; }
.lp-plan-old.show { display: inline; }
.lp-plan-per { font-size: 0.85rem; color: #6B7280; }
.lp-plan-desc { font-size: 0.85rem; color: #6B7280; margin: 16px 0 20px; line-height: 1.5; padding-bottom: 20px; border-bottom: 1px solid #E5E7EB; }
.lp-plan-feats { display: flex; flex-direction: column; gap: 10px; margin-bottom: 28px; }
.lp-plan-feat { display: flex; align-items: center; gap: 10px; font-size: 0.88rem; color: #374151; }
.lp-plan-feat svg { width: 16px; height: 16px; color: #417B5A; flex-shrink: 0; }
.lp-plan-cta { width: 100%; padding: 13px; border-radius: 8px; font-size: 0.95rem; font-weight: 700; text-align: center; transition: all 0.25s; display: block; cursor: pointer; }

/* TESTIMONIALS */
.lp-testi { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; margin-top: 48px; }
.lp-testi-card { background: #fff; border-radius: 12px; padding: 28px; box-shadow: 0 4px 24px rgba(75,63,114,0.10); }
.lp-stars { display: flex; gap: 4px; margin-bottom: 16px; }
.lp-stars svg { width: 16px; height: 16px; color: #FBBF24; }
.lp-testi-txt { font-size: 0.92rem; color: #374151; line-height: 1.7; margin-bottom: 20px; font-style: italic; }
.lp-author { display: flex; align-items: center; gap: 12px; }
.lp-avatar { width: 44px; height: 44px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 0.9rem; color: #fff; flex-shrink: 0; }
.lp-author-name { font-size: 0.9rem; font-weight: 700; color: #1F2041; }
.lp-author-role { font-size: 0.78rem; color: #6B7280; margin-top: 2px; }

/* FAQ */
.lp-faq-list { max-width: 720px; margin: 48px auto 0; display: flex; flex-direction: column; gap: 12px; }
.lp-faq-item { border: 1.5px solid #E5E7EB; border-radius: 10px; overflow: hidden; }
.lp-faq-q { display: flex; align-items: center; justify-content: space-between; padding: 20px 24px; cursor: pointer; font-weight: 600; font-size: 0.95rem; color: #1F2041; transition: background 0.25s; }
.lp-faq-q:hover { background: #F4F3FA; }
.lp-faq-ico { width: 22px; height: 22px; flex-shrink: 0; transition: transform 0.3s; color: #6B7280; }
.lp-faq-item.open .lp-faq-ico { transform: rotate(180deg); color: #417B5A; }
.lp-faq-a { max-height: 0; overflow: hidden; transition: max-height 0.4s ease; }
.lp-faq-ai { padding: 0 24px 20px; font-size: 0.9rem; color: #6B7280; line-height: 1.7; }
.lp-faq-item.open .lp-faq-a { max-height: 300px; }

/* CTA FINAL */
.lp-cta-sec { background: linear-gradient(135deg, #1F2041 0%, #4B3F72 100%); padding: 96px 0; text-align: center; }
.lp-cta-t { font-size: clamp(2rem, 4.5vw, 3rem); font-weight: 900; color: #fff; margin-bottom: 16px; max-width: 700px; margin-left: auto; margin-right: auto; }
.lp-cta-sub { font-size: 1.08rem; color: rgba(255,255,255,0.65); margin-bottom: 36px; }
.lp-cta-form { display: flex; gap: 10px; max-width: 480px; margin: 0 auto 24px; }
.lp-cta-inp { flex: 1; padding: 14px 18px; border-radius: 8px; background: rgba(255,255,255,0.1); border: 1.5px solid rgba(255,255,255,0.25); color: #fff; font-size: 0.95rem; }
.lp-cta-inp::placeholder { color: rgba(255,255,255,0.45); }
.lp-cta-inp:focus { border-color: #417B5A; }
.lp-micros { display: flex; align-items: center; justify-content: center; gap: 24px; flex-wrap: wrap; }
.lp-micro { display: flex; align-items: center; gap: 6px; font-size: 0.82rem; color: rgba(255,255,255,0.55); }
.lp-micro svg { width: 14px; height: 14px; color: #417B5A; }

/* FOOTER */
.lp-footer { background: #1F2041; padding: 72px 0 32px; }
.lp-ft-top { display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 40px; margin-bottom: 56px; }
.lp-ft-slogan { font-size: 0.88rem; color: rgba(255,255,255,0.45); margin-bottom: 20px; line-height: 1.5; }
.lp-socials { display: flex; gap: 10px; margin-bottom: 28px; }
.lp-soc { width: 36px; height: 36px; background: rgba(255,255,255,0.08); border-radius: 8px; display: flex; align-items: center; justify-content: center; transition: background 0.25s; }
.lp-soc:hover { background: #417B5A; }
.lp-soc svg { width: 16px; height: 16px; color: #fff; }
.lp-nl-lbl { font-size: 0.82rem; color: rgba(255,255,255,0.55); margin-bottom: 10px; font-weight: 600; }
.lp-nl { display: flex; gap: 8px; }
.lp-nl-inp { flex: 1; padding: 10px 14px; border-radius: 7px; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); color: #fff; font-size: 0.85rem; }
.lp-nl-inp::placeholder { color: rgba(255,255,255,0.35); }
.lp-nl-btn { padding: 10px 16px; border-radius: 7px; border: 1.5px solid rgba(255,255,255,0.35); background: transparent; color: #fff; font-size: 0.82rem; font-weight: 600; cursor: pointer; transition: all 0.25s; }
.lp-nl-btn:hover { background: rgba(255,255,255,0.1); }
.lp-ft-col h4 { font-size: 0.82rem; font-weight: 700; color: rgba(255,255,255,0.85); text-transform: uppercase; letter-spacing: 0.07em; margin-bottom: 16px; }
.lp-ft-col ul { display: flex; flex-direction: column; gap: 10px; }
.lp-ft-col ul a { font-size: 0.88rem; color: rgba(255,255,255,0.45); transition: color 0.25s; }
.lp-ft-col ul a:hover { color: rgba(255,255,255,0.85); }
.lp-ft-bot { border-top: 1px solid rgba(255,255,255,0.08); padding-top: 24px; display: flex; align-items: center; justify-content: space-between; }
.lp-ft-copy { font-size: 0.83rem; color: rgba(255,255,255,0.35); }

/* RESPONSIVE */
@media (max-width: 1024px) {
  .lp-hero-inner { grid-template-columns: 1fr; gap: 48px; }
  .lp-mock { max-width: 480px; margin: 0 auto; }
  .lp-num-grid { grid-template-columns: repeat(2, 1fr); gap: 24px; }
  .lp-ft-top { grid-template-columns: 1fr 1fr; gap: 32px; }
  .lp-steps::before { display: none; }
  .lp-steps { grid-template-columns: repeat(2, 1fr); gap: 32px; }
}
@media (max-width: 768px) {
  .lp-nav-links, .lp-nav-actions { display: none; }
  .lp-ham { display: flex; }
  .lp-hero-inner { text-align: center; }
  .lp-ctas { justify-content: center; }
  .lp-trust { flex-direction: column; align-items: center; gap: 10px; }
  .lp-trust-logos { justify-content: center; }
  .lp-hsub { margin: 0 auto 36px; }
  .lp-seg-grid { grid-template-columns: 1fr 1fr; }
  .lp-tab-cont.active { grid-template-columns: 1fr; }
  .lp-tabs-hdr { max-width: 100%; flex-wrap: wrap; }
  .lp-blog-grid { grid-template-columns: 1fr; }
  .lp-plans { grid-template-columns: 1fr; max-width: 400px; margin: 0 auto; }
  .lp-testi { grid-template-columns: 1fr; }
  .lp-ft-top { grid-template-columns: 1fr 1fr; }
  .lp-ft-bot { flex-direction: column; gap: 12px; text-align: center; }
  .lp-cta-form { flex-direction: column; }
  .lp-steps { grid-template-columns: 1fr; max-width: 340px; margin-left: auto; margin-right: auto; }
}
@media (max-width: 480px) {
  .lp-seg-grid { grid-template-columns: 1fr; }
  .lp-num-grid { grid-template-columns: 1fr; }
  .lp-ft-top { grid-template-columns: 1fr; }
}
`;

const checkSVG = (
  <svg viewBox="0 0 13 13" fill="none"><path d="M2 7l3 3 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
);
const planCheckSVG = (
  <svg viewBox="0 0 16 16" fill="none"><path d="M3 8l3.5 3.5 6.5-6.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
);
const starSVG = (
  <svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 1l1.8 5.4H15L10.1 9.6l1.8 5.4L8 12l-3.9 3L5.9 9.6 1 6.4h5.2L8 1z"/></svg>
);

export default function Landing() {
  const navigate = useNavigate();
  const styleRef = useRef<HTMLStyleElement | null>(null);
  const prefersReduced = useReducedMotion();

  // Checa sessão direto (sem puxar AuthProvider no FCP da Landing)
  useEffect(() => {
    let cancelled = false;
    supabase.auth.getSession().then(({ data }) => {
      if (!cancelled && data.session) {
        navigate('/dashboard', { replace: true });
      }
    });
    return () => { cancelled = true; };
  }, [navigate]);

  useLayoutEffect(() => {
    const el = document.createElement('style');
    el.textContent = LANDING_CSS;
    document.head.appendChild(el);
    styleRef.current = el;
    return () => { el.remove(); };
  }, []);

  // JS behaviours
  useEffect(() => {
    const nav = document.getElementById('lp-nav');
    if (!nav) return;
    const onScroll = () => {
      nav.classList.toggle('lp-scrolled', window.scrollY > 40);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    // Tabs
    window.__lpSwitchTab = (name: string, btn: HTMLElement) => {
      document.querySelectorAll('.lp-tab-cont').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.lp-tab-btn').forEach(b => b.classList.remove('active'));
      const tab = document.getElementById('lp-tab-' + name);
      if (tab) tab.classList.add('active');
      btn.classList.add('active');
    };
    // FAQ
    window.__lpFaq = (el: HTMLElement) => {
      const item = el.parentElement;
      if (!item) return;
      const isOpen = item.classList.contains('open');
      document.querySelectorAll('.lp-faq-item.open').forEach(i => i.classList.remove('open'));
      if (!isOpen) item.classList.add('open');
    };
    // Mobile menu
    window.__lpMobile = () => {
      document.getElementById('lp-ham')?.classList.toggle('open');
      document.getElementById('lp-mob')?.classList.toggle('open');
    };
    // Billing toggle
    window.__lpIsAnnual = false;
    window.__lpToggle = () => {
      window.__lpIsAnnual = !window.__lpIsAnnual;
      const sw = document.getElementById('lp-tog');
      if (sw) sw.classList.toggle('annual', window.__lpIsAnnual);
      const lm = document.getElementById('lp-lm');
      const la = document.getElementById('lp-la');
      if (lm) lm.classList.toggle('active', !window.__lpIsAnnual);
      if (la) la.classList.toggle('active', window.__lpIsAnnual);
      // Enterprise é "Sob demanda" — não entra no toggle de preço.
      const prices: Record<string, { monthly: number; annual: number }> = {
        starter: { monthly: 697, annual: 558 },
        pro: { monthly: 1097, annual: 878 },
      };
      for (const [plan, vals] of Object.entries(prices)) {
        const price = document.getElementById('lp-p-' + plan);
        const old = document.getElementById('lp-o-' + plan);
        if (!price || !old) continue;
        const fmt = (n: number) => 'R$\u00A0' + n.toLocaleString('pt-BR');
        if (window.__lpIsAnnual) {
          price.textContent = fmt(vals.annual);
          old.textContent = fmt(vals.monthly);
          old.classList.add('show');
        } else {
          price.textContent = fmt(vals.monthly);
          old.classList.remove('show');
        }
      }
    };
    // CountUp
    const countUp = (el: Element) => {
      const target = parseInt(el.getAttribute('data-target') || '0');
      const suffix = el.getAttribute('data-suffix') || '';
      const duration = 1800;
      const step = target / (duration / 16);
      let current = 0;
      const timer = setInterval(() => {
        current = Math.min(current + step, target);
        el.textContent = (target >= 1000 ? Math.floor(current).toLocaleString('pt-BR') : Math.floor(current)) + suffix;
        if (current >= target) clearInterval(timer);
      }, 16);
    };
    // IntersectionObserver
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('lp-visible');
          if (entry.target.hasAttribute('data-target') && !(entry.target as HTMLElement).dataset.counted) {
            (entry.target as HTMLElement).dataset.counted = '1';
            countUp(entry.target);
          }
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    document.querySelectorAll('.lp-fade, .lp-num-val[data-target]').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="lp-root">
      {/* NAVBAR */}
      <nav className="lp-nav" id="lp-nav">
        <div className="lp-container lp-nav-inner">
          <a href="/" className="lp-logo">
            <img src="/brand/panalearn-horizontal-on-indigo.png" alt="PanaLearn" className="lp-logo-img lp-logo-img-dark" width="140" height="34" />
            <img src="/brand/panalearn-horizontal-on-white.png" alt="PanaLearn" className="lp-logo-img lp-logo-img-light" width="140" height="34" />
          </a>
          <div className="lp-nav-links">
            <a href="#lp-features">Plataforma</a>
            <a href="#lp-segments">Segmentos</a>
            <a href="#lp-plans">Planos</a>
            <a href="#lp-blog">Novidades</a>
            <a href="#lp-faq">Contato</a>
          </div>
          <div className="lp-nav-actions">
            <a href="/login" className="lp-btn lp-btn-ow">Entrar</a>
            <a href="/onboarding" className="lp-btn lp-btn-g">Teste grátis</a>
          </div>
          <button className="lp-ham" id="lp-ham" onClick={() => (window as any).__lpMobile?.()}>
            <span/><span/><span/>
          </button>
        </div>
      </nav>

      {/* MOBILE MENU */}
      <div className="lp-mob" id="lp-mob">
        <a href="#lp-features" onClick={() => (window as any).__lpMobile?.()}>Plataforma</a>
        <a href="#lp-segments" onClick={() => (window as any).__lpMobile?.()}>Segmentos</a>
        <a href="#lp-plans" onClick={() => (window as any).__lpMobile?.()}>Planos</a>
        <a href="#lp-blog" onClick={() => (window as any).__lpMobile?.()}>Novidades</a>
        <a href="#lp-faq" onClick={() => (window as any).__lpMobile?.()}>Contato</a>
        <div className="lp-mob-actions">
          <a href="/login" className="lp-btn lp-btn-op">Entrar</a>
          <a href="/onboarding" className="lp-btn lp-btn-g">Teste grátis</a>
        </div>
      </div>

      {/* HERO */}
      <section className="lp-hero">
        <svg className="lp-hero-pat" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
          <defs><pattern id="lp-dots" x="0" y="0" width="28" height="28" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.5" fill="white" opacity="0.07"/></pattern></defs>
          <rect width="100%" height="100%" fill="url(#lp-dots)"/>
        </svg>
        <div className="lp-container">
          <div className="lp-hero-inner">

            {/* Coluna esquerda — stagger sequencial */}
            <motion.div
              variants={heroStagger}
              initial={prefersReduced ? 'visible' : 'hidden'}
              animate="visible"
            >
              <motion.div variants={heroEntrance} className="lp-badge">
                <svg viewBox="0 0 14 14" fill="none" style={{width:14,height:14}}><path d="M7 1L8.8 5.2L13 6L9.5 9.3L10.6 13.5L7 11.3L3.4 13.5L4.5 9.3L1 6L5.2 5.2L7 1Z" fill="currentColor"/></svg>
                Plataforma LMS para qualquer segmento
              </motion.div>

              <motion.h1 variants={heroEntrance} className="lp-h1">
                Treine equipes, certifique talentos e{' '}
                <RotatingWords
                  words={['transforme resultados', 'amplie competências', 'acelere aprendizados']}
                  className="text-[#417B5A]"
                />
              </motion.h1>

              <motion.p variants={heroEntrance} className="lp-hsub">
                PanaLearn é a plataforma de aprendizado online que se adapta ao seu negócio — de escolas de idiomas a universidades corporativas, de redes de franquias a instituições de ensino.
              </motion.p>

              <motion.div variants={heroEntrance} className="lp-ctas">
                <motion.a
                  href="/onboarding"
                  className="lp-btn lp-btn-g lp-btn-lg"
                  whileHover={prefersReduced ? undefined : ctaGlow}
                  whileTap={prefersReduced ? undefined : pressEffect}
                >
                  Começar gratuitamente
                </motion.a>
                <motion.a
                  href="#lp-features"
                  className="lp-btn lp-btn-ow lp-btn-lg"
                  whileHover={prefersReduced ? undefined : liftOnHover}
                  whileTap={prefersReduced ? undefined : pressEffect}
                >
                  Ver demonstração
                </motion.a>
              </motion.div>

              <motion.div variants={heroEntrance} className="lp-trust">
                <span className="lp-trust-txt">Organizações que já confiam na PanaLearn</span>
                <div className="lp-trust-logos">
                  {['ERAlearn','swisscorp.texas'].map(n => (
                    <span className="lp-trust-pill" key={n}>{n}</span>
                  ))}
                </div>
              </motion.div>
            </motion.div>

            {/* Coluna direita — mockup entra após o stagger da esquerda */}
            <motion.div
              className="lp-mock"
              initial={prefersReduced ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1], delay: prefersReduced ? 0 : 0.7 }}
            >
              <div className="lp-mock-hdr">
                <div className="lp-dots"><div className="lp-dot"/><div className="lp-dot"/><div className="lp-dot"/></div>
                <div className="lp-titlebar"/>
              </div>
              <div className="lp-mc">
                <div className="lp-mc-lbl">Curso em andamento</div>
                <div className="lp-mc-title">Onboarding Comercial 2025</div>
                <div className="lp-prog-bg"><div className="lp-prog-fill"/></div>
                <div className="lp-prog-lbl"><span>Progresso</span><span style={{color:'#D0CEBA',fontWeight:700}}>72%</span></div>
              </div>
              <div className="lp-mc">
                <div className="lp-cert-row">
                  <div className="lp-cert-ico">
                    <svg viewBox="0 0 18 18" fill="none"><rect x="2" y="3" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M6 8h6M6 11h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><circle cx="13" cy="13" r="3" fill="currentColor" opacity="0.2"/><path d="M12 13l1 1 1.5-1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
                  </div>
                  <div>
                    <div className="lp-cert-name">Certificado emitido</div>
                    <div className="lp-cert-date">Liderança Estratégica • Hoje</div>
                  </div>
                  <div className="lp-cert-badge">Novo</div>
                </div>
              </div>
              <div className="lp-mc">
                <div className="lp-chart-lbl">Atividade semanal</div>
                <div className="lp-chart">
                  {[30,55,45,85,70,90,100].map((h,i) => (
                    <div key={i} className={`lp-bar${i===3||i===6?' act':''}`} style={{height:`${h}%`}}/>
                  ))}
                </div>
              </div>
              <div className="lp-stats">
                <div className="lp-stat"><div className="lp-stat-n">247</div><div className="lp-stat-l">Alunos ativos</div></div>
                <div className="lp-stat"><div className="lp-stat-n">94%</div><div className="lp-stat-l">Conclusão</div></div>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* SEGMENTS */}
      <section id="lp-segments" className="lp-sec" style={{background:'#fff'}}>
        <div className="lp-container">
          <div className="lp-center lp-fade">
            <div className="lp-tag">Segmentos</div>
            <h2 className="lp-title">Para qualquer tipo de organização</h2>
            <p className="lp-subtitle">Uma plataforma, infinitas possibilidades</p>
          </div>
          <div className="lp-seg-grid">
            {[
              { name:'Empresas e Corporações', desc:'Onboarding, compliance e universidade corporativa integrados em um só ambiente.', svg:<svg viewBox="0 0 24 24" fill="none"><rect x="3" y="7" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M8 7V5a4 4 0 018 0v2" stroke="currentColor" strokeWidth="1.8"/><circle cx="12" cy="14" r="2" stroke="currentColor" strokeWidth="1.5"/></svg> },
              { name:'Escolas de Idiomas', desc:'Cursos por nível, trilhas de aprendizado e certificação de fluência para alunos.', svg:<svg viewBox="0 0 24 24" fill="none"><path d="M12 3L3 8v2h18V8L12 3z" stroke="currentColor" strokeWidth="1.8"/><rect x="5" y="10" width="3" height="8" rx="1" stroke="currentColor" strokeWidth="1.5"/><rect x="10.5" y="10" width="3" height="8" rx="1" stroke="currentColor" strokeWidth="1.5"/><rect x="16" y="10" width="3" height="8" rx="1" stroke="currentColor" strokeWidth="1.5"/><path d="M3 18h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg> },
              { name:'Faculdades e EAD', desc:'Turmas, videoaulas, avaliações e diários acadêmicos para ensino superior e EAD.', svg:<svg viewBox="0 0 24 24" fill="none"><path d="M4 19V9l8-5 8 5v10" stroke="currentColor" strokeWidth="1.8"/><rect x="9" y="14" width="6" height="5" rx="1" stroke="currentColor" strokeWidth="1.5"/><circle cx="12" cy="9" r="2" stroke="currentColor" strokeWidth="1.5"/></svg> },
              { name:'Redes de Franquias', desc:'Treinamento padronizado com branding personalizado por unidade franqueada.', svg:<svg viewBox="0 0 24 24" fill="none"><path d="M3 12h18M12 3v18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.8"/></svg> },
              { name:'Saúde e Hospitais', desc:'Capacitação técnica, conformidade regulatória e reciclagem de equipes de saúde.', svg:<svg viewBox="0 0 24 24" fill="none"><path d="M12 2a7 7 0 100 14A7 7 0 0012 2z" stroke="currentColor" strokeWidth="1.8"/><path d="M10 9h4M12 7v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M5 20a9 9 0 0114 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg> },
              { name:'Setor Público', desc:'Qualificação de servidores, educação continuada e gestão de competências.', svg:<svg viewBox="0 0 24 24" fill="none"><path d="M3 5h18v4H3V5zM5 9v10M19 9v10M3 19h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M9 14h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg> },
            ].map((s, i) => (
              <div key={s.name} className="lp-seg-card lp-fade" style={{transitionDelay:`${i*0.07}s`}}>
                <div className="lp-seg-ico">{s.svg}</div>
                <div className="lp-seg-name">{s.name}</div>
                <div className="lp-seg-desc">{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* NUMBERS */}
      <section className="lp-sec" style={{background:'#F4F3FA'}}>
        <div className="lp-container">
          <div className="lp-center lp-fade">
            <div className="lp-tag">Resultados</div>
            <h2 className="lp-title">Números que comprovam</h2>
          </div>
          <div className="lp-num-grid">
            {[
              { target:600, suffix:'+', label:'alunos ativos', svg:<svg viewBox="0 0 26 26" fill="none"><circle cx="13" cy="10" r="4" stroke="currentColor" strokeWidth="1.8"/><path d="M5 21a8 8 0 0116 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg> },
              { target:10, suffix:'+', label:'organizações clientes', svg:<svg viewBox="0 0 26 26" fill="none"><rect x="4" y="7" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M9 7V5a4 4 0 018 0v2" stroke="currentColor" strokeWidth="1.8"/></svg> },
              { target:98, suffix:'%', label:'de satisfação', svg:<svg viewBox="0 0 26 26" fill="none"><path d="M13 3L15.5 9.5L22 10.5L17 15.5L18.5 22L13 18.5L7.5 22L9 15.5L4 10.5L10.5 9.5L13 3Z" stroke="currentColor" strokeWidth="1.8"/></svg> },
              { target:50, suffix:'+', label:'cursos disponíveis', svg:<svg viewBox="0 0 26 26" fill="none"><rect x="4" y="3" width="18" height="20" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M9 9h8M9 13h8M9 17h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg> },
            ].map((n, i) => (
              <div key={n.label} className="lp-num-item lp-fade" style={{transitionDelay:`${i*0.1}s`}}>
                <div className="lp-num-ico">{n.svg}</div>
                <div>
                  <div className="lp-num-val" data-target={n.target} data-suffix={n.suffix}>0</div>
                  <div className="lp-num-lbl">{n.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="lp-features" className="lp-sec" style={{background:'#fff'}}>
        <div className="lp-container">
          <div className="lp-center lp-fade">
            <div className="lp-tag">Funcionalidades</div>
            <h2 className="lp-title">Tudo que você precisa em um só lugar</h2>
          </div>
          <div className="lp-fade">
            <div className="lp-tabs-hdr">
              {['gestores','alunos','ti'].map((t,i) => (
                <button key={t} className={`lp-tab-btn${i===0?' active':''}`} onClick={(e) => (window as any).__lpSwitchTab?.(t, e.currentTarget)}>
                  {t==='gestores'?'Para Gestores':t==='alunos'?'Para Alunos':'Para TI'}
                </button>
              ))}
            </div>
            {[
              { id:'gestores', feats:[
                {t:'Criação de cursos e trilhas personalizadas', d:'Monte trilhas de aprendizado do zero com módulos, vídeos e quizzes em minutos.'},
                {t:'Relatórios de progresso em tempo real', d:'Acompanhe engajamento, conclusão e desempenho por aluno, turma ou curso.'},
                {t:'Gestão de usuários com roles granulares', d:'Defina permissões por perfil: admin, instrutor, gestor e aluno com controle total.'},
                {t:'Certificados automáticos configuráveis', d:'Emita certificados personalizados ao final de cursos com critérios de aprovação.'},
                {t:'Personalização por organização', d:'Cada organização tem sua própria experiência e ambiente isolado na plataforma.'},
              ]},
              { id:'alunos', feats:[
                {t:'Player de vídeo com progresso salvo', d:'Assista onde parou. Progresso salvo automaticamente, até no mobile.'},
                {t:'Quizzes e avaliações por módulo', d:'Fixe o aprendizado com quizzes interativos e veja seu desempenho ao instante.'},
                {t:'Certificados digitais verificáveis', d:'Certificados verificáveis online com código único por emissão.'},
                {t:'Acesso responsivo em qualquer dispositivo', d:'Celular, tablet ou desktop — a experiência é fluida em todos os tamanhos.'},
                {t:'Histórico completo de aprendizagem', d:'Veja todos os cursos concluídos, badges conquistadas e certificados emitidos.'},
              ]},
              { id:'ti', feats:[
                {t:'API REST documentada', d:'Integre com seus sistemas internos via API REST com documentação completa.'},
                {t:'SSO / Active Directory / OAuth2', d:'Login único via SSO, AD ou provedores OAuth2 para sua organização.'},
                {t:'Infraestrutura cloud com 99.9% uptime', d:'Hospedado em cloud com SLA garantido, backups automáticos e escalabilidade.'},
                {t:'Dados isolados por tenant (RLS)', d:'Row Level Security no PostgreSQL garante isolamento total entre clientes.'},
                {t:'Subdomínio próprio do cliente', d:'Cada cliente acessa sua plataforma em cliente.panalearn.com ou domínio próprio.'},
              ]},
            ].map(tab => (
              <div key={tab.id} id={`lp-tab-${tab.id}`} className={`lp-tab-cont${tab.id==='gestores'?' active':''}`}>
                {tab.feats.map(f => (
                  <div key={f.t} className="lp-feat">
                    <div className="lp-check">{checkSVG}</div>
                    <div><div className="lp-ft">{f.t}</div><div className="lp-fd">{f.d}</div></div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW */}
      <section className="lp-sec" style={{background:'#F4F3FA'}}>
        <div className="lp-container">
          <div className="lp-center lp-fade">
            <div className="lp-tag">Primeiros passos</div>
            <h2 className="lp-title">Configure e comece em minutos</h2>
          </div>
          <div className="lp-steps">
            {[
              {n:1, t:'Crie sua conta', d:'Cadastre sua organização e configure o ambiente de aprendizado rapidamente.'},
              {n:2, t:'Personalize', d:'Logo, cores e domínio próprios. Parece que foi feito para a sua marca.'},
              {n:3, t:'Adicione conteúdo', d:'Suba vídeos, PDFs, quizzes e monte trilhas de aprendizado completas.'},
              {n:4, t:'Convide sua equipe', d:'Alunos recebem acesso e começam a aprender imediatamente após o convite.'},
            ].map((s,i) => (
              <div key={s.n} className="lp-step lp-fade" style={{transitionDelay:`${i*0.1}s`}}>
                <div className="lp-step-n">{s.n}</div>
                <div className="lp-step-t">{s.t}</div>
                <div className="lp-step-d">{s.d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BLOG */}
      <section id="lp-blog" className="lp-sec" style={{background:'#fff'}}>
        <div className="lp-container">
          <div className="lp-center lp-fade">
            <div className="lp-tag">Novidades</div>
            <h2 className="lp-title">Novidades da plataforma</h2>
          </div>
          <div className="lp-blog-grid">
            {[
              { color:'#4B3F72', tag:'purple', tagTxt:'Nova funcionalidade', title:'Quiz com áudio', sum:'O Panalearn agora suporta quizzes com áudio, ajudando escolas e organizações a melhorar o aprendizado de forma mais acessível e dinâmica.', date:'Jun 2026' },
              { color:'#417B5A', tag:'green', tagTxt:'Case de Sucesso', title:'ERALearn centraliza treinamentos com a PanaLearn', sum:'A ERALearn utilizou o Panalearn para estruturar e melhorar a trilha de conhecimento dos seus clientes, centralizando o treinamento em uma única plataforma.', date:'Mai 2026' },
              { color:'#3B82F6', tag:'blue', tagTxt:'Dica de Gestão', title:'7 indicadores para medir o ROI do treinamento corporativo', sum:'Descubra as métricas que gestores de RH e T&D usam para comprovar o valor do aprendizado.', date:'Fev 2026' },
            ].map((b,i) => (
              <div key={b.title} className="lp-blog-card lp-fade" style={{transitionDelay:`${i*0.1}s`}}>
                <div className="lp-blog-stripe" style={{background:b.color}}/>
                <div className="lp-blog-body">
                  <span className={`lp-blog-tag ${b.tag}`}>{b.tagTxt}</span>
                  <div className="lp-blog-title">{b.title}</div>
                  <div className="lp-blog-sum">{b.sum}</div>
                  <div className="lp-blog-date">{b.date}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="lp-blog-cta lp-fade">
            <a href="/blog" className="lp-btn lp-btn-op lp-btn-lg" style={{marginTop:8}}>Ver todas as novidades →</a>
          </div>
        </div>
      </section>

      {/* PLANS */}
      <section id="lp-plans" className="lp-sec" style={{background:'#F4F3FA'}}>
        <div className="lp-container">
          <div className="lp-center lp-fade">
            <div className="lp-tag">Preços</div>
            <h2 className="lp-title">Planos para todos os tamanhos</h2>
            <p className="lp-subtitle">Comece grátis. Escale conforme cresce.</p>
          </div>
          <div className="lp-toggle lp-fade">
            <span className="lp-tog-lbl active" id="lp-lm">Mensal</span>
            <div className="lp-tog-sw" id="lp-tog" onClick={() => (window as any).__lpToggle?.()}>
              <div className="lp-tog-knob"/>
            </div>
            <span className="lp-tog-lbl" id="lp-la">Anual <span className="lp-ann-badge">-20%</span></span>
          </div>
          <div className="lp-plans lp-fade">
            <div className="lp-plan">
              <div className="lp-plan-name">Starter</div>
              <div><span className="lp-plan-old" id="lp-o-starter">R$&nbsp;697</span><span className="lp-plan-price" id="lp-p-starter">R$&nbsp;697</span><span className="lp-plan-per">/mês</span></div>
              <div className="lp-plan-desc">Ideal para pequenas equipes e empresas começando no e-learning.</div>
              <ul className="lp-plan-feats">
                {['Até 40 usuários ativos','Cursos limitados','Quizzes inclusos','Certificados automáticos','Painel básico de progresso'].map(f => <li key={f} className="lp-plan-feat">{planCheckSVG}{f}</li>)}
              </ul>
              <a href="/onboarding" className="lp-plan-cta lp-btn lp-btn-op">Começar agora</a>
            </div>
            <div className="lp-plan featured">
              <div className="lp-plan-badge">Mais popular</div>
              <div className="lp-plan-name">Pro</div>
              <div><span className="lp-plan-old" id="lp-o-pro">R$&nbsp;1.097</span><span className="lp-plan-price" id="lp-p-pro">R$&nbsp;1.097</span><span className="lp-plan-per">/mês</span></div>
              <div className="lp-plan-desc">Para empresas em crescimento que precisam de personalização e IA.</div>
              <ul className="lp-plan-feats">
                {['Até 180 usuários ativos','Cursos ilimitados','Quizzes + certificados','Gestão de usuários','Suporte com SLA garantido'].map(f => <li key={f} className="lp-plan-feat">{planCheckSVG}{f}</li>)}
              </ul>
              <a href="/onboarding" className="lp-plan-cta lp-btn lp-btn-dark">Começar agora</a>
            </div>
            <div className="lp-plan">
              <div className="lp-plan-name">Enterprise</div>
              <div><span className="lp-plan-price" id="lp-p-enterprise">Sob demanda</span></div>
              <div className="lp-plan-desc">Para grandes organizações com necessidades avançadas e escala.</div>
              <ul className="lp-plan-feats">
                {['Usuários ilimitados','Cursos ilimitados','Quizzes + certificados','White-label completo','Integrações via API','Suporte prioritário','IA de suporte incluída'].map(f => <li key={f} className="lp-plan-feat">{planCheckSVG}{f}</li>)}
              </ul>
              <a href="mailto:comercial@panalearn.com?subject=Plano%20Enterprise%20%E2%80%94%20preciso%20falar%20com%20um%20especialista" className="lp-plan-cta lp-btn lp-btn-op">Falar com especialista</a>
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="lp-sec" style={{background:'#F4F3FA'}}>
        <div className="lp-container">
          <div className="lp-center lp-fade">
            <div className="lp-tag">Depoimentos</div>
            <h2 className="lp-title">Quem usa a PanaLearn, aprova</h2>
          </div>
          <div className="lp-testi">
            {[
              { initials:'MV', bg:'linear-gradient(135deg,#7C3AED,#4F46E5)', name:'Mariangel Velásquez', role:'Orange, Texas', txt:'"O Panalearn transformou a forma como organizamos nossos treinamentos. A plataforma é intuitiva e os quizzes com áudio são um diferencial incrível."' },
              { initials:'AS', bg:'linear-gradient(135deg,#059669,#10B981)', name:'Andressa Sugar', role:'Natal, RN', txt:'"Desde que adotamos o Panalearn, nossos colaboradores completam os cursos muito mais rápido. O sistema de certificados digitais deu credibilidade ao nosso programa."' },
              { initials:'PL', bg:'linear-gradient(135deg,#DC2626,#F59E0B)', name:'Patrícia L.', role:'Coord. Pedagógica · EduFlex Idiomas', txt:'"A taxa de conclusão dos nossos cursos de idiomas subiu 60% depois que migramos para a PanaLearn. Os alunos adoram a experiência mobile."' },
            ].map((t,i) => (
              <div key={t.name} className="lp-testi-card lp-fade" style={{transitionDelay:`${i*0.1}s`}}>
                <div className="lp-stars">{[0,1,2,3,4].map(s => <span key={s}>{starSVG}</span>)}</div>
                <p className="lp-testi-txt">{t.txt}</p>
                <div className="lp-author">
                  <div className="lp-avatar" style={{background:t.bg}}>{t.initials}</div>
                  <div><div className="lp-author-name">{t.name}</div><div className="lp-author-role">{t.role}</div></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="lp-faq" className="lp-sec" style={{background:'#fff'}}>
        <div className="lp-container">
          <div className="lp-center lp-fade">
            <div className="lp-tag">FAQ</div>
            <h2 className="lp-title">Perguntas frequentes</h2>
          </div>
          <div className="lp-faq-list">
            {[
              { q:'A PanaLearn funciona para qualquer segmento ou tem um foco específico?', a:'A PanaLearn é uma plataforma universal. Ela já foi configurada para empresas corporativas, escolas de idiomas, faculdades EAD, redes de franquias, hospitais e órgãos públicos. A arquitetura multi-tenant garante que cada cliente tenha uma experiência completamente personalizada, independentemente do segmento.' },
              { q:'Posso importar meus vídeos e conteúdos já existentes?', a:'Sim. Você pode fazer upload de vídeos em MP4, MOV e AVI, documentos PDF, apresentações e outros formatos diretamente na plataforma. Também suportamos links de vídeos externos (YouTube, Vimeo) e integração com ferramentas de autoria como Articulate.' },
              { q:'Como funciona o sistema multi-tenant e o branding por cliente?', a:'Cada cliente (tenant) tem seu próprio ambiente isolado: URL personalizada, logo, paleta de cores, e-mails transacionais e certificados com a identidade visual da organização. Os dados são completamente separados entre tenants via Row Level Security.' },
              { q:'Os certificados emitidos têm validade e podem ser verificados online?', a:'Sim. Cada certificado possui um código único e QR Code que direciona para uma página de verificação pública. A validade pode ser configurada pelo gestor do curso (vitalícia ou com prazo de expiração).' },
              { q:'Existe integração com Active Directory, SSO ou ferramentas de RH?', a:'Sim. Nos planos Enterprise, oferecemos SSO via SAML 2.0, OAuth2 e integração com Active Directory / LDAP. Também possuímos APIs para sincronização com sistemas de RH como SAP SuccessFactors, Gupy, Totvs e outros via webhooks.' },
              { q:'Como funciona o período de teste gratuito de 14 dias?', a:'Ao criar sua conta, você tem acesso completo ao plano Profissional por 14 dias sem necessidade de cartão de crédito. Durante esse período, você pode criar cursos, convidar alunos e explorar todas as funcionalidades.' },
              { q:'Preciso de equipe técnica para configurar a plataforma?', a:'Não. A PanaLearn foi projetada para que gestores de RH e coordenadores pedagógicos configurem tudo sem necessidade de TI. Para integrações avançadas (SSO, API), nossa equipe técnica oferece suporte dedicado.' },
              { q:'Como a PanaLearn trata segurança e conformidade com a LGPD?', a:'A plataforma está em conformidade com a LGPD. Os dados dos usuários são armazenados em servidores no Brasil com criptografia em trânsito (TLS 1.3) e em repouso. Disponibilizamos DPA para clientes Enterprise.' },
            ].map((f,i) => (
              <div key={i} className="lp-faq-item lp-fade" style={{transitionDelay:`${i*0.04}s`}}>
                <div className="lp-faq-q" onClick={(e) => (window as any).__lpFaq?.(e.currentTarget)}>
                  {f.q}
                  <svg className="lp-faq-ico" viewBox="0 0 22 22" fill="none"><path d="M5 8l6 6 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
                </div>
                <div className="lp-faq-a"><div className="lp-faq-ai">{f.a}</div></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="lp-cta-sec">
        <div className="lp-container lp-fade">
          <h2 className="lp-cta-t">Pronto para transformar a forma como sua organização aprende?</h2>
          <p className="lp-cta-sub">14 dias grátis. Configuração em minutos. Sem cartão de crédito.</p>
          <form className="lp-cta-form" onSubmit={(e) => {
            e.preventDefault();
            const email = (e.currentTarget.elements.namedItem('email') as HTMLInputElement)?.value.trim();
            navigate(`/onboarding${email ? `?email=${encodeURIComponent(email)}` : ''}`);
          }}>
            <input name="email" type="email" className="lp-cta-inp" placeholder="Seu melhor e-mail corporativo"/>
            <button type="submit" className="lp-btn lp-btn-g lp-btn-lg" style={{whiteSpace:'nowrap'}}>Começar agora</button>
          </form>
          <div className="lp-micros">
            <span className="lp-micro"><svg viewBox="0 0 14 14" fill="none"><path d="M7 1v6l3 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.5"/></svg>Cancele quando quiser</span>
            <span className="lp-micro"><svg viewBox="0 0 14 14" fill="none"><path d="M7 2a3 3 0 100 6 3 3 0 000-6zM2 12a5 5 0 0110 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>Suporte em português</span>
            <span className="lp-micro"><svg viewBox="0 0 14 14" fill="none"><rect x="2" y="6" width="10" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><path d="M4.5 6V4a2.5 2.5 0 015 0v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>Dados seguros (LGPD)</span>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="lp-footer">
        <div className="lp-container">
          <div className="lp-ft-top">
            <div>
              <div className="lp-logo" style={{marginBottom:12}}>
                <img src="/brand/panalearn-horizontal-on-indigo.png" alt="PanaLearn" className="lp-logo-img" width="140" height="34" />
              </div>
              <p className="lp-ft-slogan">Aprenda. Certifique. Cresça.<br/>A plataforma LMS para qualquer organização.</p>
            </div>
            {[
              { h:'Plataforma', links:[
                { l:'Funcionalidades', href:'/#lp-features' },
                { l:'Planos',           href:'/#lp-plans' },
                { l:'Segmentos',        href:'/#lp-segments' },
              ]},
              { h:'Empresa', links:[
                { l:'Blog',    href:'/blog' },
                { l:'Contato', href:'mailto:comercial@panalearn.com' },
              ]},
              { h:'Legal', links:[
                { l:'Privacidade', href:'/privacidade' },
                { l:'Termos de uso', href:'/termos' },
              ]},
            ].map(col => (
              <div key={col.h} className="lp-ft-col">
                <h4>{col.h}</h4>
                <ul>{col.links.map(it => <li key={it.l}><a href={it.href}>{it.l}</a></li>)}</ul>
              </div>
            ))}
          </div>
          <div className="lp-ft-bot">
            <span className="lp-ft-copy">© 2026 PanaLearn. Todos os direitos reservados.</span>
            <span className="lp-ft-copy" style={{ display: 'flex', gap: 16 }}>
              <a href="/privacidade">Privacidade</a>
              <a href="/termos">Termos</a>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

declare global {
  interface Window {
    __lpSwitchTab?: (name: string, btn: HTMLElement) => void;
    __lpFaq?: (el: HTMLElement) => void;
    __lpMobile?: () => void;
    __lpIsAnnual?: boolean;
    __lpToggle?: () => void;
  }
}
