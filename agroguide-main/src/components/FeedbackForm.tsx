import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { MessageSquare, Send } from 'lucide-react';

export default function FeedbackForm() {
  const { user, isAuthenticated } = useAuth();
  const [formData, setFormData] = useState({
    category: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      toast({
        title: "Authentication required",
        description: "Please sign in to submit feedback.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('feedback')
        .insert({
          user_id: user!.id,
          message: formData.message,
          category: formData.category as 'general' | 'bug' | 'feature_request' | 'plant_info',
        });

      if (error) throw error;

      toast({
        title: "Feedback submitted!",
        description: "Thank you for your feedback. We'll review it soon.",
      });

      // Reset form
      setFormData({ category: '', message: '' });
    } catch (error: any) {
      toast({
        title: "Error submitting feedback",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            <CardTitle>Send Feedback</CardTitle>
          </div>
          <CardDescription>
            Please sign in to submit feedback
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground">
            You need to be signed in to submit feedback to our team.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center space-x-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          <CardTitle>Send Feedback</CardTitle>
        </div>
        <CardDescription>
          Help us improve AgroGuide by sharing your thoughts and suggestions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select feedback category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">General Feedback</SelectItem>
                <SelectItem value="bug">Bug Report</SelectItem>
                <SelectItem value="feature_request">Feature Request</SelectItem>
                <SelectItem value="plant_info">Plant Information</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="Share your feedback, suggestions, or report issues..."
              className="min-h-[120px]"
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading || !formData.category}>
            <Send className="h-4 w-4 mr-2" />
            {loading ? 'Sending...' : 'Send Feedback'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}