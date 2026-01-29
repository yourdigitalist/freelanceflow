import React, { useState } from 'react';
import { Mail, HelpCircle, BookOpen, MessageCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { toast } from "sonner";
import { base44 } from '@/api/base44Client';

export default function HelpCenter() {
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });
  const [sending, setSending] = useState(false);

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      await base44.integrations.Core.SendEmail({
        to: 'support@flowdesk.app',
        subject: `Help Center Contact: ${contactForm.name}`,
        body: `From: ${contactForm.name} (${contactForm.email})\n\n${contactForm.message}`,
      });
      toast.success('Message sent successfully');
      setContactForm({ name: '', email: '', message: '' });
    } catch (error) {
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5] relative">
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(circle at 30% 40%, rgba(247, 237, 255, 0.6), transparent 40%), radial-gradient(circle at 70% 60%, rgba(206, 221, 247, 0.4), transparent 40%)',
        mixBlendMode: 'multiply'
      }} />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-3">Help Center</h1>
          <p className="text-lg text-slate-600">Get support, find answers, and learn how to use Flowdesk</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card className="border-[#9B63E9]/20 hover:border-[#9B63E9]/40 transition-colors">
            <CardHeader>
              <MessageCircle className="w-10 h-10 text-[#9B63E9] mb-3" />
              <CardTitle>Contact Us</CardTitle>
              <CardDescription>Get in touch with our support team</CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-[#9B63E9]/20 hover:border-[#9B63E9]/40 transition-colors">
            <CardHeader>
              <HelpCircle className="w-10 h-10 text-[#9B63E9] mb-3" />
              <CardTitle>FAQs</CardTitle>
              <CardDescription>Find answers to common questions</CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-[#9B63E9]/20 hover:border-[#9B63E9]/40 transition-colors">
            <CardHeader>
              <BookOpen className="w-10 h-10 text-[#9B63E9] mb-3" />
              <CardTitle>Support Docs</CardTitle>
              <CardDescription>Learn how to use Flowdesk</CardDescription>
            </CardHeader>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-[#9B63E9]" />
                Contact Us
              </CardTitle>
              <CardDescription>Send us a message and we'll get back to you soon</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleContactSubmit} className="space-y-4">
                <div>
                  <Input
                    placeholder="Your name"
                    value={contactForm.name}
                    onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Input
                    type="email"
                    placeholder="Your email"
                    value={contactForm.email}
                    onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Textarea
                    placeholder="How can we help?"
                    value={contactForm.message}
                    onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                    rows={5}
                    required
                  />
                </div>
                <Button 
                  type="submit" 
                  disabled={sending}
                  className="w-full bg-[#9B63E9] hover:bg-[#8A52D8]"
                >
                  {sending ? 'Sending...' : 'Send Message'}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-[#9B63E9]" />
                Frequently Asked Questions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger>How do I create a new project?</AccordionTrigger>
                  <AccordionContent>
                    Navigate to the Projects page and click the "New Project" button. Fill in the project details and click "Create Project".
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2">
                  <AccordionTrigger>How do I send a review request?</AccordionTrigger>
                  <AccordionContent>
                    Go to the Reviews page, click "Send for Review", upload your files, select a client, and add their email address. Click "Send Review Request" to notify them.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-3">
                  <AccordionTrigger>How do I create an invoice?</AccordionTrigger>
                  <AccordionContent>
                    Visit the Invoices page, click "New Invoice", fill in the client details, add line items, and save. You can then send the invoice to your client.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-4">
                  <AccordionTrigger>How do I track time?</AccordionTrigger>
                  <AccordionContent>
                    Go to the Time page, select a project, enter the hours worked and description, then click "Add Entry" to log your time.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[#9B63E9]" />
              Support Documentation
            </CardTitle>
            <CardDescription>Comprehensive guides and tutorials (Coming soon)</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-slate-600">
              Detailed documentation and video tutorials will be available here soon. Check back later for step-by-step guides on using all Flowdesk features.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}