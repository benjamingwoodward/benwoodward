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
  description: "I lead Coverage at Redo, a business line worth $750M.",
} as const;

type Work = { id: string; title: string; metric: string; description: string; illustration: IllustrationId; href?: string; action?: string };
export const work: Work[] = [
  { id: "fintech", title: "Fintech & fraud systems", metric: "$500M+", description: "Scaled financial and fraud infrastructure at Redo across merchants representing more than $500M in GMV.", illustration: "financial-systems", href: "https://redo.com", action: "About Redo" },
  { id: "pureflow", title: "Water-quality analytics", metric: "Six-figure exit", description: "Built and sold Pureflow, a data product that translated water-quality inputs into personalized health reports.", illustration: "water-measurement" },
  { id: "onboarding", title: "Onboarding automation", metric: "~20 minutes", description: "Re-architected merchant onboarding as an automated pipeline: 1+ week to ~20 minutes, 60% of the workflow automated, and eight figures onboarded autonomously.", illustration: "merchant-connection" },
  { id: "outbound", title: "AI outbound systems", metric: "$1.04M annual run-rate", description: "Built an autonomous AI outbound engine that reached this annual run-rate in under two weeks.", illustration: "outbound-system" },
  { id: "building", title: "Rapid prototyping", metric: "3× winner", description: "Engineered and demoed prototypes under tight constraints, with hackathon wins at 15, 19, and 22.", illustration: "prototype-building" },
];

export type Photo = { file: string; caption: string };
type Chapter = { id: string; age: string; label: string; title: string; text: string; photos: Photo[] };
export const chapters: Chapter[] = [
  { id: "origin", age: "0–18", label: "ORIGIN", title: "A childhood across six countries.", text: "As a kid, I drew engineering plans, built wooden cars, and learned to weld.", photos: [
    { file: "ben-child-car.jpg", caption: "Building a wooden car as a child." },
    { file: "ben-child-diagram.jpg", caption: "An early engineering diagram." },
    { file: "ben-child-welding.jpg", caption: "Learning by making — and welding." },
  ] },
  { id: "builder", age: "8–15", label: "BUILDER", title: "Hardware before software.", text: "Between eight and fifteen, I designed and built robotic arms, planes, seismometers, and electric-car prototypes.", photos: [
    { file: "ben-builder-robot-arm.jpg", caption: "A robotic arm I built." },
    { file: "ben-builder-seismometer.jpg", caption: "A homemade seismometer." },
    { file: "ben-builder-electric-car.jpg", caption: "An electric car prototype." },
  ] },
  { id: "commerce", age: "15", label: "COMMERCE", title: "First business at 15.", text: "Built a five-figure ecommerce brand, moving from making things to selling them.", photos: [] },
  { id: "competition", age: "15–22", label: "COMPETITION", title: "Three hackathon wins.", text: "Won at 15, 19, and 22, building and presenting prototypes under tight deadlines.", photos: [
    { file: "hackathon-win.jpg", caption: "After a hackathon win." },
    { file: "hackathon-billboard.jpg", caption: "A Redo billboard celebrating a hackathon win." },
  ] },
  { id: "mission", age: "20–22", label: "FINLAND", title: "Two years in Finland.", text: "Served as an LDS missionary from 20 to 22.", photos: [
    { file: "mission-tampere.jpg", caption: "By the river in Tampere, Finland." },
    { file: "mission-temple.jpg", caption: "Outside the temple in Finland." },
    { file: "mission-rollers.jpg", caption: "Rollerblading with a mission companion." },
    { file: "mission-snow-group.jpg", caption: "A snowy day with mission friends." },
  ] },
  { id: "endurance", age: "22", label: "ENDURANCE", title: "Helsinki Marathon in 3.5 hours.", text: "Ran it at 22 without training.", photos: [
    { file: "marathon.jpg", caption: "After finishing the Helsinki Marathon." },
  ] },
  { id: "software", age: "22", label: "SOFTWARE", title: "Built and sold Pureflow.", text: "Built a water-quality analytics product and sold it in a six-figure exit. Separately, scaled no-touch AI outbound to a $1.04M annual run-rate in under two weeks.", photos: [] },
  { id: "redo", age: "22", label: "OPERATOR", title: "Joined Redo as an operator.", text: "Left BYU to become GM of AI infrastructure at Redo.", photos: [] },
  { id: "now", age: "Now", label: "NOW", title: "GM of Coverage", text: "Leading a business line worth $750M at Redo.", photos: [] },
];
