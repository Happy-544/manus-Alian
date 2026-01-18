/**
 * HelpMenu Component
 * Provides help options and tour restart functionality
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { HelpCircle, RotateCcw, BookOpen, MessageSquare, Mail } from "lucide-react";

interface HelpMenuProps {
  onRestartTour?: () => void;
}

export function HelpMenu({ onRestartTour }: HelpMenuProps) {
  const [showRestartModal, setShowRestartModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);

  const handleRestartTour = () => {
    setShowRestartModal(false);
    if (onRestartTour) {
      onRestartTour();
    }
  };

  return (
    <>
      <DropdownMenu>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-full hover:bg-gold/10 transition-all duration-200 hover:scale-110"
          title="Help & Support (Press ? for keyboard shortcut)"
        >
          <HelpCircle className="h-5 w-5 text-gold animate-pulse" />
        </Button>

        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="text-gold font-semibold">
            Help & Support
          </DropdownMenuLabel>
          <DropdownMenuSeparator />

          {/* Restart Tour Option */}
          <DropdownMenuItem
            onClick={() => setShowRestartModal(true)}
            className="cursor-pointer flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Restart Product Tour</span>
          </DropdownMenuItem>

          {/* Documentation */}
          <DropdownMenuItem
            onClick={() => window.open("/docs", "_blank")}
            className="cursor-pointer flex items-center gap-2"
          >
            <BookOpen className="h-4 w-4" />
            <span>Documentation</span>
          </DropdownMenuItem>

          {/* FAQ */}
          <DropdownMenuItem
            onClick={() => window.open("/faq", "_blank")}
            className="cursor-pointer flex items-center gap-2"
          >
            <MessageSquare className="h-4 w-4" />
            <span>FAQ</span>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* Contact Support */}
          <DropdownMenuItem
            onClick={() => setShowContactModal(true)}
            className="cursor-pointer flex items-center gap-2"
          >
            <Mail className="h-4 w-4" />
            <span>Contact Support</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Restart Tour Modal */}
      <Dialog open={showRestartModal} onOpenChange={setShowRestartModal}>
        <DialogContent className="sm:max-w-[425px] animate-in fade-in duration-300">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5 text-gold" />
              Restart Product Tour
            </DialogTitle>
            <DialogDescription>
              Would you like to restart the interactive product tour? This will take you through all the key features of AliPM.
            </DialogDescription>
          </DialogHeader>

          <div className="bg-gold/5 border border-gold/20 rounded-lg p-4 my-4">
            <h4 className="font-semibold text-sm mb-2">Tour Highlights:</h4>
            <ul className="text-sm space-y-1 text-foreground/80">
              <li>✓ Dashboard overview and KPIs</li>
              <li>✓ Document creation workflow</li>
              <li>✓ Gap analysis and completion</li>
              <li>✓ Supplier management</li>
              <li>✓ Project templates</li>
              <li>✓ Team collaboration features</li>
            </ul>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowRestartModal(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRestartTour}
              className="bg-gold text-primary hover:bg-gold/90"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Start Tour
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Contact Support Modal */}
      <Dialog open={showContactModal} onOpenChange={setShowContactModal}>
        <DialogContent className="sm:max-w-[425px] animate-in fade-in duration-300">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-gold" />
              Contact Support
            </DialogTitle>
            <DialogDescription>
              Need help? Get in touch with our support team.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 my-4">
            <div className="bg-gold/5 border border-gold/20 rounded-lg p-4">
              <h4 className="font-semibold text-sm mb-2">Email Support</h4>
              <a
                href="mailto:support@alipm.com"
                className="text-gold hover:underline text-sm"
              >
                support@alipm.com
              </a>
              <p className="text-xs text-foreground/60 mt-1">
                Average response time: 2-4 hours
              </p>
            </div>

            <div className="bg-gold/5 border border-gold/20 rounded-lg p-4">
              <h4 className="font-semibold text-sm mb-2">Live Chat</h4>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => {
                  // Trigger live chat widget if available
                  window.location.href = "https://alipm.com/chat";
                }}
              >
                Start Chat
              </Button>
              <p className="text-xs text-foreground/60 mt-2">
                Available Monday-Friday, 9 AM - 6 PM (Dubai Time)
              </p>
            </div>

            <div className="bg-gold/5 border border-gold/20 rounded-lg p-4">
              <h4 className="font-semibold text-sm mb-2">Documentation</h4>
              <a
                href="/docs"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gold hover:underline text-sm"
              >
                View Help Center →
              </a>
              <p className="text-xs text-foreground/60 mt-1">
                Comprehensive guides and tutorials
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowContactModal(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
