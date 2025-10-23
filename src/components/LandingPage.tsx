import { ArrowRight } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Logo } from './Logo';
import wasselLogo from '@/assets/wassel-logo.png';

interface LandingPageProps {
  onGetStarted: () => void;
  onLogin: () => void;
}

const testimonials = [
  {
    quote: "Wassel saved me over 60% on my weekly commute from Dubai to Abu Dhabi. The drivers are professional and friendly!",
    author: "Ahmed K.",
    route: "Dubai → Abu Dhabi"
  },
  {
    quote: "I love the Raje3 feature! It makes planning return trips so much easier and more affordable.",
    author: "Sarah M.",
    route: "Riyadh → Jeddah"
  },
  {
    quote: "Safe, reliable, and eco-friendly. Wassel is exactly what the Middle East needed for modern travel.",
    author: "Omar A.",
    route: "Cairo → Alexandria"
  }
];

export function LandingPage({ onGetStarted, onLogin }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 to-white">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Logo size="sm" />
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={onLogin}>
              Sign In
            </Button>
            <Button className="bg-primary hover:bg-primary/90" onClick={onGetStarted}>
              Get Started
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-block px-4 py-2 bg-primary/10 text-primary rounded-full text-sm">
              Next-Generation Ride Sharing
            </div>
            <h1 className="text-5xl md:text-6xl leading-tight">
              Share Your Journey Across the Middle East
            </h1>
            <p className="text-xl text-gray-600">
              Connect with travelers, save money, and reduce your carbon footprint with Wassel's smart carpooling platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-lg h-14" onClick={onGetStarted}>
                Start Your Journey
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="text-lg h-14 border-primary text-primary hover:bg-primary/5"
                onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Learn More
              </Button>
            </div>
            <div className="flex items-center gap-8 pt-4">
              <div>
                <p className="text-3xl text-primary">50K+</p>
                <p className="text-sm text-gray-600">Active Users</p>
              </div>
              <div>
                <p className="text-3xl text-primary">200K+</p>
                <p className="text-sm text-gray-600">Trips Completed</p>
              </div>
              <div>
                <p className="text-3xl text-primary">4.8★</p>
                <p className="text-sm text-gray-600">Average Rating</p>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="bg-gradient-to-br from-primary/80 to-primary rounded-3xl p-12 shadow-2xl flex items-center justify-center">
              <img src={wasselLogo} alt="Wassel Platform" className="w-64 h-auto" />
            </div>
            <div className="mt-6 text-center">
              <p className="text-xl text-gray-700">Connecting Travelers</p>
              <p className="text-lg text-gray-600">Across the Middle East</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="max-w-7xl mx-auto px-6 py-20 bg-gray-50" id="how-it-works">
        <h2 className="text-4xl font-semibold text-center mb-12">What Our Users Say</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t, idx) => (
            <Card key={idx} className="p-6">
              <CardContent>
                <p className="text-gray-700 italic">"{t.quote}"</p>
                <p className="mt-4 font-semibold text-gray-900">{t.author}</p>
                <p className="text-sm text-gray-500">{t.route}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
