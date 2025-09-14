export type JobCategory = 
  | 'Administration'
  | 'Accounting & Finance'
  | 'Customer Service'
  | 'Education & Training'
  | 'Engineering'
  | 'Healthcare & Medical'
  | 'Hospitality & Tourism'
  | 'Human Resources'
  | 'Information Technology'
  | 'Legal'
  | 'Manufacturing'
  | 'Marketing & Communications'
  | 'Real Estate'
  | 'Retail & Sales'
  | 'Trades & Services'
  | 'Transport & Logistics';

export type WesternSydneyLocation = 
  | 'Parramatta'
  | 'Blacktown'
  | 'Liverpool'
  | 'Fairfield'
  | 'Penrith'
  | 'Campbelltown'
  | 'Camden'
  | 'Bringelly'
  | 'Oran Park'
  | 'Mount Druitt'
  | 'St Marys'
  | 'Leppington'
  | 'Luddenham'
  | 'Kellyville'
  | 'Marsden Park'
  | 'Schofields'
  | 'Rouse Hill'
  | 'Castle Hill'
  | 'Baulkham Hills'
  | 'Merrylands'
  | 'Auburn'
  | 'Bankstown'
  | 'Cabramatta'
  | 'Wetherill Park'
  | 'Smithfield'
  | 'Prairiewood'
  | 'Bossley Park'
  | 'Horsley Park'
  | 'Cecil Park'
  | 'Kemps Creek'
  | 'Badgerys Creek'
  | 'Rossmore'
  | 'Catherine Field'
  | 'Harrington Park'
  | 'Narellan'
  | 'Smeaton Grange'
  | 'Gregory Hills'
  | 'Spring Farm'
  | 'Currans Hill'
  | 'Mount Annan'
  | 'Macarthur'
  | 'Minto'
  | 'Ingleburn'
  | 'Raby'
  | 'Bradbury'
  | 'Airds'
  | 'Ambarvale'
  | 'Claymore'
  | 'Eagle Vale'
  | 'Eschol Park'
  | 'Kearns'
  | 'Leumeah'
  | 'Macquarie Fields'
  | 'Minto Heights'
  | 'Ruse'
  | 'St Andrews'
  | 'Varroville'
  | 'Woodbine'
  | 'Glenfield'
  | 'Casula'
  | 'Prestons'
  | 'Miller'
  | 'Cartwright'
  | 'Sadleir'
  | 'Heckenberg'
  | 'Busby'
  | 'Green Valley'
  | 'Hinchinbrook'
  | 'Hoxton Park'
  | 'Len Waters Estate'
  | 'West Hoxton'
  | 'Carnes Hill'
  | 'Edmondson Park'
  | 'Denham Court'
  | 'Austral'
  | 'Lurnea'
  | 'Warwick Farm'
  | 'Chipping Norton'
  | 'Moorebank'
  | 'Hammondville'
  | 'Holsworthy'
  | 'Wattle Grove';

export interface Job {
  id: string;
  title: string;
  company: string;
  companyLogo?: string;
  companyWebsite?: string;
  location: string;
  type: 'Full-time' | 'Part-time' | 'Contract' | 'Internship';
  remote: boolean;
  salary?: {
    min: number;
    max: number;
    currency: string;
  };
  description: string;
  requirements: string[];
  benefits: string[];
  tags: string[];
  postedDate: string;
  featured: boolean;
  urgent: boolean;
  applications: number;
  companyId: string;
  contactEmail?: string;
  contactPhone?: string;
  contactApplyUrl?: string;
  employerId: string;
  isFilled: boolean;
  slug: string;
  categories: JobCategory[];
}

export interface Company {
  id: string;
  name: string;
  logo?: string;
  description: string;
  website: string;
  location: string;
  size: string;
  industry: string;
  jobs: string[];
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'jobseeker' | 'employer' | 'admin';
  company?: string;
  avatar?: string;
}

export interface JobApplication {
  id: string;
  jobId: string;
  userId: string;
  resume: string;
  coverLetter: string;
  appliedDate: string;
  status: 'pending' | 'reviewed' | 'interviewed' | 'hired' | 'rejected';
}

export interface PricingPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  duration: number; // days
  features: string[];
  featured: boolean;
  urgent: boolean;
  highlight: boolean;
}

export interface JobFormData {
  title: string;
  company: string;
  companyLogo: string;
  companyWebsite: string;
  location: string;
  type: 'Full-time' | 'Part-time' | 'Contract' | 'Internship';
  remote: boolean;
  salaryMin: string;
  salaryMax: string;
  currency: string;
  description: string;
  requirements: string;
  benefits: string;
  tags: string;
  contactEmail: string;
  contactPhone: string;
  contactApplyUrl: string;
  jobType: 'free' | 'featured';
  categories: JobCategory[];
}