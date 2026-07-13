/** Production app URL (GitHub Pages). Use this as Supabase Auth → Site URL. */
export const APP_URL = 'https://futurifydesigns.github.io/MarketSphere/'

/** Optimized logo (WebP). */
export const LOGO_PATH = 'logo.webp'

export const FUTURIFY_DESIGNS = {
  name: 'Futurify Designs',
  url: 'https://github.com/FuturifyDesigns',
} as const

export const COMPANY = {
  name: 'Market Sphere Group (Pty) Ltd',
  shortName: 'Market Sphere Group',
  tagline: 'Master Your Field for Relevance',
  registration: 'UIN BW00000887185',
  mission: 'Master Your Field for Relevance',
  vision:
    'To be a formidable hub for providing timely solutions to the needs of clients, youths and meet Government on the national vision in the development of the country.',
  overview:
    'Market Sphere Group (Pty) Ltd is a privately owned company providing professional and socio-economic services and solutions in areas including Entrepreneurship Development, basic music education, Real estate consultancy, career development, academic tuitions, youth empowerment projects and mentorship, platform for mass marketing, and basic farming practice.',
  headOffice: 'Gaborone, Botswana',
  operationalArea: 'Botswana and SADC',
  businessType: 'Service provider and entrepreneurship developments',
  companyType: 'A private limited company',
  address:
    '10102 MAFULO House, next to Old Prison Headquarters, Taung Broadhurst, Gaborone, Botswana',
  email: 'imcalledsammy@gmail.com',
  phones: ['+267 74013060', '+267 72470917'],
  coreValues: [
    'Botho',
    'Professionalism',
    'Customer satisfaction',
    'Innovation',
    'Excellence',
    'Empowerment',
    'Reliability',
    'Sustainable growth / Unemployment reduction',
  ],
  areasOfInterest: [
    'Entrepreneurship training',
    'Career development',
    'Basic IT services',
    'Real estate consulting',
    'Youth empowerment projects and mentorship',
    'Music education',
    'Academic tuitions',
    'Platform mass marketing',
    'Basic farming practices',
  ],
} as const

export const SERVICES = [
  {
    title: 'Youth Empowerment',
    tagline: 'Empowering youth. Building communities. Shaping the future.',
    description:
      'We identify different youth centered and community projects that will harness the potentials of youths and young professionals in different parts of the country.',
    icon: 'users',
    image: 'services/youth-empowerment.webp',
    video: 'services/youth-empowerment.mp4',
    accent: '#6B5A3E',
    gradient:
      'linear-gradient(145deg, #eef4ff 0%, #f7f0e4 42%, #e8f0ff 100%)',
  },
  {
    title: 'Academic Tuition',
    tagline: 'Learn today. Excel tomorrow.',
    description:
      'We have flexible packages for out of school and school going folks to better upgrade their grades.',
    icon: 'graduation-cap',
    image: 'services/academic-tuition.webp',
    video: 'services/academic-tuition.mp4',
    accent: '#4A5D4A',
    gradient:
      'linear-gradient(145deg, #edf7f0 0%, #f4f8ef 45%, #e7f2ea 100%)',
  },
  {
    title: 'Platform Marketing',
    tagline: 'Powerful apps. Broader reach.',
    description:
      'We have at our disposal a couple of powerful apps that makes advertisements worthwhile and easy getting fast and broader mileage.',
    icon: 'megaphone',
    image: 'services/platform-marketing.webp',
    video: 'services/platform-marketing.mp4',
    accent: '#5C5040',
    gradient:
      'linear-gradient(145deg, #f3eefc 0%, #f8f2e8 48%, #ebe4ff 100%)',
  },
  {
    title: 'Real Estate Consultancy',
    tagline: 'Your dream property, our priority.',
    description:
      'We are quite acclimatized to the real estate industry in different areas of the country and we have a resolve to help customers achieve their property needs around the country from time to time.',
    icon: 'building',
    image: 'services/real-estate.webp',
    video: 'services/real-estate.mp4',
    accent: '#4A4034',
    gradient:
      'linear-gradient(145deg, #f8f1e8 0%, #f3ebe0 50%, #efe4d4 100%)',
  },
  {
    title: 'Entrepreneurship Development',
    tagline: 'Fostering enterprise. Reducing dependency.',
    description:
      'We through our networks will provide a number of different opportunities that will foster the spirit of entrepreneurship in the population in the ultimate goal to reducing unemployment and total Government dependency.',
    icon: 'lightbulb',
    image: 'services/entrepreneurship.webp',
    video: 'services/entrepreneurship.mp4',
    accent: '#1A1510',
    gradient:
      'linear-gradient(145deg, #fff6e8 0%, #f7edd8 46%, #efe2c4 100%)',
  },
] as const

export const FAQ_ITEMS = [
  {
    category: 'Platform',
    question: 'What is Market Sphere Group?',
    answer:
      'Market Sphere Group connects customers with verified service providers across Botswana through our online marketplace. Browse, search, and enquire about services from trusted professionals.',
  },
  {
    category: 'Platform',
    question: 'How do I find a service provider?',
    answer:
      'Use the Browse Providers page to search by category or location. View provider profiles, read descriptions, and submit an enquiry directly through the platform.',
  },
  {
    category: 'Providers',
    question: 'How do I become a service provider?',
    answer:
      'Register as a Service Provider, complete your business profile with logo, services, and contact details. Your application will be reviewed by our team before going live.',
  },
  {
    category: 'Payments',
    question: 'Is payment handled on the platform?',
    answer:
      'No. Market Sphere Group facilitates connections and enquiries only. Any payment arrangements happen directly between you and the service provider.',
  },
  {
    category: 'Company',
    question: 'How does Market Sphere Group protect my personal data?',
    answer:
      'We process personal data in line with Botswana\'s Data Protection Act, 2024. Read our Privacy Policy for details on your rights, cookies, retention, and how to contact us or the Information and Data Protection Commission.',
  },
  {
    category: 'Company',
    question: 'Where is Market Sphere Group located?',
    answer:
      'Our head office is in Gaborone, Botswana, at 10102 MAFULO House, Taung Broadhurst. We operate across Botswana with plans to expand into SADC markets.',
  },
  {
    category: 'Providers',
    question: 'How long does provider approval take?',
    answer:
      'We review all provider applications to ensure quality and trust. Approval typically takes 1–3 business days after you submit a complete profile.',
  },
] as const

export const FAQ_CATEGORIES = ['All', 'Platform', 'Providers', 'Payments', 'Company'] as const

export const COLORS = {
  day: '#FAF8F4',
  night: '#0E1116',
  gold: '#C9A24B',
  sand: '#E8DCC4',
  bronze: '#4A3F2F',
} as const
