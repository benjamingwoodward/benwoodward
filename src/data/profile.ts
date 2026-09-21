import type { IllustrationId } from "../components/machines/purposeful-machines";

export const socials = [
  { label: "LinkedIn", href: "https://www.linkedin.com/in/woodward-ben/" },
  { label: "GitHub", href: "https://github.com/benjaminwoodward" },
  { label: "X", href: "https://x.com/benjaminbuilt" },
  { label: "Instagram", href: "https://www.instagram.com/benjawo/" },
] as const;
export const contactUrl = socials[0].href;
export const currentRole = {
  title: "GM of Coverage",
  company: "Redo",
  description: "I run a business line worth $750M at Redo.",
} as const;

type Work = { id: string; title: string; metric: string; description: string; illustration: IllustrationId; href?: string; action?: string };
export const work: Work[] = [
  { id: "fintech", title: "Fintech & fraud", metric: "$500M+", description: "Scaled fintech and fraud products across $500M+ in merchant GMV at Redo.", illustration: "financial-systems", href: "https://redo.com", action: "About Redo" },
  { id: "pureflow", title: "Water-quality software", metric: "Six-figure exit", description: "Developed and sold Pureflow, a water-quality software product.", illustration: "water-measurement" },
  { id: "onboarding", title: "Merchant onboarding", metric: "~20 minutes", description: "Cut merchant onboarding from 1+ week to ~20 minutes. Automated 60% of onboarding, with eight figures onboarded autonomously.", illustration: "merchant-connection" },
  { id: "outbound", title: "AI outbound", metric: "$1.04M annual run-rate", description: "Built no-touch AI outbound, reaching this run-rate in under two weeks.", illustration: "outbound-system" },
  { id: "building", title: "Hackathons", metric: "3× winner", description: "Three hackathon wins, including a first-place AI hackathon finish.", illustration: "prototype-building" },
];

export type Photo = { file: string; caption: string };
type Chapter = { id: string; age: string; label: string; title: string; text: string; photos: Photo[] };
export const chapters: Chapter[] = [
  { id: "origin", age: "0–18", label: "ORIGIN", title: "Grew up in six countries.", text: "Spent my childhood building wooden cars, drawing engineering plans, and learning to weld.", photos: [
    { file: "ben-child-car.jpg", caption: "Building a wooden car as a child." },
    { file: "ben-child-diagram.jpg", caption: "An early engineering diagram." },
    { file: "ben-child-welding.jpg", caption: "Learning by making — and welding." },
  ] },
  { id: "builder", age: "8–15", label: "BUILDER", title: "Robotics and electric cars.", text: "Between 8 and 15, my projects included robotic arms, planes, seismometers, and electric cars.", photos: [
    { file: "ben-builder-robot-arm.jpg", caption: "A robotic arm I built." },
    { file: "ben-builder-seismometer.jpg", caption: "A homemade seismometer." },
    { file: "ben-builder-electric-car.jpg", caption: "An electric car prototype." },
  ] },
  { id: "commerce", age: "15", label: "COMMERCE", title: "First business at 15.", text: "Built a five-figure ecommerce brand.", photos: [] },
  { id: "competition", age: "20", label: "COMPETITION", title: "Three hackathon wins.", text: "Including a first-place AI hackathon finish at 20.", photos: [
    { file: "hackathon-win.jpg", caption: "After a first-place AI hackathon finish." },
    { file: "hackathon-billboard.jpg", caption: "A Redo billboard celebrating the AI hackathon win." },
  ] },
  { id: "mission", age: "20–22", label: "FINLAND", title: "Two years in Finland.", text: "Served as an LDS (Mormon) missionary from 20 to 22.", photos: [
    { file: "mission-tampere.jpg", caption: "By the river in Tampere, Finland." },
    { file: "mission-temple.jpg", caption: "Outside the temple in Finland." },
    { file: "mission-rollers.jpg", caption: "Rollerblading with a mission companion." },
    { file: "mission-snow-group.jpg", caption: "A snowy day with mission friends." },
  ] },
  { id: "endurance", age: "22", label: "ENDURANCE", title: "A 3.5-hour marathon.", text: "Ran the Helsinki Marathon at 22 with no training.", photos: [
    { file: "marathon.jpg", caption: "After finishing the Helsinki Marathon." },
  ] },
  { id: "software", age: "22", label: "SOFTWARE", title: "Built and sold Pureflow.", text: "A six-figure exit in water-quality software. Then scaled AI outbound to a $1.04M annual run-rate in under two weeks.", photos: [] },
  { id: "redo", age: "22", label: "OPERATOR", title: "Joined Redo.", text: "Left BYU to join Redo as GM of AI infrastructure.", photos: [] },
  { id: "now", age: "Now", label: "NOW", title: "GM of Coverage", text: "A business line worth $750M.", photos: [] },
];
