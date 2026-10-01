-- 004_seed_services_pricing_data.sql
-- Default seed for Services, Packages, Package Features, Art Directions, Hosting Plans, and Add-ons.
-- Safe to run repeatedly (uses ON CONFLICT DO NOTHING).

-- ==============================================================================
-- 1. SERVICES
-- ==============================================================================
insert into public.services (id, name, slug, index_num, description, short_description, starting_price, price_label, billing_type, is_featured, is_active, display_order)
values
  ('digital-presence', 'Digital Presence', 'digital-presence', '01', 'Websites designed around your business.', 'Websites that make your business exist online properly.', 3000, 'From ₹3,000+', 'one_time', true, true, 1),
  ('brand-identity', 'Brand Identity', 'brand-identity', '02', 'A distinct visual language that commands attention.', 'A visual language people remember.', 3999, 'From ₹3,999+', 'one_time', true, true, 2),
  ('design', 'Design', 'design', '03', 'Crafted marketing, print collateral and screen communications.', 'Everything your business needs to communicate.', 1000, 'From ₹1,000+', 'one_time', true, true, 3),
  ('marketing', 'Marketing', 'marketing', '04', 'Strategic growth and visual advertising campaigns.', 'Turn attention into measurable action.', 4999, 'From ₹4,999/month+', 'monthly', true, true, 4),
  ('digital-support', 'Digital Support', 'digital-support', '05', 'High-performance hosting, continuous maintenance and security monitoring.', 'We don''t disappear after launch.', 3999, 'From ₹3,999/year+', 'yearly', true, true, 5),
  ('complete-packages', 'Complete Packages', 'complete-packages', '06', 'Holistic digital partnerships combining identity, web, and marketing.', 'Everything your business needs from inception to growth.', 14999, 'From ₹14,999+', 'one_time', true, true, 6)
on conflict (id) do nothing;

-- ==============================================================================
-- 2. SERVICE PACKAGES
-- ==============================================================================
-- Digital Presence Packages
insert into public.service_packages (id, service_id, name, slug, description, price, price_label, billing_type, badge, is_featured, is_active, display_order)
values
  ('inquiry-website', 'digital-presence', 'Inquiry Website', 'inquiry-website', 'A simple responsive website designed to help customers discover your business and get in touch.', 3000, '₹3,000+', 'one_time', 'Entry Level', false, true, 1),
  ('business-website', 'digital-presence', 'Business Website', 'business-website', 'A complete modern web presence tailored for growing companies seeking credibility and lead generation.', 19999, '₹19,999+', 'one_time', 'Popular', true, true, 2),
  ('premium-website', 'digital-presence', 'Premium Website', 'premium-website', 'An immersive, bespoke digital experience with custom motion design and high conversion architecture.', 34999, '₹34,999+', 'one_time', 'Flagship', true, true, 3),
  ('ecommerce', 'digital-presence', 'E-Commerce', 'ecommerce', 'Full-stack online store built with friction-free checkout, inventory management, and payment gateway integration.', 39999, '₹39,999+', 'one_time', null, false, true, 4),
  ('custom-web-application', 'digital-presence', 'Custom Web Application', 'custom-web-application', 'Bespoke dashboards, SaaS products, booking portals, CRM, AI workflows, and 3D web experiences.', 60000, '₹60,000+ / Custom quote', 'custom', 'Enterprise', false, true, 5)
on conflict (id) do nothing;

-- Brand Identity Packages
insert into public.service_packages (id, service_id, name, slug, description, price, price_label, billing_type, badge, is_featured, is_active, display_order)
values
  ('logo-design', 'brand-identity', 'Logo Design', 'logo-design', 'Precise typographic and symbolic marks that distill your company essence into an unforgettable icon.', 3999, '₹3,999+', 'one_time', null, false, true, 1),
  ('brand-identity-pack', 'brand-identity', 'Brand Identity', 'brand-identity-pack', 'A cohesive identity system providing foundational assets, colors, and layout guidelines for digital and physical use.', 9999, '₹9,999+', 'one_time', 'Most Popular', true, true, 2),
  ('complete-brand-identity', 'brand-identity', 'Complete Brand Identity', 'complete-brand-identity', 'Comprehensive brand universe with exhaustive guideline manuals, marketing collateral, and social design systems.', 19999, '₹19,999+', 'one_time', 'Full System', false, true, 3)
on conflict (id) do nothing;

-- Design Services Packages
insert into public.service_packages (id, service_id, name, slug, description, price, price_label, billing_type, badge, is_featured, is_active, display_order)
values
  ('brochure', 'design', 'Brochure', 'brochure', 'Curated print or digital layout designed to present your offerings concisely.', 2500, '₹2,500+', 'one_time', null, false, true, 1),
  ('premium-brochure', 'design', 'Premium Brochure', 'premium-brochure', 'Multi-page editorial publication featuring custom typography, layouts, and print-ready finishes.', 5000, '₹5,000+', 'one_time', null, false, true, 2),
  ('catalogue', 'design', 'Catalogue', 'catalogue', 'Structured product and services catalog with grid precision and seamless reading flow.', 7500, '₹7,500+', 'one_time', null, false, true, 3),
  ('flyer-poster', 'design', 'Flyer / Poster', 'flyer-poster', 'High-impact display design engineered for instant visual recall in digital or print spaces.', 1000, '₹1,000+', 'one_time', null, false, true, 4),
  ('menu', 'design', 'Menu', 'menu', 'Tactile, appetizing layout for culinary, hospitality, or luxury lifestyle venues.', 2000, '₹2,000+', 'one_time', null, false, true, 5),
  ('business-card', 'design', 'Business Card', 'business-card', 'Sophisticated stationery piece with tactile finishing specifications and crisp typography.', 1000, '₹1,000+', 'one_time', null, false, true, 6),
  ('presentation', 'design', 'Presentation', 'presentation', 'Executive slide decks and investor pitches with cohesive typography and visual storytelling.', 2500, '₹2,500+', 'one_time', null, false, true, 7),
  ('social-media-creative', 'design', 'Social Media Creative', 'social-media-creative', 'Single high-fidelity creative asset crafted for key announcements or campaign beats.', 500, '₹500+', 'one_time', null, false, true, 8),
  ('social-media-template-pack', 'design', 'Social Media Template Pack', 'social-media-template-pack', 'Figma or Canva design system consisting of reusable feeds, carousels, and stories.', 3999, '₹3,999+', 'one_time', 'Value Pack', true, true, 9)
on conflict (id) do nothing;

-- Marketing Packages
insert into public.service_packages (id, service_id, name, slug, description, price, price_label, billing_type, badge, is_featured, is_active, display_order)
values
  ('social-starter', 'marketing', 'Social Starter', 'social-starter', 'Consistent social media presence focused on brand authority and audience retention.', 4999, '₹4,999/month', 'monthly', null, false, true, 1),
  ('social-growth', 'marketing', 'Social Growth', 'social-growth', 'Dynamic content rhythm pairing static storytelling with short-form reel art direction and analytics.', 9999, '₹9,999/month', 'monthly', 'Recommended', true, true, 2),
  ('ads-management', 'marketing', 'Meta / Google Ads Management', 'ads-management', 'Performance advertising management. Ad spend paid to Meta/Google is billed separately.', 5000, '₹5,000/month+', 'monthly', null, false, true, 3)
on conflict (id) do nothing;

-- Digital Support Packages
insert into public.service_packages (id, service_id, name, slug, description, price, price_label, billing_type, badge, is_featured, is_active, display_order)
values
  ('pkg-lattice-hosting', 'digital-support', 'Lattice Hosting', 'lattice-hosting', 'Global edge CDN deployment with SSL, automated backups, and 99.9% uptime SLA.', 3999, '₹3,999/year', 'yearly', null, false, true, 1),
  ('pkg-lattice-care', 'digital-support', 'Lattice Care', 'lattice-care', 'Hosting plus monthly maintenance, continuous security scanning, and content updates.', 6999, '₹6,999/year', 'yearly', 'Popular', true, true, 2),
  ('pkg-lattice-app-care', 'digital-support', 'Lattice Application Care', 'lattice-application-care', 'Dedicated infrastructure maintenance for custom software, e-commerce, and database backends.', 12000, '₹12,000/year+', 'yearly', 'Enterprise', false, true, 3)
on conflict (id) do nothing;

-- Complete Packages
insert into public.service_packages (id, service_id, name, slug, description, price, price_label, billing_type, badge, is_featured, is_active, display_order)
values
  ('pkg-launch', 'complete-packages', 'Launch', 'launch', 'Foundational identity and digital presence for emerging studios and ventures.', 14999, '₹14,999+', 'one_time', 'Starter Suite', false, true, 1),
  ('pkg-grow', 'complete-packages', 'Grow', 'grow', 'Expanded identity and high-performance multi-page website built for scaling businesses.', 29999, '₹29,999+', 'one_time', 'Growth Suite', true, true, 2),
  ('pkg-signature', 'complete-packages', 'Signature', 'signature', 'Bespoke art direction, complete brand language, and flagship custom web platform.', 49999, '₹49,999+', 'one_time', 'Flagship', true, true, 3),
  ('pkg-digital-partner', 'complete-packages', 'Digital Partner', 'digital-partner', 'Complete brand, custom website, marketing collateral, ongoing support, and technical roadmap.', 79999, '₹79,999+', 'one_time', 'All-Inclusive', false, true, 4)
on conflict (id) do nothing;

-- ==============================================================================
-- 3. PACKAGE FEATURES
-- ==============================================================================
-- Inquiry Website Features
insert into public.package_features (package_id, feature, display_order)
values
  ('inquiry-website', '1–3 responsive pages', 1),
  ('inquiry-website', 'Responsive mobile-first design', 2),
  ('inquiry-website', 'Business & contact overview', 3),
  ('inquiry-website', 'Services & products showcase', 4),
  ('inquiry-website', 'Direct WhatsApp & tap-to-call links', 5),
  ('inquiry-website', 'Interactive lead inquiry form', 6),
  ('inquiry-website', 'Google Maps integration', 7),
  ('inquiry-website', 'Foundational SEO setup', 8),
  ('inquiry-website', 'SSL security certificate & deployment', 9),
  ('inquiry-website', 'One structured revision round', 10);

-- Business Website Features
insert into public.package_features (package_id, feature, display_order)
values
  ('business-website', '6–10 bespoke pages', 1),
  ('business-website', 'Tailored UI/UX design architecture', 2),
  ('business-website', 'Smooth micro-interactions and transitions', 3),
  ('business-website', 'Lead capture & contact workflows', 4),
  ('business-website', 'Curated gallery & case studies', 5),
  ('business-website', 'Client testimonials & trust markers', 6),
  ('business-website', 'Comprehensive SEO metadata structure', 7),
  ('business-website', 'Privacy-first analytics integration', 8),
  ('business-website', 'Two structured revision rounds', 9);

-- Premium Website Features
insert into public.package_features (package_id, feature, display_order)
values
  ('premium-website', 'Bespoke UI/UX with editorial art direction', 1),
  ('premium-website', 'Advanced motion design & scroll choreography', 2),
  ('premium-website', 'Custom graphics and icon system', 3),
  ('premium-website', 'Interactive 3D / WebGL moments where suitable', 4),
  ('premium-website', 'Conversion-focused page layouts', 5),
  ('premium-website', 'Advanced SEO & schema markup', 6),
  ('premium-website', 'Core Web Vitals performance tuning', 7),
  ('premium-website', 'Dedicated staging environment & priority support', 8);

-- E-commerce Features
insert into public.package_features (package_id, feature, display_order)
values
  ('ecommerce', 'Complete product catalogue & categories', 1),
  ('ecommerce', 'Smooth cart & checkout experience', 2),
  ('ecommerce', 'Indian & international payment gateways', 3),
  ('ecommerce', 'Automated order notifications & tracking', 4),
  ('ecommerce', 'Admin inventory & order dashboard', 5),
  ('ecommerce', 'Customer accounts & order history', 6),
  ('ecommerce', 'Mobile e-commerce optimization', 7),
  ('ecommerce', 'Sales & conversion analytics', 8);

-- Custom Web Application Features
insert into public.package_features (package_id, feature, display_order)
values
  ('custom-web-application', 'Dashboards, SaaS & client portals', 1),
  ('custom-web-application', 'Appointment booking & reservation systems', 2),
  ('custom-web-application', 'Custom CRM & automated workflows', 3),
  ('custom-web-application', 'AI integrations (LLMs, vision, automation)', 4),
  ('custom-web-application', 'Real-time 3D / Canvas experiences', 5),
  ('custom-web-application', 'Third-party API & webhook integrations', 6),
  ('custom-web-application', 'Scalable relational database architecture', 7),
  ('custom-web-application', 'Role-based access control & enterprise security', 8);

-- Logo Design Features
insert into public.package_features (package_id, feature, display_order)
values
  ('logo-design', 'Logo concept development & exploration', 1),
  ('logo-design', '2 distinct initial design concepts', 2),
  ('logo-design', 'Refinement of chosen direction', 3),
  ('logo-design', 'Colour palette selection', 4),
  ('logo-design', 'Typography pairing selection', 5),
  ('logo-design', 'Deliverables: PNG, JPG, vector SVG', 6),
  ('logo-design', 'Light and dark background variants', 7);

-- Brand Identity Pack Features
insert into public.package_features (package_id, feature, display_order)
values
  ('brand-identity-pack', 'Core logo system & lockups', 1),
  ('brand-identity-pack', 'Curated brand color palette (HEX, RGB, CMYK)', 2),
  ('brand-identity-pack', 'Primary & secondary typography hierarchy', 3),
  ('brand-identity-pack', 'Custom brand graphic elements & patterns', 4),
  ('brand-identity-pack', 'Social media profile & cover assets', 5),
  ('brand-identity-pack', 'Print-ready business card design', 6),
  ('brand-identity-pack', 'Digital letterhead template', 7),
  ('brand-identity-pack', 'Brand style guide overview (PDF)', 8);

-- Complete Brand Identity Features
insert into public.package_features (package_id, feature, display_order)
values
  ('complete-brand-identity', 'Complete multi-format logo system', 1),
  ('complete-brand-identity', 'Exhaustive brand identity guidelines book', 2),
  ('complete-brand-identity', 'Typography & font pairing specification', 3),
  ('complete-brand-identity', 'Extended chromatic system & usage rules', 4),
  ('complete-brand-identity', 'Custom graphic language, motifs & iconography', 5),
  ('complete-brand-identity', 'Complete business stationery suite', 6),
  ('complete-brand-identity', 'Multi-platform social media templates', 7),
  ('complete-brand-identity', 'Marketing collateral templates', 8),
  ('complete-brand-identity', 'Packaging / merchandise concept guidelines', 9);

-- Marketing Packages Features
insert into public.package_features (package_id, feature, display_order)
values
  ('social-starter', '8 custom-designed social creatives per month', 1),
  ('social-starter', 'Engaging caption & hashtag strategy', 2),
  ('social-starter', 'Monthly content calendar planning', 3),
  ('social-starter', 'Strict brand-consistent visual design', 4),
  ('social-growth', '12–16 bespoke social creatives per month', 1),
  ('social-growth', 'Strategic content calendar & theme curation', 2),
  ('social-growth', 'Reels / short-form creative direction', 3),
  ('social-growth', 'Engaging copy & calls-to-action', 4),
  ('social-growth', 'Monthly performance & engagement reporting', 5),
  ('ads-management', 'Multi-platform campaign setup (Meta / Google)', 1),
  ('ads-management', 'Audience segmentation & targeting configuration', 2),
  ('ads-management', 'Ad creative coordination & copy alignment', 3),
  ('ads-management', 'A/B split testing & budget optimization', 4),
  ('ads-management', 'Detailed monthly ROI & performance reporting', 5);

-- Complete Packages Features
insert into public.package_features (package_id, feature, display_order)
values
  ('pkg-launch', 'Distinct logo design with vector deliverables', 1),
  ('pkg-launch', 'Foundational brand identity & color system', 2),
  ('pkg-launch', '1–3 page responsive inquiry website', 3),
  ('pkg-launch', 'Print-ready business card layout', 4),
  ('pkg-launch', '4-page corporate brochure', 5),
  ('pkg-launch', 'Cohesive social profile assets', 6),
  ('pkg-grow', 'Logo design & comprehensive brand identity', 1),
  ('pkg-grow', '5–8 page custom business website', 2),
  ('pkg-grow', 'Premium brochure / editorial catalogue', 3),
  ('pkg-grow', 'Reusable social media templates', 4),
  ('pkg-grow', 'Foundational SEO & analytics setup', 5),
  ('pkg-grow', 'SSL certification & global edge deployment', 6),
  ('pkg-signature', 'Complete multi-format brand identity system', 1),
  ('pkg-signature', 'Bespoke premium website with custom motion', 2),
  ('pkg-signature', 'Editorial brochure / product catalogue', 3),
  ('pkg-signature', 'Multi-platform social media design system', 4),
  ('pkg-signature', 'Curated custom visual / art direction', 5),
  ('pkg-signature', 'Advanced SEO & schema performance tuning', 6),
  ('pkg-signature', 'Analytics & conversion tracking infrastructure', 7),
  ('pkg-digital-partner', 'Complete brand identity & design guidelines', 1),
  ('pkg-digital-partner', 'Flagship custom web application / website', 2),
  ('pkg-digital-partner', 'Bespoke art direction (Signature or Indian Modern)', 3),
  ('pkg-digital-partner', 'Full marketing collateral & print assets', 4),
  ('pkg-digital-partner', 'End-to-end social media design system', 5),
  ('pkg-digital-partner', 'Multi-channel campaign creatives', 6),
  ('pkg-digital-partner', 'SEO foundation & conversion funnel tracking', 7),
  ('pkg-digital-partner', '1-year hosting setup & support roadmap', 8);

-- ==============================================================================
-- 4. ART DIRECTIONS (18 Directions including Indian Visual Directions)
-- ==============================================================================
insert into public.art_directions (id, name, slug, category, tier, description, accent_color, typography, tags, starting_price, price_label, is_featured, is_active, display_order)
values
  -- International Directions
  ('modernism', 'Modernism', 'modernism', 'international', 'standard', 'Form follows function. Rational grid systems, objective visual clarity, and deliberate typographic rhythm.', '#3b82f6', 'Clean grotesque sans-serifs, asymmetric geometry, balanced white space', array['Grid-Driven', 'Rational', 'Timeless'], 0, 'Included', true, true, 1),
  ('bauhaus', 'Bauhaus', 'bauhaus', 'international', 'standard', 'Harmony of art, craft, and technology. Primary hues, bold geometric compositions, and radical elemental typography.', '#ef4444', 'Bold geometric sans, primary color balance, constructivist angles', array['Constructivist', 'Geometric', 'Functional'], 0, 'Included', true, true, 2),
  ('minimalism', 'Minimalism', 'minimalism', 'international', 'standard', 'Subtractive purity. Stripping extraneous decoration to let essential layout, proportion, and quiet breathing room shine.', '#71717a', 'Refined monospace and neo-grotesque, mono accents, generous void', array['Pure', 'Subtractive', 'Serene'], 0, 'Included', true, true, 3),
  ('art-deco', 'Art Deco', 'art-deco', 'international', 'signature', 'Sleek luxury, aerodynamic symmetry, polished metallic gradients, and stepped vertical architecture.', '#eab308', 'High-contrast decorative display type, linear filigree, opulent contrast', array['Geometric Luxury', 'Symmetric', 'Opulent'], 3500, '+₹3,500', false, true, 4),
  ('pop-art', 'Pop Art', 'pop-art', 'international', 'standard', 'High saturation, halftone dot patterns, cultural irony, and punchy comic-inspired layout dynamics.', '#ec4899', 'Impactful sans, heavy borders, vibrant chromatic collisions', array['Chromatic', 'Vibrant', 'Playful'], 0, 'Included', false, true, 5),
  ('swiss-style', 'Swiss Style', 'swiss-style', 'international', 'standard', 'The International Typographic Style. Strict mathematical grids, flush-left rag-right setting, and supreme readability.', '#64748b', 'Rigorous Helvetica / Akzidenz Grotesk, asymmetric rhythm, objective neutrality', array['Objective', 'Mathematical', 'Structured'], 0, 'Included', true, true, 6),
  ('psychedelic', 'Psychedelic', 'psychedelic', 'international', 'signature', 'Organic curvilinear forms, fluid optical distortions, vibrating complementary color contrasts, and expressive spirit.', '#8b5cf6', 'Hand-drawn fluid letterforms, liquid geometry, hallucinatory spectrums', array['Fluid', 'Experimental', 'Expressive'], 4500, '+₹4,500', false, true, 7),
  ('postmodernism', 'Postmodernism', 'postmodernism', 'international', 'standard', 'Intentional disruption of strict grids. Eclectic typography, collage aesthetics, and expressive anti-monolithic composition.', '#14b8a6', 'Eclectic pairings, layered textures, playful anti-rational grids', array['Eclectic', 'Subversive', 'Dynamic'], 0, 'Included', false, true, 8),
  ('brutalism', 'Brutalism', 'brutalism', 'international', 'standard', 'Raw, unpolished digital candour. Monospace type, stark borders, high-contrast monochrome, and structural honesty.', '#f43f5e', 'Heavy monospace, raw exposed borders, high utilitarian energy', array['Raw', 'Architectural', 'Direct'], 0, 'Included', true, true, 9),
  ('flat', 'Flat', 'flat', 'international', 'standard', 'Crisp two-dimensional clarity. Vivid uniform tones, crisp silhouettes, and immediate user comprehension.', '#06b6d4', 'Modern geometric sans, flat color planes, lightweight interfaces', array['Two-Dimensional', 'Crisp', 'Intuitive'], 0, 'Included', false, true, 10),
  ('contemporary', 'Contemporary', 'contemporary', 'international', 'standard', 'The pinnacle of current digital aesthetics. Fluid micro-animations, glass textures, refined serif accents, and deep dark modes.', '#6366f1', 'Editorial serif headers paired with ultra-refined neo-grotesque bodies', array['Studio Standard', 'Refined', 'Dynamic'], 0, 'Included', true, true, 11),
  
  -- Indian Visual Directions (Section 10)
  ('indian-modern', 'Indian Modern', 'indian-modern', 'indian', 'signature', 'Contemporary layouts combined with Indian colour palettes, geometry and typography.', '#f97316', 'Contemporary Devanagari/Latin bilingual balance, warm terracotta, saffron & indigo', array['Contemporary Indian', 'Harmonious', 'Vibrant'], 3999, '+₹3,999', true, true, 12),
  ('kerala-contemporary', 'Kerala Contemporary', 'kerala-contemporary', 'indian', 'bespoke', 'Inspired by Kerala architecture, materials, tropical landscapes and restrained traditional forms.', '#059669', 'Earthy timber tones, deep monsoon greens, sloped roof geometry, tropical minimalism', array['Tropical Architecture', 'Earthy', 'Restrained'], 7500, '+₹7,500', true, true, 13),
  ('indo-deco', 'Indo-Deco', 'indo-deco', 'indian', 'signature', 'Art Deco geometry combined with Indian architectural and ornamental influences.', '#d97706', 'Bombay Deco curves, brass & teak accents, symmetrical floral and jaali motifs', array['Bombay Deco', 'Architectural', 'Refined'], 4999, '+₹4,999', true, true, 14),
  ('heritage-modern', 'Heritage Modern', 'heritage-modern', 'indian', 'signature', 'Traditional visual references translated into a modern brand system.', '#dc2626', 'Royal crimson & gold accents, archival parchment textures, dignified serifs', array['Archival', 'Prestigious', 'Storied'], 4500, '+₹4,500', false, true, 15),
  ('folk-inspired', 'Folk-Inspired', 'folk-inspired', 'indian', 'bespoke', 'Inspired by Indian folk-art traditions while creating an original contemporary visual language.', '#84cc16', 'Stylized motifs inspired by Warli, Gond, and Madhubani rendered in minimal modern vectors', array['Folk Art', 'Handcrafted', 'Authentic'], 7500, '+₹7,500', false, true, 16),
  ('craft-material', 'Craft & Material', 'craft-material', 'indian', 'bespoke', 'Inspired by Indian textiles, wood, metal, stone, paper and handmade craft.', '#b45309', 'Tactile khadi weaves, oxidized copper patinas, carved wood reliefs, organic textures', array['Textile & Stone', 'Artisanal', 'Tactile'], 8500, '+₹8,500', true, true, 17),
  ('festive-contemporary', 'Festive Contemporary', 'festive-contemporary', 'indian', 'signature', 'Indian festive colour, pattern and illustration interpreted through a modern digital system.', '#a855f7', 'Radiant marigold, gulal pigments, modern illumination gradients, celebratory motion', array['Celebratory', 'Chromatic', 'Illuminated'], 5000, '+₹5,000', false, true, 18)
on conflict (id) do nothing;

-- ==============================================================================
-- 5. HOSTING PLANS & FEATURES
-- ==============================================================================
insert into public.hosting_plans (id, name, slug, description, price, price_label, billing_type, is_featured, is_active, display_order)
values
  ('lattice-hosting', 'Lattice Hosting', 'lattice-hosting', 'Turnkey website hosting on fast edge infrastructure, fully managed by Lattice.', 3999, '₹3,999/year', 'yearly', false, true, 1),
  ('lattice-care', 'Lattice Care', 'lattice-care', 'Complete peace of mind. Everything in Hosting plus regular content updates, security patrols, and technical support.', 6999, '₹6,999/year', 'yearly', true, true, 2),
  ('lattice-application-care', 'Lattice Application Care', 'lattice-application-care', 'Engineered for transactional web applications, databases, portals, and e-commerce requiring high availability.', 12000, '₹12,000/year+', 'yearly', false, true, 3)
on conflict (id) do nothing;

insert into public.hosting_plan_features (hosting_plan_id, feature, display_order)
values
  -- Lattice Hosting
  ('lattice-hosting', 'Global edge CDN & static site hosting', 1),
  ('lattice-hosting', 'Automated SSL security certificate', 2),
  ('lattice-hosting', 'Zero-downtime deployment pipelines', 3),
  ('lattice-hosting', 'Custom domain DNS connection', 4),
  ('lattice-hosting', 'Automated daily cloud backups', 5),
  ('lattice-hosting', 'Standard technical response support', 6),
  ('lattice-hosting', 'Note: Domain registration/renewal billed separately', 7),
  
  -- Lattice Care
  ('lattice-care', 'All features in Lattice Hosting', 1),
  ('lattice-care', 'Monthly website maintenance & health checks', 2),
  ('lattice-care', 'Minor text, image, and portfolio content updates', 3),
  ('lattice-care', 'Backup integrity verification & monitoring', 4),
  ('lattice-care', 'Proactive security scans & dependency updates', 5),
  ('lattice-care', 'Core Web Vitals & speed performance checks', 6),
  ('lattice-care', '24/7 automated uptime monitoring', 7),
  ('lattice-care', 'Priority turnaround for minor technical fixes', 8),

  -- Lattice Application Care
  ('lattice-application-care', 'All features in Lattice Care', 1),
  ('lattice-application-care', 'Database maintenance, vacuuming & optimization', 2),
  ('lattice-application-care', 'API & third-party webhook health monitoring', 3),
  ('lattice-application-care', 'E-commerce transactional flow validation', 4),
  ('lattice-application-care', 'High concurrency traffic scaling assistance', 5),
  ('lattice-application-care', 'Staging environment management', 6),
  ('lattice-application-care', 'Dedicated direct-line developer technical support', 7);

-- ==============================================================================
-- 6. PRICING ADD-ONS
-- ==============================================================================
insert into public.pricing_addons (id, name, description, price, price_label, billing_type, category, is_active, display_order)
values
  ('custom-illustration', 'Custom Illustration', 'Original vector or digital paintings tailored to your brand narrative.', 3000, '₹3,000+', 'one_time', 'Creative', true, 1),
  ('3d-model', '3D Model & Visualisation', 'Custom Three.js or rendered 3D assets, textures, and interactive scenes.', 7500, '₹7,500+', 'one_time', 'Creative', true, 2),
  ('advanced-animation', 'Advanced Animation', 'Complex GSAP scroll sequencing, SVG path morphing, and interactive reveals.', 5000, '₹5,000+', 'one_time', 'Development', true, 3),
  ('additional-page', 'Additional Page', 'Design and responsive build of an extra page within your existing design system.', 2000, '₹2,000 / page', 'one_time', 'Development', true, 4),
  ('seo-optimization', 'Advanced SEO & Schema', 'In-depth keyword targeting, rich snippet JSON-LD schemas, and speed optimization.', 4500, '₹4,500+', 'one_time', 'Marketing', true, 5),
  ('copywriting', 'Copywriting & Content Strategy', 'Compelling tone-of-voice editorial copy designed to engage and convert.', 3500, '₹3,500+', 'one_time', 'Content', true, 6),
  ('photography', 'Photography Direction', 'On-site or studio art direction, shot lists, and color grading.', 6000, '₹6,000+', 'one_time', 'Creative', true, 7),
  ('priority-maintenance', 'Priority Maintenance', 'Guaranteed 4-hour response time for emergency fixes and monthly feature enhancements.', 2500, '₹2,500/month', 'monthly', 'Support', true, 8),
  ('additional-revision', 'Additional Revision Round', 'An extra round of detailed feedback and styling adjustments beyond package scope.', 1500, '₹1,500 / round', 'one_time', 'Support', true, 9),
  ('api-integration', 'API Integration', 'Connecting payment gateways, CRMs, WhatsApp business APIs, or custom webhooks.', 6000, '₹6,000+', 'one_time', 'Development', true, 10)
on conflict (id) do nothing;
